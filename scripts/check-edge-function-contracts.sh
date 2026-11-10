#!/usr/bin/env bash
# Free, no-secrets CI contract checks. These are source guards, not a substitute for live staging.
set -euo pipefail

grade="supabase/functions/grade-quiz/index.ts"
complete="supabase/functions/complete-lesson/index.ts"
client="lesson-secure-client.js"

need() {
  local file="$1" pattern="$2" label="$3"
  if ! grep -Eq "$pattern" "$file"; then
    echo "FAIL: $label ($file)"
    exit 1
  fi
  echo "PASS: $label"
}

for file in "$grade" "$complete"; do
  need "$file" 'req\.method === "OPTIONS"' "handles CORS preflight"
  need "$file" 'req\.method !== "POST"' "rejects non-POST requests"
  need "$file" 'Authorization' "requires authorization header"
  need "$file" 'auth\.getUser\(\)' "validates caller JWT"
  need "$file" 'SUPABASE_SERVICE_ROLE_KEY' "uses server-only service role env"
  need "$file" 'from\("course_access"\)' "checks course entitlement"
  need "$file" 'payment_verified' "requires verified payment"
  need "$file" 'expires_at' "checks entitlement expiry"
done

need "$grade" 'normalizeAnswers\(' "validates submitted quiz answers"
need "$grade" 'gradeAnswers\(' "uses shared server-side grader"
need "$grade" 'from\("quiz_attempts"\)\.insert' "persists quiz attempts server-side"
need "$grade" 'from\("lesson_progress"\)\.upsert' "persists passing progress server-side"
need "$complete" 'from\("quiz_attempts"\)' "requires a persisted quiz attempt"
need "$complete" 'eq\("passed", true\)' "requires a passing quiz attempt"
need "$complete" 'from\("lesson_progress"\)\.upsert' "persists completion server-side"
need "$client" 'functions\.invoke\("grade-quiz"' "client invokes grading endpoint"
need "$client" 'functions\.invoke\("complete-lesson"' "client invokes completion endpoint"


# Course progress integrity and SECURITY DEFINER hardening are draft migrations only.
progress_key="supabase/migrations/20261102170527_repair_course_progress_key_and_policy_duplicates.sql"
definer_search_path="supabase/migrations/20261102170530_pin_security_definer_search_path.sql"
need "$progress_key" 'where user_id is null or lesson_number is null' "blocks progress PK migration on null key fields"
need "$progress_key" 'having count\(\*\) > 1' "blocks progress PK migration on duplicate user/lesson rows"
need "$progress_key" 'primary key using index lesson_progress_user_lesson_number_uidx' "promotes the existing upsert index to a primary key"
need "$definer_search_path" "set search_path = ''" "pins SECURITY DEFINER functions to an empty search_path"
need "$definer_search_path" 'auth[.]uid[(][)]' "schema-qualifies auth.uid in is_admin"
need "$definer_search_path" 'as [$]function[$]' "uses a valid PostgreSQL dollar-quote delimiter"
need "$definer_search_path" 'revoke all on function public[.]handle_new_student' "revokes direct execution of trigger helper"

# Quiz answer keys are stored in public.quiz_questions; browser roles must not read them.
answer_policy="supabase/migrations/20261102170551_restrict_quiz_answer_key_access.sql"
need "$answer_policy" 'drop policy if exists "Authenticated users can view quiz questions"' "removes broad authenticated quiz-question policy"
need "$answer_policy" 'create policy "Admins can view quiz questions"' "restricts quiz-question reads to admins"
need "$answer_policy" 'using \(\(select public\.is_admin\(\)\)\)' "checks admin role for quiz-question reads"
need "$answer_policy" 'revoke all on table public\.quiz_questions from anon' "revokes anonymous quiz-question access"
need "$answer_policy" 'revoke all on table public\.quiz_questions from public' "revokes inherited public quiz-question access"

# Authoritative course state must only be written by trusted Edge Functions.
progress_write="supabase/migrations/20261104190000_lock_course_progress_writes_to_edge_functions.sql"
need "$progress_write" "drop policy %I on %I[.]%I" "removes browser-role INSERT/UPDATE/DELETE policies dynamically"
need "$progress_write" "revoke insert, update, delete" "revokes direct authenticated writes to lesson progress"
need "$progress_write" "grant select, insert, update on table public[.]lesson_progress to service_role" "grants trusted course progress writes to service_role"
need "$progress_write" "grant select, insert on table public[.]quiz_attempts to service_role" "grants trusted quiz attempt writes to service_role"
need "$progress_write" "grant usage, select on sequence public[.]quiz_attempts_id_seq to service_role" "grants trusted quiz attempt identity sequence usage"

need "$progress_write" "create or replace function public[.]issue_my_certificate" "adds a student-owned certificate claim function"
need "$progress_write" "caller_id := auth[.]uid[(][)]" "derives certificate identity from the authenticated session"
need "$progress_write" "grant execute on function public[.]issue_my_certificate[(][)] to authenticated" "allows authenticated students to claim only their own certificate"

for file in supabase/functions/grade-quiz/index.ts supabase/functions/complete-lesson/index.ts; do
  need "$file" 'bullseye-theory-secure-preview[.]onrender[.]com' "allows the approved secure Render preview origin"
  need "$file" 'ALLOWED_SITE_ORIGINS' "supports an explicit additional-origin allowlist"
  need "$file" 'Vary' "varies responses by request origin"
  need "$file" 'Origin not allowed' "rejects unapproved browser origins"
done

echo "PASS: free static edge-function contract checks. Live auth/database behavior still requires staging."
