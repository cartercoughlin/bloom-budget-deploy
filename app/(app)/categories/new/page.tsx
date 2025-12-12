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
    <div className="container mx-auto p-3 md:p-6 max-w-7xl pb-20 md:pb-6">
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">Add Category</h1>
        <p className="text-muted-foreground text-xs md:text-sm">Create a new spending category</p>
      </div>

      <div className="max-w-2xl">
        <CategoryForm />
      </div>
    </div>
  )
}
