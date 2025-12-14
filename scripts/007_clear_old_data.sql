-- Clear all existing transaction and account data
DELETE FROM transactions;
DELETE FROM account_balances;

-- Reset any sync timestamps
UPDATE profiles SET last_sync_at = NULL;
