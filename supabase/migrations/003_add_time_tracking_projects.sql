-- Migration: Add Time Tracking, Projects, Goals, and Enhanced Features
-- Run this in Supabase SQL Editor
-- IMPORTANT: Run migrations in order: 001, 002, then this one (003)

-- ============================================
-- 1. PROJECTS & GOALS SYSTEM (Must be created FIRST!)
-- ============================================

-- Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  description text,
  color text,
  icon text,
  target_date date,
  start_date date,
  status text default 'active', -- active, completed, paused, archived
  progress int default 0, -- 0-100
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Goals table (high-level objectives)
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  category text, -- career, health, learning, personal, etc.
  target_date date,
  start_date timestamptz default now(),
  status text default 'active', -- active, completed, paused, cancelled
  progress int default 0, -- 0-100
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Milestones (within projects or goals)
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  description text,
  target_date date,
  completed boolean default false,
  completed_at timestamptz,
  order_idx int default 0,
  created_at timestamptz default now(),
  constraint check_parent check (
    (project_id is not null and goal_id is null) or
    (project_id is null and goal_id is not null)
  )
);

-- Link tasks to projects and milestones
alter table public.tasks
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists milestone_id uuid references public.milestones(id) on delete set null,
  add column if not exists actual_time_minutes int;

-- ============================================
-- 2. TIME TRACKING SYSTEM (Now that projects exist)
-- ============================================

-- Time tracking sessions
create table if not exists public.time_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz,
  duration_minutes int,
  notes text,
  created_at timestamptz default now()
);

-- Add time tracking active session (only one per user)
create table if not exists public.active_time_sessions (
  user_id uuid primary key references public.users(id) on delete cascade,
  session_id uuid references public.time_sessions(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete set null,
  started_at timestamptz default now()
);

-- ============================================
-- 3. PRODUCTIVITY PATTERNS (for AI learning)
-- ============================================

-- User productivity patterns (learned by AI)
create table if not exists public.productivity_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  pattern_type text not null, -- 'best_time', 'task_duration', 'category_preference', etc.
  pattern_data jsonb not null, -- flexible JSON storage
  confidence_score float default 0.5, -- 0-1, how confident we are in this pattern
  last_updated timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, pattern_type)
);

-- Task completion history (for learning)
create table if not exists public.task_completion_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete set null,
  scheduled_start timestamptz,
  actual_start timestamptz,
  scheduled_end timestamptz,
  actual_end timestamptz,
  estimated_minutes int,
  actual_minutes int,
  completed_on_time boolean,
  rescheduled_count int default 0,
  energy_level int, -- 1-5 rating
  difficulty_rating int, -- 1-5 rating
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- 4. ANALYTICS & INSIGHTS
-- ============================================

-- Weekly productivity summaries
create table if not exists public.weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  week_start date not null,
  week_end date not null,
  tasks_completed int default 0,
  tasks_planned int default 0,
  hours_tracked numeric(10, 2) default 0,
  habits_maintained int default 0,
  productivity_score int, -- 0-100
  insights jsonb, -- AI-generated insights
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

-- ============================================
-- 5. CALENDAR INTEGRATIONS
-- ============================================

-- Calendar integrations
create table if not exists public.calendar_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  provider text not null, -- 'google', 'outlook', 'apple'
  access_token text, -- encrypted
  refresh_token text, -- encrypted
  calendar_id text,
  sync_enabled boolean default true,
  sync_direction text default 'two-way', -- 'one-way-in', 'one-way-out', 'two-way'
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- External calendar events (synced from calendars)
create table if not exists public.external_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  integration_id uuid references public.calendar_integrations(id) on delete cascade,
  external_id text not null, -- ID from external calendar
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  description text,
  location text,
  imported_as_task boolean default false,
  task_id uuid references public.tasks(id) on delete set null,
  last_synced_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, external_id, integration_id)
);

-- ============================================
-- 6. AUTOMATION & WORKFLOWS
-- ============================================

-- Automation rules
create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  trigger_type text not null, -- 'task_completed', 'habit_completed', 'time_of_day', 'date', etc.
  trigger_config jsonb not null,
  action_type text not null, -- 'create_task', 'update_task', 'send_notification', etc.
  action_config jsonb not null,
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

create index if not exists idx_time_sessions_user_task on public.time_sessions(user_id, task_id);
create index if not exists idx_time_sessions_date on public.time_sessions(start_time);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_milestone on public.tasks(milestone_id);
create index if not exists idx_projects_user on public.projects(user_id);
create index if not exists idx_goals_user on public.goals(user_id);
create index if not exists idx_milestones_project on public.milestones(project_id);
create index if not exists idx_milestones_goal on public.milestones(goal_id);
create index if not exists idx_patterns_user on public.productivity_patterns(user_id);
create index if not exists idx_completion_history_user on public.task_completion_history(user_id);
create index if not exists idx_calendar_events_user on public.external_calendar_events(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
alter table public.time_sessions enable row level security;
alter table public.active_time_sessions enable row level security;
alter table public.projects enable row level security;
alter table public.goals enable row level security;
alter table public.milestones enable row level security;
alter table public.productivity_patterns enable row level security;
alter table public.task_completion_history enable row level security;
alter table public.weekly_summaries enable row level security;
alter table public.calendar_integrations enable row level security;
alter table public.external_calendar_events enable row level security;
alter table public.automation_rules enable row level security;

-- Time sessions policies
create policy "Users manage own time sessions" on public.time_sessions
  for all using (auth.uid() = user_id);

create policy "Users manage own active sessions" on public.active_time_sessions
  for all using (auth.uid() = user_id);

-- Projects policies
create policy "Users manage own projects" on public.projects
  for all using (auth.uid() = user_id);

-- Goals policies
create policy "Users manage own goals" on public.goals
  for all using (auth.uid() = user_id);

-- Milestones policies
create policy "Users manage own milestones" on public.milestones
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id and p.user_id = auth.uid()
    ) or exists (
      select 1 from public.goals g
      where g.id = milestones.goal_id and g.user_id = auth.uid()
    ) or auth.uid() = user_id
  );

-- Productivity patterns policies
create policy "Users manage own patterns" on public.productivity_patterns
  for all using (auth.uid() = user_id);

-- Completion history policies
create policy "Users manage own history" on public.task_completion_history
  for all using (auth.uid() = user_id);

-- Weekly summaries policies
create policy "Users view own summaries" on public.weekly_summaries
  for all using (auth.uid() = user_id);

-- Calendar integrations policies
create policy "Users manage own integrations" on public.calendar_integrations
  for all using (auth.uid() = user_id);

-- External events policies
create policy "Users manage own events" on public.external_calendar_events
  for all using (auth.uid() = user_id);

-- Automation rules policies
create policy "Users manage own automations" on public.automation_rules
  for all using (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update project progress when tasks are completed
create or replace function public.update_project_progress()
returns trigger as $$
begin
  if new.done != old.done and new.project_id is not null then
    update public.projects
    set progress = (
      select case
        when count(*) = 0 then 0
        else round((count(*) filter (where done = true)::numeric / count(*)::numeric) * 100)
      end
      from public.tasks
      where project_id = new.project_id
    ),
    updated_at = now()
    where id = new.project_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger update_project_progress_trigger
  after update on public.tasks
  for each row
  when (new.project_id is not null)
  execute procedure public.update_project_progress();

-- Update milestone completion when all tasks are done
create or replace function public.update_milestone_completion()
returns trigger as $$
begin
  if new.done != old.done and new.milestone_id is not null then
    update public.milestones
    set completed = not exists (
      select 1 from public.tasks
      where milestone_id = new.milestone_id and done = false
    ),
    completed_at = case
      when not exists (
        select 1 from public.tasks
        where milestone_id = new.milestone_id and done = false
      ) then now()
      else null
    end
    where id = new.milestone_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger update_milestone_completion_trigger
  after update on public.tasks
  for each row
  when (new.milestone_id is not null)
  execute procedure public.update_milestone_completion();

-- Update updated_at timestamps
create trigger set_updated_at_projects
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_goals
  before update on public.goals
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_automation_rules
  before update on public.automation_rules
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_calendar_integrations
  before update on public.calendar_integrations
  for each row execute procedure public.handle_updated_at();
