import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncPlaidTransactions } from '@/lib/plaid-sync'

export async function POST() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Plaid access tokens with sync preferences
    const { data: plaidItems, error: plaidError } = await supabase
      .from('plaid_items')
      .select('access_token, sync_transactions, sync_balances')
      .eq('user_id', user.id)

    if (plaidError) {
      console.error('Database error:', plaidError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!plaidItems || plaidItems.length === 0) {
      return NextResponse.json({ error: 'No connected accounts found. Please connect a bank account first.' }, { status: 400 })
    }

    let totalNewTransactions = 0
    let totalUpdatedTransactions = 0
    let totalProcessed = 0
    let totalSyncedAccounts = 0
    const errors: string[] = []

    // Sync transactions for each connected account
    for (const item of plaidItems) {
      try {
        const result = await syncPlaidTransactions(item.access_token, {
          syncTransactions: item.sync_transactions,
          syncBalances: item.sync_balances
        })
        
        if (result.success) {
          totalNewTransactions += result.newTransactions
          totalUpdatedTransactions += result.updatedTransactions
          totalProcessed += result.totalProcessed
          totalSyncedAccounts += result.syncedAccounts || 0
        } else {
          errors.push(result.error || 'Unknown sync error')
        }
      } catch (itemError) {
        console.error('Item sync error:', itemError)
        errors.push(`Sync failed for one account: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({ 
      success: errors.length === 0,
      newTransactions: totalNewTransactions,
      updatedTransactions: totalUpdatedTransactions,
      totalProcessed: totalProcessed,
      syncedAccounts: totalSyncedAccounts,
      message: errors.length === 0 ? 'Transactions synced successfully' : `Partial sync completed with ${errors.length} errors`,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Sync failed' 
    }, { status: 500 })
  }
}
