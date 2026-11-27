#!/usr/bin/env bash
set -euo pipefail

fail() { echo "FAIL: $1" >&2; exit 1; }

echo "== Bullseye Theory pre-deploy checks =="

# Keep the currently approved manual-enrollment-only policy intact.
bash scripts/check-manual-course-activation.sh

# Validate the 11-lesson certificate threshold and core SQL migration markers.
admin_sql="supabase/admin-production.sql"
lesson_migration="supabase/migrations/20261025030000_align_11_lesson_schema.sql"
admin_migration="supabase/migrations/20261026180000_admin_course_access_upsert.sql"

for file in "$admin_sql" "$lesson_migration" "$admin_migration"; do
  test -s "$file" || fail "required SQL file missing or empty: $file"
done

if grep -nE '^[[:space:]]*as \$[[:space:]]*$' "$admin_sql" "$lesson_migration" "$admin_migration"; then
  fail "malformed single-dollar PL/pgSQL function delimiter detected"
fi

grep -Fq 'as $$' "$admin_sql" || fail "admin-production.sql missing function delimiter"
grep -Fq 'as $$' "$lesson_migration" || fail "lesson migration missing function delimiter"
grep -Fq '$$;' "$admin_sql" || fail "admin-production.sql missing function terminator"
grep -Fq '$$;' "$lesson_migration" || fail "lesson migration missing function terminator"
grep -Fq 'and quiz_passed = true) < 11 then' "$admin_sql" || fail "admin SQL certificate threshold is not 11"
grep -Fq 'and quiz_passed = true) < 11 then' "$lesson_migration" || fail "lesson migration certificate threshold is not 11"

# Parse every inline script in admin.html before deployment. This catches
# browser-blocking SyntaxErrors that an HTTP-only smoke test cannot detect.
node <<'NODE'
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('admin.html', 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(source => source.trim().length > 0);
if (scripts.length === 0) {
  console.error('FAIL: admin.html has no inline JavaScript to validate');
  process.exit(1);
}
scripts.forEach((source, index) => {
  new vm.Script(source, { filename: `admin.html:inline-script-${index + 1}` });
});
console.log(`PASS: parsed ${scripts.length} admin inline JavaScript block(s).`);
NODE

# Verify admin-only RPC protections and frontend wiring.
grep -Fq 'create or replace function public.admin_list_course_students' "$admin_migration" || fail "admin student-list RPC missing"
grep -Fq 'create or replace function public.admin_set_course_access' "$admin_migration" || fail "admin access RPC missing"
grep -Fq 'if not public.is_admin()' "$admin_migration" || fail "admin authorization guard missing"
grep -Fq 'revoke all on function public.admin_list_course_students() from public, anon' "$admin_migration" || fail "admin list RPC revoke missing"
grep -Fq 'grant execute on function public.admin_list_course_students() to authenticated' "$admin_migration" || fail "admin list RPC authenticated grant missing"
grep -Fq 'admin_list_course_students' admin.html || fail "admin UI list RPC wiring missing"
grep -Fq 'admin_set_course_access' admin.html || fail "admin UI access RPC wiring missing"

# Lesson HTML pages intentionally share one security runtime. The paid-course
# entitlement checks live in lesson-secure-client.js, not duplicated in each
# HTML document. Lesson 1 is an explicitly free HTML preview; lessons 2–11
# require active + payment-verified + unexpired course_access in that runtime,
# and the Worker independently protects paid lesson assets.
secure_client="lesson-secure-client.js"
test -s "$secure_client" || fail "shared lesson security runtime missing"
grep -Fq 'from("course_access")' "$secure_client" || fail "shared lesson runtime missing course_access lookup"
grep -Fq 'payment_verified' "$secure_client" || fail "shared lesson runtime missing payment verification"
grep -Fq 'expires_at' "$secure_client" || fail "shared lesson runtime missing expiry check"
grep -Fq 'from("lesson_progress")' "$secure_client" || fail "shared lesson runtime missing lesson_progress wiring"
grep -Fq 'if (lesson !== 1)' "$secure_client" || fail "shared lesson runtime must exempt only the free Lesson 1 preview"

lesson_count=0
for lesson in lesson-[0-9]*.html; do
  [[ -f "$lesson" ]] || continue
  test -s "$lesson" || fail "empty lesson page: $lesson"
  lesson_number="${lesson#lesson-}"
  lesson_number="${lesson_number%.html}"
  grep -Fq 'lesson-secure-client.js' "$lesson" || fail "$lesson missing shared lesson security runtime"
  grep -Fq "data-lesson-number=\"$lesson_number\"" "$lesson" || fail "$lesson has incorrect/missing lesson number binding"
  lesson_count=$((lesson_count + 1))
done
(( lesson_count >= 11 )) || fail "expected at least 11 lesson pages; found $lesson_count"

# Admins must establish the same Worker cookie as paid students before navigating to protected Chart Drills.
grep -Fq 'await syncCourseCookie(session);' dashboard.html || fail "dashboard does not request server-verified protected asset session"
if grep -Fq 'if(active || isAdmin) await syncCourseCookie(session);' dashboard.html; then fail "protected asset session must not depend on client-side admin/profile detection"; fi
grep -Fq 'href="lessons/chart-drills.html"' dashboard.html || fail "Chart Drills dashboard navigation is missing"
test -s lessons/chart-drills.html || fail "Chart Drills page is missing"

# Inventory every static course asset and fail if any paid lesson/download path
# falls outside the Worker entitlement matcher.
node scripts/check-course-asset-protection.mjs

echo "PASS: manual enrollment policy, SQL integrity markers, admin RPC guards, shared lesson entitlement/progress runtime, and $lesson_count lesson page bindings."
