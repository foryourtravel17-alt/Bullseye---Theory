-- Align the production course schema with the current 11-lesson student UI.
-- Existing progress and quiz rows are backfilled before constraints are changed.

insert into public.lessons (lesson_number, title, description, is_published)
values (11, 'Complete Course Revision', 'Review and integrate the full Bullseye Theory process.', true)
on conflict (lesson_number) do update
set title = excluded.title,
    description = excluded.description,
    is_published = true;

alter table public.lesson_progress
  add column if not exists lesson_number integer;

update public.lesson_progress lp
set lesson_number = l.lesson_number
from public.lessons l
where lp.lesson_id = l.id
  and lp.lesson_number is null;

-- The current frontend keys progress by (user_id, lesson_number), not lesson_id.
alter table public.lesson_progress drop constraint if exists lesson_progress_pkey;
alter table public.lesson_progress alter column lesson_id drop not null;
alter table public.lesson_progress alter column lesson_number set not null;
create unique index if not exists lesson_progress_user_lesson_number_uidx
  on public.lesson_progress (user_id, lesson_number);

alter table public.quiz_attempts
  add column if not exists lesson_number integer;

update public.quiz_attempts qa
set lesson_number = l.lesson_number
from public.quizzes q
join public.lessons l on l.id = q.lesson_id
where qa.quiz_id = q.id
  and qa.lesson_number is null;

-- The current lesson pages submit quiz attempts by lesson_number.
alter table public.quiz_attempts alter column quiz_id drop not null;
alter table public.quiz_attempts alter column lesson_number set not null;

-- Permit the 11th lesson in practical submissions.
alter table public.practical_submissions
  drop constraint if exists practical_submissions_lesson_number_check;
alter table public.practical_submissions
  add constraint practical_submissions_lesson_number_check
  check (lesson_number >= 1 and lesson_number <= 11);

-- A student may edit only their own display name, never their role/admin flag.
drop policy if exists "Students can update their own profile" on public.profiles;
create policy "Students can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id or public.is_admin())
with check (public.is_admin() or ((select auth.uid()) = id and is_admin = false and role = 'student'));

revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Certificate eligibility must match the full 11-lesson curriculum.
create or replace function public.issue_certificate(target_user uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  cert_id text;
  student text;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if not exists (
    select 1 from public.course_access
    where user_id = target_user
      and is_active = true
      and payment_verified = true
      and (expires_at is null or expires_at > now())
  ) then
    raise exception 'Course access is not active';
  end if;

  if (select count(*) from public.lesson_progress
      where user_id = target_user and lesson_number between 1 and 11
        and completed = true and quiz_passed = true) < 11 then
    raise exception 'All 11 lessons and quizzes must be completed';
  end if;

  select coalesce(nullif(full_name,''), 'Student') into student
  from public.profiles where id = target_user;

  cert_id := 'BT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));

  insert into public.certificates(user_id, student_name, certificate_id)
  values(target_user, student, cert_id)
  on conflict(user_id) do update
    set student_name = excluded.student_name,
        certificate_id = public.certificates.certificate_id;

  return cert_id;
end;
$$;

revoke all on function public.issue_certificate(uuid) from public;
grant execute on function public.issue_certificate(uuid) to authenticated;
