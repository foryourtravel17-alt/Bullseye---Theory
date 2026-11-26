This document is retained as a historical schema/payment design reference. The current indicator delivery route is the website-based CSV historical analyzer in PR #49. Do not treat TradingView invite-only publication, TradingView Premium/Ultimate eligibility, or TradingView username grants as launch requirements for the current v1 product. Keep all payment flags disabled; any future payment integration requires separate owner approval.

# Bullseye Theory — Annual Indicator Membership Technical Specification

Status: implementation specification. No production schema, payment flag or TradingView access has been changed.

## Product rules

- COURSE: ₹999, one-time payment, 85 days of course access.
- INDICATOR_ANNUAL: ₹9,999 prepayment, 365 days of indicator membership.
- Renewals are customer-initiated. The current TRC-20 wallet flow cannot automatically debit a customer's wallet.
- Course and indicator are separate products. A combined bundle price is not defined.
- Indicator checkout remains disabled until Pine validation, TradingView publication/eligibility and the database migration have passed.

## Existing payment system facts

The current production `payment_orders` table allows only `course` / `premium`, INR paise 99,900 / 199,900 and exactly 85 access days. The existing finalizer grants only `course_access`. Do not send a ₹9,999 indicator order to production before a migration updates these constraints and grants a distinct indicator entitlement.

The existing TRC-20 verifier checks matching amount, destination wallet, USDT token contract, order time window and solidified successful chain receipt before finalization. Keep it fail-closed.

## Database design

Create a separate indicator entitlement and history model; do not overload `course_access`.

### indicator_access (current entitlement)
- user_id UUID primary key, references auth.users
- is_active boolean not null default false
- payment_verified boolean not null default false
- activated_at timestamptz nullable
- expires_at timestamptz nullable
- last_order_id UUID unique references payment_orders
- updated_at timestamptz not null default now()
- check: a verified active membership must have an expiry

### indicator_membership_periods (immutable purchase periods)
- id UUID primary key
- user_id UUID not null
- payment_order_id UUID not null unique
- starts_at timestamptz not null
- expires_at timestamptz not null
- status: active | expired | refunded | disputed
- created_at timestamptz not null default now()
- check: expires_at > starts_at

### tradingview_access_audit
- id UUID primary key
- user_id UUID not null
- entitlement_period_id UUID not null
- tradingview_username text not null
- script_publication_id text not null
- action: grant | extend | revoke
- status: pending | confirmed | failed
- performed_by UUID not null
- performed_at timestamptz nullable
- note text nullable
- created_at timestamptz not null default now()

Enable RLS on all exposed tables. Revoke browser-role write privileges. Use a server-only finalizer for entitlement writes; admin actions must verify the admin identity server-side and be audited. Users must never be able to edit prices, payment status, entitlement dates or TradingView access status.

## Payment order constraints

Replace the present fixed constraints only in a reviewed migration:
- plan_code must allow only COURSE and INDICATOR_ANNUAL for this release.
- COURSE must be exactly 99,900 paise and 85 days.
- INDICATOR_ANNUAL must be exactly 999,900 paise and 365 days.
- Retain the fixed TRON wallet, TRC-20 USDT contract and network constraints.
- Migration preflight must stop if any legacy premium orders or unexpected access durations exist. Reconcile them before changing constraints.

## Server-side finalizer

After a valid finalized chain receipt:
1. Lock the exact pending payment order.
2. Validate amount, transaction, destination, token, network and order window.
3. Mark the order paid exactly once.
4. If plan=course, grant/extend only course_access by the order's 85 days.
5. If plan=indicator_annual, create one immutable membership period and extend indicator_access by 365 days. If a current paid period remains active, start at its expiry; otherwise start now.
6. Enforce one transaction/order and one membership-period/order.
7. Return the plan-specific result. Never grant both products from one order.

## Feature flags and checkout

- USDT_CHECKOUT_ENABLED must remain false until owner and accountant approval.
- INDICATOR_CHECKOUT_ENABLED must additionally remain false until the indicator is published/eligible and the new schema/finalizer is deployed and tested.
- Server must validate plan/price/access period; ignore any client-supplied amounts or expiry.
- Missing flags, missing secrets, mismatched wallet/network or unavailable quote must fail closed.
- The browser must never display a payment instruction for a disabled plan.

## TradingView access is a separate manual workflow

No verified TradingView access-management API is configured here. After a verified indicator payment:
1. Admin checks the student's TradingView username.
2. Admin manually grants access to the public invite-only script through TradingView Manage access.
3. Admin records a confirmed grant in tradingview_access_audit.
4. Renewal payment creates a new 365-day period; admin manually extends access and records it.
5. Expiry/refund/dispute creates a revoke task. Admin removes access and records confirmation.

A website entitlement is not proof that TradingView access was successfully granted. Never show the latter as active until manually confirmed.

## Tests required

- A course payment grants exactly 85 days and does not create indicator access.
- An indicator payment grants exactly 365 days and does not unlock paid course lessons.
- A renewal extends from the active expiry without losing already-paid days.
- A customer with an expired entitlement starts a new period from verification time.
- Duplicate chain event and duplicate order finalization do not double-extend.
- Wrong plan, price, access duration, wallet, contract, network or order window is rejected.
- Browser cannot mutate orders, access rows or audit history.
- Checkout closed or indicator flag missing means no new order.
- Admin TradingView grant/extend/revoke actions require admin role and are audited.
- Refund/dispute creates a revoke task; no UI claims access is revoked before owner confirmation.
- Student A cannot read Student B's payments or entitlements.

## Operational limits

Annual TRC-20 renewal is not auto-debit. The customer must initiate payment again. Automatic membership expiry can be handled on the website, but TradingView access removal requires a manual owner/admin action unless a supported API is verified. TradingView Paid Spaces may later provide a separate monthly recurring model after Creator Program approval.
