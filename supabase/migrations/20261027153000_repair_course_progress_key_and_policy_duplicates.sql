-- Repair course progress integrity without changing any student progress values.
-- This migration is intentionally additive/safety-focused: it refuses to proceed
-- when existing rows cannot be keyed uniquely or contain missing key fields.
--
-- The live course pages use ON CONFLICT (user_id, lesson_number), so that pair
-- is the canonical key until all existing clients are migrated to lesson_id.

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

-- Reuse the already-established upsert index when present. Promoting it to a
-- primary key removes the advisor warning without changing the client key.
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

-- Keep one ownership-safe policy per operation. These canonical policies are
-- retained: "Students can view their own progress",
-- "Students can insert their own progress", and
-- "Students can update their own progress".
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

-- The two quiz-attempt INSERT policies are equivalent; retain the policy used
-- by the normalized schema and remove the duplicate legacy policy.
drop policy if exists "Students can create their own quiz attempts"
  on public.quiz_attempts;
