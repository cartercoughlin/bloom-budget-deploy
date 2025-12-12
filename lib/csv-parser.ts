// CSV parsing utilities for different bank formats

export type BankType = "chase" | "citi" | "first-horizon"

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  transactionType: "debit" | "credit"
}

// Chase CSV format: Transaction Date,Post Date,Description,Category,Type,Amount,Memo
function parseChaseCSV(csvText: string): ParsedTransaction[] {
  const lines = csvText.trim().split("\n")
  const transactions: ParsedTransaction[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Parse CSV line handling quoted fields
    const values = parseCSVLine(line)

    if (values.length >= 6) {
      const date = values[0] // Transaction Date
      const description = values[2] // Description
      const type = values[4] // Type (Sale, Payment, etc.)
      const amount = Number.parseFloat(values[5].replace(/[^0-9.-]/g, ""))

      transactions.push({
        date,
        description,
        amount: Math.abs(amount),
        transactionType: amount < 0 ? "debit" : "credit",
      })
    }
  }

  return transactions
}

// Citi CSV format: Status,Date,Description,Debit,Credit
function parseCitiCSV(csvText: string): ParsedTransaction[] {
  const lines = csvText.trim().split("\n")
  const transactions: ParsedTransaction[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    const values = parseCSVLine(line)

    if (values.length >= 5) {
      const date = values[1] // Date
      const description = values[2] // Description
      const debit = values[3] ? Number.parseFloat(values[3].replace(/[^0-9.-]/g, "")) : 0
      const credit = values[4] ? Number.parseFloat(values[4].replace(/[^0-9.-]/g, "")) : 0

      const amount = debit || credit

      transactions.push({
        date,
        description,
        amount: Math.abs(amount),
        transactionType: debit ? "debit" : "credit",
      })
    }
  }

  return transactions
}

// First Horizon CSV format: Date,Description,Comments,Check Number,Amount,Balance
function parseFirstHorizonCSV(csvText: string): ParsedTransaction[] {
  const lines = csvText.trim().split("\n")
  const transactions: ParsedTransaction[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    const values = parseCSVLine(line)

    if (values.length >= 5) {
      const date = values[0] // Date
      const description = values[1] // Description
      const amount = Number.parseFloat(values[4].replace(/[^0-9.-]/g, ""))

      transactions.push({
        date,
        description,
        amount: Math.abs(amount),
        transactionType: amount < 0 ? "debit" : "credit",
      })
    }
  }

  return transactions
}

// Helper function to parse CSV line with quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

export function parseCSV(csvText: string, bank: BankType): ParsedTransaction[] {
  switch (bank) {
    case "chase":
      return parseChaseCSV(csvText)
    case "citi":
      return parseCitiCSV(csvText)
    case "first-horizon":
      return parseFirstHorizonCSV(csvText)
    default:
      throw new Error(`Unsupported bank: ${bank}`)
  }
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
    desc.includes("trader joe")
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
    desc.includes("starbucks")
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
    desc.includes("transit")
  ) {
    return categories.find((c) => c.name === "Transportation")?.id || null
  }

  // Entertainment
  if (
    desc.includes("movie") ||
    desc.includes("theater") ||
    desc.includes("netflix") ||
    desc.includes("spotify") ||
    desc.includes("game")
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
    desc.includes("utility")
  ) {
    return categories.find((c) => c.name === "Bills & Utilities")?.id || null
  }

  // Healthcare
  if (
    desc.includes("pharmacy") ||
    desc.includes("doctor") ||
    desc.includes("hospital") ||
    desc.includes("medical") ||
    desc.includes("health")
  ) {
    return categories.find((c) => c.name === "Healthcare")?.id || null
  }

  // Income
  if (
    desc.includes("deposit") ||
    desc.includes("payroll") ||
    desc.includes("salary") ||
    desc.includes("payment received")
  ) {
    return categories.find((c) => c.name === "Income")?.id || null
  }

  return categories.find((c) => c.name === "Other")?.id || null
}
