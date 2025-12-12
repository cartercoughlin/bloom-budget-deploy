-- Migration: Create category_rules table with support for multiple conditions
-- This enables automatic categorization of transactions based on rules

-- Create category_rules table
create table if not exists public.category_rules (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  priority integer not null default 5 check (priority >= 1 and priority <= 10),
  is_active boolean not null default true,

  -- Condition fields (all optional, rules match if ALL specified conditions match)
  description_pattern text, -- Regex pattern for description matching
  amount_min numeric(10, 2), -- Minimum amount
  amount_max numeric(10, 2), -- Maximum amount
  transaction_type text check (transaction_type in ('debit', 'credit')), -- Filter by type
  bank_pattern text, -- Regex pattern for bank matching
  account_pattern text, -- Regex pattern for account matching
  institution_pattern text, -- Regex pattern for institution matching

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure at least one condition is specified
  constraint at_least_one_condition check (
    description_pattern is not null or
    amount_min is not null or
    amount_max is not null or
    transaction_type is not null or
    bank_pattern is not null or
    account_pattern is not null or
    institution_pattern is not null
  )
);

-- Create indexes for performance
create index if not exists category_rules_user_id_idx on public.category_rules(user_id);
create index if not exists category_rules_category_id_idx on public.category_rules(category_id);
create index if not exists category_rules_priority_idx on public.category_rules(priority desc);
create index if not exists category_rules_is_active_idx on public.category_rules(is_active);

-- Enable Row Level Security
alter table public.category_rules enable row level security;

-- Create RLS policies
create policy "Users can view their own category rules"
  on public.category_rules for select
  using (auth.uid() = user_id);

create policy "Users can create their own category rules"
  on public.category_rules for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own category rules"
  on public.category_rules for update
  using (auth.uid() = user_id);

create policy "Users can delete their own category rules"
  on public.category_rules for delete
  using (auth.uid() = user_id);

-- Create function to update updated_at timestamp
create or replace function public.update_category_rules_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger to auto-update updated_at
create trigger update_category_rules_updated_at
  before update on public.category_rules
  for each row
  execute function public.update_category_rules_updated_at();

-- Grant permissions
grant all on public.category_rules to authenticated;
grant all on public.category_rules to service_role;
