-- Find duplicate Oura Ring transactions this month
-- This will help identify what variations exist in the transaction names

SELECT
  id,
  date,
  description,
  amount,
  bank,
  transaction_type,
  plaid_transaction_id,
  created_at
FROM transactions
WHERE LOWER(description) LIKE '%oura%'
  AND date >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY date DESC, amount DESC, created_at DESC;

-- Also check for potential duplicates (same date, similar amount)
SELECT
  t1.id as id1,
  t1.description as desc1,
  t1.amount as amount1,
  t1.date as date1,
  t1.created_at as created1,
  t1.plaid_transaction_id as plaid_id1,
  t2.id as id2,
  t2.description as desc2,
  t2.amount as amount2,
  t2.date as date2,
  t2.created_at as created2,
  t2.plaid_transaction_id as plaid_id2
FROM transactions t1
JOIN transactions t2 ON (
  t1.user_id = t2.user_id
  AND t1.id < t2.id
  AND t1.date = t2.date
  AND ABS(t1.amount - t2.amount) < 0.01
  AND LOWER(t1.description) LIKE '%oura%'
  AND LOWER(t2.description) LIKE '%oura%'
)
WHERE t1.date >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY t1.date DESC;
