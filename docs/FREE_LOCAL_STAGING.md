# Free local integration testing — Bullseye Theory

This is the no-paid-staging path. It uses the Supabase CLI and Docker on your own laptop; it does not create a hosted Supabase project and does not deploy anything.

## 1. Prerequisites
Install Docker Desktop and the Supabase CLI. Start Docker Desktop, then open a terminal in the repository folder.

## 2. Start a disposable local Supabase stack
```bash
supabase start
```
This starts local services on your laptop. It may download container images and use disk/CPU, but does not create a hosted Supabase bill.

## 3. Schema gate — do not skip
Before running the Edge Functions, inspect the current SQL migrations and confirm these exist and match the code:
- `course_access(user_id, is_active, payment_verified, expires_at)`
- `quiz_attempts(user_id, lesson_number, score, passed)`
- `lesson_progress(user_id, lesson_number, quiz_passed, progress_percent, completed, completed_at)`
- a unique constraint on `lesson_progress(user_id, lesson_number)`

If the repository does not contain authoritative migrations for these tables, STOP. Do not create guessed tables or import production data. Have the schema owner provide the approved schema or add a reviewed local-only fixture migration first.

## 4. Configure local function secrets
Use only disposable local test values. Never paste production service-role keys into GitHub or commit them.
```bash
supabase secrets set --env-file supabase/.env.local
```
Create `supabase/.env.local` locally (do not commit it) with local values for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `ALLOWED_SITE_ORIGIN`. Get the first three from the local `supabase start` output; use a local origin only for local browser testing.

## 5. Serve functions locally
```bash
supabase functions serve grade-quiz --env-file supabase/.env.local
supabase functions serve complete-lesson --env-file supabase/.env.local
```
Run each command in a separate terminal. Keep JWT verification enabled.

## 6. Current automated tests
GitHub Actions runs Deno type-checking, quiz grading contract tests, static checks across all 11 lesson pages, and free source-contract checks. These do not substitute for the end-to-end tests above.

## Draft migration inventory — 2 Nov 2026

PR #35 now carries three reviewed migration drafts in timestamp order:
- 20261027153000_repair_course_progress_key_and_policy_duplicates.sql — checks for null/duplicate keys, then promotes the existing unique (user_id, lesson_number) index to the primary key.
- 20261027180000_pin_security_definer_search_path.sql — pins the SECURITY DEFINER function search_path and uses a valid $function$ delimiter with schema-qualified auth.uid().
- 20261102180000_restrict_quiz_answer_key_access.sql — removes broad authenticated access to quiz answer keys and restricts question reads to admins.

Read-only live check on 2 Nov 2026: lesson_progress has 0 rows, no primary key, and the expected unique index on (user_id, lesson_number). This supports the guarded migration design, but does not replace local integration testing. No migration has been applied to the live project. The 85-day migration must be run in the disposable local Supabase stack and reviewed before it is ever considered for production.

## Safety
- Do not use the live project ref `kjhdcpjztuzpysdauqdz` as local or staging.
- Do not deploy with `supabase functions deploy`.
- Do not run production migrations.
- Do not use real student/payment data in local tests.
- Keep PR #35 draft until local schema and function integration tests pass. PR #32 is consolidated into #35; do not merge #32 separately.
