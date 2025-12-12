import { createClient } from "@/lib/supabase/server"
import { learnFromAssignment } from "@/lib/category-rules"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { transactionId, categoryId } = await request.json()

    await learnFromAssignment(transactionId, categoryId, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error learning from assignment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
