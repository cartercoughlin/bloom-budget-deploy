-- Remove the unique_user_account constraint and set up proper partial indexes
-- This allows multiple Plaid accounts with the same name but different plaid_account_ids

BEGIN;

-- 1. Drop the problematic unique constraint
ALTER TABLE account_balances
DROP CONSTRAINT IF EXISTS unique_user_account;

-- 2. Also drop any other name-based unique constraints that might exist
ALTER TABLE account_balances
DROP CONSTRAINT IF EXISTS account_balances_user_id_account_name_key;

-- 3. Drop any related indexes
DROP INDEX IF EXISTS account_balances_user_id_account_name_key;
DROP INDEX IF EXISTS account_balances_user_id_account_name_idx;

-- 4. Create partial unique index for Plaid accounts (by plaid_account_id)
-- This ensures each plaid_account_id is unique per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_balances_unique_plaid
ON account_balances (user_id, plaid_account_id)
WHERE plaid_account_id IS NOT NULL;

-- 5. Create partial unique index for manual accounts (by account_name)
-- This ensures manual account names are unique per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_balances_unique_manual
ON account_balances (user_id, account_name)
WHERE plaid_account_id IS NULL;

-- 6. Verify the changes
SELECT
    'Remaining unique constraints:' as info;

SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'account_balances'
  AND con.contype = 'u';

SELECT
    'New partial indexes:' as info;

SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'account_balances'
    AND schemaname = 'public'
    AND (indexname LIKE '%unique%' OR indexname LIKE '%plaid%')
ORDER BY indexname;

COMMIT;
