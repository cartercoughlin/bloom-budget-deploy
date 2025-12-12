import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CategoryRuleForm } from "@/components/category-rule-form"

export default async function NewCategoryRulePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name")

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Category Rule</h1>
        <p className="text-muted-foreground">
          Set up automatic categorization based on transaction descriptions
        </p>
      </div>

      <CategoryRuleForm categories={categories || []} />
    </div>
  )
}
