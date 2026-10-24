-- Secure public helper functions and make the published course catalogue readable by signed-in students.
revoke execute on function public.handle_new_student() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Authenticated users can view published lessons" on public.lessons;
create policy "Authenticated users can view published lessons" on public.lessons for select to authenticated using (is_published = true or public.is_admin());

drop policy if exists "Authenticated users can view quizzes" on public.quizzes;
create policy "Authenticated users can view quizzes" on public.quizzes for select to authenticated using (exists (select 1 from public.lessons l where l.id = lesson_id and l.is_published = true) or public.is_admin());

drop policy if exists "Authenticated users can view quiz questions" on public.quiz_questions;
create policy "Authenticated users can view quiz questions" on public.quiz_questions for select to authenticated using (exists (select 1 from public.quizzes q join public.lessons l on l.id=q.lesson_id where q.id=quiz_id and l.is_published=true) or public.is_admin());

drop policy if exists "Admins manage reels queue" on public.reels_queue;
create policy "Admins manage reels queue" on public.reels_queue for all to authenticated using (public.is_admin()) with check (public.is_admin());