# Bullseye Theory — final launch handoff
Date: 16 November 2026
Status: consolidated release candidate in PR #51; production release intentionally held.

## 1. Current release candidate
- Product repository: `foryourtravel17-alt/Bullseye---Theory` (private).
- Current consolidated PR: https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/51
- Earlier release PR #47 was closed as superseded; it was not merged.
- PR #51 contains the 11-lesson course, secure access, server-graded quizzes, India CSV analyzer, Pine v6 source, terminal HUD homepage design, and radar hero asset.
- Latest full CI pass before this handoff update: 9/9 checks succeeded (Launch Page, Course Runtime, Bullseye Levels, Daily Course Integrity, Admin Access, Market Lab Guard, Edge Functions, Render Preview Security Smoke, TRC20 Payment).

## 2. Products and pricing
| Product | Planned price | Term / delivery |
|---|---:|---|
| Complete Course | ₹999 | 85 days; 11 lessons, server-graded quizzes, progress and study guides |
| Premium Telegram | ₹1,999 | Separate private Telegram membership; server plan currently uses 85 days, offer term still needs owner confirmation |
| Bullseye India Indicator | ₹9,999 | 365 days; website-based historical NSE/BSE OHLCV CSV analyzer |

The three products are separate. Do not invent a bundle discount. Payment verification and fulfilment remain manual. All checkout/payment flags remain OFF.

## 3. Telegram social automation
- Separate private repository: `foryourtravel17-alt/ai-trending-content-factory`.
- PR #91 removed Facebook/Instagram/Meta publishing and made Telegram the only social publishing destination.
- PR #92 fixed Telegram/Supabase Storage readiness checks.
- PR #93 polished Telegram reports and readiness checks.
- Owner confirmed Telegram approval notifications were tested and approved, followed by successful automatic channel posting.
- Market cards and educational Reels require explicit owner approval in private Telegram before channel publishing.
- Premium evergreen lessons are a separate workflow and publish only to the configured private Premium Telegram destination.
- PR #95 adds bounded retries for transient Telegram network/rate-limit errors; its test suite passed 156 tests (one skipped) and the change was merged.
- Repository remains private. Telegram and Supabase credentials stay in GitHub Actions Secrets only.

## 4. Course implementation
- All 11 lesson pages exist.
- Lesson 1 is the free preview; lessons 2–11 require a verified, active, unexpired 85-day course entitlement.
- Each lesson page has five quiz questions; server-side grading has 11 answer keys; pass mark is 4/5 (80%).
- Quiz grading and lesson completion run through Supabase Edge Functions; answer keys are not sent to the browser.
- Course access, quiz attempts, progress and certificate flows have automated checks.
- Repository marketing copy describes the current lesson pages, study guides and chart exercises. Recorded video breakdowns are not present in this repository and are not promised in the current copy.

## 5. Bullseye Levels / TradingView
The fixed rules in `indicator/README.md` are an owner-approved contract and must not be changed without permission:
- 15m and 1h only.
- Strict confirmed 3-left / 3-right swing pivots.
- Same-side pivot clustering within 0.25 × ATR(14), at least two touches.
- LONG: close > zone top + 0.10 × ATR(14), volume > SMA(volume,20) × 1.5.
- SHORT: close < zone bottom − 0.10 × ATR(14), same volume condition.
- Entry at breakout close; stop beyond the opposite zone edge by 0.20 × ATR; target 2R.
- Per-zone cooldown 12 bars; completed candles only.

Current v1 delivery is the website-based historical CSV analyzer:
- Accepts user-supplied OHLCV CSV, maximum 5 MB.
- Supports 15m and 1h.
- Processes uploads in memory and does not persist uploaded files.
- No live NSE feed, no whole-market scanner, no broker execution and no guaranteed signal claims.
- CSV may come from any broker/chart/data source whose terms permit the user's use. TradingView Pro/Premium and TradingView CSV export are not required.
- Node tests and the Pine/Node reference model do not prove that TradingView's Pine runtime has compiled or executed the script.

## 6. Supabase and payment status
- The hosted Supabase project was read-only audited: project healthy, public tables have RLS enabled, 11 lesson records present, and six Edge Functions active.
- The `quizzes` and `quiz_questions` tables currently have zero rows; the current quiz grader uses the checked-in server-side `grading.ts` answer keys.
- The `indicator_access` table exists only in the additive release-candidate migration and has not been created in production.
- No production migration or production Edge Function deployment is authorized.
- Keep `USDT_CHECKOUT_ENABLED=false` and `INDICATOR_CHECKOUT_ENABLED=false`.
- Do not create a paid Supabase branch.

## 7. Website design and deployment boundary
- Terminal HUD design and `public/img/hero-radar.webp` are integrated in PR #51.
- The homepage and membership copy preserve closed-enrollment and planned-price markers.
- Existing Render preview security smoke tests pass.
- `.github/workflows/deploy-cloudflare.yml` deploys production on pushes to `main`. Merging PR #51 would trigger the production Cloudflare deployment.
- Do not merge PR #51, deploy production, run production migrations, deploy Edge Functions, or activate checkout until the owner explicitly authorizes the release.

## 8. Remaining owner actions
1. Open `indicator/bullseye.pine` in TradingView Free Pine Editor, compile, and resolve any Pine compiler errors. No Pro/Premium upgrade is needed.
2. Review confirmed-bar behavior on representative 15m and 1h NSE charts.
3. If numerical Pine-vs-Node comparison is required, obtain completed OHLCV candles from a permitted free/broker data source and upload them to the analyzer preview. Do not wait for TradingView CSV export.
4. Use a disposable staging account to test sign-in/out, password reset, lessons 1–11, quiz grading, progress persistence, certificate and expiry.
5. Confirm Premium Telegram membership duration; server code currently says 85 days.
6. Finalize refund/cancellation policy, business identity, support expectations and applicable Indian legal/tax disclosures with a qualified adviser.
7. Explicitly approve the production release before merging PR #51; this merge triggers the Cloudflare production deploy.
8. Keep payment verification and customer course/Telegram fulfilment manual.

## 9. Local tests
Repository root:
```bash
npm install --no-audit --no-fund
npm test
```

Indicator app:
```bash
cd indicator
npm install --ignore-scripts --no-audit --no-fund
npm test
node --check server.mjs
npm start
```
