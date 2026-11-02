#!/usr/bin/env bash
set -euo pipefail

need() {
  local file="$1" pattern="$2" label="$3"
  if ! grep -Eq "$pattern" "$file"; then
    echo "FAIL: $label ($file)"
    exit 1
  fi
  echo "PASS: $label"
}

need "wrangler.toml" '^main = "./_worker.js"$' "Cloudflare Worker entrypoint is configured"
need "wrangler.toml" '^run_worker_first = true$' "Worker runs before every static asset"
need "wrangler.toml" '^binding = "ASSETS"$' "Static asset binding is configured"
need ".assetsignore" '^_worker\.js$' "Worker source is excluded from public static assets"
need "_worker.js" 'isProtectedCourseAsset\(' "Worker has a protected course asset matcher"
need "_worker.js" 'auth/v1/user' "Worker verifies Supabase user sessions remotely"
need "_worker.js" 'rest/v1/course_access' "Worker checks course entitlement through the Data API"
need "_worker.js" 'payment_verified' "Worker requires independently verified payment"
need "_worker.js" 'HttpOnly; Secure; SameSite=Lax' "Worker uses a protected HttpOnly session cookie"
need "_worker.js" 'Cache-Control.*PRIVATE_CACHE' "Protected content is marked private and non-cacheable"
need "auth.js" 'syncCourseCookie\(data\.session\)' "Login and signup exchange session for course cookie"
need "dashboard.html" 'syncCourseCookie\(session\)' "Dashboard refreshes course cookie for active students"
need "dashboard.html" 'api/course-session/logout' "Dashboard clears course cookie on logout"

need "_worker.js" 'decodeURIComponent' "normalizes encoded asset paths before authorization"
need "_worker.js" 'rows[.]length !== 1' "fails closed when entitlement rows are duplicated"
need "_worker.js" 'responseHeaders[.]set[(]"Vary", "Cookie"[)]' "marks protected cache responses as cookie-varying"

echo "PASS: static course-asset gate contract checks. Runtime behavior is covered by Deno tests; production deployment remains separate."\n\necho "Building Cloudflare Worker locally (dry-run only; no deployment)."\nnpx --yes wrangler@4 deploy --dry-run --outdir /tmp/bullseye-worker-dry-run
