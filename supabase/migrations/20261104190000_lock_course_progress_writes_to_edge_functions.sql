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
grant usage, select on sequence public.quiz_attempts_id_seq to service_role;


-- Let a student claim their own certificate after all eleven server-recorded lessons pass.
-- The function ignores client-supplied user IDs and derives identity from auth.uid().
create or replace function public.issue_my_certificate()
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  caller_id uuid;
  certificate_code text;
  student_name text;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Sign-in required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.course_access
    where user_id = caller_id
      and is_active = true
      and payment_verified = true
      and expires_at > now()
  ) then
    raise exception 'Verified course access is required' using errcode = '42501';
  end if;

  if (
    select count(*) from public.lesson_progress
    where user_id = caller_id
      and lesson_number between 1 and 11
      and completed = true
      and quiz_passed = true
  ) <> 11 then
    raise exception 'All 11 lessons and quizzes must be completed' using errcode = '22023';
  end if;

  select coalesce(nullif(full_name, ''), 'Student')
    into student_name
  from public.profiles
  where id = caller_id;

  certificate_code := 'BT-' || upper(substr(replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.certificates as existing (user_id, student_name, certificate_id)
  values (caller_id, coalesce(student_name, 'Student'), certificate_code)
  on conflict (user_id) do update
    set student_name = excluded.student_name,
        certificate_id = existing.certificate_id
  returning existing.certificate_id into certificate_code;

  return certificate_code;
end;
$function$;

revoke all on function public.issue_my_certificate() from public, anon;
grant execute on function public.issue_my_certificate() to authenticated;
