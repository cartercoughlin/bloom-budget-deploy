-- Add enrichment columns to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category_detailed TEXT;
