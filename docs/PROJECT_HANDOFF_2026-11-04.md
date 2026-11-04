# Bullseye Theory — project handoff (4 November 2026)

This document is the current engineering handoff for the 11-lesson Bullseye Theory course. It distinguishes code that is prepared and tested from changes that have **not** been merged or applied to production.

## Project identity

- Repository: `foryourtravel17-alt/Bullseye---Theory`
- Active engineering branch: `feat/render-secure-course-runtime`
- Secure preview: https://bullseye-theory-secure-preview.onrender.com
- Render dashboard: https://dashboard.render.com/web/srv-dblmgiuc6qcc73bmhqo0
- Render service ID: `srv-dblmgiuc6qcc73bmhqo0`
- Supabase project ref: `kjhdcpjztuzpysdauqdz`
- Support: `eyetheorybulls@gmail.com`
- Course: 11 lessons; Lesson 1 is the free preview; Lessons 2–11 require current verified access.
- Course access policy: exactly 85 days from verified activation; a renewal while access is still active extends the current expiry by 85 days.
- Course positioning: educational only, no signal selling, no guaranteed-return or easy-money claims.

## Current pull requests

1. **PR #39 — remove public Pages bypass**  
   https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/39  
   Draft, not merged. Deletes `.github/workflows/deploy-pages.yml`, which previously uploaded the repository root to GitHub Pages. The launch-page guard now fails if that public workflow is reintroduced. Merge this PR into the release branch before any release that publishes the course.

2. **PR #40 — secure Node course runtime and release hardening**  
   https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/40  
   Draft, not merged. Contains the Render preview server, route/asset gate, regression tests, Supabase Edge Function CORS allowlist updates, certificate self-claim flow, and a new database security migration. Latest observed PR head: `18ca0c8fa67ba89164d3d0c9c4ccd6d7924c0c92` at the time of this handoff; always re-check the PR head before reviewing checks.

3. **PR #36 — existing release candidate**  
   https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/36  
   Keep this behind PR #39 and PR #40. It is not a production release approval.

## Hosting and preview

A separate Render **Free** Web Service already exists:

- Name: `bullseye-theory-secure-preview`
- Region: Singapore
- Branch: `feat/render-secure-course-runtime`
- Auto-deploy: OFF
- Build command: `npm run build`
- Start command: `npm start`
- Health check: `/_health`
- Runtime environment variables: `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` only. No service-role key is configured in Render.
- Current deployed preview commit: `4e0951748cec3596d2eddbf1946cbbd83a7787e5` (4 November 2026, 17:50 UTC; Render build and app startup succeeded)
- Because auto-deploy is OFF, later branch commits are not automatically deployed. Trigger a new **preview-only** Render deploy after review and successful checks.

Render Free services can sleep while idle; expect a cold start on the first visit. The existing service is a preview, not the final public production deployment.

## Secure runtime architecture

`server.mjs`:
- Public home/auth/legal pages and the free Lesson 1 page are served normally.
- `lesson-2.html` through `lesson-11.html` and course asset paths (including `/lessons/`, PDFs and PPTX files) are protected server-side.
- The browser exchanges its Supabase access token for a short-lived `HttpOnly; Secure; SameSite=Lax` course cookie.
- The server validates the token with Supabase Auth, then checks the user's `course_access` row using the caller JWT and RLS.
- Active, verified and unexpired entitlement is rechecked on each protected request.
- Protected success/error/redirect responses are private, no-store and vary by cookie.
- Logout clears the course cookie.
- Malformed/encoded paths, traversal, symlinks and internal repository paths are handled fail-closed.
- No service-role key is used by the Node runtime.

Course assets are stored under `lessons/` in the repository. The existing public `REELS` Storage bucket is unrelated and must not be repurposed for paid course files.

## Latest hosted smoke coverage

The hosted smoke script covers:
- `/_health` returns 200.
- Lesson 1 is public.
- Every paid root lesson redirects to sign-in when no course cookie is present.
- Encoded/path-normalized paid routes remain protected.
- Real course PDF and PPTX paths remain protected.
- Internal repository files are not served.
- Invalid Supabase session tokens are rejected.
- Protected redirects/responses use private no-store cache policy and vary by cookie.

The earlier hosted smoke workflow passed on commit `5980cf2cb7b7539d5e5bbf38f759a3941dfbf4f6` (run `41876548990`). Subsequent source edits add asset MIME types, stronger cache assertions, certificate UI, CORS integration and database tests. Do not treat the older successful workflow as validation of the latest PR head. Re-check current Actions status for the exact head commit before merge or deploy.

## Supabase state and critical migration

Live Supabase project status was `ACTIVE_HEALTHY`. Eleven lesson catalogue rows exist and six Edge Functions were active at version 7:
- `grade-quiz`
- `complete-lesson`
- `get-trc20-payment-config`
- `create-trc20-order`
- `get-trc20-order-status`
- `scan-trc20-payments`

A read-only audit found a serious access-control defect in the current database:
- Authenticated browser users still had INSERT/UPDATE access and write policies on `lesson_progress`.
- Authenticated browser users still had INSERT access and a write policy on `quiz_attempts`.
- The `service_role` lacked the table/sequence permissions needed for the server-side grading/completion functions to write quiz attempts and course progress.

This could let a student fabricate their own quiz/completion rows directly through the Data API, while the trusted Edge Functions may not have the permissions needed to record genuine results.

PR #40 now includes:

`supabase/migrations/20261104190000_lock_course_progress_writes_to_edge_functions.sql`

It:
- Removes browser-role INSERT/UPDATE/DELETE/ALL policies from `lesson_progress` and `quiz_attempts`.
- Revokes browser-role table write privileges.
- Preserves student own-row SELECT policies.
- Grants `service_role` the minimum table and identity-sequence permissions needed by `grade-quiz` and `complete-lesson`.
- Adds `public.issue_my_certificate()`, which derives the student from `auth.uid()`, requires active verified unexpired course access, requires all 11 completed+passed lessons, and returns a stable certificate ID.

The migration is **committed to PR #40 but has NOT been applied to the live Supabase database**. Do not run the migration until its exact PR head has passed the disposable-Postgres security test and the owner approves applying the database change.

Regression test:
`scripts/test-course-progress-security-postgres.sh`

It creates a throwaway PostgreSQL schema/roles, seeds intentionally permissive browser policies, applies the migration, asserts browser writes are blocked while own-row reads remain, verifies trusted Edge Function writes still work (including the quiz identity sequence), and verifies the certificate is stable and denied to incomplete/expired users. CI runs this test in a disposable GitHub Actions PostgreSQL service; it must never target the live Supabase database.

## Render-to-Supabase browser integration

The PR updates `grade-quiz` and `complete-lesson` Edge Function sources to allow:
- The Cloudflare Worker course origin.
- The exact Render preview origin.
- Additional explicitly configured origins via `ALLOWED_SITE_ORIGIN` or comma-separated `ALLOWED_SITE_ORIGINS`.

Unapproved Origin values are rejected; responses vary by Origin. These function source updates are in GitHub PR #40 only and have **not** been deployed to Supabase. Deploy them only after the database migration is applied and the review/CI gates pass.

## Certificate flow

- Students can claim only their own certificate through `issue_my_certificate()`.
- Claim requires current verified access and 11 lesson rows where both `completed` and `quiz_passed` are true.
- The database keeps the existing certificate ID stable across repeated visits.
- `certificate.html` displays the verified student's name/ID/date and provides Print / Save as PDF.
- `dashboard.html` shows the certificate link when all eleven lesson records are complete and access remains active.
- This feature depends on the new migration; it is not live until that migration is applied.

## Payment scope — intentionally closed

Payment setup is deferred as requested:
- Checkout remains closed.
- No payment orders exist in the live database at last read-only count.
- No real payment or customer transaction was run.
- The TRC20 scanner remains disabled unless its explicit repository/environment gate is enabled.
- UPI/PayPal and premium Telegram access are not part of the current live course scope.
- Do not enable scanner, checkout or advertise the QR until the owner/accountant completes manual validation and approves launch.

Payment implementation is present behind closed gates, with isolated PostgreSQL tests for strict TRC-20 matching, solidified successful receipts, idempotency, and 85-day expiry/renewal. Its passing CI does not mean payment is enabled or ready to receive funds.

## Cloudflare authentication blocker

Cloudflare preview builds previously failed with Wrangler authentication errors 10000 and 9109 (invalid token). The owner intends to repair the Cloudflare token manually. Never ask for or paste the token into chat. The separate Render preview does not require Cloudflare credentials and is the current test host.

After the token is repaired, re-run a non-production Cloudflare preview build. Do not substitute a production `wrangler deploy` command.

## Release/verification order

1. Review and merge PR #39 into the release branch (only after its checks pass).
2. Rebase/update PR #40 against the updated release branch; verify the PR is mergeable and every required check is green on its exact head SHA.
3. Review `20261104190000_lock_course_progress_writes_to_edge_functions.sql` and its disposable PostgreSQL regression test. Apply it to Supabase only after explicit owner approval.
4. Deploy updated `grade-quiz` and `complete-lesson` functions after the migration is applied and CI passes. Never deploy service-role credentials to browser/Render environment.
5. Trigger a **Render preview-only** deploy (auto-deploy is OFF) and rerun the hosted smoke suite.
6. With the owner on Chromebook, create a dedicated test student and test signup/login/logout, free Lesson 1, unauthorised paid lesson denial, quiz grading, lesson completion, expired/revoked access denial and certificate eligibility. Do not use a real customer account.
7. Owner completes legal/accountant review, Cloudflare token repair if desired, and payment/QR validation later.
8. Only after these gates and explicit release approval should the release branch be merged to `main` and production hosting/payment configured.

## What is not done / do not claim

- PR #39/#40/#36 are not merged.
- New database migration is not applied to live Supabase.
- Updated Edge Functions are not deployed to the live Supabase project.
- The latest branch changes have not been confirmed green by CI yet; check Actions for the current exact PR head.
- The latest code has not yet been redeployed to the Render preview service.
- Authorised paid-student journey has not been tested.
- Cloudflare token is not repaired.
- Checkout and scanner are not enabled; no payment launch has occurred.
- No production deploy/customer launch has occurred.

The product is technically prepared for the next controlled preview/release phase, not yet production-launch-ready.
