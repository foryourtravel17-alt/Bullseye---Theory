# Bullseye Theory — Release handoff record (2026-11-02)

> Internal engineering record. Draft only. Not legal advice, not a market brief, and not approval to merge, deploy, publish, or accept payments.

## Market Lab work completed in this review

- Inspected `market-briefs.json` and `docs/market-briefing-policy.md` on `feat/bullseye-companion-terminal-memberships`.
- Preserved all three conditional educational scenarios and all fictional demo instrument values. `mode=educational_demo`, `dataStatus=simulated`, and every sample instrument remains `fictional_demo_only`.
- Added the SEBI 8 May 2026 educational market-price-data circular (effective 1 July 2026) to the policy: 30-day lag for educational price-data sharing/usage, narrow NISM simulation-lab exception, agreement and audit-trail safeguards. Bullseye must not assume the NISM exception applies.
- Removed TradingView live ticker embeds from homepage and Market Lab. Replaced stale numeric XAUUSD/BTCUSD hero overlays with non-price educational labels.
- Paused public factory observation rendering in Market Lab. Telegram approval does not establish data age, licence, exchange permission or educational-use eligibility.
- Added `scripts/validate-market-data-guardrails.mjs`, wired to `npm run build` and `npm test`, plus `.github/workflows/market-lab-guard.yml` for branch/PR validation.
- Updated the dated review record and commented on PR #11.
- Added a twice-weekly review automation (Monday/Thursday, flexible evening window, Asia/Kolkata). The previous exact-time automation was disabled after the new schedule was confirmed.

## Source record

1. SEBI Circular HO/47/17/12(11)2025-MRD-POD3/I/11107/2026, 8 May 2026: https://www.sebi.gov.in/legal/circulars/may-2026/norms-for-sharing-and-usage-of-price-data-for-educational-purposes_101293.html
2. NSE corporate filings event calendar: https://www.nseindia.com/companies-listing/corporate-filings-event-calendar
3. NSE Data Sharing & Usage Policy: https://www.nseindia.com/static/market-data/nse-data-policy
4. SEBI circular index: https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListingLegal=yes&sid=1&smid=0&ssid=7
5. RBI press-release listing: https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx

## Validation evidence

- Connector-side source assertions after the edits: homepage no longer contains the TradingView ticker script or stale hero quote numbers; Market Lab no longer embeds TradingView or fetches `approved_market_feed.json`; policy includes the SEBI circular/30-day control and NISM/audit-trail qualifications; all sample fixture labels remain fictional; package build includes the new compliance guard. These are source-level checks only, not a completed `npm test` execution.
- GitHub Actions for the latest Market Lab head were not returned by the available commit-workflow query. Do not call CI green until a successful run is visible in GitHub.
- No production deployment, merge, Supabase SQL/function deployment, secret change, payment activation or social publishing occurred.

## Current PR/release state

- Repository default branch: `main`.
- PR #11: open, draft, unmerged, and GitHub currently reports `mergeable=false`; head branch is `feat/bullseye-companion-terminal-memberships`. GitHub compare reports 69 commits ahead and 54 behind `main` (diverged). Resolve the base divergence/conflicts before merge. The feature branch is not in production.
- PR #14: open draft; targets the Market Lab feature branch (not `main`). It documents schema hardening and compatibility work; SQL has not been applied to live Supabase.
- PR #27: open draft, targets `main`; progress primary-key/RLS repair is not applied to live Supabase.
- PR #29: open draft, targets `main`; SECURITY DEFINER search-path migration is not applied to production.
- PR #30, #31 and #32: open drafts, target `main`; server-side quiz grading/completion and all-lesson client migration are not deployed. PR #32's prior recorded workflows passed on its current reported head, but its new no-secrets source-contract check still needs a fresh run. Local Supabase integration tests and schema reconciliation remain outstanding.
- Raw factory state: the separate `ai-trending-content-factory` repository is public and the current `main/data/state.json` is directly accessible (approximately 720 KB); it contains signal-related fields. A key-name scan of the current file found no obvious token/password/secret field names, but this is not a complete value or Git-history secret scan. The sanitized feed does not make this state private. A private raw-state store, migration, credential setup and history/secret review are required. Do not assume deleting the current file alone removes historical exposure.
- Membership: planned ₹999 course and ₹1,999 Premium bundle including course. Payments remain disabled. Billing duration, renewal/cancellation/refund terms, support, payment gateway and server-side verification must be finalised and tested before checkout.
- Cloudflare Workers build failure, mobile/desktop browser QA and live Supabase migration verification remain release gates. No Cloudflare deploy was performed.

## Owner actions required before launch

1. Resolve PR #11's merge conflicts/base divergence and review the complete diff.
2. Verify the new Market Lab GitHub Actions workflow passes on the latest branch head; run the full build/tests.
3. Perform visual/functional QA at common Android/mobile widths and desktop, including journal, calculator, navigation, local links and no-live-data notices.
4. Obtain qualified Indian securities-law review and written data-provider/exchange permissions before enabling any real price data or ticker. Keep all live/recent data displays disabled until then.
5. Move raw factory state to private storage and inspect Git history for sensitive levels/credentials; rotate any exposed credentials if found.
6. Reconcile PRs #14/#27/#29/#30/#31/#32, back up and verify the live Supabase schema, and run local disposable Supabase integration tests. Do not apply migrations or deploy functions as a test.
7. Finalise course/Premium access duration, renewal/cancellation/refund terms, support, payment gateway and server-side verification. Keep checkout disabled until complete.
8. Verify Cloudflare build/deployment separately; only deploy after owner approval and successful preview/device checks.

## Review bookkeeping

- Review completed: 2026-11-02.
- Next scheduled review: 2026-11-05.
- Scenario pack changed: no.
- Market-data display controls changed: yes.
- Production changes: none.

## Follow-up verification addendum — 2026-11-02 (latest branch head)

- Latest PR #11 head: `aeb053ee687ae71feb1f7c7995b59c71d94d54ef`. The branch is 76 commits ahead and 54 behind `main`; GitHub still reports the PR open, draft, unmerged and `mergeable=false`. This supersedes the earlier 69-ahead count in this handoff.
- Draft corrections on the feature branch: the SEBI policy now records the circular's no-monetary-incentive-to-participants wording and its separate security-name/future-price/advice clarification; the homepage no longer promises lifetime access while duration is undecided; and the local validator now matches the paused quote/factory-feed design rather than requiring the retired eight-hour approved-feed path.
- No commit status entries or PR-triggered workflow runs were returned for the latest head. The local container could not resolve GitHub to clone the private repository, so `npm test` was not executed locally. Do not call CI green until a successful run is visible on the exact current head.
- A direct source inspection confirms that `lesson-2.html` and `lesson-11.html` include lesson bodies in static HTML and only check `course_access` in browser JavaScript. This is not a secure paid-content boundary. A direct request can retrieve the static file before the client redirect. Do not accept payments or claim paid-content protection until lesson bodies are served behind server-side authorization and direct-URL/bypass tests pass.
- PR #14, #27, #29, #30, #31 and #32 remain open drafts and none is merged. PR #32 describes server-side quiz grading/completion and migration of lesson clients, but its description does not establish server-side authorization for delivering the lesson HTML body. The live Supabase schema/policies remain unverified from this review; the SQL in PR #11 has not been applied.
- `terms.html` and `refund.html` were not found; `legal.html` remains a placeholder. Course/Premium duration, renewal/cancellation/refund terms, support details, gateway and server-side payment verification are still required before checkout.
- No merge, production deployment, Supabase migration, payment activation or publishing was performed.

