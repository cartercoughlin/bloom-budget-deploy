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

    // Get user's Plaid access tokens
    const { data: plaidItems, error: plaidError } = await supabase
      .from('plaid_items')
      .select('access_token')
      .eq('user_id', user.id)

    if (plaidError || !plaidItems || plaidItems.length === 0) {
      return NextResponse.json({ error: 'No connected accounts found' }, { status: 400 })
    }

    let totalNewTransactions = 0
    let totalUpdatedTransactions = 0
    let totalProcessed = 0
    let totalSyncedAccounts = 0

    // Sync transactions for each connected account
    for (const item of plaidItems) {
      const result = await syncPlaidTransactions(item.access_token)
      
      if (result.success) {
        totalNewTransactions += result.newTransactions
        totalUpdatedTransactions += result.updatedTransactions
        totalProcessed += result.totalProcessed
        totalSyncedAccounts += result.syncedAccounts || 0
      }
    }

    return NextResponse.json({ 
      success: true,
      newTransactions: totalNewTransactions,
      updatedTransactions: totalUpdatedTransactions,
      totalProcessed: totalProcessed,
      syncedAccounts: totalSyncedAccounts,
      message: 'Transactions synced successfully'
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
