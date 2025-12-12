// Google Sheets parsing utilities

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  transactionType: "debit" | "credit"
  account?: string
  institution?: string
  category?: string
}

/**
 * Fetches data from a Google Sheet using the CSV export URL
 * @param spreadsheetId The ID of the Google Sheet
 * @param gid The sheet GID (default is 0 for first sheet)
 */
export async function fetchGoogleSheetData(spreadsheetId: string, gid = "0"): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error("Failed to fetch Google Sheet. Make sure the sheet is publicly viewable.")
  }

  return await response.text()
}

/**
 * Parses Google Sheet CSV/TSV data into transactions
 * Supports Tiller format with columns: Date, Description, Category, Amount, Account, Institution, etc.
 */
export function parseGoogleSheetCSV(csvText: string): ParsedTransaction[] {
  const lines = csvText.trim().split("\n")
  const transactions: ParsedTransaction[] = []

  if (lines.length < 2) {
    throw new Error("CSV file is empty or has no data rows")
  }

  const firstLine = lines[0]
  const delimiter = firstLine.includes("\t") ? "\t" : ","
  console.log("[v0] Detected delimiter:", delimiter === "\t" ? "tab" : "comma")

  // Parse header to find column indices
  const headerLine = parseCSVLine(lines[0], delimiter)
  console.log("[v0] Raw headers:", headerLine)

  const header = headerLine.map((h) => h.toLowerCase().trim())
  console.log("[v0] Normalized headers:", header)

  const dateIdx = header.findIndex((h) => h.includes("date") && !h.includes("added") && !h.includes("categorized"))
  const descIdx = header.findIndex((h) => h === "description")
  const fullDescIdx = header.findIndex((h) => h.includes("full") && h.includes("description"))
  const categoryIdx = header.findIndex((h) => h === "category")
  const amountIdx = header.findIndex((h) => h === "amount")
  const accountIdx = header.findIndex((h) => h === "account" && !h.includes("#") && !h.includes("id"))
  const institutionIdx = header.findIndex((h) => h === "institution")

  console.log("[v0] Column indices:", { dateIdx, descIdx, amountIdx, categoryIdx, accountIdx, institutionIdx })

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
    throw new Error(`Could not find required columns. Found headers: ${headerLine.join(", ")}`)
  }

  console.log("[v0] Total lines to parse:", lines.length - 1)

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) {
      console.log(`[v0] Row ${i}: Empty line, skipping`)
      continue
    }

    const values = parseCSVLine(line, delimiter)
    console.log(`[v0] Row ${i}: Parsed ${values.length} values`)

    if (values.length < Math.max(dateIdx, descIdx, amountIdx) + 1) {
      console.log(
        `[v0] Row ${i}: Not enough columns (need ${Math.max(dateIdx, descIdx, amountIdx) + 1}, got ${values.length}), skipping`,
      )
      continue
    }

    const dateStr = values[dateIdx]
    let date = ""
    if (dateStr) {
      // Handle M/D/YYYY or MM/DD/YYYY format
      const dateParts = dateStr.split("/")
      if (dateParts.length === 3) {
        const month = dateParts[0].padStart(2, "0")
        const day = dateParts[1].padStart(2, "0")
        const year = dateParts[2]
        date = `${year}-${month}-${day}`
      }
    }

    const description = values[descIdx] || (fullDescIdx !== -1 ? values[fullDescIdx] : "")
    const amountStr = values[amountIdx].replace(/[$,]/g, "")
    const amount = Number.parseFloat(amountStr)

    console.log(
      `[v0] Row ${i}: date="${dateStr}" -> "${date}", desc="${description}", amountStr="${values[amountIdx]}" -> "${amountStr}", amount=${amount}`,
    )

    // Get optional fields
    const category = categoryIdx !== -1 ? values[categoryIdx] : undefined
    const account = accountIdx !== -1 ? values[accountIdx] : undefined
    const institution = institutionIdx !== -1 ? values[institutionIdx] : undefined

    if (isNaN(amount)) {
      console.log(`[v0] Row ${i}: Invalid amount (NaN), skipping`)
      continue
    }
    if (!date) {
      console.log(`[v0] Row ${i}: Missing date, skipping`)
      continue
    }
    if (!description) {
      console.log(`[v0] Row ${i}: Missing description, skipping`)
      continue
    }

    // Determine transaction type from amount sign (negative = expense/debit, positive = income/credit)
    const transactionType: "debit" | "credit" = amount < 0 ? "debit" : "credit"

    transactions.push({
      date,
      description,
      amount: Math.abs(amount),
      transactionType,
      account,
      institution,
      category,
    })

    console.log(`[v0] Row ${i}: Successfully parsed transaction`)
  }

  console.log("[v0] Parsed", transactions.length, "transactions")
  console.log("[v0] Sample transaction:", transactions[0])

  return transactions
}

function parseCSVLine(line: string, delimiter = ","): string[] {
  if (delimiter === "\t") {
    return line.split("\t").map((field) => field.trim())
  }

  // For comma-delimited, handle quoted fields
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// Auto-categorize transactions based on description
export function suggestCategory(description: string, categories: { id: string; name: string }[]): string | null {
  const desc = description.toLowerCase()

  // Groceries
  if (
    desc.includes("grocery") ||
    desc.includes("supermarket") ||
    desc.includes("walmart") ||
    desc.includes("target") ||
    desc.includes("whole foods") ||
    desc.includes("trader joe") ||
    desc.includes("kroger") ||
    desc.includes("safeway") ||
    desc.includes("publix")
  ) {
    return categories.find((c) => c.name === "Groceries")?.id || null
  }

  // Dining Out
  if (
    desc.includes("restaurant") ||
    desc.includes("cafe") ||
    desc.includes("coffee") ||
    desc.includes("pizza") ||
    desc.includes("mcdonald") ||
    desc.includes("starbucks") ||
    desc.includes("chipotle") ||
    desc.includes("subway") ||
    desc.includes("panera")
  ) {
    return categories.find((c) => c.name === "Dining Out")?.id || null
  }

  // Transportation
  if (
    desc.includes("gas") ||
    desc.includes("fuel") ||
    desc.includes("uber") ||
    desc.includes("lyft") ||
    desc.includes("parking") ||
    desc.includes("transit") ||
    desc.includes("shell") ||
    desc.includes("exxon") ||
    desc.includes("chevron")
  ) {
    return categories.find((c) => c.name === "Transportation")?.id || null
  }

  // Entertainment
  if (
    desc.includes("movie") ||
    desc.includes("theater") ||
    desc.includes("netflix") ||
    desc.includes("spotify") ||
    desc.includes("game") ||
    desc.includes("hulu") ||
    desc.includes("disney")
  ) {
    return categories.find((c) => c.name === "Entertainment")?.id || null
  }

  // Shopping
  if (desc.includes("amazon") || desc.includes("shop") || desc.includes("store") || desc.includes("retail")) {
    return categories.find((c) => c.name === "Shopping")?.id || null
  }

  // Bills & Utilities
  if (
    desc.includes("electric") ||
    desc.includes("water") ||
    desc.includes("gas bill") ||
    desc.includes("internet") ||
    desc.includes("phone") ||
    desc.includes("utility") ||
    desc.includes("verizon") ||
    desc.includes("at&t") ||
    desc.includes("comcast")
  ) {
    return categories.find((c) => c.name === "Bills & Utilities")?.id || null
  }

  // Healthcare
  if (
    desc.includes("pharmacy") ||
    desc.includes("doctor") ||
    desc.includes("hospital") ||
    desc.includes("medical") ||
    desc.includes("health") ||
    desc.includes("cvs") ||
    desc.includes("walgreens")
  ) {
    return categories.find((c) => c.name === "Healthcare")?.id || null
  }

  // Income
  if (
    desc.includes("deposit") ||
    desc.includes("payroll") ||
    desc.includes("salary") ||
    desc.includes("payment received") ||
    desc.includes("direct deposit")
  ) {
    return categories.find((c) => c.name === "Income")?.id || null
  }

  return categories.find((c) => c.name === "Other")?.id || null
}
