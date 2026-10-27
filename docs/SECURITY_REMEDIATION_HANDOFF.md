# Security remediation handoff — 2026-10-27

## Work completed in this PR

- Adds a small, repeatable migration to pin `search_path` to the empty string for all six SECURITY DEFINER functions found in the live `public` schema.
- Revokes direct execution grants on the signup trigger and RLS event-trigger helpers.
- This migration is additive and does not alter student data, policies, course access, payment state, or deployments.
- **Not applied to the live database.** A green GitHub check does not apply SQL.

## Verified live risks that remain open

### P0 — Student-controlled quiz scores and completion flags

The live RLS policies permit authenticated users to insert their own `quiz_attempts` rows and insert/update their own `lesson_progress` rows. The checks establish ownership of `user_id`, but do not verify `score`, `passed`, `quiz_passed`, `completed`, or `progress_percent`. The current HTML pages grade quizzes in browser JavaScript and submit these fields directly. A user can modify browser requests and potentially forge passing attempts/completion. `issue_certificate(uuid)` trusts the stored progress flags, so certificate eligibility is affected.

**Required full fix:** move authoritative grading and progress writes into a trusted Supabase Edge Function or carefully designed database RPC; verify the caller's JWT and active course entitlement; keep answer keys server-side; calculate scores on the server; write attempts/progress only from the trusted function; then revoke direct student INSERT/UPDATE grants and remove the student INSERT/UPDATE policies only after all deployed clients use the trusted path. Add tests for wrong answers, forged score/passed flags, cross-user writes, expired access, and unauthorized certificate attempts.

Do not revoke those grants first: current lesson pages depend on direct writes and would stop saving progress.

### P0 — Static paid lesson files

Lesson HTML and any PDF/PPTX assets present in the public static site/repository are directly retrievable. Client-side redirects and `robots.txt` do not enforce paid access. Do not activate paid checkout until paid material is served from private storage or authenticated server-side routes.

### P1 — Schema PRs conflict

- PR #14: https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/14 — compatibility script, normalized `lesson_id/quiz_id`, lesson seeding, policy/grant changes; draft and not applied.
- PR #27: https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/27 — promotes `(user_id, lesson_number)` to the primary key and drops duplicate policies; draft and not applied.

They are not interchangeable. PR #14 preserves the normalized `(user_id, lesson_id)` primary key and adds a unique compatibility index for `(user_id, lesson_number)`; PR #27 makes `(user_id, lesson_number)` the primary key. Choose one model after confirming all deployed clients and existing rows. Do not apply both scripts.

### P1 — Course content quality

Lessons 3–10 still include generic/placeholder educational copy and overly easy questions. These need a substantive educational review before selling the course.

### P1 — Cloudflare build-token failure

Cloudflare dashboard access is owner-only in this workflow; this PR does not change deployment credentials or deploy. The latest exact failing build log and token permissions must be reviewed in Cloudflare. Never paste token values into chat.

## Verified item now green

PR #28 checks both extensionless and `.html` unknown routes; GitHub Actions run #45 passed on commit `b2fe973`. This validates the check, not a production deployment triggered by the PR.

## Owner-only release checklist

1. Review and apply this migration in a test/staging database first; verify all SECURITY DEFINER functions show `search_path=""`.
2. Back up Supabase and resolve PR #14 vs #27 into one canonical schema migration.
3. Implement and deploy trusted quiz grading/progress writes; test with a dedicated test account.
4. Only after client migration succeeds, revoke direct progress/attempt writes and remove the old permissive policies.
5. Protect paid lesson assets before enabling payments.
6. Review Cloudflare's latest failed build log and token permissions in the dashboard; do not share token values.
7. Manually verify signup/email confirmation, course entitlement, lesson quiz, dashboard progress, and certificate gating.
8. Rewrite and proofread Lessons 3–10 before course sale.

No production SQL, secrets, payments, or deployments were changed by this PR.
