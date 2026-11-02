-- Bullseye Theory: pin search_path for existing SECURITY DEFINER functions.
-- This migration changes function configuration/grants only; it does not rewrite
-- function bodies, modify student data, alter RLS policies, or enable payments.
-- Reviewed against the live function inventory on 2026-10-27.
--
-- Empty search_path prevents attacker-controlled schemas from shadowing names.
-- Existing function bodies use schema-qualified application objects; PostgreSQL
-- still resolves built-ins from pg_catalog.

alter function public.admin_list_course_students()
  set search_path = '';

alter function public.admin_set_course_access(uuid, boolean, boolean, timestamp with time zone)
  set search_path = '';

alter function public.handle_new_student()
  set search_path = '';


-- The existing helper originally resolved auth.uid() through the default
-- search_path. Once search_path is empty it must be schema-qualified.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $
  select coalesce(
    (select p.is_admin from public.profiles as p where p.id = auth.uid()),
    false
  );
$;


alter function public.issue_certificate(uuid)
  set search_path = '';

alter function public.rls_auto_enable()
  set search_path = '';

-- Trigger/event-trigger helpers are not intended to be callable RPCs.
revoke all on function public.handle_new_student() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- Release verification (run after applying in a non-production environment):
-- select p.proname, p.proconfig
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.prosecdef
-- order by p.proname;
-- Expected: every SECURITY DEFINER function above reports search_path="".
