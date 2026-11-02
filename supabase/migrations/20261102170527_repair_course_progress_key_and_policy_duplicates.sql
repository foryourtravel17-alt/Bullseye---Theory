-- Repair course progress integrity without changing any student progress values.
-- This migration refuses to proceed when existing rows cannot be keyed uniquely.
-- The live course clients and secure Edge Functions use ON CONFLICT (user_id, lesson_number).

do $course_progress_precheck$
begin
  if exists (
    select 1 from public.lesson_progress
    where user_id is null or lesson_number is null
  ) then
    raise exception
      'Cannot add lesson_progress primary key: rows have null user_id or lesson_number; repair those rows first.';
  end if;

  if exists (
    select 1
    from public.lesson_progress
    group by user_id, lesson_number
    having count(*) > 1
  ) then
    raise exception
      'Cannot add lesson_progress primary key: duplicate (user_id, lesson_number) rows exist; reconcile them first.';
  end if;
end;
$course_progress_precheck$;

alter table public.lesson_progress
  alter column user_id set not null,
  alter column lesson_number set not null;

-- The live database already has this unique index on the same key.
create unique index if not exists lesson_progress_user_lesson_number_uidx
  on public.lesson_progress (user_id, lesson_number);

do $course_progress_primary_key$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.lesson_progress'::regclass
      and contype = 'p'
  ) then
    alter table public.lesson_progress
      add constraint lesson_progress_pkey
      primary key using index lesson_progress_user_lesson_number_uidx;
  end if;
end;
$course_progress_primary_key$;

-- Retain the canonical ownership-safe student policies and remove duplicates.
drop policy if exists "Students can create their own lesson progress"
  on public.lesson_progress;
drop policy if exists "Students can insert own lesson progress"
  on public.lesson_progress;
drop policy if exists "Students can update own lesson progress"
  on public.lesson_progress;
drop policy if exists "Students can update their own lesson progress"
  on public.lesson_progress;
drop policy if exists "Students can view own lesson progress"
  on public.lesson_progress;
drop policy if exists "Students can view their own lesson progress"
  on public.lesson_progress;

drop policy if exists "Students can create their own quiz attempts"
  on public.quiz_attempts;
