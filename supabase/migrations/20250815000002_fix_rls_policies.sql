-- supabase/migrations/20250815000002_fix_rls_policies.sql

-- Drop existing restrictive policies
drop policy if exists "Users can view their own role" on public.user_roles;
drop policy if exists "Only admins can manage user roles" on public.user_roles;

-- Create more permissive policies for role checking
-- Allow authenticated users to read user_roles for role checking
create policy "Allow authenticated users to read user_roles" on public.user_roles
  for select using (auth.role() = 'authenticated');

-- Allow admins to manage user roles
create policy "Allow admins to manage user roles" on public.user_roles
  for all using (
    exists (
      select 1 from public.user_roles 
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Create a view for easier role checking
create or replace view public.user_roles_view as
select 
  ur.user_id,
  ur.role,
  ur.created_at,
  ur.updated_at
from public.user_roles ur;

-- Grant access to the view
grant select on public.user_roles_view to authenticated;
