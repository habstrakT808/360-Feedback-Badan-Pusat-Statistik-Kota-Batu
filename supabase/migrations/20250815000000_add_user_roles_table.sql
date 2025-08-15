-- supabase/migrations/20250815000000_add_user_roles_table.sql

-- Create user_roles table if it doesn't exist
create table if not exists public.user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role varchar not null check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text) not null,
  updated_at timestamp with time zone default timezone('utc'::text) not null,
  constraint unique_user_role unique(user_id)
);

-- Create index for better performance
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);

-- Enable Row Level Security
alter table public.user_roles enable row level security;

-- Create RLS policies
-- Users can view their own role
create policy "Users can view their own role" on public.user_roles
  for select using (auth.uid() = user_id);

-- Only admins can insert/update/delete user roles
create policy "Only admins can manage user roles" on public.user_roles
  for all using (
    exists (
      select 1 from public.user_roles 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger update_user_roles_updated_at
  before update on public.user_roles
  for each row
  execute function public.update_updated_at_column();
