-- Migration 008: Fill in the RLS gap on learning-platform tables
--
-- 006_add_learning_platform.sql enabled RLS and added SELECT policies for
-- cert_lessons, cert_lesson_content, cert_quizzes, cert_quiz_questions, and
-- cert_flashcards — but never added INSERT/UPDATE/DELETE policies. The result:
-- the "Generate Lessons" endpoint inserts under the user's auth session, RLS
-- rejects every row with error 42501, the endpoint silently logs each failure
-- and returns "0 lessons generated" as 200 OK. Mirrors what 002 already did
-- for cert_modules: authenticated users can write to the shared catalog.
--
-- Idempotent: drops the policy first if it already exists.

-- ============================================================================
-- cert_lessons
-- ============================================================================

drop policy if exists "Authenticated users can insert cert lessons" on public.cert_lessons;
create policy "Authenticated users can insert cert lessons"
on public.cert_lessons
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update cert lessons" on public.cert_lessons;
create policy "Authenticated users can update cert lessons"
on public.cert_lessons
for update
to authenticated
using (true);

drop policy if exists "Authenticated users can delete cert lessons" on public.cert_lessons;
create policy "Authenticated users can delete cert lessons"
on public.cert_lessons
for delete
to authenticated
using (true);

-- ============================================================================
-- cert_lesson_content
-- ============================================================================

drop policy if exists "Authenticated users can insert lesson content" on public.cert_lesson_content;
create policy "Authenticated users can insert lesson content"
on public.cert_lesson_content
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update lesson content" on public.cert_lesson_content;
create policy "Authenticated users can update lesson content"
on public.cert_lesson_content
for update
to authenticated
using (true);

drop policy if exists "Authenticated users can delete lesson content" on public.cert_lesson_content;
create policy "Authenticated users can delete lesson content"
on public.cert_lesson_content
for delete
to authenticated
using (true);

-- ============================================================================
-- cert_quizzes + cert_quiz_questions
-- (attempts/answers already had user-scoped policies in 006)
-- ============================================================================

drop policy if exists "Authenticated users can insert quizzes" on public.cert_quizzes;
create policy "Authenticated users can insert quizzes"
on public.cert_quizzes
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update quizzes" on public.cert_quizzes;
create policy "Authenticated users can update quizzes"
on public.cert_quizzes
for update
to authenticated
using (true);

drop policy if exists "Authenticated users can delete quizzes" on public.cert_quizzes;
create policy "Authenticated users can delete quizzes"
on public.cert_quizzes
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can insert quiz questions" on public.cert_quiz_questions;
create policy "Authenticated users can insert quiz questions"
on public.cert_quiz_questions
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update quiz questions" on public.cert_quiz_questions;
create policy "Authenticated users can update quiz questions"
on public.cert_quiz_questions
for update
to authenticated
using (true);

drop policy if exists "Authenticated users can delete quiz questions" on public.cert_quiz_questions;
create policy "Authenticated users can delete quiz questions"
on public.cert_quiz_questions
for delete
to authenticated
using (true);

-- ============================================================================
-- cert_flashcards
-- ============================================================================

drop policy if exists "Authenticated users can insert flashcards" on public.cert_flashcards;
create policy "Authenticated users can insert flashcards"
on public.cert_flashcards
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update flashcards" on public.cert_flashcards;
create policy "Authenticated users can update flashcards"
on public.cert_flashcards
for update
to authenticated
using (true);

drop policy if exists "Authenticated users can delete flashcards" on public.cert_flashcards;
create policy "Authenticated users can delete flashcards"
on public.cert_flashcards
for delete
to authenticated
using (true);
