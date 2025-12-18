import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: transactionId } = await params

    // Validate transactionId is not undefined/null string
    if (!transactionId || transactionId === 'undefined' || transactionId === 'null') {
      console.error('Invalid transaction ID:', transactionId)
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      )
    }

    console.log('Deleting transaction:', transactionId, 'for user:', user.id)

    // Verify the transaction belongs to the user before deleting
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('id, user_id')
      .eq('id', transactionId)
      .single()

    if (fetchError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (transaction.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Soft delete the transaction (set deleted = true)
    // This prevents the transaction from showing in UI and from being re-imported during Plaid syncs
    const { error: deleteError } = await supabase
      .from('transactions')
      .update({ deleted: true })
      .eq('id', transactionId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting transaction:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete transaction' },
        { status: 500 }
      )
    }

    console.log('Transaction soft-deleted successfully:', transactionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete transaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
