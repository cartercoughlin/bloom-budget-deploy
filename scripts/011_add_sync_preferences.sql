-- Add sync preference columns to plaid_items table
ALTER TABLE plaid_items ADD COLUMN IF NOT EXISTS sync_transactions BOOLEAN DEFAULT true;
ALTER TABLE plaid_items ADD COLUMN IF NOT EXISTS sync_balances BOOLEAN DEFAULT true;
