# Manual-Only Course and Indicator Launch Hardening — Design

Date: 16 November 2026
Status: Implementation design for the existing release candidate branch

## Intent

Prepare the Bullseye Theory course and Bullseye India historical analyzer for a safe final launch review without opening payments, changing production data, or deploying to production. The owner wants free-first automation, manual payment verification, and a simple list of remaining manual actions.

## Product contract

- Complete Course: ₹999, 85 days, 11 lessons, five-question server-graded quiz per lesson, progress and certificate.
- Premium Telegram: ₹1,999, separate private-channel membership. Its duration and final deliverables remain unconfirmed; keep the offer closed.
- Bullseye India Indicator: ₹9,999, 365 days, a website-based historical OHLCV CSV analyzer. It is not a paid TradingView invite-only script, live feed, broker connection, or automatic NSE-wide scanner.
- The Pine Script v6 file remains a development/reference implementation that the owner must compile and inspect in TradingView Free.

## Goals

1. Require a valid signed-in Supabase user and a verified, unexpired 365-day indicator_access entitlement before the analyzer API will process a CSV.
2. Keep entitlement validation server-side and fail closed if Supabase Auth or the indicator-access Edge Function is unavailable.
3. Give the owner an admin-only manual indicator entitlement control that calls the existing admin RPCs; payment verification must be an explicit, unchecked-by-default owner action.
4. Make membership and payment pages describe the same three independent products.
5. Keep all payment and checkout paths closed; do not display a receiving QR or wallet while enrollment is closed.
6. Add tests for the entitlement gate, admin actions, quiz contracts, and closed checkout behavior.

## Non-goals

- Do not apply the indicator_access migration to production.
- Do not deploy or replace production Supabase Edge Functions.
- Do not deploy to Cloudflare production or merge release PR #47.
- Do not enable USDT, UPI, Premium, or indicator checkout.
- Do not automate payment verification or customer fulfilment.
- Do not buy TradingView Pro/Premium or publish a paid invite-only script.
- Do not add a live market-data feed, exchange scanner, broker integration, or trade execution.
- Do not populate the legacy quizzes / quiz_questions tables: current quiz UI and server grading are already defined in the 11 lesson pages and grading.ts.

## Approaches considered

### A. Keep the analyzer public and rely on the closed membership page

Rejected. The current /api/analyze-csv endpoint accepts CSV without an entitlement check, so a public analyzer URL bypasses the planned ₹9,999 membership.

### B. Server-side Supabase entitlement gate with existing Edge Function — selected

The browser signs in through Supabase Auth and sends its access token to the analyzer server. The Node server validates the token against Supabase Auth, then calls get-indicator-access with the same user token and publishable API key. Only an active, payment-verified, unexpired entitlement allows analysis. The Edge Function uses the service-role key server-side to read the private indicator_access row. The browser never receives a service-role key. The owner uses admin_list_indicator_members and admin_set_indicator_access from the protected admin page after the additive migration is applied.

This reuses the existing Supabase project model, avoids a new paid service, and ensures the API itself is protected even if the browser UI is bypassed.

### C. Direct service-role database lookup from the Render analyzer

Rejected. It would put privileged database logic in a second server and increase secret exposure and policy duplication. The existing Edge Function already owns this check.

## Payment and membership page behavior

- membership.html shows the three products independently and states that enrollment is closed.
- The indicator description says website-based historical CSV analyzer; it must not promise TradingView invite-only access or require TradingView CSV export.
- payment.html remains a closed notice only. No wallet address, QR, order creation, polling, or automatic unlock is exposed.
- payment-checkout.js remains a defensive closed stub so an old cached page cannot activate checkout.
- Manual payment verification and manual access activation remain separate owner actions after legal, tax, refund and support terms are approved.

## Security and data boundaries

- indicator_access stays RLS-enabled with no browser-role table access; only service_role accesses the table directly.
- get-indicator-access validates the caller's JWT and returns only that caller's entitlement.
- Admin RPCs retain an is_admin() check and an empty search_path.
- The analyzer accepts only 15m / 1h OHLCV CSV, max 5 MB, processes uploads in memory, and does not store uploaded files.
- Missing environment variables, invalid/expired JWTs, missing entitlement, duplicate/invalid entitlement rows, or upstream failures must deny analysis.
- Production remains unchanged until explicit release approval.

## Acceptance criteria

- Missing or invalid token: HTTP 401.
- Valid user without active, payment-verified, unexpired indicator entitlement: HTTP 403.
- Supabase Auth or entitlement service unavailable: HTTP 503; no analysis.
- Active verified 365-day entitlement: analysis can proceed.
- API cannot be bypassed by skipping the browser sign-in UI.
- Upload remains memory-only and the 5 MB / 15m / 1h limits remain intact.
- Admin indicator access defaults to payment_verified = false; marking payment verified requires a confirmation prompt.
- Course and indicator are separate entitlements; granting one never grants the other.
- All 11 lesson quizzes remain five-question, 80% pass, and server-graded.
- All product pages agree on names, prices, terms, and closed status.
- Production schema, production Edge Functions, checkout flags, and Cloudflare production deployment remain untouched.

## Owner actions still required

- Compile indicator/bullseye.pine in TradingView Free Pine Editor and visually inspect 15m and 1h closed-bar behavior.
- For numerical Pine/Node comparison, supply completed OHLCV candles from a permitted free/broker data source; TradingView CSV export is not required.
- After code review, use a disposable staging account and a non-production Supabase environment to test indicator entitlement and the full course flow.
- Finalize Premium Telegram duration and deliverables.
- Finalize refund/cancellation, business identity, support, tax and legal terms with a qualified Indian adviser.
- Explicitly authorize any production migration, Edge Function deployment, checkout opening, or Cloudflare production release.
