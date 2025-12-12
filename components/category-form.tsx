"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

interface Category {
  id: string
  name: string
  color: string
  icon: string | null
}

const PRESET_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#22C55E",
  "#6B7280",
]

const PRESET_ICONS = ["🛒", "🍽️", "🚗", "🎬", "🛍️", "💡", "🏥", "💰", "📦", "🏠", "📱", "✈️", "🎓", "⚽", "🎨"]

export function CategoryForm({ category }: { category?: Category }) {
  const [name, setName] = useState(category?.name || "")
  const [color, setColor] = useState(category?.color || "#3B82F6")
  const [icon, setIcon] = useState(category?.icon || "📦")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      if (category) {
        // Update existing category
        const { error: updateError } = await supabase
          .from("categories")
          .update({ name, color, icon })
          .eq("id", category.id)

        if (updateError) throw updateError
      } else {
        // Create new category
        const { error: insertError } = await supabase.from("categories").insert({
          user_id: user.id,
          name,
          color,
          icon,
        })

        if (insertError) throw insertError
      }

      router.push("/categories")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Groceries"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_ICONS.map((presetIcon) => (
                <button
                  key={presetIcon}
                  type="button"
                  onClick={() => setIcon(presetIcon)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all ${
                    icon === presetIcon ? "ring-2 ring-primary scale-110" : "hover:scale-105 bg-muted"
                  }`}
                >
                  {presetIcon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-9 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-12 h-12 rounded-lg transition-all ${
                    color === presetColor ? "ring-2 ring-primary scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Label htmlFor="custom-color">Custom Color:</Label>
              <input
                id="custom-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10 rounded cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${color}20` }}
            >
              {icon}
            </div>
            <div>
              <p className="font-semibold">{name || "Category Name"}</p>
              <p className="text-sm text-muted-foreground">Preview</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{category ? "Update" : "Create"} Category</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
