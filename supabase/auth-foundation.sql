-- Bullseye Theory — Auth foundation
-- Run this in Supabase SQL Editor AFTER the existing profiles and course_access
-- tables have been created successfully.
--
-- This script does not drop your tables or delete student data.

-- 1) Protect student-owned rows.
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles enable row level security;
alter table public.course_access enable row level security;

-- 2) Recreate only the policies used by the browser.
drop policy if exists "Students can view their own profile" on public.profiles;
create policy "Students can view their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Students can update their own profile" on public.profiles;
create policy "Students can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Students can view their own course access" on public.course_access;
create policy "Students can view their own course access"
on public.course_access
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Students must NOT be able to activate themselves or change payment_verified.
-- Admin activation will be implemented through a protected admin workflow later.

-- 3) Automatically create a profile + inactive course-access row after signup.
create or replace function public.handle_new_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'student'
  )
  on conflict (id) do update
    set full_name = excluded.full_name;

  insert into public.course_access (user_id, is_active, payment_verified)
  values (new.id, false, false)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_student();

-- This function is trigger-only; it must not be exposed as a callable RPC.
revoke all on function public.handle_new_student() from public, anon, authenticated;

-- 4) Give the signed-in browser only the permissions it needs.
revoke all on table public.profiles from anon;
revoke all on table public.course_access from anon;

-- Students may edit only their display name; they cannot elevate themselves
-- by modifying role or is_admin. Keep this in sync with admin-production.sql.
grant select on table public.profiles to authenticated;
revoke update on table public.profiles from anon, authenticated;
revoke update (id, role, is_admin) on table public.profiles from anon, authenticated;
grant update (full_name) on table public.profiles to authenticated;
grant select on table public.course_access to authenticated;
