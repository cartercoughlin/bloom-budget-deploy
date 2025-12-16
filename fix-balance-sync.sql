-- Fix balance sync issues

-- 1. Ensure balance sync is enabled for all Plaid items
UPDATE plaid_items 
SET sync_balances = TRUE 
WHERE sync_balances = FALSE;

-- 2. Remove the unique constraint on account_name that might be causing conflicts
-- This allows multiple accounts with the same name (differentiated by plaid_account_id)
ALTER TABLE account_balances DROP CONSTRAINT IF EXISTS account_balances_user_id_account_name_key;

-- 3. Add a better unique constraint that allows same names but different Plaid accounts
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_balances_unique_plaid_v2
ON account_balances (user_id, plaid_account_id) 
WHERE plaid_account_id IS NOT NULL;

-- 4. Check current state
SELECT 
  'Plaid Items' as table_name,
  institution_name,
  sync_balances,
  sync_transactions
FROM plaid_items;

SELECT 
  'Account Balances' as table_name,
  COUNT(*) as count
FROM account_balances;

-- 5. Show any constraint conflicts
SELECT 
  account_name,
  COUNT(*) as count
FROM account_balances 
GROUP BY account_name, user_id
HAVING COUNT(*) > 1;
