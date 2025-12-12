import type React from "react"
import { AppNav } from "@/components/app-nav"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AppNav />
      {children}
    </>
  )
}
