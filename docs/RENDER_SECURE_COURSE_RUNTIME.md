# Secure Node course runtime (Render preview alternative)

This is an alternative to the Cloudflare Worker runtime for a non-production preview. It is not deployed by this change.

## Security model

- The Node server serves the repository's public landing/auth/static assets.
- Requests for `lesson-2.html` through `lesson-11.html`, plus course asset directories (`lessons`, `course-assets`, `downloads`, `pdf`, `pptx`, `videos`), are gated server-side.
- The browser posts its existing Supabase access token to `POST /api/course-session`. The server validates it with Supabase Auth, checks the caller's `course_access` row using the caller JWT, and issues a short-lived `HttpOnly; Secure; SameSite=Lax` cookie.
- Each protected request revalidates the cookie JWT and the user's active, payment-verified, unexpired entitlement. Failures are closed (401/403/503); protected responses use `Cache-Control: private, no-store` and `Vary: Cookie`.
- `POST /api/course-session/logout` clears the cookie.
- No service-role key is used by this runtime. Only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are required.

The existing `REELS` bucket is public and is not used for course material. Do not upload course assets there.

## Local validation

Node.js 20 or newer is required. Run `npm test` and `npm start`. Health check: `GET /_health`.

For an entitlement integration test, use a dedicated test account and a known active entitlement. Do not use a real customer or real payment.

## Render preview setup (manual owner action after CI review)

Create a **new Web Service**, not a Static Site, from repository `foryourtravel17-alt/Bullseye---Theory` and branch `feat/render-secure-course-runtime`.

- Runtime: Node
- Root directory: `/`
- Build command: `npm run build`
- Start command: `npm start`
- Health check path: `/_health`
- Environment variables: `SUPABASE_URL` (existing project URL) and `SUPABASE_PUBLISHABLE_KEY` (existing publishable key)
- Do not add a service-role key.
- Free instance is acceptable for preview only; Render free web services sleep when idle, so expect cold starts.
- Do not repurpose `bullseye-theory-marketlab-preview` static site.
- Do not enable checkout, scanner, or production deployment.

Do not create the service until this PR's checks pass and the owner approves the preview URL. Missing Supabase configuration makes the session endpoint fail closed; the public landing pages may still render.

## Required hosted QA before launch

1. Public home, auth, terms, privacy and refund pages load.
2. `/lesson-1.html` loads without entitlement.
3. `/lesson-2.html` through `/lesson-11.html` redirect to sign-in without a session.
4. Authenticated user without active verified entitlement receives 403.
5. Authenticated user with active verified entitlement can load paid lessons.
6. Expired entitlement is denied immediately on next protected request.
7. Encoded/case/path-normalized routes remain protected.
8. Protected responses include `Cache-Control: private, no-store` and `Vary: Cookie`.
9. Logout clears the cookie; replayed cookie is rejected.
10. Direct asset URLs in protected directories are denied without entitlement.

This is a preview architecture only. Do not merge to `main`, deploy production, or enable payments as part of this work.
