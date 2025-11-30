-- Migration: Add Complete Learning Platform
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. LESSONS (Structured learning content)
-- ============================================

create table if not exists public.cert_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.cert_modules(id) on delete cascade not null,
  title text not null,
  description text,
  content_type text default 'text', -- 'text', 'video', 'interactive', 'quiz'
  order_idx int default 0,
  estimated_minutes int default 10,
  difficulty_level int default 2, -- 1-5 scale
  ai_generated boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 2. LESSON CONTENT (AI-generated or manual content)
-- ============================================

create table if not exists public.cert_lesson_content (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.cert_lessons(id) on delete cascade not null,
  content_type text not null, -- 'intro', 'concept', 'example', 'summary', 'diagram', 'analogy'
  content_data jsonb not null, -- Flexible JSON structure
  ai_generated boolean default false,
  generated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 3. QUIZZES
-- ============================================

create table if not exists public.cert_quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.cert_lessons(id) on delete cascade,
  module_id uuid references public.cert_modules(id) on delete cascade,
  title text not null,
  description text,
  question_type text default 'multiple_choice', -- 'multiple_choice', 'true_false', 'fill_blank', 'scenario'
  difficulty_level int default 2,
  ai_generated boolean default false,
  created_at timestamptz default now()
);

-- Quiz Questions
create table if not exists public.cert_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references public.cert_quizzes(id) on delete cascade not null,
  question text not null,
  question_type text default 'multiple_choice',
  options jsonb, -- Array of options for multiple choice
  correct_answer text not null,
  explanation text,
  difficulty_level int default 2,
  order_idx int default 0,
  ai_generated boolean default false,
  created_at timestamptz default now()
);

-- Quiz Attempts (User progress)
create table if not exists public.cert_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  quiz_id uuid references public.cert_quizzes(id) on delete cascade not null,
  score int default 0, -- Percentage
  total_questions int not null,
  correct_answers int not null,
  time_taken_minutes int,
  completed_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Quiz Answers (Detailed tracking)
create table if not exists public.cert_quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references public.cert_quiz_attempts(id) on delete cascade not null,
  question_id uuid references public.cert_quiz_questions(id) on delete cascade not null,
  user_answer text not null,
  is_correct boolean not null,
  time_spent_seconds int,
  created_at timestamptz default now()
);

-- ============================================
-- 4. FLASHCARDS (AI-generated)
-- ============================================

create table if not exists public.cert_flashcards (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.cert_modules(id) on delete cascade not null,
  lesson_id uuid references public.cert_lessons(id) on delete cascade,
  front text not null,
  back text not null,
  category text,
  difficulty_level int default 2,
  ai_generated boolean default false,
  created_at timestamptz default now()
);

-- Flashcard Study Sessions
create table if not exists public.cert_flashcard_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  flashcard_id uuid references public.cert_flashcards(id) on delete cascade not null,
  difficulty_rating int, -- 1-5, how hard it was to recall
  correct boolean not null,
  review_due_at timestamptz, -- Next review based on forgetting curve
  times_studied int default 1,
  last_studied_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ============================================
-- 5. LEARNING SESSIONS (Track study time)
-- ============================================

create table if not exists public.cert_learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  cert_id uuid references public.certifications(id) on delete cascade,
  module_id uuid references public.cert_modules(id) on delete cascade,
  lesson_id uuid references public.cert_lessons(id) on delete cascade,
  session_type text not null, -- 'lesson', 'quiz', 'flashcard', 'review', 'project'
  start_time timestamptz not null,
  end_time timestamptz,
  duration_minutes int,
  progress_percentage int, -- 0-100
  completed boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- 6. LEARNING NOTES (User's personal notes)
-- ============================================

create table if not exists public.cert_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  module_id uuid references public.cert_modules(id) on delete cascade,
  lesson_id uuid references public.cert_lessons(id) on delete cascade,
  content text not null,
  highlights text[], -- Array of highlighted text
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 7. DETAILED PROGRESS TRACKING
-- ============================================

create table if not exists public.cert_progress_detailed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  module_id uuid references public.cert_modules(id) on delete cascade not null,
  lesson_id uuid references public.cert_lessons(id) on delete cascade,
  completion_status text default 'not_started', -- 'not_started', 'in_progress', 'completed', 'mastered'
  progress_percentage int default 0,
  time_spent_minutes int default 0,
  last_accessed_at timestamptz,
  completed_at timestamptz,
  mastery_score int, -- 0-100 based on quiz performance
  adaptive_difficulty int default 2, -- Adjusted based on performance
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, lesson_id)
);

-- ============================================
-- 8. REVISION REMINDERS (Smart revision system)
-- ============================================

create table if not exists public.cert_revision_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  module_id uuid references public.cert_modules(id) on delete cascade,
  lesson_id uuid references public.cert_lessons(id) on delete cascade,
  reminder_type text not null, -- 'forgetting_curve', 'weak_area', 'exam_prep'
  due_at timestamptz not null,
  priority int default 3, -- 1-5
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- 9. AI TUTOR CONVERSATIONS (Chat-based learning)
-- ============================================

create table if not exists public.cert_tutor_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  cert_id uuid references public.certifications(id) on delete cascade,
  module_id uuid references public.cert_modules(id) on delete cascade,
  lesson_id uuid references public.cert_lessons(id) on delete cascade,
  title text,
  context jsonb, -- Module/lesson context
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AI Tutor Messages (links to chat_messages, but with learning context)
create table if not exists public.cert_tutor_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.cert_tutor_conversations(id) on delete cascade not null,
  chat_message_id uuid references public.chat_messages(id) on delete set null,
  learning_context jsonb, -- What module/lesson they're asking about
  message_type text default 'question', -- 'question', 'explanation', 'example', 'quiz'
  created_at timestamptz default now()
);

-- ============================================
-- 10. PRACTICAL PROJECTS (Real-world applications)
-- ============================================

create table if not exists public.cert_projects (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.cert_modules(id) on delete cascade,
  cert_id uuid references public.certifications(id) on delete cascade,
  title text not null,
  description text,
  instructions text not null,
  project_type text default 'coding', -- 'coding', 'configuration', 'architecture', 'analysis'
  difficulty_level int default 3,
  ai_generated boolean default false,
  created_at timestamptz default now()
);

-- Project Submissions
create table if not exists public.cert_project_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  project_id uuid references public.cert_projects(id) on delete cascade not null,
  submission_data jsonb not null, -- Code, files, answers, etc.
  ai_feedback jsonb, -- AI-generated feedback
  score int, -- 0-100
  status text default 'submitted', -- 'submitted', 'reviewed', 'approved'
  submitted_at timestamptz default now(),
  reviewed_at timestamptz
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

create index if not exists idx_lessons_module on public.cert_lessons(module_id);
create index if not exists idx_lesson_content_lesson on public.cert_lesson_content(lesson_id);
create index if not exists idx_quizzes_lesson on public.cert_quizzes(lesson_id);
create index if not exists idx_quizzes_module on public.cert_quizzes(module_id);
create index if not exists idx_quiz_questions_quiz on public.cert_quiz_questions(quiz_id);
create index if not exists idx_quiz_attempts_user on public.cert_quiz_attempts(user_id);
create index if not exists idx_quiz_answers_attempt on public.cert_quiz_answers(attempt_id);
create index if not exists idx_flashcards_module on public.cert_flashcards(module_id);
create index if not exists idx_flashcard_sessions_user on public.cert_flashcard_sessions(user_id);
create index if not exists idx_learning_sessions_user on public.cert_learning_sessions(user_id);
create index if not exists idx_cert_notes_user on public.cert_notes(user_id);
create index if not exists idx_progress_detailed_user on public.cert_progress_detailed(user_id);
create index if not exists idx_revision_reminders_user on public.cert_revision_reminders(user_id);
create index if not exists idx_revision_reminders_due on public.cert_revision_reminders(due_at) where completed = false;
create index if not exists idx_tutor_conversations_user on public.cert_tutor_conversations(user_id);
create index if not exists idx_project_submissions_user on public.cert_project_submissions(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================

alter table public.cert_lessons enable row level security;
alter table public.cert_lesson_content enable row level security;
alter table public.cert_quizzes enable row level security;
alter table public.cert_quiz_questions enable row level security;
alter table public.cert_quiz_attempts enable row level security;
alter table public.cert_quiz_answers enable row level security;
alter table public.cert_flashcards enable row level security;
alter table public.cert_flashcard_sessions enable row level security;
alter table public.cert_learning_sessions enable row level security;
alter table public.cert_notes enable row level security;
alter table public.cert_progress_detailed enable row level security;
alter table public.cert_revision_reminders enable row level security;
alter table public.cert_tutor_conversations enable row level security;
alter table public.cert_tutor_messages enable row level security;
alter table public.cert_projects enable row level security;
alter table public.cert_project_submissions enable row level security;

-- Lessons: Public read
create policy "Anyone can view lessons" on public.cert_lessons
  for select using (true);

-- Lesson Content: Public read
create policy "Anyone can view lesson content" on public.cert_lesson_content
  for select using (true);

-- Quizzes: Public read
create policy "Anyone can view quizzes" on public.cert_quizzes
  for select using (true);

-- Quiz Questions: Public read
create policy "Anyone can view quiz questions" on public.cert_quiz_questions
  for select using (true);

-- Quiz Attempts: Users manage own attempts
create policy "Users manage own quiz attempts" on public.cert_quiz_attempts
  for all using (auth.uid() = user_id);

-- Quiz Answers: Users manage own answers
create policy "Users manage own quiz answers" on public.cert_quiz_answers
  for all using (
    exists (
      select 1 from public.cert_quiz_attempts
      where id = cert_quiz_answers.attempt_id and user_id = auth.uid()
    )
  );

-- Flashcards: Public read
create policy "Anyone can view flashcards" on public.cert_flashcards
  for select using (true);

-- Flashcard Sessions: Users manage own sessions
create policy "Users manage own flashcard sessions" on public.cert_flashcard_sessions
  for all using (auth.uid() = user_id);

-- Learning Sessions: Users manage own sessions
create policy "Users manage own learning sessions" on public.cert_learning_sessions
  for all using (auth.uid() = user_id);

-- Cert Notes: Users manage own notes
create policy "Users manage own cert notes" on public.cert_notes
  for all using (auth.uid() = user_id);

-- Progress Detailed: Users manage own progress
create policy "Users manage own detailed progress" on public.cert_progress_detailed
  for all using (auth.uid() = user_id);

-- Revision Reminders: Users manage own reminders
create policy "Users manage own revision reminders" on public.cert_revision_reminders
  for all using (auth.uid() = user_id);

-- Tutor Conversations: Users manage own conversations
create policy "Users manage own tutor conversations" on public.cert_tutor_conversations
  for all using (auth.uid() = user_id);

-- Tutor Messages: Users manage own messages
create policy "Users manage own tutor messages" on public.cert_tutor_messages
  for all using (
    exists (
      select 1 from public.cert_tutor_conversations
      where id = cert_tutor_messages.conversation_id and user_id = auth.uid()
    )
  );

-- Projects: Public read
create policy "Anyone can view projects" on public.cert_projects
  for select using (true);

-- Project Submissions: Users manage own submissions
create policy "Users manage own project submissions" on public.cert_project_submissions
  for all using (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps
create trigger set_updated_at_lessons
  before update on public.cert_lessons
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_lesson_content
  before update on public.cert_lesson_content
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_progress_detailed
  before update on public.cert_progress_detailed
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_tutor_conversations
  before update on public.cert_tutor_conversations
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_cert_notes
  before update on public.cert_notes
  for each row execute procedure public.handle_updated_at();

