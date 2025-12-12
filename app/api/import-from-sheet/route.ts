import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchGoogleSheetData, parseGoogleSheetCSV, suggestCategory } from "@/lib/google-sheets-parser"

export async function POST(request: Request) {
  try {
    const { spreadsheetId, gid } = await request.json()

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Spreadsheet ID is required" }, { status: 400 })
    }

    // Fetch Google Sheet data
    const csvText = await fetchGoogleSheetData(spreadsheetId, gid)
    console.log("[v0] CSV text preview:", csvText.substring(0, 500))

    const transactions = parseGoogleSheetCSV(csvText)
    console.log("[v0] Parsed transactions sample:", transactions.slice(0, 3))
    console.log("[v0] Total transactions:", transactions.length)
    console.log("[v0] Income transactions:", transactions.filter((t) => t.transactionType === "credit").length)
    console.log("[v0] Expense transactions:", transactions.filter((t) => t.transactionType === "debit").length)

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get user categories
    const { data: categories } = await supabase.from("categories").select("id, name")

    if (!categories) {
      return NextResponse.json({ error: "No categories found" }, { status: 404 })
    }

    // Prepare transactions for insert with auto-categorization
    const transactionsToInsert = transactions.map((tx) => ({
      user_id: user.id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      transaction_type: tx.transactionType,
      bank: "google-sheet",
      category_id: suggestCategory(tx.description, categories),
    }))

    console.log("[v0] Transactions to insert sample:", transactionsToInsert.slice(0, 3))

    // Insert transactions
    const { error: insertError, data: insertedData } = await supabase
      .from("transactions")
      .insert(transactionsToInsert)
      .select()

    if (insertError) {
      console.error("[v0] Insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log("[v0] Successfully inserted:", insertedData?.length, "transactions")

    return NextResponse.json({
      success: true,
      count: insertedData?.length || 0,
      transactions: insertedData,
    })
  } catch (error) {
    console.error("[v0] Import error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import from Google Sheet" },
      { status: 500 },
    )
  }
}
