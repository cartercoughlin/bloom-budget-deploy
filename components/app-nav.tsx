"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Receipt, Wallet, FolderKanban, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function AppNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Transactions",
      href: "/transactions",
      icon: Receipt,
    },
    {
      title: "Budget",
      href: "/budgets",
      icon: Wallet,
    },
    {
      title: "Categories",
      href: "/categories",
      icon: FolderKanban,
    },
  ]

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            <span className="text-xl font-bold">Bloom Budget</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" className={cn("gap-2", pathname?.startsWith(item.href) && "bg-muted")}>
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </nav>
  )
}
