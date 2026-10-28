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

echo "PASS: free static edge-function contract checks. Live auth/database behavior still requires staging."
