-- supabase/migrations/20250814091512_initial_schema.sql

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email varchar unique not null,
  username varchar unique not null,
  full_name varchar not null,
  position varchar,
  department varchar,
  avatar_url varchar,
  allow_public_view boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Assessment periods table
create table public.assessment_periods (
  id uuid default gen_random_uuid() primary key,
  month integer not null,
  year integer not null,
  start_date date not null,
  end_date date not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_period unique(month, year)
);

-- Assessment assignments table
create table public.assessment_assignments (
  id uuid default gen_random_uuid() primary key,
  period_id uuid references public.assessment_periods(id) on delete cascade not null,
  assessor_id uuid references public.profiles(id) on delete cascade not null,
  assessee_id uuid references public.profiles(id) on delete cascade not null,
  is_completed boolean default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint no_self_assessment check (assessor_id != assessee_id),
  constraint unique_assignment unique(period_id, assessor_id, assessee_id)
);

-- Feedback responses table
create table public.feedback_responses (
  id uuid default gen_random_uuid() primary key,
  assignment_id uuid references public.assessment_assignments(id) on delete cascade not null,
  aspect varchar not null,
  indicator varchar not null,
  rating integer not null check (rating >= 1 and rating <= 10),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reminder logs table
create table public.reminder_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  period_id uuid references public.assessment_periods(id) on delete cascade not null,
  reminder_type varchar not null,
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Assessment history for tracking past evaluations
create table public.assessment_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  period_id uuid references public.assessment_periods(id) on delete cascade not null,
  total_feedback_received integer default 0,
  average_rating numeric(3,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_period unique(user_id, period_id)
);

-- Create indexes for better performance
create index idx_assessment_assignments_period on public.assessment_assignments(period_id);
create index idx_assessment_assignments_assessor on public.assessment_assignments(assessor_id);
create index idx_assessment_assignments_assessee on public.assessment_assignments(assessee_id);
create index idx_feedback_responses_assignment on public.feedback_responses(assignment_id);
create index idx_reminder_logs_user_period on public.reminder_logs(user_id, period_id);

-- Row Level Security (RLS) Policies
alter table public.profiles enable row level security;
alter table public.assessment_periods enable row level security;
alter table public.assessment_assignments enable row level security;
alter table public.feedback_responses enable row level security;
alter table public.reminder_logs enable row level security;
alter table public.assessment_history enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Assessment periods policies (everyone can view)
create policy "Everyone can view assessment periods" on public.assessment_periods
  for select using (true);

-- Assessment assignments policies
create policy "Users can view their own assignments" on public.assessment_assignments
  for select using (auth.uid() = assessor_id or auth.uid() = assessee_id);

create policy "Users can update their own assignments" on public.assessment_assignments
  for update using (auth.uid() = assessor_id);

-- Feedback responses policies (anonymous)
create policy "Users can insert feedback for their assignments" on public.feedback_responses
  for insert with check (
    exists (
      select 1 from public.assessment_assignments 
      where id = assignment_id and assessor_id = auth.uid()
    )
  );

-- Assessment history policies
create policy "Users can view assessment history" on public.assessment_history
  for select using (
    auth.uid() = user_id or 
    (select allow_public_view from public.profiles where id = user_id)
  );

-- Reminder logs policies
create policy "Users can view their own reminder logs" on public.reminder_logs
  for select using (auth.uid() = user_id);

-- Functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at on profiles
create trigger handle_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Function to generate random assignments
create or replace function public.generate_random_assignments(period_uuid uuid)
returns void as $$
declare
  user_record record;
  target_users uuid[];
  i integer;
begin
  -- Clear existing assignments for this period
  delete from public.assessment_assignments where period_id = period_uuid;
  
  -- For each user, assign 5 random other users to evaluate
  for user_record in select id from public.profiles loop
    -- Get 5 random users excluding the current user and previously assigned users
    select array_agg(id) into target_users
    from (
      select p.id
      from public.profiles p
      where p.id != user_record.id
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