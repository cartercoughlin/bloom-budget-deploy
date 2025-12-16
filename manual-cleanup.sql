-- Manual cleanup of all Plaid-related data
-- Run this to remove all remaining transactions and balances

-- Remove all transactions from recent dates (when Plaid was active)
DELETE FROM transactions 
WHERE date >= '2025-12-01';

-- Remove all account balances
DELETE FROM account_balances;

-- Show what's left
SELECT 
  'Remaining transactions' as type,
  COUNT(*) as count,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM transactions;

SELECT 
  'Remaining balances' as type,
  COUNT(*) as count
FROM account_balances;
