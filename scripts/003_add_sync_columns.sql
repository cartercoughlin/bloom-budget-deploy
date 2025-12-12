-- Add sync tracking columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_sync_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS google_sheet_id text;

-- Add transaction_id column to transactions table to prevent duplicates
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS transaction_id text,
ADD COLUMN IF NOT EXISTS account text,
ADD COLUMN IF NOT EXISTS institution text;

-- Update the bank column name to account for clarity (keep both for backwards compatibility)
-- Create index on transaction_id for faster duplicate checking
CREATE INDEX IF NOT EXISTS transactions_transaction_id_idx ON public.transactions(transaction_id);

-- Update the transactions table check constraint to allow account/institution fields
COMMENT ON COLUMN public.transactions.account IS 'Account name from bank/financial institution';
COMMENT ON COLUMN public.transactions.institution IS 'Financial institution name (e.g., Chase, Citi)';
COMMENT ON COLUMN public.transactions.transaction_id IS 'Unique transaction ID from source system to prevent duplicates';
