-- Admin-only student listing and course-access upsert for the Bullseye Theory panel.
-- The browser publishable key is safe to use; authorization is enforced in PostgreSQL.
create or replace function public.admin_list_course_students()
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
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  select u.id, u.email::text, coalesce(p.full_name, ''), coalesce(c.is_active, false),
         coalesce(c.payment_verified, false), c.expires_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.course_access c on c.user_id = u.id
  order by coalesce(p.full_name, ''), u.email;
end;
$$;

create or replace function public.admin_set_course_access(
  target_user uuid,
  make_active boolean,
  verify_payment boolean default false,
  access_expires_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
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

  insert into public.course_access (user_id, is_active, payment_verified, activated_at, expires_at, updated_at)
  values (target_user, make_active, verify_payment,
          case when make_active then now() else null end,
          access_expires_at, now())
  on conflict (user_id) do update
  set is_active = excluded.is_active,
      payment_verified = excluded.payment_verified,
      activated_at = case when excluded.is_active then coalesce(public.course_access.activated_at, now()) else null end,
      expires_at = excluded.expires_at,
      updated_at = now();
end;
$$;

revoke all on function public.admin_list_course_students() from public, anon;
revoke all on function public.admin_set_course_access(uuid, boolean, boolean, timestamptz) from public, anon;
grant execute on function public.admin_list_course_students() to authenticated;
grant execute on function public.admin_set_course_access(uuid, boolean, boolean, timestamptz) to authenticated;
