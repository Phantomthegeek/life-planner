-- Migration: Add Task Tags and Enhancements
-- Run this in Supabase SQL Editor
-- SAFE to re-run: every statement is guarded against already-existing objects.

-- ============================================
-- 1. TASK TAGS
-- ============================================

-- Add tags column to tasks table (no-op if column exists)
alter table public.tasks
add column if not exists tags text[] default '{}';

-- Create tags table for tag management
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  color text default '#6366f1',
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- Indexes
create index if not exists idx_tasks_tags on public.tasks using gin(tags);
create index if not exists idx_tags_user on public.tags(user_id);

-- RLS
alter table public.tags enable row level security;

drop policy if exists "Users can manage their own tags" on public.tags;
create policy "Users can manage their own tags" on public.tags
  for all using (auth.uid() = user_id);

-- ============================================
-- 2. EXPORT LOGS
-- ============================================

create table if not exists public.export_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  export_type text not null, -- 'json', 'csv', 'pdf'
  data_type text not null,   -- 'tasks', 'notes', 'habits', 'all'
  file_path text,
  created_at timestamptz default now()
);

alter table public.export_logs enable row level security;

drop policy if exists "Users can view their own export logs" on public.export_logs;
create policy "Users can view their own export logs" on public.export_logs
  for select using (auth.uid() = user_id);

-- ============================================
-- 3. CALENDAR INTEGRATIONS
-- Note: migration 003 already creates this table, its RLS, and the
-- set_updated_at_calendar_integrations trigger. We only add what's missing
-- (an extra-permissive policy) without conflicting with what's already there.
-- ============================================

create table if not exists public.calendar_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  provider text not null,
  access_token text,
  refresh_token text,
  calendar_id text,
  sync_enabled boolean default true,
  last_sync_at timestamptz,
  sync_direction text default 'two_way',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

alter table public.calendar_integrations enable row level security;

drop policy if exists "Users can manage their own calendar integrations" on public.calendar_integrations;
create policy "Users can manage their own calendar integrations" on public.calendar_integrations
  for all using (auth.uid() = user_id);

-- updated_at trigger (skip if already created by migration 003)
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_calendar_integrations'
  ) then
    create trigger set_updated_at_calendar_integrations
      before update on public.calendar_integrations
      for each row execute procedure public.handle_updated_at();
  end if;
end$$;
