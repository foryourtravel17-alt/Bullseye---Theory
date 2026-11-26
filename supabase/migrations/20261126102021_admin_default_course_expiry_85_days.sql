-- Ensure admin course activation defaults to the advertised 85-day term.
-- The UI allows an empty expiry field for the standard course duration.
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
as $$
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
      activated_at = case
        when excluded.is_active then coalesce(existing.activated_at, now())
        else null
      end,
      expires_at = excluded.expires_at,
      updated_at = now();
end;
$$;
revoke all on function public.admin_set_course_access(uuid, boolean, boolean, timestamptz) from public, anon;
grant execute on function public.admin_set_course_access(uuid, boolean, boolean, timestamptz) to authenticated;
