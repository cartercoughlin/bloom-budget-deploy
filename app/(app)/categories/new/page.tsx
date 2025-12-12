import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CategoryForm } from "@/components/category-form"

export default async function NewCategoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Add Category</h1>
        <p className="text-muted-foreground">Create a new spending category</p>
      </div>

      <CategoryForm />
    </div>
  )
}
