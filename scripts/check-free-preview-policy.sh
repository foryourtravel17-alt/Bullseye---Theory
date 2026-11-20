#!/usr/bin/env bash
set -euo pipefail

grep -Fq 'const freePreviewPage = /^\/lesson-1\.html$/i.test(normalized);' _worker.js
grep -Fq 'if (lesson !== 1)' lesson-secure-client.js
grep -Fq 'if (lesson !== 1 && !active)' supabase/functions/grade-quiz/index.ts
grep -Fq 'if (lessonNumber !== 1 && !active)' supabase/functions/complete-lesson/index.ts
grep -Fq 'num===1' dashboard.html
grep -Fq 'ACCESS EXPIRED' dashboard.html
grep -Fq '85-day course access expired' dashboard.html

if grep -Eq '\(!access\.expires_at \|\|' _worker.js lesson-secure-client.js dashboard.html supabase/functions/grade-quiz/index.ts supabase/functions/complete-lesson/index.ts; then
  echo "FAIL: a missing expiry is still treated as lifetime access"
  exit 1
fi

echo "PASS: lesson 1 remains the free preview; lessons 2–11 require a verified, unexpired 85-day entitlement."
