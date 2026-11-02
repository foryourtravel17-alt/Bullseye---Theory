-- Keep quiz answer keys out of the authenticated Data API.
-- The grade-quiz Edge Function uses the server-only service role and does not
-- need browser SELECT access to this table. Normal students must not be able to
-- query correct_answer directly through PostgREST.
--
-- Run in staging first. This migration does not alter quiz content or attempts.

drop policy if exists "Authenticated users can view quiz questions"
  on public.quiz_questions;

drop policy if exists "Admins can view quiz questions"
  on public.quiz_questions;

create policy "Admins can view quiz questions"
on public.quiz_questions
for select
to authenticated
using ((select public.is_admin()));

revoke all on table public.quiz_questions from anon;
revoke all on table public.quiz_questions from public;
grant select on table public.quiz_questions to authenticated;

-- Verification (run in staging as a normal authenticated student):
-- SELECT id, question, correct_answer FROM public.quiz_questions;
-- Expected: zero rows. An admin may still read questions for content review.
-- The grade-quiz Edge Function uses service-role access after JWT + entitlement checks.
