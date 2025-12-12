"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  transaction_type: string
  categories: {
    name: string
    color: string
    icon: string | null
  } | null
}

interface TopTransactionsProps {
  transactions: Transaction[]
}

export function TopTransactions({ transactions }: TopTransactionsProps) {
  const topExpenses = transactions
    .filter((t) => t.transaction_type === "debit")
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 10)

  if (topExpenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Expenses</CardTitle>
          <CardDescription>Your largest transactions this month</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No expenses recorded this month</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Expenses</CardTitle>
        <CardDescription>Your largest transactions this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topExpenses.map((tx, index) => (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(tx.date).toLocaleDateString()}</span>
                    {tx.categories && (
                      <>
                        <span>•</span>
                        <span style={{ color: tx.categories.color }}>
                          {tx.categories.icon} {tx.categories.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">${Number(tx.amount).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
