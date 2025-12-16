-- Debug account balances and sync status

-- Check account balances
SELECT 
  'Account Balances' as table_name,
  account_name,
  account_type,
  balance,
  plaid_account_id,
  updated_at
FROM account_balances
ORDER BY updated_at DESC;

-- Check Plaid items
SELECT 
  'Plaid Items' as table_name,
  institution_name,
  sync_balances,
  sync_transactions,
  created_at
FROM plaid_items
ORDER BY created_at DESC;

-- Check recent transactions
SELECT 
  'Recent Transactions' as table_name,
  date,
  description,
  amount,
  bank,
  plaid_transaction_id,
  plaid_account_id
FROM transactions 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC
LIMIT 5;
