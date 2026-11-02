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
progress_key="supabase/migrations/20261027153000_repair_course_progress_key_and_policy_duplicates.sql"
definer_search_path="supabase/migrations/20261027180000_pin_security_definer_search_path.sql"
need "$progress_key" 'where user_id is null or lesson_number is null' "blocks progress PK migration on null key fields"
need "$progress_key" 'having count\(\*\) > 1' "blocks progress PK migration on duplicate user/lesson rows"
need "$progress_key" 'primary key using index lesson_progress_user_lesson_number_uidx' "promotes the existing upsert index to a primary key"
need "$definer_search_path" "set search_path = ''" "pins SECURITY DEFINER functions to an empty search_path"
need "$definer_search_path" 'auth[.]uid[(][)]' "schema-qualifies auth.uid in is_admin"
need "$definer_search_path" 'as [$]function[$]' "uses a valid PostgreSQL dollar-quote delimiter"
need "$definer_search_path" 'revoke all on function public[.]handle_new_student' "revokes direct execution of trigger helper"

echo "PASS: free static edge-function contract checks. Live auth/database behavior still requires staging."

# Quiz answer keys are stored in public.quiz_questions; browser roles must not read them.
answer_policy="supabase/migrations/20261102180000_restrict_quiz_answer_key_access.sql"
need "$answer_policy" 'drop policy if exists "Authenticated users can view quiz questions"' "removes broad authenticated quiz-question policy"
need "$answer_policy" 'create policy "Admins can view quiz questions"' "restricts quiz-question reads to admins"
need "$answer_policy" 'using \(\(select public\.is_admin\(\)\)\)' "checks admin role for quiz-question reads"
need "$answer_policy" 'revoke all on table public\.quiz_questions from anon' "revokes anonymous quiz-question access"
need "$answer_policy" 'revoke all on table public\.quiz_questions from public' "revokes inherited public quiz-question access"
