-- Add account balance tracking
CREATE TABLE IF NOT EXISTS account_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'liability')),
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify budgets table to support allocation-based budgeting
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS allocated_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS available_amount DECIMAL(10,2) DEFAULT 0;

-- Create budget allocation tracking
CREATE TABLE IF NOT EXISTS budget_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  allocated_amount DECIMAL(10,2) NOT NULL,
  allocation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own account balances" ON account_balances
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budget allocations" ON budget_allocations
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_account_balances_user_id ON account_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_user_id ON budget_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_budget_id ON budget_allocations(budget_id);
