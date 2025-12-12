import { NextResponse } from "next/server"
import { syncGoogleSheets } from "@/lib/google-sheets-sync"

export async function POST() {
  try {
    const result = await syncGoogleSheets()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Sync API error:", error)
    return NextResponse.json({ error: "Failed to sync with Google Sheets" }, { status: 500 })
  }
}

// Optional: Add GET endpoint for scheduled syncs (e.g., Vercel Cron)
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await syncGoogleSheets()
  return NextResponse.json(result)
}
