import { google } from "googleapis"
import { createClient } from "@/lib/supabase/server"

export interface SyncResult {
  success: boolean
  newTransactions: number
  updatedTransactions: number
  totalProcessed: number
  error?: string
}

export async function syncGoogleSheets(): Promise<SyncResult> {
  try {
    // Set up Google Sheets API authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })

    const sheets = google.sheets({ version: "v4", auth })
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    const range = "Transactions!A:T" // Covers all Tiller columns

    // Fetch data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    })

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      return {
        success: false,
        newTransactions: 0,
        updatedTransactions: 0,
        totalProcessed: 0,
        error: "No data found in sheet",
      }
    }

    // First row is headers
    const headers = rows[0].map((h: string) => h.toLowerCase().trim())
    const dateIdx = headers.indexOf("date")
    const descIdx = headers.indexOf("description")
    const categoryIdx = headers.indexOf("category")
    const amountIdx = headers.indexOf("amount")
    const accountIdx = headers.indexOf("account")
    const institutionIdx = headers.indexOf("institution")
    const transactionIdIdx = headers.indexOf("transaction id")

    if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
      return {
        success: false,
        newTransactions: 0,
        updatedTransactions: 0,
        totalProcessed: 0,
        error: "Required columns not found in sheet",
      }
    }

    // Get Supabase client
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        newTransactions: 0,
        updatedTransactions: 0,
        totalProcessed: 0,
        error: "User not authenticated",
      }
    }

    // Get existing categories for this user
    const { data: categories } = await supabase.from("categories").select("id, name").eq("user_id", user.id)

    const categoryMap = new Map(categories?.map((c) => [c.name.toLowerCase(), c.id]) || [])

    // Get existing transaction IDs to avoid duplicates
    const { data: existingTransactions } = await supabase
      .from("transactions")
      .select("id, description, date, amount")
      .eq("user_id", user.id)

    const existingKeys = new Set(existingTransactions?.map((t) => `${t.date}-${t.description}-${t.amount}`) || [])

    let newCount = 0
    let updatedCount = 0
    let processedCount = 0

    // Process each row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      const dateStr = row[dateIdx]
      const description = row[descIdx]
      const amountStr = row[amountIdx]
      const categoryName = row[categoryIdx] || ""
      const account = row[accountIdx] || ""
      const institution = row[institutionIdx] || ""
      const bank = institution || account || "Unknown"
      const transactionId = row[transactionIdIdx] || `${dateStr}-${description}-${amountStr}`

      if (!dateStr || !description || !amountStr) continue

      // Parse date (M/D/YYYY to YYYY-MM-DD)
      const dateParts = dateStr.split("/")
      if (dateParts.length !== 3) continue
      const [month, day, year] = dateParts
      const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`

      // Parse amount (remove $ and commas, convert to number)
      const amount = Number.parseFloat(amountStr.replace(/[$,]/g, ""))
      if (isNaN(amount)) continue

      // Determine transaction type (negative = expense/debit, positive = income/credit)
      const transactionType = amount < 0 ? "debit" : "credit"

      // Find category ID using smart assignment
      let categoryId = null
      if (categoryName) {
        categoryId = categoryMap.get(categoryName.toLowerCase()) || null
      }
      
      // If no category from sheet, try smart assignment
      if (!categoryId) {
        try {
          const { assignCategoryByRules } = await import('./category-rules')
          categoryId = await assignCategoryByRules(description, user.id)
        } catch (error) {
          console.log('Smart categorization not available:', error)
        }
      }

      const transactionKey = `${formattedDate}-${description}-${Math.abs(amount)}`

      const transactionData = {
        user_id: user.id,
        date: formattedDate,
        description,
        amount: Math.abs(amount),
        transaction_type: transactionType,
        category_id: categoryId,
        bank: bank,
      }

      // Check if transaction already exists
      if (existingKeys.has(transactionKey)) {
        // Skip duplicate
        updatedCount++
      } else {
        // Insert new transaction
        const { error: insertError } = await supabase.from("transactions").insert(transactionData)

        if (insertError) {
          console.error("[v0] Insert error:", insertError)
        } else {
          newCount++
        }
      }

      processedCount++
    }

    // Update last sync timestamp
    await supabase.from("profiles").update({ last_sync_at: new Date().toISOString() }).eq("id", user.id)

    return {
      success: true,
      newTransactions: newCount,
      updatedTransactions: updatedCount,
      totalProcessed: processedCount,
    }
  } catch (error) {
    console.error("[v0] Sync error:", error)
    return {
      success: false,
      newTransactions: 0,
      updatedTransactions: 0,
      totalProcessed: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
