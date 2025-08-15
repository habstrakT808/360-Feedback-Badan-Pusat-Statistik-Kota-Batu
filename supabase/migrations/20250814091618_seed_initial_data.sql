-- supabase/migrations/20250814091618_seed_initial_data.sql

-- Insert current assessment period
insert into public.assessment_periods (month, year, start_date, end_date, is_active)
values (
  extract(month from current_date)::integer,
  extract(year from current_date)::integer,
  date_trunc('month', current_date)::date,
  (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
  true
);

-- Function to create admin user (call this after first admin signs up)
create or replace function public.setup_admin_user(admin_email text)
returns void as $$
begin
  update public.profiles 
  set 
    position = 'Administrator',
    department = 'IT',
    full_name = 'System Administrator'
  where email = admin_email;
end;
$$ language plpgsql security definer;