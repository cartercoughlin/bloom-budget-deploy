"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Check } from "lucide-react"

interface Category {
  id: string
  name: string
  color: string
  icon?: string
}

interface SmartSuggestion {
  categoryId: string
  confidence: number
  reason: string
}

interface TransactionCategorizerProps {
  transactionId: string
  description: string
  amount: number
  currentCategoryId?: string
  categories: Category[]
  onCategoryChange: (categoryId: string) => void
}

export function TransactionCategorizer({
  transactionId,
  description,
  amount,
  currentCategoryId,
  categories,
  onCategoryChange,
}: TransactionCategorizerProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentCategoryId) {
      fetchSuggestions()
    }
  }, [transactionId, currentCategoryId])

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/category-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySelect = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/category`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId }),
      })

      if (response.ok) {
        onCategoryChange(categoryId)
        
        // Learn from this assignment
        await fetch("/api/category-learning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId, categoryId }),
        })
      }
    } catch (error) {
      console.error("Error updating category:", error)
    }
  }

  const currentCategory = categories.find(c => c.id === currentCategoryId)

  return (
    <div className="space-y-4">
      {currentCategory ? (
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
            style={{ backgroundColor: `${currentCategory.color}20`, color: currentCategory.color }}
          >
            {currentCategory.icon} {currentCategory.name}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCategoryChange("")}
          >
            Change
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Smart Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestions.map((suggestion) => {
                  const category = categories.find(c => c.id === suggestion.categoryId)
                  if (!category) return null
                  
                  return (
                    <div
                      key={suggestion.categoryId}
                      className="flex items-center justify-between p-2 rounded border hover:bg-muted cursor-pointer"
                      onClick={() => handleCategorySelect(suggestion.categoryId)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm">{category.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}%
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {suggestion.reason}
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          <Select onValueChange={handleCategorySelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.icon} {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
