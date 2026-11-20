# Manual-Only Course and Indicator Launch Hardening — Implementation Plan

> **For agentic workers:** Execute this plan natively in the isolated GitHub feature branch. Do not merge to main or deploy production.

**Goal:** Secure the Bullseye India analyzer behind verified 365-day Supabase entitlement, preserve manual-only payments, and make the course launch checks repeatable.

**Architecture:** The analyzer browser signs in with Supabase Auth and sends its JWT to the Node server. The server validates access through the existing get-indicator-access Edge Function and fails closed before processing CSV. The admin page uses the existing admin-only indicator access RPCs; payment remains disabled and manually verified.

**Tech Stack:** Node.js 20+, native Node test runner, Supabase Auth and Edge Functions, static HTML/JS, existing GitHub Actions checks.

**Spec:** docs/superpowers/specs/2026-11-16-manual-membership-launch-hardening.md

## Global Constraints

- Course price ₹999 and course access 85 days.
- Premium Telegram price ₹1,999; do not open until duration and deliverables are confirmed.
- Bullseye India Analyzer price ₹9,999 and access 365 days.
- Only 15m and 1h OHLCV analysis; max CSV upload 5 MB; uploaded files remain in memory.
- No service-role key in browser code or Render public environment.
- No payment checkout, QR, wallet display, automated payment verification, or automatic entitlement activation.
- No production migration, Edge Function deployment, Cloudflare production deployment, or PR merge.
- No TradingView Pro/Premium purchase and no alteration of the fixed Bullseye Levels strategy rules.
- Use only permitted user-supplied OHLCV data; do not claim verified free 15m/1h data availability or Pine runtime parity.

## Review Focus

- Missing, malformed, expired, or invalid Supabase session must never reach CSV analysis.
- Missing or unavailable indicator-access function must fail closed with HTTP 503.
- A user with course access but no indicator entitlement must remain blocked from the analyzer.
- A single user with duplicate indicator_access rows must not be granted access.
- Cached payment pages or scripts must not re-enable automatic checkout.
- Indicator entitlement must never be granted by course access or by an unchecked payment-verification flag.

---

### Task 1: Fail-closed analyzer entitlement API

**Files:**
- Modify: indicator/server.mjs
- Modify: indicator/tests/server.test.mjs

**Interfaces:**
- Consumes: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, Authorization: Bearer JWT.
- Produces: GET /api/access and POST /api/analyze-csv guarded by get-indicator-access.
- get-indicator-access response contract: { access_active: boolean, expires_at: string | null, access_days: 365 }.

- [ ] **Step 1: Add integration tests first** for missing token (401), no entitlement (403), active entitlement (200), upstream outage/malformed response (503), and CSV POST denied before parsing when no entitlement exists.
- [ ] **Step 2: Run** "cd indicator && npm test"; confirm the new tests fail because the access routes/guard are missing.
- [ ] **Step 3: Implement** verifyIndicatorAccess(req) using only SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to call "/functions/v1/get-indicator-access"; do not query indicator_access directly from the Node server.
- [ ] **Step 4: Implement** GET /api/access and require the same check before POST /api/analyze-csv reads the request body.
- [ ] **Step 5: Run** "cd indicator && npm test"; all tests must pass.

### Task 2: Member sign-in and fail-closed analyzer UI

**Files:**
- Modify: indicator/indicator.html
- Modify: indicator/server.mjs
- Modify: indicator/tests/server.test.mjs

**Interfaces:**
- Consumes: /supabase-config.js, GET /api/access, POST /api/analyze-csv.
- Produces: sign-in/sign-out state; analyzer controls stay disabled until the server confirms an active entitlement.

- [ ] **Step 1: Add a test** that /supabase-config.js exposes only the Supabase URL and publishable key, never a service-role key.
- [ ] **Step 2: Run** "cd indicator && npm test"; confirm the config endpoint test fails before implementation.
- [ ] **Step 3: Implement** the public config endpoint and the browser Supabase sign-in flow; send the JWT to both access and analysis requests.
- [ ] **Step 4: Keep** CSV analysis disabled when signed out, unentitled, or when the access service is unavailable; show a plain explanation and link to the Bullseye Theory account page.
- [ ] **Step 5: Run** "cd indicator && npm test".

### Task 3: Manual indicator entitlement controls for the owner

**Files:**
- Modify: admin.html
- Test: tests/course-runtime.test.mjs or a focused new Node test file
- Reference: supabase/migrations/20261113140000_add_indicator_membership_365d.sql

**Interfaces:**
- Consumes: admin_list_indicator_members() and admin_set_indicator_access(target_user, make_active, verify_payment, access_expires_at).
- Produces: owner-only 365-day indicator entitlement updates; payment verification is unchecked by default and requires a confirmation prompt.

- [ ] **Step 1: Add a regression test** that the admin page has a separate indicator-access control, defaults verify_payment to false, and requires an explicit confirmation before setting it true.
- [ ] **Step 2: Run** "npm test"; confirm the test fails because the indicator admin controls do not exist.
- [ ] **Step 3: Implement** a separate indicator access panel that loads the admin RPC list and saves only through admin_set_indicator_access; do not add service-role keys to the page.
- [ ] **Step 4: Show** expiry, active state and payment-verified state separately; do not imply that saving a pending/unverified row grants access.
- [ ] **Step 5: Run** "npm test".

### Task 4: Manual-only payment pages and product copy

**Files:**
- Modify: payment.html
- Modify: payment-checkout.js
- Modify: membership.html
- Modify: index.html
- Modify: scripts/check_launch_pages.py
- Test: tests/payment-manual-only.test.mjs

**Interfaces:**
- Consumes: the three separate product plans.
- Produces: a closed payment page with no QR/wallet/order flow; a defensive script that never creates orders or polls payment status.

- [ ] **Step 1: Add a behavior test** that executes payment-checkout.js against a minimal DOM and proves the order button remains disabled and no network/payment function is invoked.
- [ ] **Step 2: Run** "node --test tests/payment-manual-only.test.mjs"; confirm it fails against the current auto-checkout implementation.
- [ ] **Step 3: Replace** the payment page's QR/order UI with a clear enrollment-closed notice; keep course ₹999, premium ₹1,999 planned/closed, and website analyzer ₹9,999/365 days.
- [ ] **Step 4: Replace** payment-checkout.js with a defensive manual-only closed stub; do not call Supabase payment Edge Functions.
- [ ] **Step 5: Update** the index stylesheet cache-busting URL to bullseye-v3.css?v=20261116-1 and ensure product copy does not promise TradingView invite-only access or paid CSV export.
- [ ] **Step 6: Run** "node --test tests/payment-manual-only.test.mjs" and "python scripts/check_launch_pages.py".

### Task 5: Course quiz contract and final release checks

**Files:**
- Create: scripts/validate-course-quizzes.mjs
- Modify: package.json
- Modify: docs/FINAL_LAUNCH_HANDOFF_2026-11-16.md
- Modify: docs/INDICATOR_MEMBERSHIP_365D_RUNBOOK.md
- Test: existing lesson pages and server grading contract

**Interfaces:**
- Consumes: lesson-1.html through lesson-11.html and supabase/functions/grade-quiz/grading.ts.
- Produces: one build-time validator for five questions, correct option values/text, secure-client lesson IDs and server answer keys.

- [ ] **Step 1: Add** the quiz content validator from the reviewed PR #53 implementation and wire npm run validate:course-quizzes into npm run build.
- [ ] **Step 2: Run** "npm run validate:course-quizzes"; all 55 correct-answer mappings must match the lesson UI.
- [ ] **Step 3: Update** the handoff to distinguish code-verified work from owner-only Pine compilation, real-market OHLCV parity, legal review, and production deployment.
- [ ] **Step 4: Run** "npm test", "cd indicator && npm test", "python scripts/check_launch_pages.py", "node scripts/check-payment-checkout-closed-order.mjs", and "node scripts/validate-indicator-entitlement.mjs".
- [ ] **Step 5: Review** all modified files and verify that no production migration, payment activation, Edge Function deploy, or Cloudflare production deploy occurred.

## Release boundary

The branch stays isolated and PR #47 stays unmerged. The owner will receive a concise manual checklist for TradingView Free compilation, staging sign-in/course test, legal terms, and any later production authorization.
