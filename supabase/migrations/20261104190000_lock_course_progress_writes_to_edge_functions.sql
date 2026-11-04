-- Keep authoritative learning progress and quiz attempts server-written only.
-- The grade-quiz and complete-lesson Edge Functions use the server-side service_role.
-- Students retain read-only access to their own progress and attempts via existing SELECT policies.
--
-- This closes a privilege-escalation path: a browser-authenticated student could previously
-- insert quiz_attempts.passed=true or update lesson_progress.completed/quiz_passed directly.

do $lock_course_progress_writes$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('lesson_progress', 'quiz_attempts')
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      and roles && array['public'::name, 'anon'::name, 'authenticated'::name]
  loop
    execute format(
      'drop policy %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end;
$lock_course_progress_writes$;

-- RLS is the row-level boundary; table privileges are also removed so browser roles
-- cannot write even if a permissive policy is accidentally reintroduced later.
revoke insert, update, delete, truncate, references, trigger
  on table public.lesson_progress
  from public, anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.quiz_attempts
  from public, anon, authenticated;

-- Edge Functions are the only writer for quiz outcomes and course completion.
-- service_role has BYPASSRLS; grant only the operations the functions require.
grant select, insert, update on table public.lesson_progress to service_role;
grant select, insert on table public.quiz_attempts to service_role;
