-- supabase/migrations/20250815000003_exclude_admin_from_assessments.sql

-- Update the generate_random_assignments function to exclude admin users
create or replace function public.generate_random_assignments(period_uuid uuid)
returns void as $$
declare
  user_record record;
  target_users uuid[];
  i integer;
begin
  -- Clear existing assignments for this period
  delete from public.assessment_assignments where period_id = period_uuid;
  
  -- For each non-admin user, assign 5 random other non-admin users to evaluate
  for user_record in 
    select p.id 
    from public.profiles p
    left join public.user_roles ur on p.id = ur.user_id
    where ur.role is null or ur.role != 'admin'
  loop
    -- Get 5 random non-admin users excluding the current user and previously assigned users
    select array_agg(id) into target_users
    from (
      select p.id
      from public.profiles p
      left join public.user_roles ur on p.id = ur.user_id
      where p.id != user_record.id
      and (ur.role is null or ur.role != 'admin')  -- Exclude admin users
      and not exists (
        select 1 from public.assessment_assignments aa
        inner join public.assessment_periods ap on aa.period_id = ap.id
        where aa.assessor_id = user_record.id
        and aa.assessee_id = p.id
        and ap.year = (select year from public.assessment_periods where id = period_uuid)
        and ap.month < (select month from public.assessment_periods where id = period_uuid)
      )
      order by random()
      limit 5
    ) random_users;
    
    -- Insert assignments
    if array_length(target_users, 1) >= 5 then
      for i in 1..5 loop
        insert into public.assessment_assignments (period_id, assessor_id, assessee_id)
        values (period_uuid, user_record.id, target_users[i]);
      end loop;
    end if;
  end loop;
end;
$$ language plpgsql security definer;
