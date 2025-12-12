import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CategoryForm } from "@/components/category-form"
import { notFound } from "next/navigation"

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: category, error } = await supabase.from("categories").select("*").eq("id", id).single()

  if (error || !category) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Category</h1>
        <p className="text-muted-foreground">Update your spending category</p>
      </div>

      <CategoryForm category={category} />
    </div>
  )
}
