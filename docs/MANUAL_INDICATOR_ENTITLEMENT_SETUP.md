# Bullseye Theory — manual indicator entitlement setup

This setup keeps all payment handling outside the website. The site only displays prices. Do not enable checkout, payment polling, wallet/QR collection, or automatic fulfilment.

## Product rules

- Complete Course: ₹999, 85 days, activated by the administrator after the customer creates an account and enrolment is independently confirmed.
- Premium Bundle: ₹1,999, course access follows the 85-day course term; private Telegram membership and its duration are confirmed and added manually.
- Bullseye India Indicator: ₹9,999, planned 365-day website historical-analyzer entitlement. Do not describe it as a live market feed or TradingView invite-only service.
- The website analyzer currently accepts compatible user-supplied OHLCV CSV files. It is not a live scanner.

## Database changes requiring an owner-controlled Supabase action

The Cloudflare Worker deployment does not apply Supabase migrations. The Supabase connector is not connected to this workspace, so production database changes cannot be applied or verified from this workflow.

In the correct Bullseye Theory Supabase project:

1. Open **SQL Editor**.
2. Run the contents of `supabase/migrations/20261126101546_retire_automatic_trc20_settlement.sql`.
3. Run the contents of `supabase/migrations/20261126110000_manual_indicator_entitlements.sql`.
4. Deploy the current disabled HTTP 410 stubs for these four Edge Functions from this repository: `create-trc20-order`, `get-trc20-order-status`, `get-trc20-payment-config`, and `scan-trc20-payments`. Keep JWT verification enabled for all four. The scanner workflow in GitHub is already retired; do not re-enable it.
5. Do **not** run `20261113140000_add_indicator_membership_365d.sql` as a fresh production migration. It is a historical candidate containing the retired automatic-payment schema and finalizer.
6. Open the Admin page, sign in with the owner/admin account, refresh Indicator Members, and confirm the indicator access controls load.

The two required SQL files are idempotent for the intended objects. Keep a database backup before changing production. Do not paste service-role keys, database passwords, or other secrets into chat.

## Edge Functions

Deploy all four disabled payment stubs listed above so any legacy endpoint returns HTTP 410. Then deploy the current indicator access function below.

The indicator analyzer calls `get-indicator-access`. Deploy the current source at `supabase/functions/get-indicator-access/index.ts` to the same Supabase project and keep JWT verification enabled. The function validates the caller's JWT, then reads only that caller's indicator entitlement. It must never accept a caller-supplied user ID.

The Supabase Edge Function runtime must have its standard `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` environment variables configured. Never expose the service-role key in browser code.

## Manual fulfilment

1. Ask the customer to create a student account through the website.
2. Confirm the product, duration, delivery details, cancellation/refund terms, and the separate payment arrangement privately.
3. Independently confirm the arrangement outside the website.
4. For the course, use Admin → Grant or update student access; confirm the manual enrolment checkbox and save the 85-day access.
5. For the indicator, use Admin → Manual Bullseye India indicator access; confirm the manual verification checkbox and save the 365-day entitlement.
6. For Premium, activate the course separately and add the confirmed Telegram account manually. No automatic Telegram delivery is promised.
7. To revoke access, uncheck active access and save. Do not change the customer's course entitlement when changing indicator access, or vice versa.

## Verification boundary

A green GitHub/Cloudflare deployment does not prove that production Supabase migrations or Edge Functions have been applied. Confirm the Admin indicator controls load and that an entitled test account can access the analyzer before offering indicator activation. Until then, keep the indicator marked availability-confirmation-required.
