-- Manual-only Bullseye India indicator entitlement.
-- This migration is intentionally independent of the retired payment-order system.
-- Admins verify arrangements outside the website and grant/revoke access here.
begin;

create table if not exists public.indicator_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default false,
  payment_verified boolean not null default false,
  activated_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint indicator_access_verified_requires_expiry
    check (not (is_active and payment_verified) or expires_at is not null)
);

alter table public.indicator_access enable row level security;
revoke all on table public.indicator_access from public, anon, authenticated, service_role;
-- The authenticated get-indicator-access Edge Function validates the user's JWT
-- before using its service-role client to read only that user's entitlement.
grant select on table public.indicator_access to service_role;

create or replace function public.admin_set_indicator_access(
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

  if make_active and access_expires_at is null then
    v_expiry := now() + interval '365 days';
  elsif make_active and access_expires_at <= now() then
    raise exception 'Expiry must be in the future' using errcode = '22023';
  else
    v_expiry := access_expires_at;
  end if;

  insert into public.indicator_access as existing (
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
      activated_at = case
        when not excluded.is_active then null
        when existing.is_active and existing.payment_verified
          and existing.expires_at > now() then existing.activated_at
        else now()
      end,
      expires_at = excluded.expires_at,
      updated_at = now();
end;
$function$;

create or replace function public.admin_list_indicator_members()
returns table (
  user_id uuid,
  email text,
  full_name text,
  is_active boolean,
  payment_verified boolean,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  select u.id, u.email::text, coalesce(p.full_name, ''),
         coalesce(a.is_active, false),
         coalesce(a.payment_verified, false),
         a.expires_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.indicator_access a on a.user_id = u.id
  order by coalesce(p.full_name, ''), u.email;
end;
$function$;

revoke all on function public.admin_set_indicator_access(uuid, boolean, boolean, timestamptz)
  from public, anon;
revoke all on function public.admin_list_indicator_members()
  from public, anon;
grant execute on function public.admin_set_indicator_access(uuid, boolean, boolean, timestamptz)
  to authenticated;
grant execute on function public.admin_list_indicator_members()
  to authenticated;

commit;
