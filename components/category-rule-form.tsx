"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Category {
  id: string
  name: string
  color: string
}

interface CategoryRuleFormProps {
  categories: Category[]
  initialData?: {
    id?: string
    name: string
    description_pattern: string
    category_id: string
    priority: number
    is_active: boolean
  }
}

export function CategoryRuleForm({ categories, initialData }: CategoryRuleFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description_pattern: initialData?.description_pattern || "",
    category_id: initialData?.category_id || "",
    priority: initialData?.priority || 1,
    is_active: initialData?.is_active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = initialData?.id 
        ? `/api/category-rules/${initialData.id}`
        : "/api/category-rules"
      
      const method = initialData?.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push("/categories/rules")
      } else {
        console.error("Failed to save rule")
      }
    } catch (error) {
      console.error("Error saving rule:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/categories/rules">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rules
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{initialData?.id ? "Edit" : "Create"} Category Rule</CardTitle>
          <CardDescription>
            Rules automatically assign categories to transactions based on description patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Grocery Stores"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pattern">Description Pattern</Label>
              <Input
                id="pattern"
                value={formData.description_pattern}
                onChange={(e) => setFormData({ ...formData, description_pattern: e.target.value })}
                placeholder="e.g., walmart|target|grocery"
                required
              />
              <p className="text-sm text-muted-foreground">
                Use regular expressions. Examples: "starbucks" (exact match), "coffee|cafe" (multiple options)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                Higher priority rules are checked first (1-10)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="active">Active</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : initialData?.id ? "Update Rule" : "Create Rule"}
              </Button>
              <Link href="/categories/rules">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
