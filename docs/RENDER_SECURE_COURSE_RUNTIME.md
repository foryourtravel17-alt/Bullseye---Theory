# Secure Node course runtime (Render preview alternative)

This is an alternative to the Cloudflare Worker runtime for a non-production preview. A separate Render preview service has already been created and deployed; this is not production.

## Security model

- The Node server serves the repository's public landing/auth/static assets.
- Requests for `lesson-2.html` through `lesson-11.html`, plus course asset directories (`lessons`, `course-assets`, `downloads`, `pdf`, `pptx`, `videos`), are gated server-side.
- The browser posts its existing Supabase access token to `POST /api/course-session`. The server validates it with Supabase Auth, checks the caller's `course_access` row using the caller JWT, and issues a short-lived `HttpOnly; Secure; SameSite=Lax` cookie.
- Each protected request revalidates the cookie JWT and the user's active, payment-verified, unexpired entitlement. Failures are closed (401/403/503); protected responses use `Cache-Control: private, no-store` and `Vary: Cookie`.
- `POST /api/course-session/logout` clears the cookie.
- No service-role key is used by this runtime. Only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are required.

The existing `REELS` bucket is public and is not used for course material. Do not upload course assets there.

## Local validation

Node.js 20 or newer is required. Run `npm test` and `npm start`. Health check: `GET /_health`.

For an entitlement integration test, use a dedicated test account and a known active entitlement. Do not use a real customer or real payment.

## Preview-to-Supabase browser integration

The secure Render preview uses the same Supabase Edge Functions for quiz grading and lesson completion. Both functions now use a strict CORS allowlist containing the production Cloudflare Worker origin and the approved Render preview origin. Additional exact origins can be configured with `ALLOWED_SITE_ORIGIN` or comma-separated `ALLOWED_SITE_ORIGINS`; unapproved browser origins receive 403. Responses vary by Origin. These function source changes are committed for review but have **not** been deployed to the live Supabase project.

## Authoritative learning-state write protection

A database audit found that authenticated browser roles still had INSERT/UPDATE privileges and RLS policies on `lesson_progress`, plus INSERT on `quiz_attempts`. That would allow a signed-in student to fabricate a passing attempt or mark a lesson complete directly through the Data API, bypassing server-side quiz grading.

Migration `20261104190000_lock_course_progress_writes_to_edge_functions.sql` removes all browser-role write policies on those two tables, revokes browser-role write privileges, preserves student SELECT policies, and grants the minimum required SELECT/INSERT/UPDATE permissions to `service_role` for the trusted `grade-quiz` and `complete-lesson` Edge Functions.

The migration has a disposable-PostgreSQL regression test in `scripts/test-course-progress-security-postgres.sh`. The test verifies browser writes are blocked, student reads remain available, and service-role inserts/updates still work. CI runs this test without changing the live Supabase database. **This migration is committed to the open PR but is not yet applied to the live project.** Apply it only after the PR has been reviewed and the migration deployment is explicitly approved.

The same migration adds `public.issue_my_certificate()`: an authenticated student can claim only their own certificate after all eleven lesson records have both `completed=true` and `quiz_passed=true`. The function checks the student's verified active course record, creates a stable certificate ID once, and does not accept a client-supplied user ID. The certificate page invokes this RPC, loads only the signed-in student's certificate, and provides print / Save as PDF. The dashboard links to it after all eleven lessons are complete.

## Existing Render preview service

The preview service is already created and live:

- Service: `bullseye-theory-secure-preview`
- Service ID: `srv-dblmgiuc6qcc73bmhqo0`
- URL: `https://bullseye-theory-secure-preview.onrender.com`
- Dashboard: `https://dashboard.render.com/web/srv-dblmgiuc6qcc73bmhqo0`
- Plan/region: Free / Singapore
- Branch: `feat/render-secure-course-runtime`
- Auto-deploy: OFF
- Build/start: `npm run build` / `npm start`
- Health check: `/_health`
- Environment variables: `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` only; no service-role key
- Current deployed commit: `92a7e6fb7aa061718fc3c083406cf56c5ded7080`
- Latest hosted unauthenticated security smoke test: PASS on commit `5980cf2cb7b7539d5e5bbf38f759a3941dfbf4f6` (workflow run `41876548990`)

The Render service runs a previously validated server commit; the expanded latest smoke test runs against the hosted URL. The service is not configured to auto-deploy later branch commits.

## Recreating the preview service (only if needed)

Create a **new Web Service**, not a Static Site, from repository `foryourtravel17-alt/Bullseye---Theory` and branch `feat/render-secure-course-runtime`.

- Runtime: Node
- Root directory: `/`
- Build command: `npm run build`
- Start command: `npm start`
- Health check path: `/_health`
- Environment variables: `SUPABASE_URL` (existing project URL) and `SUPABASE_PUBLISHABLE_KEY` (existing publishable key)
- Do not add a service-role key.
- Free instance is acceptable for preview only; Render free web services sleep when idle, so expect cold starts.
- Do not repurpose `bullseye-theory-marketlab-preview` static site.
- Do not enable checkout, scanner, or production deployment.

The service already exists. Do not create a duplicate. Missing Supabase configuration makes the session endpoint fail closed; the public landing pages may still render.

## Hosted QA status and remaining checks

Automated hosted smoke test PASS (workflow run `41876548990`, commit `5980cf2cb7b7539d5e5bbf38f759a3941dfbf4f6`): health endpoint, public Lesson 1, all paid lesson routes unauthenticated, encoded/path-normalized paid routes, protected asset-directory routes, invalid Supabase token rejection, internal repository file blocking, and private/no-store response headers.

Still requires a dedicated authorised test student (no real customer/payment):

1. Authenticated user without active verified entitlement receives 403.
2. Authenticated user with active verified entitlement can load paid lessons.
3. Expired/revoked entitlement is denied on the next protected request.
4. Logout clears the cookie; replayed cookie is rejected.

Also manually confirm public home, auth, terms, privacy and refund pages on a browser before launch. Do not use a real customer account or payment for QA.

This is a preview architecture only. Do not merge to `main`, deploy production, or enable payments as part of this work.
