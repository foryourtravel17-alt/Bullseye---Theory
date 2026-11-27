# Chart Drills Admin Entitlement Implementation Plan

> **For agentic workers:** Use the repository's GitHub PR workflow and complete each task with CI evidence before proposing merge.

**Goal:** Let verified admins inspect the existing protected Chart Drills while preserving paid-course and separate indicator entitlements.

**Architecture:** Extend the existing Cloudflare Worker entitlement gate to validate the JWT once, look up the authenticated user's `profiles.is_admin`, and allow either verified admin or valid course entitlement. Keep the indicator entitlement route and Supabase schema unchanged.

**Tech Stack:** Cloudflare Workers JavaScript, Deno tests, Supabase PostgREST/Auth, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-27-chart-drills-admin-entitlement-design.md`

## Global Constraints
- Chart Drills remain protected under `/lessons/*`.
- Admin authority is based on server-read `profiles.is_admin = true`, never browser state or user-editable metadata.
- Students require one active, payment-verified, unexpired course entitlement.
- Indicator access remains separate and requires its own 365-day manually verified entitlement.
- No payment or production database changes.

## Review Focus
- Missing/duplicate profile rows must fail closed for non-admin access.
- A free student must not receive a Worker cookie or protected asset bytes.
- A valid admin without a course_access row must receive protected course assets.
- A course member must continue to receive protected assets.
- Indicator access must not be inferred from admin or course access.

---

### Task 1: Regression tests (RED)
**Files:**
- Modify: `scripts/test-cloudflare-entitlement-worker.ts`

**Steps:**
- Add a test proving an admin profile receives a short-lived HttpOnly course cookie even when `course_access` is empty.
- Add a test proving an admin with a valid cookie can fetch `/lessons/chart-drills.html`.
- Add a test proving a non-admin with no valid course entitlement remains denied and static assets are not fetched.
- Run `deno test scripts/test-cloudflare-entitlement-worker.ts`; confirm the admin tests fail before implementation.

### Task 2: Worker authorization (GREEN)
**Files:**
- Modify: `_worker.js`

**Steps:**
- Extract authenticated-user lookup from course entitlement lookup.
- Query `profiles` by the authenticated user ID and require exactly one row with `is_admin === true`.
- Permit protected course assets if admin is verified OR course entitlement is valid.
- Keep failure paths fail-closed, private/no-store cache headers, origin checks, and credential stripping.
- Run the focused Deno tests and full `npm test` / repository Worker checks.

### Task 3: Release verification
**Files:**
- No production files beyond Task 2.

**Steps:**
- Open a PR against `main`.
- Inspect the complete diff and CI runs on the exact PR head.
- Do not merge or deploy automatically; report any required manual checks.
- Confirm no Supabase migrations or payment workflows were changed.
