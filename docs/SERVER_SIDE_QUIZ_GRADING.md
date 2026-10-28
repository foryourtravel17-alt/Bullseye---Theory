# Server-side quiz grading and lesson completion

## Current implementation in PR #32

All eleven lesson HTML pages load `lesson-secure-client.js`. The shared client calls the `grade-quiz` and `complete-lesson` Edge Functions. Browser answer keys and direct browser INSERT/UPSERT writes for quiz attempts and lesson progress have been removed from the lesson HTML.

The grading implementation lives in `supabase/functions/grade-quiz/grading.ts`; contract tests import that module rather than maintaining a duplicate grader.

## Request contract

The signed-in browser calls `sb.functions.invoke("grade-quiz", { body: { lesson_number, answers } })`, with five selected answer strings. The function derives the user from the verified JWT, checks active, payment-verified and unexpired course access, grades against server-held answer keys, saves the attempt and updates progress on a pass. The service-role key is read only by the Edge Function.

The browser calls `complete-lesson` with `lesson_number`; the function requires authenticated, eligible course access and a persisted passing attempt for that lesson before saving completion.

## CI evidence

The latest observed CI runs for PR #32 passed:
- Edge Function Checks (Deno type-check, grading contract tests, static migration guard): https://github.com/foryourtravel17-alt/Bullseye---Theory/actions/runs/40625904819
- Launch Page Checks: https://github.com/foryourtravel17-alt/Bullseye---Theory/actions/runs/40625904862
- Admin course access checks: https://github.com/foryourtravel17-alt/Bullseye---Theory/actions/runs/40625904817
- Daily Course Integrity Watch: https://github.com/foryourtravel17-alt/Bullseye---Theory/actions/runs/40625904855

These are CI checks, not staging or production integration tests.

## Staging checklist — still required

- [ ] Provision/use a separate staging Supabase project; do not test by deploying to the current live project.
- [ ] Deploy both functions to staging with server-side environment variables; keep gateway JWT verification enabled.
- [ ] Configure `ALLOWED_SITE_ORIGIN` to the exact staging website origin.
- [ ] Signed-out and invalid JWT requests are rejected.
- [ ] Invalid lesson number or malformed/missing answers are rejected.
- [ ] Inactive, unpaid and expired access is rejected.
- [ ] Confirm 4/5 passes and 3/5 fails for every lesson.
- [ ] Forged `score`, `passed`, or `user_id` request fields cannot affect grading or write to another account.
- [ ] Attempts and progress belong only to the authenticated user.
- [ ] Retaking a quiz does not erase existing lesson completion.
- [ ] Completion requires a persisted passing attempt for the same lesson.
- [ ] Validate preflight/CORS and database failure behavior.
- [ ] Verify actual staging schema and upsert conflict key; reconcile schema PRs #14/#27 before migration.
- [ ] Content owner reviews all eleven answer keys before selling the course.

## Release safety

Do not revoke direct student write permissions until staging tests prove every migrated page works. Do not apply production SQL, deploy functions to production, or merge this draft solely on the basis of CI success.
