#!/usr/bin/env node

// Debug script to check balance sync issues
// Run with: node debug-balance-sync.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugBalanceSync() {
  console.log('🔍 Debugging balance sync issues...\n')

  try {
    // 1. Check plaid_items table
    console.log('1. Checking Plaid items and sync settings:')
    const { data: plaidItems, error: plaidError } = await supabase
      .from('plaid_items')
      .select('*')
    
    if (plaidError) {
      console.error('❌ Error fetching plaid items:', plaidError)
      return
    }

    if (!plaidItems || plaidItems.length === 0) {
      console.log('❌ No Plaid items found. You need to connect a bank account first.')
      return
    }

    plaidItems.forEach((item, i) => {
      console.log(`   Item ${i + 1}:`)
      console.log(`   - Institution: ${item.institution_name || 'Unknown'}`)
      console.log(`   - Sync Transactions: ${item.sync_transactions}`)
      console.log(`   - Sync Balances: ${item.sync_balances}`)
      console.log(`   - Created: ${item.created_at}`)
      console.log('')
    })

    // 2. Check account_balances table
    console.log('2. Checking account balances:')
    const { data: balances, error: balanceError } = await supabase
      .from('account_balances')
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (balanceError) {
      console.error('❌ Error fetching account balances:', balanceError)
      return
    }

    if (!balances || balances.length === 0) {
      console.log('❌ No account balances found.')
    } else {
      balances.forEach((balance, i) => {
        console.log(`   Balance ${i + 1}:`)
        console.log(`   - Account: ${balance.account_name}`)
        console.log(`   - Type: ${balance.account_type}`)
        console.log(`   - Balance: $${balance.balance}`)
        console.log(`   - Plaid ID: ${balance.plaid_account_id || 'None'}`)
        console.log(`   - Updated: ${balance.updated_at}`)
        console.log('')
      })
    }

    // 3. Check recent transactions
    console.log('3. Checking recent transactions:')
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('date, description, amount, bank, plaid_account_id')
      .order('date', { ascending: false })
      .limit(5)
    
    if (txError) {
      console.error('❌ Error fetching transactions:', txError)
      return
    }

    if (!transactions || transactions.length === 0) {
      console.log('❌ No transactions found.')
    } else {
      transactions.forEach((tx, i) => {
        console.log(`   Transaction ${i + 1}:`)
        console.log(`   - Date: ${tx.date}`)
        console.log(`   - Description: ${tx.description}`)
        console.log(`   - Amount: $${tx.amount}`)
        console.log(`   - Bank: ${tx.bank}`)
        console.log(`   - Plaid Account ID: ${tx.plaid_account_id || 'None'}`)
        console.log('')
      })
    }

    // 4. Check for constraint issues
    console.log('4. Checking for potential constraint conflicts:')
    const { data: duplicateNames, error: dupError } = await supabase
      .rpc('check_duplicate_account_names')
    
    if (dupError && !dupError.message.includes('function check_duplicate_account_names')) {
      console.error('❌ Error checking duplicates:', dupError)
    } else {
      console.log('✅ No duplicate account name issues detected.')
    }

    // 5. Recommendations
    console.log('\n📋 Recommendations:')
    
    const hasBalanceSyncDisabled = plaidItems.some(item => !item.sync_balances)
    if (hasBalanceSyncDisabled) {
      console.log('⚠️  Some accounts have balance sync disabled. Enable it in your Plaid settings.')
    }

    if (!balances || balances.length === 0) {
      console.log('⚠️  No account balances found. Try running a manual sync.')
      console.log('   Run: POST /api/sync-transactions')
    }

    const hasGenericBankNames = transactions?.some(tx => 
      tx.bank === 'Connected Account' || tx.bank === 'Account' || !tx.bank
    )
    if (hasGenericBankNames) {
      console.log('⚠️  Some transactions have generic bank names. This might indicate sync issues.')
    }

  } catch (error) {
    console.error('❌ Debug script error:', error)
  }
}

debugBalanceSync()
