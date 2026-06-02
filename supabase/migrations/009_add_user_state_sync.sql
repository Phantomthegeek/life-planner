-- ============================================
-- 009: User state sync (gamification + templates)
-- ============================================
--
-- Before this migration, XP / level / achievements / task templates lived
-- exclusively in browser localStorage via Zustand's persist middleware. That
-- meant nothing carried across devices and a user's progress effectively
-- "lived" on whichever browser they last used.
--
-- This migration adds two tables — both intentionally simple, both keyed by
-- user_id only (no separate id surrogate) so upserts can target the row
-- directly with the user's auth uid.
--
-- The tables use jsonb columns for state that's either user-defined (template
-- list) or schema-volatile (achievement list). The application layer is the
-- source of truth for the shape.

-- ============================================
-- user_gamification — one row per user
-- ============================================
create table if not exists public.user_gamification (
  user_id uuid primary key references public.users(id) on delete cascade,
  xp int not null default 0,
  level int not null default 1,
  total_tasks_completed int not null default 0,
  total_habits_completed int not null default 0,
  streak int not null default 0,
  -- Achievements stored as an array of { id, progress, unlockedAt } objects.
  -- We don't bother normalizing into a side table because the achievement
  -- catalog is small and client-defined; introducing FKs would force a
  -- migration every time we add a new achievement type.
  achievements jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_gamification_updated
  on public.user_gamification(updated_at);

alter table public.user_gamification enable row level security;

drop policy if exists "Users manage own gamification" on public.user_gamification;
create policy "Users manage own gamification" on public.user_gamification
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at_user_gamification on public.user_gamification;
create trigger set_updated_at_user_gamification
  before update on public.user_gamification
  for each row execute procedure public.handle_updated_at();

-- ============================================
-- user_task_templates — many rows per user
-- ============================================
create table if not exists public.user_task_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  title text not null,
  detail text,
  duration_minutes int not null default 60,
  category text not null default 'work',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_task_templates_user
  on public.user_task_templates(user_id);

alter table public.user_task_templates enable row level security;

drop policy if exists "Users manage own task templates" on public.user_task_templates;
create policy "Users manage own task templates" on public.user_task_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at_user_task_templates on public.user_task_templates;
create trigger set_updated_at_user_task_templates
  before update on public.user_task_templates
  for each row execute procedure public.handle_updated_at();
