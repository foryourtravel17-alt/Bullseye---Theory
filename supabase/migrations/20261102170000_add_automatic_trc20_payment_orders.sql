-- Automatic USDT settlement for Bullseye Theory.
-- This migration is intentionally prepared in a draft PR; it is not applied to production.
create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null check (plan_code in ('course', 'premium')),
  inr_amount_paise integer not null check (inr_amount_paise in (99900, 199900)),
  access_days integer not null check (access_days between 1 and 3650),
  usdt_inr_rate numeric(18,8) not null check (usdt_inr_rate > 0),
  usdt_amount_atomic numeric(24,0) not null check (usdt_amount_atomic > 0),
  destination_wallet text not null check (destination_wallet = 'TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV'),
  token_contract text not null check (token_contract = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'),
  network text not null default 'TRON_MAINNET_TRC20' check (network = 'TRON_MAINNET_TRC20'),
  quote_source text not null default 'coingecko_tether_inr',
  quote_observed_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired', 'manual_review')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  paid_at timestamptz,
  payment_tx_hash text unique,
  constraint payment_orders_expiry_after_creation check (expires_at > created_at),
  constraint payment_orders_paid_fields check (
    (status = 'paid' and paid_at is not null and payment_tx_hash is not null)
    or (status <> 'paid' and paid_at is null and payment_tx_hash is null)
  )
);

create unique index if not exists payment_orders_pending_amount_uidx
  on public.payment_orders (usdt_amount_atomic)
  where status = 'pending';

create index if not exists payment_orders_user_status_created_idx
  on public.payment_orders (user_id, status, created_at desc);

create table if not exists public.payment_transactions (
  tx_hash text primary key check (tx_hash ~ '^[A-Fa-f0-9]{64}$'),
  order_id uuid not null unique references public.payment_orders(id) on delete restrict,
  from_address text not null,
  to_address text not null check (to_address = 'TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV'),
  token_contract text not null check (token_contract = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'),
  amount_atomic numeric(24,0) not null check (amount_atomic > 0),
  block_number bigint not null check (block_number > 0),
  block_timestamp timestamptz not null,
  verified_at timestamptz not null default now()
);

create table if not exists public.payment_review_events (
  tx_hash text primary key check (tx_hash ~ '^[A-Fa-f0-9]{64}
revoke all on table public.payment_orders from public, anon, authenticated;
revoke all on table public.payment_transactions from public, anon, authenticated;
revoke all on table public.payment_review_events from public, anon, authenticated;
grant select, insert, update, delete on table public.payment_orders to service_role;
grant select, insert, update, delete on table public.payment_transactions to service_role;
grant select, insert, update, delete on table public.payment_review_events to service_role;
grant select, insert, update on table public.course_access to service_role;

create or replace function public.finalize_trc20_payment(
  p_order_id uuid,
  p_tx_hash text,
  p_amount_atomic numeric,
  p_from_address text,
  p_to_address text,
  p_token_contract text,
  p_block_timestamp timestamptz,
  p_block_number bigint
)
returns text
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_order public.payment_orders%rowtype;
  v_inserted integer;
begin
  if current_user <> 'service_role' then
    raise exception 'Server payment verifier only' using errcode = '42501';
  end if;

  if p_tx_hash is null or p_tx_hash !~ '^[A-Fa-f0-9]{64}$'
     or p_amount_atomic is null or p_amount_atomic <= 0
     or p_block_number is null or p_block_number <= 0
     or p_block_timestamp is null
     or p_from_address is null or length(p_from_address) < 20 then
    return 'invalid_chain_evidence';
  end if;

  select * into v_order
  from public.payment_orders
  where id = p_order_id
  for update;

  if not found then return 'order_not_found'; end if;
  if v_order.status = 'paid' then
    if lower(v_order.payment_tx_hash) = lower(p_tx_hash) then return 'already_paid'; end if;
    return 'order_already_paid';
  end if;
  if v_order.status <> 'pending' then return 'order_not_pending'; end if;
  if now() > v_order.expires_at + interval '1 hour' then
    update public.payment_orders set status = 'expired'
    where id = p_order_id and status = 'pending';
    return 'order_expired';
  end if;
  if p_amount_atomic <> v_order.usdt_amount_atomic then return 'amount_mismatch'; end if;
  if p_to_address <> v_order.destination_wallet then return 'destination_mismatch'; end if;
  if p_token_contract <> v_order.token_contract then return 'token_contract_mismatch'; end if;
  if p_block_timestamp < v_order.created_at or p_block_timestamp > v_order.expires_at then
    return 'transfer_outside_order_window';
  end if;

  insert into public.payment_transactions (
    tx_hash, order_id, from_address, to_address, token_contract,
    amount_atomic, block_number, block_timestamp
  ) values (
    p_tx_hash, p_order_id, p_from_address, p_to_address, p_token_contract,
    p_amount_atomic, p_block_number, p_block_timestamp
  ) on conflict do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then return 'duplicate_transaction'; end if;

  update public.payment_orders
  set status = 'paid', paid_at = now(), payment_tx_hash = p_tx_hash
  where id = p_order_id and status = 'pending';

  if not found then
    raise exception 'Order status changed during payment finalization';
  end if;

  insert into public.course_access (
    user_id, is_active, payment_verified, activated_at, expires_at, updated_at
  ) values (
    v_order.user_id, true, true, now(), now() + make_interval(days => v_order.access_days), now()
  )
  on conflict (user_id) do update
  set is_active = true,
      payment_verified = true,
      activated_at = case
        when public.course_access.is_active and public.course_access.payment_verified
          and (public.course_access.expires_at is null or public.course_access.expires_at > now())
          then public.course_access.activated_at
        else now()
      end,
      expires_at = greatest(coalesce(public.course_access.expires_at, now()), now())
        + make_interval(days => v_order.access_days),
      updated_at = now();

  return 'paid';
end;
$function$;

revoke all on function public.finalize_trc20_payment(
  uuid, text, numeric, text, text, text, timestamptz, bigint
) from public, anon, authenticated;
grant execute on function public.finalize_trc20_payment(
  uuid, text, numeric, text, text, text, timestamptz, bigint
) to service_role;
),
  from_address text not null,
  to_address text not null,
  token_contract text not null,
  amount_atomic numeric(24,0) not null check (amount_atomic > 0),
  block_number bigint not null check (block_number > 0),
  block_timestamp timestamptz not null,
  review_reason text not null check (review_reason in ('no_matching_order', 'multiple_matching_orders')),
  first_seen_at timestamptz not null default now(),
  resolution_note text,
  resolved_at timestamptz
);

alter table public.payment_orders enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_review_events enable row level security;

-- Orders and chain evidence are server-only. Browser roles receive no table privileges.
revoke all on table public.payment_orders from public, anon, authenticated;
revoke all on table public.payment_transactions from public, anon, authenticated;
grant select, insert, update, delete on table public.payment_orders to service_role;
grant select, insert, update, delete on table public.payment_transactions to service_role;
grant select, insert, update on table public.course_access to service_role;

create or replace function public.finalize_trc20_payment(
  p_order_id uuid,
  p_tx_hash text,
  p_amount_atomic numeric,
  p_from_address text,
  p_to_address text,
  p_token_contract text,
  p_block_timestamp timestamptz,
  p_block_number bigint
)
returns text
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_order public.payment_orders%rowtype;
  v_inserted integer;
begin
  if current_user <> 'service_role' then
    raise exception 'Server payment verifier only' using errcode = '42501';
  end if;

  if p_tx_hash is null or p_tx_hash !~ '^[A-Fa-f0-9]{64}$'
     or p_amount_atomic is null or p_amount_atomic <= 0
     or p_block_number is null or p_block_number <= 0
     or p_block_timestamp is null
     or p_from_address is null or length(p_from_address) < 20 then
    return 'invalid_chain_evidence';
  end if;

  select * into v_order
  from public.payment_orders
  where id = p_order_id
  for update;

  if not found then return 'order_not_found'; end if;
  if v_order.status = 'paid' then
    if lower(v_order.payment_tx_hash) = lower(p_tx_hash) then return 'already_paid'; end if;
    return 'order_already_paid';
  end if;
  if v_order.status <> 'pending' then return 'order_not_pending'; end if;
  if now() > v_order.expires_at then
    update public.payment_orders set status = 'expired'
    where id = p_order_id and status = 'pending';
    return 'order_expired';
  end if;
  if p_amount_atomic <> v_order.usdt_amount_atomic then return 'amount_mismatch'; end if;
  if p_to_address <> v_order.destination_wallet then return 'destination_mismatch'; end if;
  if p_token_contract <> v_order.token_contract then return 'token_contract_mismatch'; end if;
  if p_block_timestamp < v_order.created_at or p_block_timestamp > v_order.expires_at then
    return 'transfer_outside_order_window';
  end if;

  insert into public.payment_transactions (
    tx_hash, order_id, from_address, to_address, token_contract,
    amount_atomic, block_number, block_timestamp
  ) values (
    p_tx_hash, p_order_id, p_from_address, p_to_address, p_token_contract,
    p_amount_atomic, p_block_number, p_block_timestamp
  ) on conflict do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then return 'duplicate_transaction'; end if;

  update public.payment_orders
  set status = 'paid', paid_at = now(), payment_tx_hash = p_tx_hash
  where id = p_order_id and status = 'pending';

  if not found then
    raise exception 'Order status changed during payment finalization';
  end if;

  insert into public.course_access (
    user_id, is_active, payment_verified, activated_at, expires_at, updated_at
  ) values (
    v_order.user_id, true, true, now(), null, now()
  )
  on conflict (user_id) do update
  set is_active = true,
      payment_verified = true,
      activated_at = case
        when public.course_access.is_active and public.course_access.payment_verified
          then public.course_access.activated_at
        else now()
      end,
      expires_at = null,
      updated_at = now();

  return 'paid';
end;
$function$;

revoke all on function public.finalize_trc20_payment(
  uuid, text, numeric, text, text, text, timestamptz, bigint
) from public, anon, authenticated;
grant execute on function public.finalize_trc20_payment(
  uuid, text, numeric, text, text, text, timestamptz, bigint
) to service_role;
),
  from_address text not null,
  to_address text not null check (to_address = 'TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV'),
  token_contract text not null check (token_contract = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'),
  amount_atomic numeric(24,0) not null check (amount_atomic > 0),
  block_number bigint not null check (block_number > 0),
  block_timestamp timestamptz not null,
  review_reason text not null check (review_reason in ('no_matching_order', 'multiple_matching_orders')),
  first_seen_at timestamptz not null default now(),
  resolution_note text,
  resolved_at timestamptz
);

-- Orders and chain evidence are server-only. Browser roles receive no table privileges.
revoke all on table public.payment_orders from public, anon, authenticated;
revoke all on table public.payment_transactions from public, anon, authenticated;
revoke all on table public.payment_review_events from public, anon, authenticated;
grant select, insert, update, delete on table public.payment_orders to service_role;
grant select, insert, update, delete on table public.payment_transactions to service_role;
grant select, insert, update, delete on table public.payment_review_events to service_role;
grant select, insert, update on table public.course_access to service_role;

create or replace function public.finalize_trc20_payment(
  p_order_id uuid,
  p_tx_hash text,
  p_amount_atomic numeric,
  p_from_address text,
  p_to_address text,
  p_token_contract text,
  p_block_timestamp timestamptz,
  p_block_number bigint
)
returns text
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_order public.payment_orders%rowtype;
  v_inserted integer;
begin
  if current_user <> 'service_role' then
    raise exception 'Server payment verifier only' using errcode = '42501';
  end if;

  if p_tx_hash is null or p_tx_hash !~ '^[A-Fa-f0-9]{64}$'
     or p_amount_atomic is null or p_amount_atomic <= 0
     or p_block_number is null or p_block_number <= 0
     or p_block_timestamp is null
     or p_from_address is null or length(p_from_address) < 20 then
    return 'invalid_chain_evidence';
  end if;

  select * into v_order
  from public.payment_orders
  where id = p_order_id
  for update;

  if not found then return 'order_not_found'; end if;
  if v_order.status = 'paid' then
    if lower(v_order.payment_tx_hash) = lower(p_tx_hash) then return 'already_paid'; end if;
    return 'order_already_paid';
  end if;
  if v_order.status <> 'pending' then return 'order_not_pending'; end if;
  if now() > v_order.expires_at + interval '1 hour' then
    update public.payment_orders set status = 'expired'
    where id = p_order_id and status = 'pending';
    return 'order_expired';
  end if;
  if p_amount_atomic <> v_order.usdt_amount_atomic then return 'amount_mismatch'; end if;
  if p_to_address <> v_order.destination_wallet then return 'destination_mismatch'; end if;
  if p_token_contract <> v_order.token_contract then return 'token_contract_mismatch'; end if;
  if p_block_timestamp < v_order.created_at or p_block_timestamp > v_order.expires_at then
    return 'transfer_outside_order_window';
  end if;

  insert into public.payment_transactions (
    tx_hash, order_id, from_address, to_address, token_contract,
    amount_atomic, block_number, block_timestamp
  ) values (
    p_tx_hash, p_order_id, p_from_address, p_to_address, p_token_contract,
    p_amount_atomic, p_block_number, p_block_timestamp
  ) on conflict do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then return 'duplicate_transaction'; end if;

  update public.payment_orders
  set status = 'paid', paid_at = now(), payment_tx_hash = p_tx_hash
  where id = p_order_id and status = 'pending';

  if not found then
    raise exception 'Order status changed during payment finalization';
  end if;

  insert into public.course_access (
    user_id, is_active, payment_verified, activated_at, expires_at, updated_at
  ) values (
    v_order.user_id, true, true, now(), now() + make_interval(days => v_order.access_days), now()
  )
  on conflict (user_id) do update
  set is_active = true,
      payment_verified = true,
      activated_at = case
        when public.course_access.is_active and public.course_access.payment_verified
          then public.course_access.activated_at
        else now()
      end,
      expires_at = now() + make_interval(days => v_order.access_days),
      updated_at = now();

  return 'paid';
end;
$function$;

revoke all on function public.finalize_trc20_payment(
  uuid, text, numeric, text, text, text, timestamptz, bigint
) from public, anon, authenticated;
grant execute on function public.finalize_trc20_payment(
  uuid, text, numeric, text, text, text, timestamptz, bigint
) to service_role;
),
  from_address text not null,
  to_address text not null,
  token_contract text not null,
  amount_atomic numeric(24,0) not null check (amount_atomic > 0),
  block_number bigint not null check (block_number > 0),
  block_timestamp timestamptz not null,
  review_reason text not null check (review_reason in ('no_matching_order', 'multiple_matching_orders')),
  first_seen_at timestamptz not null default now(),
  resolution_note text,
  resolved_at timestamptz
);

alter table public.payment_orders enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_review_events enable row level security;

-- Orders and chain evidence are server-only. Browser roles receive no table privileges.
revoke all on table public.payment_orders from public, anon, authenticated;
revoke all on table public.payment_transactions from public, anon, authenticated;
grant select, insert, update, delete on table public.payment_orders to service_role;
grant select, insert, update, delete on table public.payment_transactions to service_role;
grant select, insert, update on table public.course_access to service_role;

create or replace function public.finalize_trc20_payment(
  p_order_id uuid,
  p_tx_hash text,
  p_amount_atomic numeric,
  p_from_address text,
  p_to_address text,
  p_token_contract text,
  p_block_timestamp timestamptz,
  p_block_number bigint
)
returns text
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_order public.payment_orders%rowtype;
  v_inserted integer;
begin
  if current_user <> 'service_role' then
    raise exception 'Server payment verifier only' using errcode = '42501';
  end if;

  if p_tx_hash is null or p_tx_hash !~ '^[A-Fa-f0-9]{64}$'
     or p_amount_atomic is null or p_amount_atomic <= 0
     or p_block_number is null or p_block_number <= 0
     or p_block_timestamp is null
     or p_from_address is null or length(p_from_address) < 20 then
    return 'invalid_chain_evidence';
  end if;

  select * into v_order
  from public.payment_orders
  where id = p_order_id
  for update;

  if not found then return 'order_not_found'; end if;
  if v_order.status = 'paid' then
    if lower(v_order.payment_tx_hash) = lower(p_tx_hash) then return 'already_paid'; end if;
    return 'order_already_paid';
  end if;
  if v_order.status <> 'pending' then return 'order_not_pending'; end if;
  if now() > v_order.expires_at then
    update public.payment_orders set status = 'expired'
    where id = p_order_id and status = 'pending';
    return 'order_expired';
  end if;
  if p_amount_atomic <> v_order.usdt_amount_atomic then return 'amount_mismatch'; end if;
  if p_to_address <> v_order.destination_wallet then return 'destination_mismatch'; end if;
  if p_token_contract <> v_order.token_contract then return 'token_contract_mismatch'; end if;
  if p_block_timestamp < v_order.created_at or p_block_timestamp > v_order.expires_at then
    return 'transfer_outside_order_window';
  end if;

  insert into public.payment_transactions (
    tx_hash, order_id, from_address, to_address, token_contract,
    amount_atomic, block_number, block_timestamp
  ) values (
    p_tx_hash, p_order_id, p_from_address, p_to_address, p_token_contract,
    p_amount_atomic, p_block_number, p_block_timestamp
  ) on conflict do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then return 'duplicate_transaction'; end if;

  update public.payment_orders
  set status = 'paid', paid_at = now(), payment_tx_hash = p_tx_hash
  where id = p_order_id and status = 'pending';

  if not found then
    raise exception 'Order status changed during payment finalization';
  end if;

  insert into public.course_access (
    user_id, is_active, payment_verified, activated_at, expires_at, updated_at
  ) values (
    v_order.user_id, true, true, now(), null, now()
  )
  on conflict (user_id) do update
  set is_active = true,
      payment_verified = true,
      activated_at = case
        when public.course_access.is_active and public.course_access.payment_verified
          then public.course_access.activated_at
        else now()
      end,
      expires_at = null,
      updated_at = now();

  return 'paid';
end;
$function$;

revoke all on function public.finalize_trc20_payment(
  uuid, text, numeric, text, text, text, timestamptz, bigint
) from public, anon, authenticated;
grant execute on function public.finalize_trc20_payment(
  uuid, text, numeric, text, text, text, timestamptz, bigint
) to service_role;
