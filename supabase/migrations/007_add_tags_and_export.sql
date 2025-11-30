-- Migration: Add Task Tags and Enhancements
-- Run this in Supabase SQL Editor

-- Add tags column to tasks table
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

-- Create index for faster tag queries
create index if not exists idx_tasks_tags on public.tasks using gin(tags);
create index if not exists idx_tags_user on public.tags(user_id);

-- Enable RLS for tags
alter table public.tags enable row level security;

create policy "Users can manage their own tags" on public.tags
  for all using (auth.uid() = user_id);

-- Add export_logs table for tracking exports
create table if not exists public.export_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  export_type text not null, -- 'json', 'csv', 'pdf'
  data_type text not null, -- 'tasks', 'notes', 'habits', 'all'
  file_path text,
  created_at timestamptz default now()
);

alter table public.export_logs enable row level security;

create policy "Users can view their own export logs" on public.export_logs
  for select using (auth.uid() = user_id);

-- Add calendar sync settings
create table if not exists public.calendar_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  provider text not null, -- 'google', 'outlook', 'ical'
  access_token text,
  refresh_token text,
  calendar_id text,
  sync_enabled boolean default true,
  last_sync_at timestamptz,
  sync_direction text default 'two_way', -- 'two_way', 'import', 'export'
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

alter table public.calendar_integrations enable row level security;

create policy "Users can manage their own calendar integrations" on public.calendar_integrations
  for all using (auth.uid() = user_id);

-- Update updated_at trigger for calendar_integrations
create trigger set_updated_at_calendar_integrations
  before update on public.calendar_integrations
  for each row execute procedure public.handle_updated_at();

