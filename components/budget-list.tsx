"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Loader2, Target } from "lucide-react"
import { useRouter } from "next/navigation"

interface Budget {
  id: string
  amount: number
  category_id: string
  categories: {
    id: string
    name: string
    color: string
    icon: string | null
  } | null
}

interface Category {
  id: string
  name: string
  color: string
  icon: string | null
}

interface BudgetListProps {
  budgets: Budget[]
  categories: Category[]
  spending: Record<string, number>
  month: number
  year: number
}

export function BudgetList({ budgets: initialBudgets, categories, spending, month, year }: BudgetListProps) {
  const [budgets, setBudgets] = useState(initialBudgets)
  const [isOpen, setIsOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleOpenDialog = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget)
      setSelectedCategoryId(budget.category_id)
      setAmount(budget.amount.toString())
    } else {
      setEditingBudget(null)
      setSelectedCategoryId("")
      setAmount("")
    }
    setIsOpen(true)
  }

  const handleSave = async () => {
    if (!selectedCategoryId || !amount) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      if (editingBudget) {
        // Update existing budget
        const { error } = await supabase
          .from("budgets")
          .update({ amount: Number.parseFloat(amount) })
          .eq("id", editingBudget.id)

        if (error) throw error
      } else {
        // Create new budget
        const { error } = await supabase.from("budgets").insert({
          user_id: user.id,
          category_id: selectedCategoryId,
          amount: Number.parseFloat(amount),
          month,
          year,
        })

        if (error) throw error
      }

      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error saving budget:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (budgetId: string) => {
    const supabase = createClient()

    try {
      const { error } = await supabase.from("budgets").delete().eq("id", budgetId)

      if (error) throw error

      setBudgets(budgets.filter((b) => b.id !== budgetId))
      router.refresh()
    } catch (error) {
      console.error("Error deleting budget:", error)
    }
  }

  const usedCategoryIds = budgets.map((b) => b.category_id)
  const availableCategories = categories.filter((c) => !usedCategoryIds.includes(c.id) || c.id === selectedCategoryId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Category Budgets</h2>
          <p className="text-muted-foreground text-sm">Set spending limits for each category</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBudget ? "Edit Budget" : "Add Budget"}</DialogTitle>
              <DialogDescription>Set a monthly spending limit for a category</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} disabled={!!editingBudget}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monthly Budget Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading || !selectedCategoryId || !amount}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Budget"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length > 0 ? (
        <div className="grid gap-4">
          {budgets.map((budget) => {
            const spent = spending[budget.category_id] || 0
            const percentage = (spent / Number(budget.amount)) * 100
            const isOverBudget = spent > Number(budget.amount)

            return (
              <Card key={budget.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {budget.categories && (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${budget.categories.color}20` }}
                        >
                          {budget.categories.icon}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{budget.categories?.name}</CardTitle>
                        <CardDescription>
                          ${spent.toFixed(2)} of ${Number(budget.amount).toFixed(2)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(budget)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(budget.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress
                    value={Math.min(percentage, 100)}
                    className={isOverBudget ? "bg-red-100" : undefined}
                    indicatorClassName={isOverBudget ? "bg-red-600" : undefined}
                  />
                  <div className="flex justify-between text-sm">
                    <span className={isOverBudget ? "text-red-600 font-medium" : "text-muted-foreground"}>
                      {percentage.toFixed(1)}% used
                    </span>
                    <span className={isOverBudget ? "text-red-600 font-medium" : "text-green-600"}>
                      ${Math.abs(Number(budget.amount) - spent).toFixed(2)} {isOverBudget ? "over budget" : "remaining"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No budgets set</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first budget to start tracking spending
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
