"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { parseGoogleSheetCSV, suggestCategory } from "@/lib/google-sheets-parser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, AlertCircle, Loader2, Sheet, Copy } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SyncStatus } from "@/components/sync-status"

interface TransactionPreview {
  date: string
  description: string
  amount: number
  transactionType: "debit" | "credit"
  account?: string
  institution?: string
  category?: string
  suggestedCategory: string | null
  categoryName?: string
}

export default function ImportTransactionsPage() {
  const [csvData, setCsvData] = useState("")
  const [previews, setPreviews] = useState<TransactionPreview[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handlePreview = async () => {
    setError(null)
    setPreviews([])
    setIsLoading(true)

    try {
      if (!csvData.trim()) {
        throw new Error("Please paste CSV data")
      }

      const parsed = parseGoogleSheetCSV(csvData)

      if (parsed.length === 0) {
        throw new Error("No valid transactions found in CSV data")
      }

      const supabase = createClient()
      const { data: categories } = await supabase.from("categories").select("id, name")

      const withCategories = parsed.map((tx) => ({
        ...tx,
        suggestedCategory: categories ? suggestCategory(tx.description, categories) : null,
        categoryName: categories?.find((c) => c.id === suggestCategory(tx.description, categories))?.name,
      }))

      setPreviews(withCategories.slice(0, 10))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const parsed = parseGoogleSheetCSV(csvData)

      if (parsed.length === 0) {
        throw new Error("No valid transactions found")
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      const { data: categories } = await supabase.from("categories").select("id, name")

      const transactionsToInsert = parsed.map((tx) => ({
        user_id: user.id,
        date: tx.date,
        description: tx.description,
        amount: Math.abs(tx.amount),
        transaction_type: tx.transactionType,
        category_id: categories ? suggestCategory(tx.description, categories) : null,
        account: tx.account,
        institution: tx.institution,
      }))

      const { error: insertError } = await supabase.from("transactions").insert(transactionsToInsert)

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push("/transactions")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import transactions")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Import Transactions</h1>
        <p className="text-muted-foreground">Import transactions from your Tiller Google Sheet</p>
      </div>

      <div className="mb-6">
        <SyncStatus />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manual Import (Alternative Method)</CardTitle>
          <CardDescription>Copy and paste data if automatic sync is not configured</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>
              Open your Tiller spreadsheet:{" "}
              <a
                href="https://docs.google.com/spreadsheets/d/1qmQMEk1sbj55MkTT7l9DyZXsyBydfwjHEQo73zGa56o/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Open Sheet
              </a>
            </li>
            <li>Go to the "Transactions" tab at the bottom</li>
            <li>Select all data (Ctrl+A or Cmd+A)</li>
            <li>Copy (Ctrl+C or Cmd+C)</li>
            <li>Paste into the text area below</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paste CSV Data</CardTitle>
          <CardDescription>Copy and paste your Transactions data from the Google Sheet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="csv-data">Transaction Data (CSV format)</Label>
            <Textarea
              id="csv-data"
              placeholder="Paste your copied data here..."
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
            <p className="text-sm text-muted-foreground">
              Expected columns: Date, Description, Category, Amount, Account, Institution
            </p>
          </div>

          <Button onClick={handlePreview} disabled={isLoading || !csvData.trim()} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Preview...
              </>
            ) : (
              <>
                <Sheet className="mr-2 h-4 w-4" />
                Preview Transactions
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Transactions imported successfully! Redirecting...</AlertDescription>
            </Alert>
          )}

          {previews.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Preview (First 10 transactions)</h3>
                <span className="text-sm text-muted-foreground">{previews.length} shown</span>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Date</th>
                        <th className="text-left p-3 text-sm font-medium">Description</th>
                        <th className="text-left p-3 text-sm font-medium">Amount</th>
                        <th className="text-left p-3 text-sm font-medium">Type</th>
                        <th className="text-left p-3 text-sm font-medium">Account</th>
                        <th className="text-left p-3 text-sm font-medium">Suggested Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {previews.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-muted/50">
                          <td className="p-3 text-sm">{tx.date}</td>
                          <td className="p-3 text-sm">{tx.description}</td>
                          <td className="p-3 text-sm">${tx.amount.toFixed(2)}</td>
                          <td className="p-3 text-sm">
                            <span className={tx.transactionType === "credit" ? "text-green-600" : "text-red-600"}>
                              {tx.transactionType}
                            </span>
                          </td>
                          <td className="p-3 text-sm">{tx.account || "-"}</td>
                          <td className="p-3 text-sm">{tx.categoryName || tx.category || "Other"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button onClick={handleImport} disabled={isLoading} className="w-full" size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Import All Transactions
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">About Tiller Format</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            This app is designed to work with Tiller Foundation Template spreadsheets. Make sure your Transactions sheet
            includes these columns:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Date - Transaction date</li>
            <li>Description - Transaction description</li>
            <li>Amount - Transaction amount (negative for expenses, positive for income)</li>
            <li>Category - Existing category from Tiller (optional)</li>
            <li>Account - Account name (optional)</li>
            <li>Institution - Bank or financial institution (optional)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
