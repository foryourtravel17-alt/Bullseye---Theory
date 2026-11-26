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

## 4. Configure local function environment — local only
Create `supabase/.env.local` on your own machine and keep it out of Git. Use only disposable credentials printed by the local `supabase start` command. Set the local `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and a local `ALLOWED_SITE_ORIGIN` in that file.

**Never run `supabase secrets set` for this local workflow.** That command writes secrets to the linked hosted Supabase project; it is not a local environment-file operation. Never put production service-role keys in this file, GitHub, or a commit.

Before continuing, verify that `supabase/.env.local` is ignored by Git:
```bash
git check-ignore supabase/.env.local
```
If the command prints no matching path, STOP and add the file to the local Git ignore rules before creating it.

## 5. Serve functions locally
Run each command in a separate terminal:
```bash
supabase functions serve grade-quiz --env-file supabase/.env.local
supabase functions serve complete-lesson --env-file supabase/.env.local
```
These commands serve the functions against the local stack. Keep JWT verification enabled. Do not run `supabase functions deploy`.

## 6. Current automated tests
GitHub Actions runs Deno type-checking, quiz grading contract tests, static checks across all 11 lesson pages, and free source-contract checks. These do not substitute for the end-to-end tests above.

## Live migration history snapshot — 4 Nov 2026

A read-only Supabase migration-history check on 4 Nov 2026 returned 15 applied migrations. The eight latest entries recorded on 2 Nov 2026 are:
- 20261102170527 — repair_course_progress_key_and_policy_duplicates
- 20261102170530 — pin_security_definer_search_path
- 20261102170543 — add_automatic_trc20_payment_orders
- 20261102170551 — restrict_quiz_answer_key_access
- 20261102170553 — revoke_public_table_maintenance_rights
- 20261102170555 — set_course_access_validity_85_days
- 20261102170710 — add_course_foreign_key_indexes_and_rls_initplan_fixes
- 20261102170802 — add_explicit_deny_policies_for_payment_tables

This is migration-history evidence only; it does not replace schema inspection or local integration tests. Do not re-apply these migrations to production. Use the repository's checked-in migrations to build a disposable local database, and compare the resulting schema before running function tests. Never use production student/payment data in local tests.

## Safety
- Do not use the live project ref `kjhdcpjztuzpysdauqdz` as local or staging.
- Do not use `supabase secrets set`, `supabase functions deploy`, or production migrations for local testing.
- Do not use real student/payment data in local tests.
- Keep integrated release PR #47 in draft until local schema/function integration tests and preview browser QA pass. PR #32 is superseded by the consolidated release candidate; do not merge the older PR separately.
