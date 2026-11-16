# Bullseye Theory — launch handoff (13 Nov 2026)

## Product plans

| Plan | Price | Access term | Included |
|---|---:|---:|---|
| Complete Course | ₹999 one-time | 85 days | 11 lessons, course PDFs and chart drills |
| Premium Telegram Bundle | ₹1,999 | Membership term to be confirmed at fulfilment | Premium Telegram channel; manual approval |
| Bullseye India Indicator | ₹9,999 | 365 days | Planned website-based historical analyzer; manual access |

Prices remain planned presentation values. Enrollment is closed, checkout/payment flags stay OFF, and payment verification/fulfilment remain manual.

## Current artifacts
- Release PR #47: https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/47
- India CSV analyzer PR #49: https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/49
- Design PR #44: https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/44
- Pre-launch acceptance issue #48: https://github.com/foryourtravel17-alt/Bullseye---Theory/issues/48
- Secure preview: https://bullseye-theory-secure-preview.onrender.com/
- Isolated enrollment preview: https://bullseye-theory-enrollment-preview.onrender.com/
- Isolated India analyzer preview (Render Free, feature branch only): https://bullseye-india-analyzer-preview.onrender.com/
- Secure preview runs on Render Free; enrollment preview serves only membership-preview/.
- The unsafe root-publishing Render static service was deleted and verified absent.

## India indicator implementation in PR #49
- Removed Binance-only live crypto klines from the web dashboard.
- Added a user-supplied OHLCV CSV upload flow for NSE/BSE symbols.
- Added 5 MB upload limit, in-memory parsing, chronological/OHLC validation, 15m/1h selection and historical report.
- Added candlestick chart, signal history table and mobile layout.
- Added HTTP API tests for valid CSV, unsupported intervals, malformed input and private-source file access.
- Public static serving is allowlisted to the dashboard and chart library.
- No market feed is fetched, no CSV is persisted, no live NSE data or automatic NSE scanner is claimed.
- GitHub Actions Bullseye Levels — Private Source Tests #49 passed: dependency install, all indicator tests (including CSV API and static asset allowlist tests), server syntax and CSV validator syntax.
- GitHub Actions Launch Page Checks #268 passed after the website analyzer membership copy update.

## Fixed Bullseye Levels rules — do not change without owner approval
- 15m and 1h only.
- Confirmed 3-left / 3-right swing pivots.
- Same-side pivots cluster within 0.25 × ATR(14); minimum 2 touches.
- LONG close > zone top + 0.10 × ATR and volume > SMA(volume,20) × 1.5.
- SHORT close < zone bottom − 0.10 × ATR with same volume filter.
- Entry at breakout close; stop beyond opposite zone edge by 0.20 × ATR; target 2R; 12-bar per-zone cooldown.
- Node tests and streaming parity model are not actual TradingView Pine runtime execution. Actual Pine compile and signal comparison remain outstanding.

## Manual owner work before launch
1. Use TradingView Free Pine Editor to compile `indicator/bullseye.pine`; no Pro/Premium purchase is requested.
2. Export completed 15m and 1h OHLCV CSVs for representative NSE symbols and upload them in a preview of PR #49. Compare report values and record errors.
3. Compare actual TradingView Pine outputs with Node reports on the same candles; document mismatches.
4. Test signed-in staging course journey: sign-in/out, password reset, all 11 lessons, PDFs, quiz grading and progress.
5. Keep payment manual. Verify customer identity and payment before manually granting course/Telegram access.
6. Confirm refund, cancellation, expiry and access-revocation process.
7. Only after owner approval, plan production deployment/migration and activate checkout.

## Safety / not authorized
- Do not buy TradingView Pro/Premium.
- No production deployment or production database migration.
- Keep `USDT_CHECKOUT_ENABLED=false` and `INDICATOR_CHECKOUT_ENABLED=false`.
- No public TradingView script publication, automatic access grant, broker execution, live signal distribution or Telegram auto-posting.
- No claim of live NSE data, Pine runtime parity or profitability.
- Do not merge PR #47 or PR #49 and do not deploy production without owner approval.

## Local run
From `indicator/` with Node.js 20+:
```bash
npm install --ignore-scripts --no-audit --no-fund
npm test
node --check server.mjs
npm start
```
Open http://localhost:3000 and upload an OHLCV CSV. The final CSV row is excluded by default as potentially unfinished.
