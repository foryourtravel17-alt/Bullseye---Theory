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

# Verify admin-only RPC protections and frontend wiring.
grep -Fq 'create or replace function public.admin_list_course_students' "$admin_migration" || fail "admin student-list RPC missing"
grep -Fq 'create or replace function public.admin_set_course_access' "$admin_migration" || fail "admin access RPC missing"
grep -Fq 'if not public.is_admin()' "$admin_migration" || fail "admin authorization guard missing"
grep -Fq 'revoke all on function public.admin_list_course_students() from public, anon' "$admin_migration" || fail "admin list RPC revoke missing"
grep -Fq 'grant execute on function public.admin_list_course_students() to authenticated' "$admin_migration" || fail "admin list RPC authenticated grant missing"
grep -Fq 'admin_list_course_students' admin.html || fail "admin UI list RPC wiring missing"
grep -Fq 'admin_set_course_access' admin.html || fail "admin UI access RPC wiring missing"

# Verify all published lesson pages retain the access/expiry/progress gates.
lesson_count=0
for lesson in lesson-[0-9]*.html; do
  [[ -f "$lesson" ]] || continue
  test -s "$lesson" || fail "empty lesson page: $lesson"
  grep -Fq 'course_access' "$lesson" || fail "$lesson missing course_access gate"
  grep -Fq 'payment_verified' "$lesson" || fail "$lesson missing payment_verified gate"
  grep -Fq 'expires_at' "$lesson" || fail "$lesson missing expiry gate"
  grep -Fq 'lesson_progress' "$lesson" || fail "$lesson missing lesson_progress wiring"
  lesson_count=$((lesson_count + 1))
done
(( lesson_count >= 11 )) || fail "expected at least 11 lesson pages; found $lesson_count"

echo "PASS: manual enrollment policy, SQL integrity markers, admin RPC guards, and $lesson_count lesson access gates."
