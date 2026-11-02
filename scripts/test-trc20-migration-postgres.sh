#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must point to the disposable PostgreSQL 17 test database}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create table auth.users (
  id uuid primary key
);

create table public.course_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default false,
  payment_verified boolean not null default false,
  activated_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.course_access enable row level security;
grant usage on schema public to service_role;
grant usage on schema auth to service_role;
SQL

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f supabase/migrations/20261102170000_add_automatic_trc20_payment_orders.sql

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
insert into auth.users(id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000003');

insert into public.payment_orders (
  id, user_id, plan_code, inr_amount_paise, access_days,
  usdt_inr_rate, usdt_amount_atomic, destination_wallet, token_contract,
  network, quote_source, quote_observed_at, status, created_at, expires_at
) values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'course', 99900, 365, 83.5, 12500000,
    'TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV',
    'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    'TRON_MAINNET_TRC20', 'test_fixture', now(), 'pending', now() - interval '2 minutes', now() + interval '20 minutes'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000002',
    'course', 99900, 365, 83.5, 12500001,
    'TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV',
    'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    'TRON_MAINNET_TRC20', 'test_fixture', now(), 'pending', now() - interval '2 minutes', now() + interval '20 minutes'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000003',
    'course', 99900, 365, 83.5, 12500002,
    'TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV',
    'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    'TRON_MAINNET_TRC20', 'test_fixture', now() - interval '3 hours',
    'pending', now() - interval '3 hours', now() - interval '2 hours'
  );
SQL

WALLET="TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV"
TOKEN="TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
HASH_A="$(printf 'a%.0s' {1..64})"
HASH_B="$(printf 'b%.0s' {1..64})"

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
  '$HASH_A', 12500000,
  'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8',
  '$WALLET', '$TOKEN', now(), 12345678
)"

assert_result "already_paid" "SELECT public.finalize_trc20_payment(
  '10000000-0000-4000-8000-000000000001',
  '$HASH_A', 12500000,
  'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8',
  '$WALLET', '$TOKEN', now(), 12345678
)"

assert_result "amount_mismatch" "SELECT public.finalize_trc20_payment(
  '10000000-0000-4000-8000-000000000002',
  '$HASH_B', 12500000,
  'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8',
  '$WALLET', '$TOKEN', now(), 12345678
)"

assert_result "destination_mismatch" "SELECT public.finalize_trc20_payment(
  '10000000-0000-4000-8000-000000000002',
  '$HASH_B', 12500001,
  'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8',
  'TWrongWallet111111111111111111111', '$TOKEN', now(), 12345678
)"

assert_result "token_contract_mismatch" "SELECT public.finalize_trc20_payment(
  '10000000-0000-4000-8000-000000000002',
  '$HASH_B', 12500001,
  'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8',
  '$WALLET', 'TWrongToken111111111111111111111', now(), 12345678
)"

assert_result "duplicate_transaction" "SELECT public.finalize_trc20_payment(
  '10000000-0000-4000-8000-000000000002',
  '$HASH_A', 12500001,
  'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8',
  '$WALLET', '$TOKEN', now(), 12345678
)"

assert_result "order_expired" "SELECT public.finalize_trc20_payment(
  '10000000-0000-4000-8000-000000000003',
  '$HASH_B', 12500002,
  'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8',
  '$WALLET', '$TOKEN',
  now() - interval '2 hours 30 minutes', 12345678
)"

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
do $$
declare
  access_row public.course_access%rowtype;
begin
  select * into access_row
  from public.course_access
  where user_id = '00000000-0000-4000-8000-000000000001';

  if not found or not access_row.is_active or not access_row.payment_verified then
    raise exception 'Successful payment did not activate course access';
  end if;
  if access_row.expires_at is null or access_row.expires_at <= now() then
    raise exception 'Course access expiry was not written as a future timestamp';
  end if;

  if (select count(*) from public.payment_transactions) <> 1 then
    raise exception 'Expected exactly one recorded payment transaction';
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
end;
$$;
SQL

echo "PASS: TRC-20 PostgreSQL migration and atomic payment finalization integration tests."
