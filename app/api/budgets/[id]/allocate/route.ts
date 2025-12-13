import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount } = await request.json()
    const budgetId = params.id

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Get current budget
    const { data: budget, error: fetchError } = await supabase
      .from('budgets')
      .select('allocated_amount, available_amount, user_id')
      .eq('id', budgetId)
      .single()

    if (fetchError || !budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Verify ownership
    if (budget.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update budget with new allocation
    const newAllocatedAmount = (budget.allocated_amount || 0) + amount
    const newAvailableAmount = (budget.available_amount || 0) + amount

    const { error: updateError } = await supabase
      .from('budgets')
      .update({
        allocated_amount: newAllocatedAmount,
        available_amount: newAvailableAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', budgetId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to allocate' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      allocated_amount: newAllocatedAmount,
      available_amount: newAvailableAmount
    })

  } catch (error) {
    console.error('Allocation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
