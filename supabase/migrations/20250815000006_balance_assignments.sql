-- Ensure balanced 360° peer assignments per active period
-- This replaces the previous purely-random approach while keeping the same function name
-- so existing API calls continue to work.

create or replace function public.generate_random_assignments(period_uuid uuid)
returns void as $$
declare
  -- configuration
  target_k integer; -- desired number of peers per user (max 5, capped by N-1)

  -- eligible users (non-admin, non-supervisor)
  eligible_users uuid[];
  n integer;

  -- indices
  r integer; -- round offset
  i integer; -- user index

  assessor uuid;
  candidate uuid;
begin
  -- Clear existing assignments for this period to regenerate cleanly
  delete from public.assessment_assignments where period_id = period_uuid;

  -- Build eligible peer set: exclude admins and supervisors (peer-only)
  select array_agg(u.id)
  into eligible_users
  from (
    select p.id
    from public.profiles p
    left join public.user_roles ur on ur.user_id = p.id
    where coalesce(ur.role, '') not in ('admin', 'supervisor')
    order by random()
  ) as u;

  n := coalesce(array_length(eligible_users, 1), 0);

  -- Nothing to assign if fewer than 2 eligible users
  if n < 2 then
    return;
  end if;

  -- Determine target K per user: at most 5 and at most N-1
  target_k := least(5, n - 1);
  if target_k <= 0 then
    return;
  end if;

  -- Perform K rounds using cyclic shift (derangement per round)
  -- For round r (1..target_k), each user i evaluates user (i + r) mod n
  for r in 1..target_k loop
    for i in 1..n loop
      assessor := eligible_users[i];
      candidate := eligible_users[((i - 1 + r) % n) + 1];

      -- Extra guard (r>=1 ensures assessor<>candidate)
      if assessor <> candidate then
        insert into public.assessment_assignments (period_id, assessor_id, assessee_id)
        values (period_uuid, assessor, candidate)
        on conflict on constraint unique_assignment do nothing;
      end if;
    end loop;
  end loop;
end;
$$ language plpgsql security definer;


