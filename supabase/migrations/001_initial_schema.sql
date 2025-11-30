-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  wake_time text default '07:00',
  sleep_time text default '23:00',
  work_hours_start text default '09:00',
  work_hours_end text default '17:00',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Certifications
create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  difficulty int default 3,
  created_at timestamptz default now()
);

-- Certification Modules
create table public.cert_modules (
  id uuid primary key default gen_random_uuid(),
  cert_id uuid references public.certifications(id) on delete cascade not null,
  title text not null,
  description text,
  estimated_hours int default 1,
  order_idx int default 0
);

-- User Certification Progress
create table public.user_cert_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  cert_id uuid references public.certifications(id) on delete cascade not null,
  progress int default 0,
  target_date date,
  exam_scheduled boolean default false,
  exam_date date,
  updated_at timestamptz default now(),
  unique(user_id, cert_id)
);

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  detail text,
  date date not null,
  start_ts timestamptz,
  end_ts timestamptz,
  duration_minutes int,
  category text,
  cert_id uuid references public.certifications(id) on delete set null,
  module_id uuid references public.cert_modules(id) on delete set null,
  done boolean default false,
  recurring jsonb,
  created_at timestamptz default now()
);

-- Habits
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  streak int default 0,
  best_streak int default 0,
  last_done date
);

-- Notes
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  content text not null,
  created_at timestamptz default now()
);

-- AI Queries (for tracking AI interactions)
create table public.ai_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  prompt jsonb not null,
  response jsonb not null,
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_tasks_user_date on public.tasks(user_id, date);
create index idx_tasks_user_done on public.tasks(user_id, done);
create index idx_habits_user on public.habits(user_id);
create index idx_notes_user_date on public.notes(user_id, date);
create index idx_cert_progress_user on public.user_cert_progress(user_id);
create index idx_cert_modules_cert on public.cert_modules(cert_id);

-- Row Level Security (RLS) Policies
alter table public.users enable row level security;
alter table public.certifications enable row level security;
alter table public.cert_modules enable row level security;
alter table public.user_cert_progress enable row level security;
alter table public.tasks enable row level security;
alter table public.habits enable row level security;
alter table public.notes enable row level security;
alter table public.ai_queries enable row level security;

-- Users: Can read/update own profile
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Certifications: Public read, admin write (adjust as needed)
create policy "Anyone can view certifications" on public.certifications
  for select using (true);

-- Cert Modules: Public read
create policy "Anyone can view cert modules" on public.cert_modules
  for select using (true);

-- User Cert Progress: Users manage own progress
create policy "Users manage own cert progress" on public.user_cert_progress
  for all using (auth.uid() = user_id);

-- Tasks: Users manage own tasks
create policy "Users manage own tasks" on public.tasks
  for all using (auth.uid() = user_id);

-- Habits: Users manage own habits
create policy "Users manage own habits" on public.habits
  for all using (auth.uid() = user_id);

-- Notes: Users manage own notes
create policy "Users manage own notes" on public.notes
  for all using (auth.uid() = user_id);

-- AI Queries: Users view own queries
create policy "Users view own AI queries" on public.ai_queries
  for select using (auth.uid() = user_id);

create policy "Users insert own AI queries" on public.ai_queries
  for insert with check (auth.uid() = user_id);

-- Function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user profile
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

-- Triggers for updated_at
create trigger set_updated_at_users
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_user_cert_progress
  before update on public.user_cert_progress
  for each row execute procedure public.handle_updated_at();

