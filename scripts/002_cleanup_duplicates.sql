-- Clean up duplicate transactions and data inconsistencies
-- Run this on existing databases to remove duplicates
-- Uses normalized matching to catch variations in spacing, special characters, etc.

-- Remove duplicate transactions (normalized case-insensitive matching)
WITH similar_transactions AS (
  SELECT
    t1.id as id1,
    t2.id as id2,
    t1.created_at as created1,
    t2.created_at as created2,
    t1.description as desc1,
    t2.description as desc2
  FROM transactions t1
  JOIN transactions t2 ON (
    t1.user_id = t2.user_id
    AND t1.id < t2.id -- Only compare each pair once
    AND t1.date = t2.date -- Exact same date
    AND ABS(t1.amount - t2.amount) <= 0.01 -- Essentially the same amount
    AND (
      -- Normalized description matching (removes spaces and special characters for comparison)
      REGEXP_REPLACE(LOWER(TRIM(t1.description)), '[^\w\s]+', '', 'g') =
      REGEXP_REPLACE(LOWER(TRIM(t2.description)), '[^\w\s]+', '', 'g')
      OR
      -- Normalized merchant name matching
      (
        t1.merchant_name IS NOT NULL
        AND t2.merchant_name IS NOT NULL
        AND REGEXP_REPLACE(LOWER(TRIM(t1.merchant_name)), '[^\w\s]+', '', 'g') =
        REGEXP_REPLACE(LOWER(TRIM(t2.merchant_name)), '[^\w\s]+', '', 'g')
      )
    )
  )
  WHERE t1.created_at >= NOW() - INTERVAL '60 days'
    AND t2.created_at >= NOW() - INTERVAL '60 days'
),
duplicates_to_remove AS (
  SELECT
    CASE
      WHEN created1 < created2 THEN id2  -- Remove newer transaction (keep older one)
      ELSE id1
    END as duplicate_id,
    CASE
      WHEN created1 < created2 THEN desc2
      ELSE desc1
    END as description
  FROM similar_transactions
)

-- Show what will be deleted
SELECT
  'Found duplicates to remove' as status,
  COUNT(*) as duplicate_count
FROM duplicates_to_remove;

-- Show the actual duplicates
SELECT
  t.id,
  t.date,
  t.description,
  t.amount,
  t.bank,
  t.created_at
FROM transactions t
WHERE t.id IN (SELECT duplicate_id FROM duplicates_to_remove)
ORDER BY t.date DESC, t.description;

-- Delete the duplicates (newer ones)
DELETE FROM transactions
WHERE id IN (SELECT duplicate_id FROM duplicates_to_remove);

-- Show cleanup summary
SELECT
  'Cleanup completed' as status,
  COUNT(*) as remaining_recent_transactions
FROM transactions
WHERE created_at >= NOW() - INTERVAL '60 days';
