# Database Scripts

This directory contains SQL scripts for database migrations and fixes.

## Recent Fixes

### 013_fix_transaction_types.sql

**Purpose:** Fixes reversed transaction types from the old Plaid sync logic.

**Background:**
Before commit `da6c23f0`, the Plaid sync incorrectly mapped transaction amounts:
- Positive amounts (expenses) were marked as `credit` (should be `debit`)
- Negative amounts (income) were marked as `debit` (should be `credit`)

This caused transactions to display with reversed income/expense labels.

**When to run:**
- If you have existing transactions that were synced before the fix
- If your old transactions show expenses as income and vice versa

**How to run:**
1. Open your Supabase SQL Editor
2. Copy and paste the contents of `013_fix_transaction_types.sql`
3. Execute the script
4. Verify the results using the SELECT query at the end

**What it does:**
- Swaps all `credit` transactions to `debit`
- Swaps all `debit` transactions to `credit`
- Shows a summary count after the update

**Note:** New transactions synced after commit `da6c23f0` will have the correct types and don't need this fix.
