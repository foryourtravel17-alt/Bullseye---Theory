# Bullseye Theory — current launch handoff
Date: 16 November 2026
Status: release candidate verified in preview; production release intentionally held.

## 1. Current product decisions

| Product | Price | Current entitlement/config | Current delivery |
|---|---:|---:|---|
| Complete Course | ₹999 | 85 days | 11 lessons, student dashboard, server-graded quizzes, course PDFs/chart drills |
| Premium Telegram | ₹1,999 | Unconfigured (`accessDays = null`); checkout hard-blocked until owner confirms the term | Separate private Telegram membership; manual fulfilment |
| Bullseye India Indicator | ₹9,999 | 365 days | Website-based historical NSE/BSE OHLCV CSV analyzer; not a live scanner |

The website must continue to show all three products separately. Course and indicator are independent products. Do not invent a bundle discount.

## 2. Verified social automation status

The separate private content repository is `foryourtravel17-alt/ai-trending-content-factory`.

- PR #91 (Telegram-only social automation) merged 16 Nov 2026.
- PR #92 (Supabase Storage readiness request content type) merged.
- PR #93 (daily Telegram report and readiness checks) merged.
- Facebook and Instagram publisher integrations, health checks and recovery workflows were removed.
- Owner confirmed the private Telegram approval notifications were tested, approved, and the resulting Telegram channel auto-post succeeded.
- Market cards and educational Reels remain owner-approval-gated before public Telegram channel publishing.
- The separate Premium workflow is an explicit exception: it auto-publishes evergreen lessons only to its configured private Premium Telegram destination.
- Daily/weekly Telegram reporting and the five-minute approval poller are in the repository.
- Repository visibility remains private.

No Meta credentials are needed by the Telegram-only workflow. Keep Telegram and Supabase secrets in GitHub Actions Secrets; never paste them into chat or source code.

## 3. Course and indicator release candidate

Product repository: `foryourtravel17-alt/Bullseye---Theory`.

- Release PR #47: https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/47
- India CSV analyzer work PR #49 is included in the current release candidate.
- Latest fully verified candidate commit: `b3076d15a8bdf652a72c0721aea216c34c01a3c2`.
- Latest Cloudflare Preview deployment: https://release-bullseye-india-course-indicator-integra-bullseye-theory.foryourtravel17.workers.dev
- A previous Cloudflare preview URL is documented above; this session's final CI verifies a local Worker build and a hosted Render access-gate smoke test. The existing Render preview services are on earlier preview branches, so visually review the exact latest candidate before production.
- Nine GitHub Actions checks passed on the latest candidate commit: launch-page validation, course runtime, static safety, course integrity, hosted preview smoke, Deno/Cloudflare Worker build, indicator tests, Market Lab validation, and payment/settlement verification. The disposable PostgreSQL test now also confirms that Premium transfers can enter `manual_review` without marking the order as paid.
- PR #47 is still a draft and is not merged to main.

### Important deployment boundary

`.github/workflows/deploy-cloudflare.yml` deploys automatically on every push to `main`. Merging PR #47 therefore triggers a production Cloudflare deployment. Do not merge this release PR, apply production migrations, deploy Supabase Edge Functions, or open checkout until the owner explicitly approves the final production release.

## 4. Course implementation and QA

- All 11 lesson pages exist.
- All 11 lesson pages load the shared `lesson-secure-client.js` with their matching lesson number.
- Each lesson has five radio-answer groups and the server-side grading module has 11 answer keys. The build now validates all 55 UI-to-server answer mappings against reviewed correct-answer text.
- A new CI contract test checks all 11 lesson pages against the server-side answer keys and verifies all five questions/options are present.
- The student dashboard now exposes 10 existing PDFs and 6 slide decks as download links only when the course entitlement is active; the asset paths are checked by CI and remain protected by the server/Worker entitlement gate.
- Pass mark is 4/5 (80%).
- Lesson 1 is the free preview; lessons 2–11 require an active, payment-verified, unexpired course entitlement.
- Quiz grading and lesson completion are handled by server-side Supabase Edge Functions. The browser does not contain the answer keys or write completion directly.
- The course uses an 85-day entitlement from verified payment.

A previous owner QA pass confirmed the course lessons were working. Repository asset audit found 11 interactive HTML lessons, 10 lesson PDF files and 6 slide decks, but no video files or embedded video players, and no Lesson 11 PDF. The membership page must not promise recorded video lessons until those files are supplied. The final release acceptance should still include one signed-in staging run across all 11 quizzes, progress saving, certificate and password reset, using a disposable test account only. The 16 November release candidate also integrates the terminal HUD homepage, radar hero image, closed-enrollment price labels, production canonical URL and refreshed CSS cache key; PR #44's design work is incorporated into PR #47.

## 5. Bullseye Levels and TradingView

- Free-plan step-by-step owner instructions: [TRADINGVIEW_FREE_PLAN_RUNBOOK.md](TRADINGVIEW_FREE_PLAN_RUNBOOK.md).

The locked rule contract is `indicator/RULES.md`. Do not change it without explicit owner approval:

- 15m and 1h only.
- Strict confirmed 3-left / 3-right swing pivots.
- Same-side pivots cluster using 0.25 × ATR(14); minimum two touches.
- LONG: close > zone top + 0.10 × ATR(14), and volume > SMA(volume,20) × 1.5.
- SHORT: close < zone bottom − 0.10 × ATR(14), with the same volume condition.
- Entry at breakout close; stop beyond opposite zone edge by 0.20 × ATR; target 2R.
- Per-zone cooldown: 12 bars.
- Closed candles only; confirmed pivots and alerts must not repaint.

The product's v1 delivery is the **website-based historical CSV analyzer**:
- Accepts user-supplied OHLCV CSV, max 5 MB.
- Processes uploads in memory; does not persist uploaded files.
- Supports 15m and 1h and NSE/BSE symbol labels.
- Does not fetch live NSE market data, scan the whole market, or claim live signals.
- Node tests and the Pine/Node streaming reference model are automated checks, not proof that TradingView has executed the Pine script.

No TradingView Pro/Premium purchase is required or authorized. The owner can compile and run `indicator/bullseye.pine` on their own TradingView chart using the Free Pine Editor; a CSV export is not required for this personal chart use. TradingView Free CSV export is unavailable in the owner's current plan, so do not request an upgrade. For numerical Pine-vs-Node parity, the same completed OHLCV candles must come from another broker/data source whose terms permit the intended use. No permitted free 15m/1h source has yet been verified. NSE daily Bhavcopy alone cannot validate 15m/1h rules.

The indicator is educational, not broker-connected, not an order execution system, and has no proven profitability claim.

## 6. Supabase, payments and access status

- Production course schema and Edge Functions were previously audited; the hosted project was healthy and had 11 lesson records.
- The live `quizzes` and `quiz_questions` tables had zero rows at the prior audit. Quiz grading currently uses the checked-in server-side `grading.ts` answer keys.
- The new `indicator_access` table is defined by an additive migration in the release candidate; it has not been applied to production.
- No production migration or production Edge Function deployment has been performed for the indicator membership.
- `USDT_CHECKOUT_ENABLED` and `INDICATOR_CHECKOUT_ENABLED` must remain false. Payment verification and customer fulfilment remain manual as requested.
- Do not use real payments or customer data in tests. Do not create a paid Supabase branch.

## 7. Supabase security review

- The Supabase security advisor reports leaked-password protection is disabled. Enable it in Supabase Dashboard → Authentication → Security before accepting customers.
- Five `SECURITY DEFINER` functions are reported as executable by authenticated users. Their definitions were inspected: admin-management functions call `public.is_admin()`, certificate self-service is user-scoped, and the functions pin `search_path`. These are still linter warnings; retain the current grants only after owner/security review.
- Five unused-index performance notices are informational; no health lints were returned.

## 8. Website/legal launch review

- Membership page displays ₹999 / ₹1,999 / ₹9,999 separately and says enrollment is closed.
- Payment checkout is deliberately closed and instructs visitors not to transfer funds.
- Terms and privacy pages are preliminary and were last updated 25 October 2026.
- Refund page explicitly says a final refund/cancellation policy is not yet available.
- Before accepting money, the owner must finalize the Premium Telegram membership term; the server plan currently uses `accessDays = null` and blocks new Premium orders even if checkout flags are accidentally enabled. Also finalize refund/cancellation rules, support response expectations, business identity and applicable Indian tax/consumer/legal disclosures with a qualified adviser.

## 9. Remaining work — automation vs owner action

### Automated/repository work
1. Keep Telegram-only automation and its approval gates stable; no Instagram/Facebook work.
2. Keep release candidate tests green after any further code change.
3. Keep preview environment isolated from production Supabase.
4. Maintain the private release PR and this handoff until final acceptance.
5. Do not auto-activate payment or indicator entitlements.

### Owner actions that cannot be completed safely by repository automation
1. Compile and save the Pine script in TradingView Free Pine Editor; add it to an NSE chart on 15m and 1h.
2. Review confirmed-bar behavior in Bar Replay/forward bars; no TradingView account session is available to the automation.
3. If exact numerical parity with Node is required, identify a permitted 15m/1h OHLCV data source. Do not buy a TradingView plan for CSV export.
4. Complete one disposable signed-in course staging pass and confirm password reset, all 11 quizzes, lesson progress and certificate.
5. Confirm the Premium Telegram membership duration; Premium checkout remains hard-blocked while `accessDays = null`.
6. Finalize refund/cancellation, business identity, support and legal/tax details.
7. Decide when production deployment and any production migration are authorized.
8. Keep payment verification and course/Telegram customer fulfilment manual.

## 10. Do not do before final approval

- Do not merge PR #47 or trigger the automatic production Cloudflare deployment.
- Do not apply the indicator migration to production.
- Do not deploy Supabase Edge Functions to production.
- Do not enable TRC20 checkout or indicator checkout.
- Do not publish a paid TradingView invite-only script or buy TradingView Pro/Premium.
- Do not claim live NSE data, Pine runtime parity, guaranteed signals or profitability.
- Do not re-enable Facebook or Instagram automation.

## 11. Local test commands

From the repository root:
```bash
npm install --no-audit --no-fund
npm test
```

From `indicator/`:
```bash
npm install --ignore-scripts --no-audit --no-fund
npm test
node --check server.mjs
npm start
```
