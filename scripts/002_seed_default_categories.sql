-- Create a function to seed default categories for new users
create or replace function public.seed_default_categories(user_id_param uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, color, icon) values
    (user_id_param, 'Groceries', '#10B981', '🛒'),
    (user_id_param, 'Dining Out', '#F59E0B', '🍽️'),
    (user_id_param, 'Transportation', '#3B82F6', '🚗'),
    (user_id_param, 'Entertainment', '#8B5CF6', '🎬'),
    (user_id_param, 'Shopping', '#EC4899', '🛍️'),
    (user_id_param, 'Bills & Utilities', '#EF4444', '💡'),
    (user_id_param, 'Healthcare', '#06B6D4', '🏥'),
    (user_id_param, 'Income', '#22C55E', '💰'),
    (user_id_param, 'Other', '#6B7280', '📦')
  on conflict do nothing;
end;
$$;

-- Create trigger to auto-seed categories when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;

  -- Seed default categories
  perform seed_default_categories(new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
