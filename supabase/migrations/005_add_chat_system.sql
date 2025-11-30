-- Migration: Add Chat with Einstein System
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CHAT MESSAGES
-- ============================================

-- Chat conversations
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text,
  mode text default 'chat', -- 'learning', 'task', 'chat', 'mixed'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.chat_conversations(id) on delete cascade not null,
  role text not null, -- 'user', 'assistant', 'system'
  content text not null,
  mode text, -- Detected mode for this message
  metadata jsonb, -- module_id, task_id, etc.
  created_at timestamptz default now()
);

-- ============================================
-- 2. CHAT MEMORY
-- ============================================

-- Chat memory (remembers user preferences, learning style, etc.)
create table if not exists public.chat_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  memory_type text not null, -- 'learning_style', 'preferences', 'topics', 'goals'
  memory_key text not null,
  memory_value jsonb not null,
  confidence float default 0.5,
  last_updated timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, memory_type, memory_key)
);

-- ============================================
-- 3. INLINE TOOLS DATA
-- ============================================

-- Flashcards created in chat
create table if not exists public.chat_flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  conversation_id uuid references public.chat_conversations(id) on delete cascade,
  message_id uuid references public.chat_messages(id) on delete cascade,
  front text not null,
  back text not null,
  category text,
  created_at timestamptz default now()
);

-- Quizzes created in chat
create table if not exists public.chat_quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  conversation_id uuid references public.chat_conversations(id) on delete cascade,
  message_id uuid references public.chat_messages(id) on delete cascade,
  question text not null,
  options jsonb not null, -- Array of options
  correct_answer int not null,
  explanation text,
  created_at timestamptz default now()
);

-- ============================================
-- 4. INDEXES
-- ============================================

create index if not exists idx_chat_conversations_user on public.chat_conversations(user_id);
create index if not exists idx_chat_messages_conversation on public.chat_messages(conversation_id);
create index if not exists idx_chat_memory_user on public.chat_memory(user_id);
create index if not exists idx_chat_flashcards_user on public.chat_flashcards(user_id);
create index if not exists idx_chat_quizzes_user on public.chat_quizzes(user_id);

-- ============================================
-- 5. RLS POLICIES
-- ============================================

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_memory enable row level security;
alter table public.chat_flashcards enable row level security;
alter table public.chat_quizzes enable row level security;

-- Conversations policies
create policy "Users manage own conversations" on public.chat_conversations
  for all using (auth.uid() = user_id);

-- Messages policies
create policy "Users view own messages" on public.chat_messages
  for all using (
    exists (
      select 1 from public.chat_conversations cc
      where cc.id = chat_messages.conversation_id and cc.user_id = auth.uid()
    )
  );

-- Memory policies
create policy "Users manage own memory" on public.chat_memory
  for all using (auth.uid() = user_id);

-- Flashcards policies
create policy "Users manage own flashcards" on public.chat_flashcards
  for all using (auth.uid() = user_id);

-- Quizzes policies
create policy "Users manage own quizzes" on public.chat_quizzes
  for all using (auth.uid() = user_id);

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Update conversation updated_at
create or replace function public.update_conversation_timestamp()
returns trigger as $$
begin
  update public.chat_conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger update_conversation_timestamp_trigger
  after insert on public.chat_messages
  for each row
  execute procedure public.update_conversation_timestamp();

-- Update updated_at for conversations
create trigger set_updated_at_conversations
  before update on public.chat_conversations
  for each row execute procedure public.handle_updated_at();

-- Update updated_at for memory
create trigger set_updated_at_memory
  before update on public.chat_memory
  for each row execute procedure public.handle_updated_at();

