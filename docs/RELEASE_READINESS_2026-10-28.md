# Bullseye Theory release readiness — 2026-10-28

## Verified CI evidence
- Workflow: Edge Function Checks
- Run ID: 40624974731
- Commit: ab1269bbaee0135b70cc3d4464aaab6cc1e4a7c7
- Result: success
- Steps confirmed successful: Deno type-check for both Edge Functions; quiz grading contract tests.

Run: https://github.com/foryourtravel17-alt/Bullseye---Theory/actions/runs/40624974731

## Do not overstate this result
The run verifies TypeScript/Deno checks and isolated grading contract tests. It does not verify live Supabase access, JWT gateway settings, database schema compatibility, browser integration, payments, or production deployment.

## Release blockers
1. All eleven lesson pages still use client-side answer keys and/or direct writes to quiz_attempts and lesson_progress. They have not yet been migrated to call grade-quiz and complete-lesson.
2. The current grading test duplicates a simplified grading function instead of importing the exact production grading logic. Refactor grading into a shared pure module and test that module before relying on the tests as regression coverage.
3. The Edge Function CORS policy currently allows all origins; restrict it to approved site origins before public deployment.
4. Explicitly verify JWT enforcement for both functions in a staging Supabase project. Do not add a production project pin to a diagnostic change.
5. Verify schema compatibility in staging: quiz_attempts.lesson_number/passed; lesson_progress.lesson_number; unique conflict key (user_id, lesson_number); course_access fields.
6. Review the answer keys and all quiz questions for lessons 1–11.
7. Migrate all pages and test forged score/user_id/progress, no entitlement, expired entitlement, invalid JWT, 4/5 pass threshold, retry after completion, and database failures.
8. Only after client migration and bypass tests, prepare a separate reviewed migration to revoke direct student write access. Do not apply it to production without explicit approval.
9. Resolve schema conflicts among PR #14, #27, and #30 before applying any migration.
10. Production deploy remains blocked pending staging validation and owner approval.

## Current PRs
- Quiz grading foundation: https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/30
- Secure lesson completion: https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/31

Both remain draft/review-only. Neither has been merged or deployed.
