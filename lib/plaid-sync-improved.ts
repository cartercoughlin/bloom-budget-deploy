import { plaidClient } from './plaid'
import { createClient } from '@/lib/supabase/server'
import { AccountsGetRequest, AccountsGetResponse } from 'plaid'

export async function syncAccountBalances(accessToken: string, userId: string): Promise<{
  success: boolean
  syncedAccounts: number
  errors: string[]
}> {
  const errors: string[] = []
  let syncedAccounts = 0

  try {
    console.log('🏦 Starting account balance sync...')
    
    const supabase = await createClient()
    
    // Get accounts from Plaid
    const accountsRequest: AccountsGetRequest = { access_token: accessToken }
    const accountsResponse: AccountsGetResponse = await plaidClient.accountsGet(accountsRequest)
    const accounts = accountsResponse.data.accounts
    const institutionId = accountsResponse.data.item.institution_id
    
    console.log(`📊 Found ${accounts.length} accounts from institution: ${institutionId}`)

    for (const account of accounts) {
      try {
        // Determine account type
        const accountType = account.subtype === 'savings' ? 'savings' : 
                           account.type === 'credit' ? 'liability' : 'checking'
        
        // Calculate balance (credit cards should be negative)
        const balance = account.type === 'credit' ? 
                       -Math.abs(account.balances.current || 0) : 
                       account.balances.current || 0

        // Create better account name
        let accountName = account.official_name || account.name
        
        if (accountName === 'Connected Account' || accountName === 'Account' || !accountName) {
          const cleanInstitutionId = institutionId?.replace('ins_', '') || 'Bank'
          const accountTypeDisplay = account.subtype === 'savings' ? 'Savings' : 
                                   account.subtype === 'checking' ? 'Checking' :
                                   account.type === 'credit' ? 'Credit Card' : 
                                   account.subtype || 'Account'
          accountName = `${cleanInstitutionId} ${accountTypeDisplay}`
        }

        console.log(`💰 Syncing: ${accountName} (${accountType}) = $${balance}`)

        // Use upsert pattern to handle conflicts
        const { data, error } = await supabase
          .from('account_balances')
          .upsert({
            user_id: userId,
            account_name: accountName,
            account_type: accountType,
            balance: balance,
            plaid_account_id: account.account_id,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,plaid_account_id',
            ignoreDuplicates: false
          })
          .select()

        if (error) {
          console.error(`❌ Error syncing account ${accountName}:`, error)
          errors.push(`Failed to sync ${accountName}: ${error.message}`)
        } else {
          console.log(`✅ Successfully synced ${accountName}`)
          syncedAccounts++
        }

      } catch (accountError) {
        console.error(`❌ Error processing account ${account.account_id}:`, accountError)
        errors.push(`Failed to process account: ${accountError instanceof Error ? accountError.message : 'Unknown error'}`)
      }
    }

    return {
      success: errors.length === 0,
      syncedAccounts,
      errors
    }

  } catch (error) {
    console.error('❌ Balance sync failed:', error)
    return {
      success: false,
      syncedAccounts: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}
