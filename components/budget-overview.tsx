"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingDown, TrendingUp, DollarSign, Target } from "lucide-react"

interface Budget {
  id: string
  amount: number
  categories: {
    id: string
    name: string
    color: string
    icon: string | null
  } | null
}

interface BudgetOverviewProps {
  budgets: Budget[]
  spending: Record<string, number>
}

export function BudgetOverview({ budgets, spending }: BudgetOverviewProps) {
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
  const totalSpent = Object.values(spending).reduce((sum, amount) => sum + amount, 0)
  const remaining = totalBudget - totalSpent
  const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalBudget.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">${totalSpent.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">{percentageUsed.toFixed(1)}% of budget</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          {remaining >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
            ${Math.abs(remaining).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">{remaining >= 0 ? "Under budget" : "Over budget"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={Math.min(percentageUsed, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">{percentageUsed.toFixed(1)}% used</p>
        </CardContent>
      </Card>
    </div>
  )
}
