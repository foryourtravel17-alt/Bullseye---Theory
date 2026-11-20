# Bullseye Theory — final launch handoff

Date: 18 November 2026
Status: repository-side hardening and CI are complete for the current release candidate. Production release remains intentionally held.

## Current verified state

- Product repository: `foryourtravel17-alt/Bullseye---Theory` (private).
- Release PR: [#47 — Integrate Bullseye India indicator with secure course and annual membership](https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/47).
- The release branch is synced with the current `main` branch; GitHub reports no merge conflict.
- Latest fully verified code head before this documentation-only handoff: `92e3c4b3b48b857dffbc4b8fb549be11a98789a4`.
- All 11 current CI workflows passed on that code head: Cloudflare Preview Preflight (no deploy), Edge Function Checks, TRC20 Payment Checks, Launch Page Checks, Manual Course Activation Checks, Admin Course Access Checks, Course Runtime Checks, Market Lab Guard, Render Preview Security Smoke, Bullseye Levels Private Source Tests, and Daily Course Integrity Watch.
- The Cloudflare preflight built the Worker and ran tests without deploying production.
- The public production site remains on the current `main` branch's closed-enrollment/manual-activation state. PR #47 is not merged.

## Product and payment policy

| Product | Planned price | Planned term | Current public status |
|---|---:|---:|---|
| Complete Course | ₹999 | 85 days | Closed; manual admin activation only |
| Premium Telegram | ₹1,999 | Not finalized | Closed; no access term configured |
| Bullseye India Indicator | ₹9,999 | 365 days | Closed; website historical CSV analyzer, not a live scanner |

- The public payment page is a manual-activation notice. It has no UPI, QR, wallet, USDT/TRC20, order form, payment polling, or automatic fulfilment.
- The public page does not load the legacy checkout script. The legacy script remains in the repository only as a defensive no-network stub for cached old markup; its CI contract now verifies that it cannot create orders or make network calls.
- Course activation is performed by an admin after independently confirming enrollment outside the website. The course admin flag is labelled “Manual enrollment check confirmed”; it does not process payments.
- The indicator admin panel is separate. Its production `indicator_access` table and `get-indicator-access` Edge Function have not been deployed, so indicator access remains fail-closed.
- Do not publish payment instructions or accept transfers through this site. If the owner later chooses to accept manual payments outside the site, privately confirm the settlement destination and verify each enrollment before admin activation.

## Work completed in this pass

1. Synced PR #47 with current `main` and resolved the branch divergence without merging or deploying production.
2. Carried forward the main-branch manual-only activation policy, deployment guard, and dedicated CI check.
3. Updated the course admin, signup, dashboard, membership and payment copy to describe manual activation and the absence of public payment methods.
4. Removed the legacy checkout-script reference from the public payment page while retaining its no-network defensive stub.
5. Corrected the payment and indicator entitlement CI contracts so they test the requested manual-only model rather than expecting a live checkout interface.
6. Updated the Market Lab content review metadata after rechecking the three simulated educational scenarios. The fictional sample values remain clearly labelled; no live/recent market data was added.
7. Re-ran CI. All 11 workflows listed above passed on code head `92e3c4b3b48b857dffbc4b8fb549be11a98789a4`.

## Temporary free chart-test route — personal use only

- A separate setup note was added at [docs/SUPERCHARTING_FREE_TEST_SETUP_2026-11-17.md](SUPERCHARTING_FREE_TEST_SETUP_2026-11-17.md).
- SuperCharting Essential currently offers free NSE/BSE charting and a Pine-compatible v6 script editor, with current free limits of 4 charts/layout, 10 indicators/chart, 10,000 bars/chart, and 100 price + 100 technical alerts. Paid plans began on 12 November 2026; Telegram delivery is not included in Essential.
- This is an optional, temporary **personal testing** route for the owner to compile and inspect `indicator/bullseye.pine` on `NSE:RELIANCE` at 15m and 1h without a broker account or TradingView paid plan.
- The platform's market-data terms restrict data to personal, non-commercial analysis inside the service and prohibit feeding it into another product/service or commercial reuse. Therefore SuperCharting is **not** an approved Bullseye website/analyzer, membership, customer-alert, or market-wide scanner data source. Do not export or copy its market data into Bullseye.
- Core Pine features used by the script are mostly listed as supported by the platform's compatibility test suite, but compilation and identical-candle output still need manual verification. Keep the fixed Bullseye rules unchanged. Do not claim Pine/Node parity from compilation alone.
- This does not remove the production data-source gate: the website remains CSV-only using separately permitted OHLCV files, and no live NSE/BSE feed is connected.

## SuperCharting free scanner verification — personal use only (18 Nov 2026)

- The owner saved a separate private script named `BULLS EYE INDIA WATCHLIST SCANNER`, added it to the `NSE:RELIANCE` 1h chart and subsequently showed the separate `Bullseye Scan` pane on both RELIANCE 1h and 15m charts. Treat this as an owner-reported visual chart-load/compile check only, not a Pine/Node parity or signal-quality test.
- The owner created two `RELIANCE 1h Bullseye India Watchlist Scanner` alerts by mistake. Keep one individual 1h scanner alert and remove the duplicate only after checking both have the same condition/timeframe/trigger. Existing original RELIANCE 15m and 1h alerts are separate and should remain until a replacement is verified.
- The existing `@BullseyeTheoryAI_Bot` was connected inside SuperCharting and the private `Bullseye Theory Premium` channel was detected. The bot is already an admin in the Premium channel. However, saving Telegram notification delivery showed the **Upgrade to Plus** gate. The Essential/free plan cannot send Telegram alerts; it only provides the platform's in-app/toast/sound and Notifications inbox. SuperCharting webhooks require Premium. Do not upgrade just to continue this personal test.
- The bot's existing GitHub-to-Free-channel publishing pipeline is a separate route and must not be modified by this SuperCharting experiment. No SuperCharting Telegram alert is currently verified as delivered to Premium.
- The free Pine Screener can scan one watchlist of up to 100 symbols, one scan at a time, latest completed bar only, with up to 20 scans per 10 minutes. Watchlist alerts use the script's named `alertcondition()` entries; one watchlist alert creates one technical alert per symbol. A 10-symbol list with LONG and SHORT on both 15m and 1h consumes 40 technical-alert slots. Free Essential notifications are in-platform only.
- SuperCharting market data remains licensed for personal, non-commercial use inside the service. Do not scrape/export it or feed it to the Bullseye website, customer alert service, paid memberships, or external Telegram pipeline.

Official platform references:
- https://supercharting.com/learn/free-pine-screener-nse
- https://supercharting.com/learn/watchlists-and-watchlist-alerts
- https://supercharting.com/learn/free-telegram-stock-alerts
- https://supercharting.com/learn/webhook-alerts

## Remaining owner-only actions

- **Course and quiz testing:** owner confirmed on 17 November 2026 that course testing and quizzes have been checked and completed. This is recorded as owner-reported QA, not an automated test of a live student account.
1. **Indicator data permission and parity:** choose an approved 15m/1h OHLCV source and compare identical completed candles in the Node engine and chart implementation. No broker account or approved live NSE/BSE intraday feed is currently connected; do not claim live scanning or Pine/Node parity yet.
2. **Premium Telegram:** confirm the access duration and exact deliverables. Until then, keep the ₹1,999 offer closed.
3. **Business/legal:** finalize refund/cancellation rules, business identity, support response expectations, and applicable Indian tax/consumer/legal disclosures with a qualified adviser.
4. **Manual settlement:** only if opening course enrollment, privately confirm the official settlement destination and process. Keep public QR/wallet/checkout fields absent; verify each enrollment manually in Admin.
5. **Production approval:** explicitly authorize the final PR #47 merge and any production Supabase migration/Edge Function deployment. Merging PR #47 triggers the Cloudflare production deployment workflow.

## Do not do yet

- Do not merge PR #47 or deploy the release candidate to production.
- Do not apply the indicator membership migration to production or deploy `get-indicator-access` until the owner approves a staging test.
- Do not enable TRC20 or indicator checkout, payment polling, automatic activation, or public payment instructions.
- Do not buy TradingView Pro/Premium.
- Do not claim live NSE/BSE data, market-wide scanning, proven Pine/Node parity, profitability, or guaranteed results.
- Keep the existing GitHub-to-Free-channel Telegram pipeline unchanged. SuperCharting's Telegram notification integration is blocked on Essential; do not upgrade or re-route the existing bot without explicit product approval. Do not re-enable Facebook or Instagram publishing without a separate request.

## Free-first security note

The current setup remains on Supabase Free. Leaked-password protection is a paid-plan feature, so do not upgrade just to clear that dashboard warning. Keep strong password requirements enabled in the available Auth settings and do not reuse passwords.
