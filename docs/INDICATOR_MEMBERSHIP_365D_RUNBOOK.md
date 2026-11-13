# Bullseye India Indicator Membership — 365-day launch runbook

Status: draft implementation; checkout closed; no production migration or function deployment has been performed.

## Locked product terms

| Product | Server price | Entitlement | Entitlement table |
|---|---:|---:|---|
| Complete Course | ₹999 | 85 days | `public.course_access` |
| Bullseye India Indicator | ₹9,999 | 365 days | `public.indicator_access` |
| Legacy Premium Bundle | ₹1,999 | Not open | Existing course/premium policy; remains feature-flagged off |

The price and duration are server-side constants. The browser cannot submit a price, duration or customer user ID to decide entitlement.

## What this draft implements

- Additive SQL migration creates `indicator_access` with RLS and no direct anon/authenticated table privileges.
- Payment-order constraints bind `indicator` to 999900 paise / 365 days, while preserving course ₹999 / 85-day orders.
- The TRC-20 finalizer routes indicator payments to `indicator_access` and course/premium rows to `course_access`.
- Renewals extend the corresponding expiry; a separate entitlement is never granted by the other product's payment.
- Admin-only functions support entitlement reconciliation. They do not grant TradingView access.
- Authenticated `get-indicator-access` reads only the logged-in user's entitlement.
- Payment config and order creation have a separate `INDICATOR_CHECKOUT_ENABLED` gate. Both this and the global checkout switch must be explicitly enabled.
- Payment page describes the planned annual product but keeps the indicator option disabled by default.
- TradingView invite-only access remains a manual owner action after verified payment.

## Automated test coverage

The PR CI runs:
1. JavaScript payment-client syntax and closed-checkout guards.
2. TRC-20 transfer and receipt tests.
3. Fixed product price/duration and independent feature-flag tests.
4. Static migration/RLS/entitlement contracts.
5. Disposable PostgreSQL migrations and payment finalization:
   - Course payment issues 85 days.
   - Course renewal adds 85 days without resetting original activation.
   - Indicator payment issues 365 days.
   - Indicator renewal adds 365 days without resetting original activation.
   - Admin blank-expiry grant defaults to 365 days.
   - Indicator payment does not grant course access; course payment does not grant indicator access.
   - Browser roles cannot read indicator entitlement rows.
6. Deno type checks for payment and indicator-access Edge Functions.
7. Course Edge Function, Cloudflare Worker dry-run, site and security contract checks.

These are CI and disposable-database tests. They do not authorize a production migration or real-money test.

## Owner's one-time launch checklist

### A. Approve product and commercial details
- Confirm the ₹9,999 price, 365-day duration, renewal policy and exactly what is included.
- Publish final terms, privacy, refund, support and risk disclosures.
- Have the business accountant/adviser confirm the accepted payment method, tax/accounting treatment and legal requirements before accepting funds.
- Keep premium bundle disabled until its own benefits and terms are defined.

### B. Reconcile and validate the release branch
- Review PR #36 and reconcile its four commits behind the current main branch.
- Review this indicator membership PR #46 against that reconciled release candidate.
- Require all CI checks to pass after the final rebase/update.
- Do not merge a draft PR or skip a conflict review.

### C. Local/staging database and function rollout
- Use Supabase CLI v3 local-first workflow. Start with a local disposable Supabase stack and apply migrations locally; do not pass `--linked` or a production project reference during local testing.
- Run the full Node, Deno and PostgreSQL test commands listed by CI.
- Use a separate staging project for hosted auth/payment journey tests. No live USDT transfer is needed.
- Only after staging passes, obtain explicit owner approval for the additive production migration and Edge Function deployment.
- Never commit Supabase secrets to Git. Configure them through Supabase project secrets:
  - `INDICATOR_CHECKOUT_ENABLED=false` initially.
  - `USDT_CHECKOUT_ENABLED=false` until global payment readiness is signed off.
  - Existing `SUPABASE_SERVICE_ROLE_KEY`, `TRONGRID_API_KEY`, `TRC20_SCANNER_CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` must be verified in the secure dashboard.
- Confirm `get-trc20-payment-config` reports the indicator as disabled before opening the site.
- The scheduled TRC-20 scanner remains off until secrets and the owner enable switch are deliberately configured.

### D. Customer fulfilment after an independently verified payment
1. Confirm the order's plan is `indicator` and server status is `paid`.
2. Confirm `get-indicator-access` reports `access_active=true` and a future `expires_at`.
3. Collect the customer's TradingView username/profile link.
4. Owner manually issues invite-only access to the private TradingView script.
5. Record the invitation date and entitlement expiry in the business's customer records.
6. At expiry, owner manually removes or renews TradingView invite-only access. Database entitlement alone does not invite/revoke a TradingView user.

## Still external/manual

- Production migration approval and application.
- Supabase Edge Function deployment and secret readiness.
- Final accountant/legal sign-off.
- TradingView invite-only grant, extension and revocation.
- Customer support/refund handling.
- Final production release approval.

## Safety rules

- Do not enable either checkout flag while staging, policy and manual access checks are incomplete.
- Do not use a real USDT transfer as a test.
- Do not publish the Pine script publicly.
- Do not promise automatic TradingView invite delivery.
- Do not deploy or merge merely because CI is green.
