"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"

interface Transaction {
  date: string
  amount: number
  transaction_type: string
}

interface MonthlyTrendProps {
  transactions: Transaction[]
}

export function MonthlyTrend({ transactions }: MonthlyTrendProps) {
  // Group by month
  const monthlyData: Record<
    string,
    {
      month: string
      income: number
      expenses: number
    }
  > = {}

  transactions.forEach((t) => {
    const date = new Date(t.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const monthLabel = date.toLocaleString("default", { month: "short", year: "numeric" })

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthLabel,
        income: 0,
        expenses: 0,
      }
    }

    if (t.transaction_type === "credit") {
      monthlyData[monthKey].income += Number(t.amount)
    } else {
      monthlyData[monthKey].expenses += Number(t.amount)
    }
  })

  const chartData = Object.keys(monthlyData)
    .sort()
    .map((key) => monthlyData[key])

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
          <CardDescription>Income vs expenses over time</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No transaction history available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Trend</CardTitle>
        <CardDescription>Income vs expenses over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            income: {
              label: "Income",
              color: "#10B981",
            },
            expenses: {
              label: "Expenses",
              color: "#EF4444",
            },
          }}
          className="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(value) => `$${value}`} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                    labelFormatter={(label) => label}
                  />
                }
              />
              <Legend />
              <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
