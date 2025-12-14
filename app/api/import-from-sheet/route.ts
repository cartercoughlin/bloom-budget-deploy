import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ 
    error: 'Google Sheets integration has been replaced with Plaid. Please use the Connect Bank Account feature instead.' 
  }, { status: 410 })
}
