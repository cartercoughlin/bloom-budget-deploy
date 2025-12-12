import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload } from "lucide-react"

export default async function TransactionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get transactions with categories
  const { data: transactions } = await supabase
    .from("transactions")
    .select(`
      *,
      categories (
        name,
        color,
        icon
      )
    `)
    .order("date", { ascending: false })
    .limit(50)

  const { data: categories } = await supabase.from("categories").select("*")

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transactions</h1>
          <p className="text-muted-foreground">View and manage your transactions</p>
        </div>
        <Link href="/transactions/import">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Import Transactions
          </Button>
        </Link>
      </div>

      {transactions && transactions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest 50 transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Date</th>
                    <th className="text-left p-3 text-sm font-medium">Description</th>
                    <th className="text-left p-3 text-sm font-medium">Category</th>
                    <th className="text-left p-3 text-sm font-medium">Bank</th>
                    <th className="text-right p-3 text-sm font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/50">
                      <td className="p-3 text-sm">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="p-3 text-sm">{tx.description}</td>
                      <td className="p-3 text-sm">
                        {tx.categories ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                            style={{ backgroundColor: `${tx.categories.color}20`, color: tx.categories.color }}
                          >
                            {tx.categories.icon} {tx.categories.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Uncategorized</span>
                        )}
                      </td>
                      <td className="p-3 text-sm capitalize">{tx.bank}</td>
                      <td
                        className={`p-3 text-sm text-right font-medium ${tx.transaction_type === "credit" ? "text-green-600" : "text-red-600"}`}
                      >
                        {tx.transaction_type === "credit" ? "+" : "-"}${tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
            <p className="text-muted-foreground text-center mb-6">Import your first transactions to get started</p>
            <Link href="/transactions/import">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Import Transactions
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
