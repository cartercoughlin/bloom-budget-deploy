-- Add account_name column to plaid_items table
ALTER TABLE plaid_items ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE plaid_items ADD COLUMN IF NOT EXISTS institution_name TEXT;
