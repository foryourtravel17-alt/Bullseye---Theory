-- Separate Bullseye India annual indicator entitlement.
-- Draft candidate only: do not apply to production until disposable PostgreSQL,
-- hosted preview and owner/accountant checks are complete.
--
-- Product contracts:
--   course    ₹999    85 days
--   premium   ₹1,999  duration not finalized; new orders remain blocked (legacy row shape is retained only for schema compatibility)
--   indicator ₹9,999  365 days
--
-- Indicator membership is separate from course_access. A payment for one product
-- must never grant access to the other product.

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
revoke all on table public.indicator_access from public, anon, authenticated;
grant select, insert, update on table public.indicator_access to service_role;

-- Relax the old course-only payment checks and replace them with product-specific
-- price/duration contracts. Premium keeps its legacy 85-day database row shape only;
-- the Edge Function refuses new Premium orders until the business confirms its term.
alter table public.payment_orders
  drop constraint if exists payment_orders_plan_code_check;
alter table public.payment_orders
  drop constraint if exists payment_orders_inr_amount_paise_check;
alter table public.payment_orders
  drop constraint if exists payment_orders_access_days_85_check;
alter table public.payment_orders
  drop constraint if exists payment_orders_access_days_check;

alter table public.payment_orders
  add constraint payment_orders_plan_code_supported
    check (plan_code in ('course', 'premium', 'indicator')),
  add constraint payment_orders_product_terms_check
    check (
      (plan_code = 'course' and inr_amount_paise = 99900 and access_days = 85)
      or (plan_code = 'premium' and inr_amount_paise = 199900 and access_days = 85)
      or (plan_code = 'indicator' and inr_amount_paise = 999900 and access_days = 365)
    );

-- Premium transfers remain manual-review-only while the membership term is
-- unconfirmed. Preserve the matched transaction hash without marking the order
-- paid or granting an entitlement.
alter table public.payment_orders
  drop constraint if exists payment_orders_paid_fields;

alter table public.payment_orders
  add constraint payment_orders_paid_fields check (
    (status = 'paid' and paid_at is not null and payment_tx_hash is not null)
    or (status = 'manual_review' and paid_at is null and payment_tx_hash is not null)
    or (status in ('pending', 'expired') and paid_at is null and payment_tx_hash is null)
  );

-- A Premium transfer is recorded for manual reconciliation, not marked paid.
-- Permit its tx hash while keeping paid_at NULL; all other unpaid states remain
-- free of payment hashes, and paid orders still require both fields.
alter table public.payment_orders
  drop constraint if exists payment_orders_paid_fields;
alter table public.payment_orders
  add constraint payment_orders_paid_fields check (
    (status = 'paid' and paid_at is not null and payment_tx_hash is not null)
    or (status = 'manual_review' and paid_at is null and payment_tx_hash is not null)
    or (status in ('pending', 'expired') and paid_at is null and payment_tx_hash is null)
  );

-- Atomic payment finalizer continues to accept only a service-role caller.
-- Course and indicator products are fulfilled into different entitlement tables.
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

  -- Premium is a separate Telegram membership with an unconfirmed term. Record
  -- the matching transfer for manual reconciliation; never grant course access.
  if v_order.plan_code = 'premium' then
    update public.payment_orders
    set status = 'manual_review', payment_tx_hash = p_tx_hash
    where id = p_order_id and status = 'pending';
    if not found then
      raise exception 'Premium order status changed during manual reconciliation';
    end if;
    return 'manual_review';
  end if;

  update public.payment_orders
  set status = 'paid', paid_at = now(), payment_tx_hash = p_tx_hash
  where id = p_order_id and status = 'pending';

  if not found then
    raise exception 'Order status changed during payment finalization';
  end if;

  if v_order.plan_code = 'indicator' then
    insert into public.indicator_access (
      user_id, is_active, payment_verified, activated_at, expires_at, updated_at
    ) values (
      v_order.user_id, true, true, now(),
      now() + make_interval(days => v_order.access_days), now()
    )
    on conflict (user_id) do update
    set is_active = true,
        payment_verified = true,
        activated_at = case
          when public.indicator_access.is_active
            and public.indicator_access.payment_verified
            and public.indicator_access.expires_at > now()
            then public.indicator_access.activated_at
          else now()
        end,
        expires_at = greatest(coalesce(public.indicator_access.expires_at, now()), now())
          + make_interval(days => v_order.access_days),
        updated_at = now();
  else
    insert into public.course_access (
      user_id, is_active, payment_verified, activated_at, expires_at, updated_at
    ) values (
      v_order.user_id, true, true, now(),
      now() + make_interval(days => v_order.access_days), now()
    )
    on conflict (user_id) do update
    set is_active = true,
        payment_verified = true,
        activated_at = case
          when public.course_access.is_active
            and public.course_access.payment_verified
            and public.course_access.expires_at > now()
            then public.course_access.activated_at
          else now()
        end,
        expires_at = greatest(coalesce(public.course_access.expires_at, now()), now())
          + make_interval(days => v_order.access_days),
        updated_at = now();
  end if;

  return 'paid';
end;
$function$;

revoke all on function public.finalize_trc20_payment(
  uuid, text, numeric, text, text, text, timestamptz, bigint
) from public, anon, authenticated;
grant execute on function public.finalize_trc20_payment(
  uuid, text, numeric, text, text, text, timestamptz, bigint
) to service_role;

-- Owner/admin access controls for manual website-analyzer entitlement reconciliation.
-- These functions grant only the separate 365-day website analyzer entitlement.
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

revoke all on function public.admin_set_indicator_access(uuid, boolean, boolean, timestamptz)
  from public, anon;
grant execute on function public.admin_set_indicator_access(uuid, boolean, boolean, timestamptz)
  to authenticated;

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
         coalesce(a.is_active, false) and coalesce(a.expires_at > now(), false),
         coalesce(a.payment_verified, false), a.expires_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.indicator_access a on a.user_id = u.id
  order by coalesce(p.full_name, ''), u.email;
end;
$function$;

revoke all on function public.admin_list_indicator_members() from public, anon;
grant execute on function public.admin_list_indicator_members() to authenticated;
