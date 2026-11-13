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
4. Owner manually grants access to the **public invite-only** TradingView script; commercial access must not be sold through a private publication.
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
- Do not publish the Pine script as open-source or protected. Only publish as **Public + Invite-only** after Premium/Ultimate eligibility, moderator review and all release gates are satisfied.
- Do not promise automatic TradingView invite delivery.
- Do not deploy or merge merely because CI is green.


## TradingView invite-only publishing and customer access — owner runbook

**Current owner account:** TradingView Basic (shown in the owner's TradingView screenshots, 13 Nov 2026). Basic cannot publish invite-only scripts. TradingView requires an active **Premium or Ultimate** plan to publish/manage invite-only scripts. Do not purchase an upgrade now; keep the project on the ₹0-investment path and defer this step until the business is ready to fund the required TradingView tier.

### Correct publication type for a paid commercial indicator

- Use **Public publication + Invite-only access**. This is the supported commercial model when selling access outside TradingView.
- Do **not** sell a private invite-only publication. TradingView says private publications are for private/internal use, are capped at five users, and must not be used to sell access.
- A public invite-only script is visible as a publication, but only users whom the author explicitly grants access can add/run it; the Pine source remains closed.
- Open-source and Protected scripts are not valid paid-access substitutes: anyone can use them, and TradingView says they must remain free.
- Since Bullseye intends to serve more than five customers, do not start on a private invite-only publication.

Official TradingView guidance:
- Publishing invite-only scripts: https://www.tradingview.com/support/solutions/43000614617-publishing-invite-only-scripts/
- Vendor Requirements: https://www.tradingview.com/support/solutions/43000549951-vendor-requirements/
- Invite-only Script Rules: https://www.tradingview.com/support/solutions/43000797311-invite-only-script-rules/
- Selling scripts FAQ: https://www.tradingview.com/support/solutions/43000797373-selling-scripts-on-tradingview/

### One-time author setup (only after Premium/Ultimate is active and final script QA passes)

1. Sign in to the **owner's own** TradingView account on the web and open the final saved Bullseye India Pine script in Pine Editor.
2. Select **Publish script**. Choose a **Public** publication and **Invite-only** access. Do not select Open-source or Protected.
3. Use the approved product title and write a truthful description of the script's original features, supported intervals (15m and 1h), supported chart-symbol workflow, volume/data limitations, non-broker-execution nature, and risk disclaimer. Do not promise accuracy, profits, win-rate, or guaranteed returns.
4. Fill the **Author's instructions** field with a simple process explaining that a customer must first request access and provide their exact TradingView username after the business has independently verified their order. Avoid soliciting/spamming users who have not requested access.
5. Submit for TradingView moderation. Wait for publication approval; do not assume submission means the script is already available. Keep the Pine source in the private GitHub product repository and do not paste it into public descriptions, comments, posts or screenshots.
6. Once approved, open the script's publication page. The author should see **Manage access**. If that button is absent, stop and check plan, publication type and moderation status rather than publishing a second copy.

### Grant one customer access (manual; database entitlement does not grant TradingView access)

1. First, independently verify the paid order and confirm the server's indicator entitlement is active with a future `expires_at`. (Payment verification is intentionally deferred to the owner's separate manual process.)
2. Ask the customer for their exact TradingView username/profile URL. Do not grant access to users who did not explicitly request it.
3. Open the public invite-only script page → **Manage access** → add the customer's TradingView username.
4. Set the access start/end dates. Set the end date to the same 365-day entitlement expiry recorded in the business ledger, then confirm the grant.
5. Tell the customer to open TradingView, search the author's published script / open the publication link, and add it to their chart. Only invited users can run it.
6. Record TradingView username, order reference, grant timestamp, expiry timestamp, and operator in the restricted business access ledger. Never record passwords or API tokens.

### Renewal, expiry, refund and removal

- On a separately verified renewal, edit the user's access end date in **Manage access** to match the newly confirmed entitlement expiry.
- On expiry, cancellation, refund, chargeback or confirmed access withdrawal, remove/revoke the TradingView user promptly in **Manage access** and record the action. Do not assume Supabase expiry automatically revokes TradingView access.
- Reconcile the TradingView access list against the business entitlement ledger on a regular schedule. Only the owner/admin performs these operations; no supported API integration has been verified.
- From 1 Feb 2027, TradingView's published rules introduce seats for active users of public/private invite-only scripts (Paid Space users are treated differently). Recheck the then-current rules and seat allowance before scaling access.

### TradingView vendor-compliance requirements

- Grant access only to users who explicitly requested it; honour removal requests.
- Explain what the indicator does and its limitations. Avoid deceptive or unsupported performance claims.
- Do not use a private invite-only script to charge customers. Do not use an Open or Protected publication for paid access.
- Do not publish multiple near-identical scripts as separate market/timeframe suites; keep Bullseye as one universal symbol-agnostic script with the supported markets/timeframes explained.
- Do not spam TradingView users or use the script publication description/comments to promote external businesses. Keep access instructions factual and use the allowed author-signature/profile areas for permitted links.
- TradingView's vendor and publishing rules can change; recheck the linked official pages before the actual publication date.

