-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Create categories table
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#3B82F6',
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;

create policy "categories_select_own"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "categories_insert_own"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "categories_update_own"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "categories_delete_own"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Create transactions table
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  description text not null,
  amount numeric(10, 2) not null,
  category_id uuid references public.categories(id) on delete set null,
  bank text not null,
  transaction_type text not null check (transaction_type in ('debit', 'credit')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;

create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "transactions_update_own"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "transactions_delete_own"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Create budgets table
create table if not exists public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  amount numeric(10, 2) not null,
  month integer not null check (month >= 1 and month <= 12),
  year integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, category_id, month, year)
);

alter table public.budgets enable row level security;

create policy "budgets_select_own"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "budgets_insert_own"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "budgets_update_own"
  on public.budgets for update
  using (auth.uid() = user_id);

create policy "budgets_delete_own"
  on public.budgets for delete
  using (auth.uid() = user_id);

-- Create indexes for better query performance
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_date_idx on public.transactions(date);
create index if not exists transactions_category_id_idx on public.transactions(category_id);
create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists budgets_user_id_idx on public.budgets(user_id);
create index if not exists budgets_month_year_idx on public.budgets(month, year);
