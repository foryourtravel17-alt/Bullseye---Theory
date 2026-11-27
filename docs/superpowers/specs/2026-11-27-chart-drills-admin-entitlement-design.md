# Chart Drills and Independent Indicator Access — Design

Date: 2026-11-27

## Intent
Keep the existing 11 Chart Drills inside the paid Bullseye Theory course while allowing a verified administrator to inspect protected course resources without purchasing a course entitlement. Keep the ₹9,999 Bullseye India Indicator as a separate, independently activated 365-day product.

## Goals
- A profile with `is_admin = true` can receive the short-lived Worker course-session cookie and open protected `/lessons/*` resources.
- A non-admin can open protected course resources only with one active, payment-verified, unexpired `course_access` row.
- A free-preview account does not receive Chart Drills or paid study-library access.
- Indicator access remains independent: course entitlement never grants indicator access; indicator entitlement never grants course access.
- Keep manual payment verification and manual admin activation; do not add checkout, payment collection, live market feed, broker integration, or auto-trading.

## Current findings
- `dashboard.html` links to `lessons/chart-drills.html`; the file exists in `main` and contains 11 illustrative exercises with answer reveals and print/save-as-PDF.
- `_worker.js` protects the whole `/lessons/*` directory and currently checks only `course_access`. This excludes an admin without a course entitlement and is inconsistent with the admin panel's `profiles.is_admin` authorization model.
- Production Supabase has `indicator_access`, RLS enabled, no direct API-role access, the manual admin RPCs, and an active JWT-verified `get-indicator-access` Edge Function. The migration ledger records the manual entitlement migrations.
- The indicator analyzer is a historical CSV tool, not a live market scanner. Pine/Node runtime parity remains unverified.

## Approaches considered
1. Make Chart Drills public: rejected because it would bypass the accepted paid-course boundary.
2. Add a server-verified admin exception in the existing Worker gate: selected because it preserves one protected asset path and reuses the current `profiles.is_admin` authority.
3. Create a second course-drills service or new entitlement table: rejected as unnecessary duplication.

## Access rules
- Admin: full course-resource access after JWT validation and a server-side lookup of `profiles.is_admin`.
- Paid course member: access only with a single active, payment-verified, unexpired `course_access` row.
- Free-preview/non-member: Lesson 1 preview only; protected course resources remain denied.
- Indicator: separate `indicator_access` record, 365-day term, payment verified by the owner and manually activated in Admin. No implicit entitlement inheritance.

## Constraints / non-goals
- Preserve the existing 11 drill topics and their illustrative-only disclaimer.
- Preserve the current course term and indicator term.
- No production deployment or database mutation from this code change.
- No payment gateway, online payment API, live market-data feed, TradingView paid plan, brokerage order placement, or auto-trading.
