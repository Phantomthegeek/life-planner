-- Migration: Add Productivity Graph and Event System
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. PRODUCTIVITY GRAPH TABLES
-- ============================================

-- Task relationships (for graph queries)
create table if not exists public.task_relationships (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade not null,
  related_task_id uuid references public.tasks(id) on delete cascade not null,
  relationship_type text not null, -- 'dependency', 'similar', 'blocks', 'correlates', 'related'
  strength float default 0.5, -- 0-1 confidence
  metadata jsonb,
  created_at timestamptz default now(),
  unique(task_id, related_task_id, relationship_type)
);

-- Task context (calculated context for each task)
create table if not exists public.task_context (
  task_id uuid primary key references public.tasks(id) on delete cascade,
  project_priority_score float default 0,
  goal_impact_score float default 0,
  certification_urgency float default 0,
  habit_correlation float default 0,
  overall_priority_score float default 0,
  completion_likelihood float default 0.7,
  updated_at timestamptz default now()
);

-- ============================================
-- 2. EVENT SYSTEM
-- ============================================

-- System events (for event-driven architecture)
create table if not exists public.system_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  event_type text not null, -- 'TaskCompleted', 'HabitChecked', 'PlanGenerated', etc.
  entity_type text, -- 'task', 'habit', 'project', etc.
  entity_id uuid,
  event_data jsonb, -- flexible JSON storage for event details
  created_at timestamptz default now()
);

-- Index for system events
create index if not exists idx_events_user_type_created 
  on public.system_events(user_id, event_type, created_at desc);

-- Enable RLS for system events
alter table public.system_events enable row level security;

-- RLS policy for system events
create policy "Users view own system events" on public.system_events
  for all using (auth.uid() = user_id);

-- ============================================
-- 3. PERSONALIZATION MODEL
-- ============================================

-- Enhanced productivity patterns (if not exists)
-- This table was created in migration 003, adding index
create index if not exists idx_patterns_user_type 
  on public.productivity_patterns(user_id, pattern_type);

-- ============================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================

create index if not exists idx_task_relations_task on public.task_relationships(task_id);
create index if not exists idx_task_relations_related on public.task_relationships(related_task_id);
create index if not exists idx_task_relations_type on public.task_relationships(relationship_type);

-- ============================================
-- 5. FUNCTIONS FOR GRAPH QUERIES
-- ============================================

-- Function to get all related tasks
create or replace function public.get_task_relations(p_task_id uuid)
returns table (
  task_id uuid,
  related_task_id uuid,
  relationship_type text,
  strength float,
  related_task_title text
) as $$
begin
  return query
  select 
    tr.task_id,
    tr.related_task_id,
    tr.relationship_type,
    tr.strength,
    t.title as related_task_title
  from public.task_relationships tr
  join public.tasks t on t.id = tr.related_task_id
  where tr.task_id = p_task_id
  order by tr.strength desc;
end;
$$ language plpgsql security definer;

-- Function to calculate task priority score
create or replace function public.calculate_task_priority(p_task_id uuid)
returns float as $$
declare
  v_score float := 0;
  v_project_score float := 0;
  v_goal_score float := 0;
  v_cert_score float := 0;
begin
  -- Project priority (40% weight)
  select coalesce(p.progress / 100.0, 0) * 0.4
  into v_project_score
  from public.tasks t
  left join public.projects p on p.id = t.project_id
  where t.id = p_task_id;
  
  -- Certification urgency (30% weight)
  select coalesce(ucp.progress / 100.0, 0) * 0.3
  into v_cert_score
  from public.tasks t
  left join public.user_cert_progress ucp on ucp.cert_id = t.cert_id
  where t.id = p_task_id;
  
  -- Deadline proximity (30% weight)
  select case
    when t.date <= current_date then 0.3
    when t.date <= current_date + interval '3 days' then 0.2
    when t.date <= current_date + interval '7 days' then 0.1
    else 0
  end
  into v_goal_score
  from public.tasks t
  where t.id = p_task_id;
  
  v_score := coalesce(v_project_score, 0) + coalesce(v_cert_score, 0) + coalesce(v_goal_score, 0);
  
  return least(v_score, 1.0);
end;
$$ language plpgsql security definer;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

alter table public.task_relationships enable row level security;
alter table public.task_context enable row level security;

-- Task relationships policies
create policy "Users manage own task relationships" on public.task_relationships
  for all using (
    exists (
      select 1 from public.tasks t
      where t.id = task_relationships.task_id and t.user_id = auth.uid()
    )
  );

-- Task context policies
create policy "Users view own task context" on public.task_context
  for all using (
    exists (
      select 1 from public.tasks t
      where t.id = task_context.task_id and t.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Auto-update task context when task changes
create or replace function public.update_task_context()
returns trigger as $$
begin
  insert into public.task_context (task_id, overall_priority_score, updated_at)
  values (new.id, public.calculate_task_priority(new.id), now())
  on conflict (task_id) 
  do update set
    overall_priority_score = public.calculate_task_priority(new.id),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger update_task_context_trigger
  after insert or update on public.tasks
  for each row
  execute procedure public.update_task_context();

-- ============================================
-- 8. HELPER VIEWS
-- ============================================

-- View for task graph summary
create or replace view public.task_graph_summary as
select
  t.id as task_id,
  t.user_id,
  t.title,
  t.date,
  tc.overall_priority_score,
  tc.completion_likelihood,
  p.name as project_name,
  c.name as certification_name
from public.tasks t
left join public.task_context tc on tc.task_id = t.id
left join public.projects p on p.id = t.project_id
left join public.certifications c on c.id = t.cert_id;

