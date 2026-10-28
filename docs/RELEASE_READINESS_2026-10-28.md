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
