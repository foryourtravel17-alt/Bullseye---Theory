# Bullseye Theory release readiness — 2026-10-28

## Current code and CI status
- Current work: PR #32 — https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/32
- Current head at this update: `e667d5bb1ab07cfc9e66a43dda133438d84c96e9`
- Edge Function Checks: PASS — https://github.com/foryourtravel17-alt/Bullseye---Theory/actions/runs/40625904819
- Launch Page Checks: PASS — https://github.com/foryourtravel17-alt/Bullseye---Theory/actions/runs/40625904862
- Admin course access checks: PASS — https://github.com/foryourtravel17-alt/Bullseye---Theory/actions/runs/40625904817
- Daily Course Integrity Watch: PASS — https://github.com/foryourtravel17-alt/Bullseye---Theory/actions/runs/40625904855
- The Edge Function workflow checked Deno types, the shared grading contract tests, and the static guard for all 11 migrated lesson pages.

## Code changes now present in PR #32
1. Extracted server-held answer keys and grading into `supabase/functions/grade-quiz/grading.ts`; tests import that shared implementation.
2. Added authenticated server-side `grade-quiz` and `complete-lesson` Edge Functions.
3. Migrated all 11 lesson pages to `lesson-secure-client.js`; browser answer keys and direct browser INSERT/UPSERT quiz/progress writes were removed from those lesson HTML files.
4. Added a static CI guard for the lesson migration.
5. Updated the course-integrity workflow to validate the shared access gate instead of requiring duplicate inline access logic in each HTML file.
6. Corrected the configurable CORS fallback to the current site origin, `https://bullseye-theory.foryourtravel17.workers.dev`.

## What CI does not prove
CI is source-level verification only. It does not prove Edge Functions are deployed, the current database schema matches assumptions, browser authentication works end to end, payments grant access correctly, or production is safe to switch over.

## Remaining release blockers
1. No separate staging Supabase project is currently listed in the connected Supabase account; only the existing project `kjhdcpjztuzpysdauqdz` is visible. Do not use it as staging because it is the live project.
2. Deploy both functions to a separately provisioned staging project and configure server-side `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and exact `ALLOWED_SITE_ORIGIN`. Keep JWT verification enabled.
3. Run staging tests for signed-out/invalid JWT, active/unpaid/expired access, all 11 lessons, 4/5 pass threshold, forged client fields, cross-user attempts, retakes after completion, CORS/preflight, and database failures.
4. Confirm schema compatibility: `quiz_attempts.lesson_number/passed`; `lesson_progress.lesson_number`; unique `(user_id, lesson_number)`; and the `course_access` fields.
5. Review the educational accuracy of all 11 answer keys before course sales.
6. Resolve schema conflicts among PR #14, #27, and related SQL before any database migration.
7. Only after staging proves the new client path works, prepare and review a separate least-privilege migration to remove direct student writes. Do not apply it to production without explicit authorization.
8. PR #32 remains draft until staging tests and schema review are complete. Do not merge or deploy production merely because CI passes.

## Production safety
No production SQL/migration was applied, no Edge Function was deployed, no secret was changed, and no live content was published during this work.


## Additional live-schema finding — quiz answer-key exposure (2 Nov 2026)

A read-only audit of the connected live Supabase project found that `public.quiz_questions` has an authenticated SELECT policy named `Authenticated users can view quiz questions`. The table includes a `correct_answer` column. This means a signed-in student may be able to query answer keys directly through the Data API even after the lesson pages move grading to the Edge Function.

Draft remediation added to this PR:
- `supabase/migrations/20261102180000_restrict_quiz_answer_key_access.sql` removes the broad authenticated SELECT policy and grants row visibility only to admins via `public.is_admin()`.
- `scripts/check-edge-function-contracts.sh` now checks that the answer-key restriction migration remains present.
- This migration is draft-only and has **not** been applied to the live project. Verify in a disposable local Supabase stack or separate staging project first.

## Additional live schema finding — course progress primary key

The live `public.lesson_progress` table has zero rows and no primary key. It includes both `lesson_id` and `lesson_number`. The PR #27 migration safely checks for nulls/duplicates before promoting `(user_id, lesson_number)` to the primary key, which matches the current secure Edge Function upsert conflict target. Do not apply PR #14's alternate `(user_id, lesson_id)` primary-key model alongside PR #27. Reconcile and choose one schema model; for the current PR #32 client contract, PR #27's `lesson_number` key is the compatible choice.

## Security migration correction

Reviewing PR #29 against the live function definition found that `public.is_admin()` calls `auth.uid()` without schema qualification. Pinning its `search_path` to the empty string without fixing that call would break the helper. PR #29 now replaces the function body with the schema-qualified `auth.uid()` before applying the empty search path. This is still draft-only; verify the function in staging before any production migration.

## Payment QR readiness update

The owner reports a valid USDT QR is available and the official Indian UPI QR is expected shortly. The existing `payment.html` currently has placeholders for UPI, PayPal and USDT TRC20 and explicitly keeps all methods inactive. Do not assume the available USDT QR is TRC20: verify the exact chain, token contract, destination address and test transaction before displaying it. A QR/screenshot is not proof of settlement. Keep manual admin verification and server-side entitlement activation; do not auto-unlock from a client-supplied receipt. Before accepting USDT for course services, obtain qualified Indian CA/legal advice on VDA tax/TDS, GST, accounting, and any applicable payment/foreign-exchange requirements. The current Income Tax Department guidance on section 194S includes payments for VDA transfers and service consideration in VDA can raise withholding questions; applicability depends on transaction structure and facts. No payment settings or access records were changed.
