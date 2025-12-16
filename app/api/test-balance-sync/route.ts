import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncAccountBalances } from '@/lib/plaid-sync-improved'

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
      .select('access_token, institution_name, sync_balances')
      .eq('user_id', user.id)

    if (plaidError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!plaidItems || plaidItems.length === 0) {
      return NextResponse.json({ 
        error: 'No Plaid connections found. Connect a bank account first.' 
      }, { status: 400 })
    }

    const results = []
    let totalSynced = 0
    const allErrors: string[] = []

    for (const item of plaidItems) {
      if (!item.sync_balances) {
        results.push({
          institution: item.institution_name,
          status: 'skipped',
          reason: 'Balance sync disabled'
        })
        continue
      }

      const result = await syncAccountBalances(item.access_token, user.id)
      
      results.push({
        institution: item.institution_name,
        status: result.success ? 'success' : 'error',
        syncedAccounts: result.syncedAccounts,
        errors: result.errors
      })

      totalSynced += result.syncedAccounts
      allErrors.push(...result.errors)
    }

    return NextResponse.json({
      success: allErrors.length === 0,
      totalSyncedAccounts: totalSynced,
      results,
      errors: allErrors.length > 0 ? allErrors : undefined
    })

  } catch (error) {
    console.error('Test balance sync error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Sync failed' 
    }, { status: 500 })
  }
}
