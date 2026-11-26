# Course asset entitlement gate — draft implementation

## Problem being closed

The site uses Cloudflare static assets. A browser-side redirect in a lesson page is not an access-control boundary: lesson HTML can be requested directly by URL. Paid course content must be checked before Cloudflare returns asset bytes.

## Current draft architecture

- wrangler.toml sets main = "./_worker.js" and assets.run_worker_first = true. Every request passes through the Worker before static asset delivery.
- The Worker passes ordinary public website assets to the ASSETS binding after stripping cookies and bearer headers.
- Requests for /lesson-1 through /lesson-11 and lesson resource paths are intercepted before the asset binding.
- After login, auth.js and dashboard.html exchange the Supabase access token for a short-lived HttpOnly; Secure; SameSite=Lax cookie. JavaScript cannot read this cookie.
- The Worker validates the token against Supabase Auth (/auth/v1/user), then checks course_access using the user's own JWT through the Data API. Both is_active and payment_verified must be true; an expiry must be in the future.
- Entitlement is checked on every protected asset request. The asset response is private, no-store and varies by cookie.
- No service-role key is present in the Worker or browser. The publishable key is public configuration; authorization comes from the validated user's JWT and RLS.
- Logout clears the HttpOnly cookie.

## Automated checks

- scripts/test-cloudflare-entitlement-worker.ts covers protected-path matching, cookie parsing, expiry handling, missing-cookie denial, active session exchange, and unpaid access denial.
- scripts/check-cloudflare-entitlement-gate.sh checks Worker-first configuration, auth integration and cookie controls.
- The Edge Function CI workflow runs these tests alongside existing Deno grading and lesson-client tests.

## Important limitations and release gates

1. This is a source-only draft. It has not been deployed to Cloudflare or tested against the live hostname.
2. Verify the full set of lesson-related HTML, PDF, PPTX, video and workbook URLs. The Worker protects the lesson-* namespace and the /lessons, /course-assets, /downloads, /pdf, /pptx and /videos directories. If course files use another URL prefix, add it to the matcher before launch.
3. Verify Supabase RLS allows a user to select only their own course_access row. The Worker deliberately uses the user's JWT, not a service-role key.
4. Run browser tests for login, signup, refresh-token rotation, logout, active access, inactive access, expired access, direct lesson URLs, and attempts to fetch a lesson asset without a cookie.
5. Test cache behavior at the Cloudflare edge. Protected responses must never be shared or cached publicly.
6. Verify the site works with the current Cloudflare Workers build/deployment pipeline before merging. No production deployment is authorized by this PR.
7. This Worker does not protect lesson content already copied, downloaded or captured by an entitled student. It prevents unauthorised HTTP retrieval from the site; it cannot provide DRM.

## Safe rollout

Keep this PR draft. First run GitHub CI, then test in a disposable preview Worker using non-production Supabase credentials and test accounts. Do not attach the live production project or deploy to the canonical site until preview behavior is independently verified and the owner explicitly approves production rollout.
