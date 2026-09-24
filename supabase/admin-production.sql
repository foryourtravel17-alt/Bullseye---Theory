-- Bullseye Theory production admin/certificate hardening
-- Run once in Supabase SQL Editor.
alter table public.profiles add column if not exists is_admin boolean not null default false;
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles for select to authenticated using ((select is_admin from public.profiles where id=(select auth.uid())));
drop policy if exists "Admins can update course access" on public.course_access;
create policy "Admins can update course access" on public.course_access for update to authenticated using ((select is_admin from public.profiles where id=(select auth.uid()))) with check ((select is_admin from public.profiles where id=(select auth.uid())));
grant select, update on table public.course_access to authenticated;
-- After running this, set the owner's profile is_admin=true in Table Editor.
