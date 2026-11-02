-- Pin search_path for existing SECURITY DEFINER functions.
-- This migration changes function configuration/grants only and does not alter student data.
-- Application objects are schema-qualified; built-ins remain available from pg_catalog.

alter function public.admin_list_course_students()
  set search_path = '';

alter function public.admin_set_course_access(uuid, boolean, boolean, timestamp with time zone)
  set search_path = '';

alter function public.handle_new_student()
  set search_path = '';

-- auth.uid() and profiles are explicitly schema-qualified because search_path is empty.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(
    (select p.is_admin from public.profiles as p where p.id = auth.uid()),
    false
  );
$function$;

alter function public.issue_certificate(uuid)
  set search_path = '';

alter function public.rls_auto_enable()
  set search_path = '';

-- Trigger/event-trigger helpers are not intended to be callable RPCs.
revoke all on function public.handle_new_student() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
