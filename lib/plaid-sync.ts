import { plaidClient } from './plaid'
import { createClient } from '@/lib/supabase/server'
import { 
  TransactionsGetRequest, 
  AccountsGetRequest,
  TransactionsGetResponse,
  AccountsGetResponse 
} from 'plaid'

export interface SyncResult {
  success: boolean
  newTransactions: number
  updatedTransactions: number
  totalProcessed: number
  syncedAccounts?: number
  error?: string
}

export async function syncPlaidTransactions(accessToken: string): Promise<SyncResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        newTransactions: 0,
        updatedTransactions: 0,
        totalProcessed: 0,
        error: 'User not authenticated'
      }
    }

    // Get accounts
    const accountsRequest: AccountsGetRequest = {
      access_token: accessToken,
    }
    const accountsResponse: AccountsGetResponse = await plaidClient.accountsGet(accountsRequest)
    const accounts = accountsResponse.data.accounts

    // Sync account balances
    let syncedAccountsCount = 0
    for (const account of accounts) {
      const accountType = account.subtype === 'savings' ? 'savings' : 
                         account.type === 'credit' ? 'liability' : 'checking'
      
      const balance = account.type === 'credit' ? 
                     -Math.abs(account.balances.current || 0) : 
                     account.balances.current || 0

      const { error: upsertError } = await supabase
        .from('account_balances')
        .upsert({
          user_id: user.id,
          account_name: account.name,
          account_type: accountType,
          balance: balance,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,account_name'
        })

      if (!upsertError) {
        syncedAccountsCount++
      }
    }

    return await syncTransactionsForAccounts(accessToken, accounts, user.id, syncedAccountsCount)
    
  } catch (error) {
    console.error('Plaid sync error:', error)
    return {
      success: false,
      newTransactions: 0,
      updatedTransactions: 0,
      totalProcessed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function syncTransactionsForAccounts(accessToken: string, accounts: any[], userId: string, syncedAccountsCount: number): Promise<SyncResult> {
  const supabase = await createClient()
  
  // Get existing categories
  const { data: categories } = await supabase.from('categories').select('id, name').eq('user_id', userId)
  const categoryMap = new Map(categories?.map(c => [c.name.toLowerCase(), c.id]) || [])

  // Get existing transactions to avoid duplicates
  const { data: existingTransactions } = await supabase
    .from('transactions')
    .select('id, description, date, amount')
    .eq('user_id', userId)

  const existingKeys = new Set(existingTransactions?.map(t => `${t.date}-${t.description}-${t.amount}`) || [])

  let newCount = 0
  let updatedCount = 0
  let processedCount = 0

  // Get transactions for last 30 days
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  const endDate = new Date()

  const transactionsRequest: TransactionsGetRequest = {
    access_token: accessToken,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    count: 500,
    offset: 0,
  }

  const transactionsResponse: TransactionsGetResponse = await plaidClient.transactionsGet(transactionsRequest)
  const transactions = transactionsResponse.data.transactions

  for (const transaction of transactions) {
    const account = accounts.find(acc => acc.account_id === transaction.account_id)
    const bankName = account?.name || 'Unknown'
    
    const transactionKey = `${transaction.date}-${transaction.name}-${Math.abs(transaction.amount)}`
    
    if (existingKeys.has(transactionKey)) {
      updatedCount++
      continue
    }

    // Determine category using smart assignment
    let categoryId = null
    try {
      const { assignCategoryByRules } = await import('./category-rules')
      categoryId = await assignCategoryByRules(transaction.name, userId)
    } catch (error) {
      console.log('Smart categorization not available:', error)
    }

    const transactionData = {
      user_id: userId,
      date: transaction.date,
      description: transaction.name,
      amount: Math.abs(transaction.amount),
      transaction_type: transaction.amount < 0 ? 'debit' : 'credit',
      category_id: categoryId,
      bank: bankName,
      hidden: false,
    }

    const { error: insertError } = await supabase.from('transactions').insert(transactionData)
    
    if (!insertError) {
      newCount++
    }
    processedCount++
  }

  // Update last sync timestamp
  await supabase.from('profiles').update({ last_sync_at: new Date().toISOString() }).eq('id', userId)

  return {
    success: true,
    newTransactions: newCount,
    updatedTransactions: updatedCount,
    totalProcessed: processedCount,
    syncedAccounts: syncedAccountsCount,
  }
}
