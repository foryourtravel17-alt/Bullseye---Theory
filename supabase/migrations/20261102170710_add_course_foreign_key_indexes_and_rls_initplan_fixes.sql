create index if not exists lesson_progress_lesson_id_idx on public.lesson_progress(lesson_id);
create index if not exists practical_submissions_user_id_idx on public.practical_submissions(user_id);
create index if not exists quiz_attempts_quiz_id_idx on public.quiz_attempts(quiz_id);
create index if not exists quiz_questions_quiz_id_idx on public.quiz_questions(quiz_id);
create index if not exists trading_journal_user_id_idx on public.trading_journal(user_id);

drop policy if exists "Students can create own submissions" on public.practical_submissions;
create policy "Students can create own submissions" on public.practical_submissions
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Students can view own submissions" on public.practical_submissions;
create policy "Students can view own submissions" on public.practical_submissions
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Students can create own journal" on public.trading_journal;
create policy "Students can create own journal" on public.trading_journal
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Students can view own journal" on public.trading_journal;
create policy "Students can view own journal" on public.trading_journal
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Students can update own journal" on public.trading_journal;
create policy "Students can update own journal" on public.trading_journal
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
drop policy if exists "Students can delete own journal" on public.trading_journal;
create policy "Students can delete own journal" on public.trading_journal
for delete to authenticated using ((select auth.uid()) = user_id);
