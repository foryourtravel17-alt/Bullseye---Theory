-- Bullseye Theory course access is a fixed 85-day entitlement.
-- Existing active verified rows without an expiry receive 85 days from rollout.
-- No customer/payment records are deleted or rewritten.
do $preflight$
begin
  if exists (
    select 1 from public.payment_orders where access_days <> 85
  ) then
    raise exception 'Cannot enforce 85-day access: existing payment orders have a different duration. Reconcile them first.';
  end if;
end;
$preflight$;

alter table public.payment_orders
  alter column access_days set default 85;

alter table public.payment_orders
  drop constraint if exists payment_orders_access_days_check;

alter table public.payment_orders
  add constraint payment_orders_access_days_85_check
  check (access_days = 85);

update public.course_access
set expires_at = now() + interval '85 days',
    updated_at = now()
where is_active is true
  and payment_verified is true
  and expires_at is null;

do $access_expiry_constraint$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.course_access'::regclass
      and conname = 'course_access_verified_requires_expiry'
  ) then
    alter table public.course_access
      add constraint course_access_verified_requires_expiry
      check (
        not (is_active is true and payment_verified is true)
        or expires_at is not null
      );
  end if;
end;
$access_expiry_constraint$;

-- A manual admin grant with no chosen date is also exactly 85 days.
-- An explicit future date is retained for a documented admin extension.
create or replace function public.admin_set_course_access(
  target_user uuid,
  make_active boolean,
  verify_payment boolean default false,
  access_expires_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_expiry timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users u where u.id = target_user) then
    raise exception 'Student account not found' using errcode = 'P0002';
  end if;
  if access_expires_at is not null and access_expires_at <= now() then
    raise exception 'Expiry must be in the future' using errcode = '22023';
  end if;

  v_expiry := case
    when make_active then coalesce(access_expires_at, now() + interval '85 days')
    else null
  end;

  insert into public.course_access as existing (
    user_id, is_active, payment_verified, activated_at, expires_at, updated_at
  )
  values (
    target_user, make_active, verify_payment,
    case when make_active then now() else null end,
    v_expiry, now()
  )
  on conflict (user_id) do update
  set is_active = excluded.is_active,
      payment_verified = excluded.payment_verified,
      activated_at = case when excluded.is_active then now() else null end,
      expires_at = excluded.expires_at,
      updated_at = now();
end;
$function$;

revoke all on function public.admin_set_course_access(uuid, boolean, boolean, timestamptz) from public, anon;
grant execute on function public.admin_set_course_access(uuid, boolean, boolean, timestamptz) to authenticated;
