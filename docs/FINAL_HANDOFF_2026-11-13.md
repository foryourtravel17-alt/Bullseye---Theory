# Bullseye Theory — Consolidated release handoff
Date: 13 November 2026
Status: development and automated checks advanced; production release intentionally held.

## Verified repository / CI state

### Indicator source — PR #45
- Draft PR: `feat/india-market-indicator-v1`.
- One universal symbol-agnostic NSE-first indicator; supported decision charts are 15m and 1h.
- Pine features include supply/demand zones, confirmed breakout, entry/SL/TP, 1:2 RR, volume filter, EMA20/50, RSI14, VWAP, Previous Day High/Low, EMA200, relative volume, ATR%.
- Owner screenshot QA: RELIANCE, TCS, HDFCBANK, NIFTY 50 and BANKNIFTY, each 15m and 1h.
- Latest source test run #32 passed. A separate streaming-vs-batch model fixture passed in run #31.
- Actual TradingView-exported candle parity and forward/Bar Replay repainting validation remain open. Static/model checks are not actual Pine runtime proof or profitability proof.

### Course/payment/indicator entitlement — PR #46
- Draft PR: `feat/indicator-membership-9999-365d`, based on the course release candidate branch.
- Adds isolated product terms:
  - Course ₹999 / 85 days -> `course_access`
  - Bullseye India Indicator ₹9,999 / 365 days -> `indicator_access`
- Adds server-owned pricing and duration, a dedicated indicator checkout flag, JWT-protected own-entitlement endpoint, admin reconciliation RPCs, customer messaging and a manual TradingView invite note.
- Disposable PostgreSQL suite verifies first issue, renewal, 365-day admin grant, cross-product separation and browser-role denial.
- Latest verified checks on the PR head:
  - TRC20 Payment Checks run #128: PASS.
  - Edge Function Checks run #162: PASS.
  - Launch Page Checks run #240: PASS.
  - Admin Course Access run #217: PASS.
  - Daily Course Integrity Watch run #203: PASS.
- None of these changes have been applied to hosted production. Checkout remains closed by default.

### Course release — PR #36
- The release branch has 168 commits ahead and 4 commits behind `main` (last inspected).
- Its eight earlier course/payment/edge/security checks passed on the then-current head.
- It must be reconciled with current `main` and its checks rerun before merge. Do not merge a diverged release branch.

## Live Supabase read-only audit

Project: `kjhdcpjztuzpysdauqdz`; project status ACTIVE_HEALTHY.

- 11 lessons exist and all 11 are marked published.
- Six course/payment Edge Functions are active.
- One active, verified course entitlement was present at audit time.
- Payment orders, payment transactions and unresolved payment-review rows were zero at audit time.
- `quizzes` and `quiz_questions` contained zero rows; live `grade-quiz` uses a server-side hardcoded answer-key module for lessons 1–11. Before sale, owner must do one signed-in staging pass across all lesson quiz UI screens and confirm their five choices align with server grading.
- Payment tables have RLS and no browser-role table access; course progress writes are server-side only.
- Security advisor warns that selected SECURITY DEFINER admin/certificate RPCs are executable by authenticated callers; their definitions check admin ownership or auth.uid and have pinned search_path. Keep these permissions under review; do not broaden them.
- No live indicator entitlement table existed during this read-only audit. PR #46 supplies it only as a draft migration.

## Content factory — separate repository

Repository: `foryourtravel17-alt/ai-trending-content-factory`.

- The repository is currently private per the latest owner-controlled status; previously downloaded forks/clones/caches cannot be recalled by changing visibility.
- Latest `data/state.json` audit: 286 records total; 265 expired, 13 generated, 3 pending approval, 4 top-level published records and 1 publish_failed. 249 private Telegram approval DMs are recorded as sent; they are not 249 public posts.
- The three current pending-approval education drafts are from 12 November 2026. Keep them pending until the owner approves the content.
- Instagram history contains 10 failures with older Meta API HTTP 400 records (mostly GraphMethodException code 100/subcode 33; one OAuth code 190) and 4 successful status records. Those older failures do not prove today's token state; a fresh owner-side Meta permission/token/account check is needed before Instagram automation can be considered live.
- PR #87 scheduled public auto-publishing conflicts with the owner approval policy; keep it draft and do not merge. PR #88 is a development copy of the commercial indicator and must not become the commercial source. PR #89 stale-candle safe-skip and PR #84 approval-matrix documentation remain separate draft changes until their own review/CI.
- Current market generation uses `HUMAN_APPROVAL=true` and `GENERATE_ONLY=true` before private Telegram approval. Public Instagram publishing is not approved by this handoff.

## Owner's consolidated manual release checklist

1. **Review the final PRs:** PR #36 course release, PR #45 indicator source, PR #46 indicator membership. Keep them draft until all PRs target reconciled bases and the owner approves.
2. **Reconcile PR #36 with main:** GitHub shows it 4 commits behind. Use the PR's Update branch action only after reviewing conflicts; then rerun every check. Do not merge until it is green.
3. **Run one staging course acceptance pass:** create a test student; sign in; open each of the 11 lessons; complete its five-question quiz; confirm server rejects a user without verified course access for paid lessons; verify a student cannot directly write lesson progress or read answer keys. Use only disposable test accounts.
4. **Review the indicator historical evidence:** export fixed historical candles from TradingView for a small representative set (RELIANCE, HDFCBANK, TCS, NIFTY, BANKNIFTY) on 15m and 1h. Compare completed-bar signal time, direction, entry, stop and target against the reference engine; use Bar Replay/forward observation for repainting. No real trades.
5. **Approve the indicator product contract:** confirm ₹9,999 / 365 days, exact feature list, risk disclaimer, refund and support terms. Keep course ₹999 / 85 days distinct.
6. **Configure staging only:** after code review, apply the additive migration to a disposable/staging Supabase project, deploy the indicator-access/order functions there, and test with synthetic orders. Do not send real USDT. Keep `USDT_CHECKOUT_ENABLED=false` and `INDICATOR_CHECKOUT_ENABLED=false` on production until owner/accountant sign-off.
7. **Meta / Instagram:** owner verifies the current Instagram professional account ID, correct Page linkage, token expiry and required publishing permissions, then replaces only the canonical GitHub secret in Settings → Secrets and variables → Actions. Re-run a controlled draft/publish check only after owner approval. Never paste tokens into chat or code.
8. **TradingView customers:** after independently verified payment, owner manually grants the customer's TradingView username invite-only access; record the 365-day expiry and manually remove/extend access on expiry.
9. **Final release approval:** owner/accountant approves payment instructions, legal/tax treatment and refund terms; owner explicitly approves PR merges, production migration/function deploy, checkout enable flags and any public social post.

## Must remain disabled until release approval
- Production database migration and Edge Function deployment.
- `USDT_CHECKOUT_ENABLED`, `INDICATOR_CHECKOUT_ENABLED`, and premium checkout flags.
- Public TradingView script publication.
- Scheduled public Telegram/Instagram auto-publishing.
- Any broker execution or real-money trading tests.
