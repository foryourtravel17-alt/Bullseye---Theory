#!/usr/bin/env bash
set -euo pipefail

: "$DATABASE_URL"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
do $ensure_test_roles$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'create role anon nologin';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'create role authenticated nologin';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'create role service_role nologin bypassrls';
  elsif not (select rolbypassrls from pg_roles where rolname = 'service_role') then
    execute 'alter role service_role bypassrls';
  end if;
end;
$ensure_test_roles$;

create schema auth;
create table auth.users (
  id uuid primary key,
  email text unique
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default ''
);
create table public.course_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default false,
  payment_verified boolean not null default false,
  activated_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
create function public.is_admin()
returns boolean language sql stable
as $$ select true $$;

alter table public.course_access enable row level security;
grant usage on schema public, auth to anon, authenticated, service_role;
grant select, insert, update on public.course_access to service_role;
grant select on auth.users, public.profiles to authenticated, service_role;
SQL

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f supabase/migrations/20261102170543_add_automatic_trc20_payment_orders.sql
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f supabase/migrations/20261102170555_set_course_access_validity_85_days.sql
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f supabase/migrations/20261113140000_add_indicator_membership_365d.sql

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
insert into auth.users(id, email) values
  ('00000000-0000-4000-8000-000000000001', 'one@example.test'),
  ('00000000-0000-4000-8000-000000000002', 'two@example.test'),
  ('00000000-0000-4000-8000-000000000003', 'three@example.test');
insert into public.profiles(id, full_name)
select id, 'Test Student' from auth.users;

insert into public.payment_orders (
  id, user_id, plan_code, inr_amount_paise, access_days,
  usdt_inr_rate, usdt_amount_atomic, destination_wallet, token_contract,
  network, quote_source, quote_observed_at, status, created_at, expires_at
) values
  ('10000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000001',
   'course', 99900, 85, 83.5, 12500000,
   'TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV',
   'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
   'TRON_MAINNET_TRC20', 'test_fixture', now(), 'pending',
   now() - interval '2 minutes', now() + interval '20 minutes'),
  ('10000000-0000-4000-8000-000000000002',
   '00000000-0000-4000-8000-000000000002',
   'course', 99900, 85, 83.5, 12500001,
   'TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV',
   'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
   'TRON_MAINNET_TRC20', 'test_fixture', now(), 'pending',
   now() - interval '2 minutes', now() + interval '20 minutes'),
  ('10000000-0000-4000-8000-000000000003',
   '00000000-0000-4000-8000-000000000003',
   'course', 99900, 85, 83.5, 12500002,
   'TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV',
   'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
   'TRON_MAINNET_TRC20', 'test_fixture', now() - interval '3 hours', 'pending',
   now() - interval '3 hours', now() - interval '2 hours'),
  ('10000000-0000-4000-8000-000000000004',
   '00000000-0000-4000-8000-000000000001',
   'course', 99900, 85, 83.5, 12500003,
   'TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV',
   'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
   'TRON_MAINNET_TRC20', 'test_fixture', now(), 'pending',
   now() - interval '1 minute', now() + interval '20 minutes');
SQL

HASH_A="$(printf 'a%.0s' {1..64})"
HASH_B="$(printf 'b%.0s' {1..64})"
HASH_C="$(printf 'c%.0s' {1..64})"
WALLET="TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV"
TOKEN="TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
FROM="TJRabPrwbZy45sbavfcjinPJC18kjpRTv8"

run_as_service_role() {
  local statement="$1"
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -qAtc "SET ROLE service_role; $statement; RESET ROLE;"
}

assert_result() {
  local expected="$1"
  local statement="$2"
  local actual
  actual="$(run_as_service_role "$statement")"
  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL: expected '$expected', received '$actual'"
    exit 1
  fi
  echo "PASS: finalizer returned $expected"
}

assert_result "paid" "SELECT public.finalize_trc20_payment(
  '10000000-0000-4000-8000-000000000001',
  '$HASH_A', 12500000, '$FROM', '$WALLET', '$TOKEN', now(), 12345678
)"
FIRST_EXPIRY="$(psql "$DATABASE_URL" -X -qAtc "select extract(epoch from expires_at) from public.course_access where user_id='00000000-0000-4000-8000-000000000001'")"
FIRST_ACTIVATED="$(psql "$DATABASE_URL" -X -qAtc "select extract(epoch from activated_at) from public.course_access where user_id='00000000-0000-4000-8000-000000000001'")"

assert_result "already_paid" "SELECT public.finalize_trc20_payment(
  '10000000-0000-4000-8000-000000000001',
  '$HASH_A', 12500000, '$FROM', '$WALLET', '$TOKEN', now(), 12345678
)"
assert_result "amount_mismatch" "SELECT public.finalize_trc20_payment(
  '10000000-0000-4000-8000-000000000002',
  '$HASH_B', 12500000, '$FROM', '$WALLET', '$TOKEN', now(), 12345678
)"
assert_result "destination_mismatch" "SELECT public.finalize_trc20_payment(
  '10000000-0000-4000-8000-000000000002',
  '$HASH_B', 12500001, '$FROM', 'TWrongWallet111111111111111111111', '$TOKEN', now(), 12345678
)"
assert_result "token_contract_mismatch" "SELECT public.finalize_trc20_payment(
  '10000000-0000-4000-8000-000000000002',
  '$HASH_B', 12500001, '$FROM', '$WALLET', 'TWrongToken111111111111111111111', now(), 12345678
)"
assert_result "duplicate_transaction" "SELECT public.finalize_trc20_payment(
  '10000000-0000-4000-8000-000000000002',
  '$HASH_A', 12500001, '$FROM', '$WALLET', '$TOKEN', now(), 12345678
)"
assert_result "order_expired" "SELECT public.finalize_trc20_payment(
  '10000000-0000-4000-8000-000000000003',
  '$HASH_B', 12500002, '$FROM', '$WALLET', '$TOKEN',
  now() - interval '2 hours 30 minutes', 12345678
)"
assert_result "paid" "SELECT public.finalize_trc20_payment(
  '10000000-0000-4000-8000-000000000004',
  '$HASH_C', 12500003, '$FROM', '$WALLET', '$TOKEN', now(), 12345679
)"

SECOND_EXPIRY="$(psql "$DATABASE_URL" -X -qAtc "select extract(epoch from expires_at) from public.course_access where user_id='00000000-0000-4000-8000-000000000001'")"
SECOND_ACTIVATED="$(psql "$DATABASE_URL" -X -qAtc "select extract(epoch from activated_at) from public.course_access where user_id='00000000-0000-4000-8000-000000000001'")"
python - "$FIRST_EXPIRY" "$SECOND_EXPIRY" "$FIRST_ACTIVATED" "$SECOND_ACTIVATED" <<'PY'
import sys, time
first_expiry, second_expiry, first_activated, second_activated = map(float, sys.argv[1:])
if not (84.9 * 86400 <= first_expiry - time.time() <= 85.1 * 86400):
    raise SystemExit("First verified payment did not grant approximately 85 days.")
if not (84.9 * 86400 <= second_expiry - first_expiry <= 85.1 * 86400):
    raise SystemExit("Renewal did not extend the existing expiry by 85 days.")
if first_activated != second_activated:
    raise SystemExit("Renewal unexpectedly reset the original activation timestamp.")
print("PASS: first payment grants 85 days; renewal adds 85 days without resetting activation.")
PY

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -qAtc "SET ROLE authenticated; SELECT public.admin_set_course_access('00000000-0000-4000-8000-000000000003', true, true, null); RESET ROLE;"
ADMIN_EXPIRY="$(psql "$DATABASE_URL" -X -qAtc "select extract(epoch from expires_at) from public.course_access where user_id='00000000-0000-4000-8000-000000000003'")"
python - "$ADMIN_EXPIRY" <<'PY'
import sys, time
expiry = float(sys.argv[1])
if not (84.9 * 86400 <= expiry - time.time() <= 85.1 * 86400):
    raise SystemExit("Admin grant without explicit expiry did not default to 85 days.")
print("PASS: blank admin expiry defaults to 85 days.")
PY

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
do $$
begin
  if (select count(*) from public.payment_transactions) <> 2 then
    raise exception 'Expected exactly two recorded payment transactions';
  end if;
  if (select status from public.payment_orders where id = '10000000-0000-4000-8000-000000000001') <> 'paid' then
    raise exception 'Successful payment order not marked paid';
  end if;
  if (select status from public.payment_orders where id = '10000000-0000-4000-8000-000000000002') <> 'pending' then
    raise exception 'Invalid payment attempt changed the pending order';
  end if;
  if (select status from public.payment_orders where id = '10000000-0000-4000-8000-000000000003') <> 'expired' then
    raise exception 'Expired order was not marked expired';
  end if;
  if (select count(*) from public.course_access where is_active and payment_verified and expires_at is null) <> 0 then
    raise exception 'Active verified access without expiry was found';
  end if;
end;
$$;
SQL

echo "PASS: TRC-20 PostgreSQL migrations, payment finalization, renewal and 85-day admin expiry integration tests."
