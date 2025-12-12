import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Settings } from "lucide-react"

export default async function CategoryRulesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: rules } = await supabase
    .from("category_rules")
    .select(`
      *,
      categories (
        name,
        color
      )
    `)
    .eq("user_id", user.id)
    .order("priority", { ascending: false })

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Category Rules</h1>
          <p className="text-muted-foreground">Automate transaction categorization with smart rules</p>
        </div>
        <div className="flex gap-2">
          <Link href="/categories">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Manage Categories
            </Button>
          </Link>
          <Link href="/categories/rules/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </Link>
        </div>
      </div>

      {rules && rules.length > 0 ? (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <CardDescription>
                      Pattern: <code className="bg-muted px-1 rounded">{rule.description_pattern}</code>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">Priority: {rule.priority}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Assigns to:</span>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                      style={{ 
                        backgroundColor: `${rule.categories?.color || '#gray'}20`, 
                        color: rule.categories?.color || '#gray' 
                      }}
                    >
                      {rule.categories?.name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/categories/rules/edit/${rule.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rules yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create rules to automatically categorize your transactions
            </p>
            <Link href="/categories/rules/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Rule
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
