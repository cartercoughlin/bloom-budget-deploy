import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CategoryList } from "@/components/category-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Settings } from "lucide-react"

export default async function CategoriesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Categories</h1>
          <p className="text-muted-foreground">Manage your spending categories</p>
        </div>
        <div className="flex gap-2">
          <Link href="/categories/rules">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Rules
            </Button>
          </Link>
          <Link href="/categories/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </Link>
        </div>
      </div>

      <CategoryList categories={categories || []} />
    </div>
  )
}
