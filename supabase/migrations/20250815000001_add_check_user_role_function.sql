-- supabase/migrations/20250815000001_add_check_user_role_function.sql

-- Create function to check user role (bypasses RLS for admin checks)
create or replace function public.check_user_role(user_uuid uuid)
returns varchar
language plpgsql
security definer
as $$
declare
  user_role varchar;
begin
  -- Get user role from user_roles table
  select role into user_role
  from public.user_roles
  where user_id = user_uuid;
  
  -- Return role or 'user' as default
  return coalesce(user_role, 'user');
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.check_user_role(uuid) to authenticated;

-- Create function to get current user role
create or replace function public.get_current_user_role()
returns varchar
language plpgsql
security definer
as $$
declare
  user_role varchar;
begin
  -- Get current user's role
  select role into user_role
  from public.user_roles
  where user_id = auth.uid();
  
  -- Return role or 'user' as default
  return coalesce(user_role, 'user');
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_current_user_role() to authenticated;
