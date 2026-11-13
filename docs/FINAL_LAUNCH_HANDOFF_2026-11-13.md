# Bullseye Theory — launch handoff (13 Nov 2026)

## Product plans

| Plan | Price | Access term | Included |
|---|---:|---:|---|
| Complete Course | ₹999 one-time | 85 days | 11 recorded lessons, course PDFs and chart drills |
| Premium Telegram Bundle | ₹1,999 | Membership term to be configured/confirmed at fulfilment | Premium Telegram channel access; manual approval |
| Bullseye India Indicator | ₹9,999 | 365 days | TradingView indicator access; owner manually grants/removes invite-only access |

The three prices are presentation/plan contracts. Payment checkout and automated fulfilment are not approved as live. Payment verification stays manual. Do not promise automatic TradingView activation.

## Current release artifacts

- Release PR: https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/47
- Design PR: https://github.com/foryourtravel17-alt/Bullseye---Theory/pull/44
- Pre-launch acceptance checklist: https://github.com/foryourtravel17-alt/Bullseye---Theory/issues/48
- Isolated enrollment preview: https://bullseye-theory-enrollment-preview.onrender.com/
- Preview publishes only `membership-preview/`; it is not the production domain.
- Render secure Node preview: `bullseye-theory-secure-preview`; latest failed build was caused by stale Market Lab review dates, not a code compile/runtime defect. A content-only review dated 2026-11-12 has now been documented and its metadata synchronized to `market-briefs.json`; a preview redeploy was triggered and must be checked for completion.
- Unsafe root-publishing Render service `bullseye-theory-membership-preview` (`srv-dbrdq35g1s2s73871ncg`) was deleted by the owner and verified absent from Render service inventory.

## Automated implementation included in release candidate

- 11-lesson course and separate entitlements for course, premium bundle and indicator.
- Server-side plan contracts/status endpoint.
- ₹999 / 85-day course, ₹1,999 Premium Telegram Bundle and ₹9,999 / 365-day indicator plan presentation.
- NSE-first Bullseye India Pine source and deterministic Node reference engine.
- Historical TradingView CSV parser/validator and deterministic reference-engine backtest runner.
- Indicator tests for parser, signal engine, unfinished final candle, missing volume, prefix stability and 1:2 risk/reward.
- CI at release PR head `0155d51cb363417d471b6798bb15b053c0718ef4`: 9/9 workflow runs succeeded, including Bullseye Levels private checks.
- PR #44 design head `353fa89c0ca7c84fe231df1914d4e8c9038b47bf`: 4/4 listed workflow runs succeeded at that head.

## Indicator rules (must not be changed without owner decision)

- Timeframes: 15m and 1h only.
- Pivot: 3-bar left / 3-bar right swing high and swing low.
- Cluster pivots within 0.25 × ATR(14) into a zone; at least 2 touches.
- Long breakout: close above zone top + 0.10 × ATR and volume > SMA(volume,20) × 1.5.
- Short breakout: close below zone bottom − 0.10 × ATR with same volume filter.
- Entry = breakout close; stop at opposite zone edge ± 0.20 × ATR; target RR 2.0; cooldown 12 bars.
- Node reference engine is not the TradingView Pine runtime. Passing Node tests does not prove Pine parity, live non-repainting or profitability.

## Manual owner tasks before launch

1. TradingView account: confirm active Premium or higher plan if selling invite-only access.
2. Open the private Pine source in TradingView Pine Editor; compile and resolve any errors/warnings.
3. If commercial access is intended, follow TradingView rules for a **public invite-only** script; do not sell private invite-only publication.
4. Test representative NSE symbols on 15m and 1h with Bar Replay/forward review. Compare actual Pine signals against Node CSV reports and record mismatches.
5. Review the website on desktop and mobile. Test sign-in, sign-out, password reset, locked/unlocked lesson states, lesson playback, quiz and progress.
6. Confirm course content, PDFs, all 11 lessons and customer entitlement expiry behaviour.
7. Manually verify payment, customer identity and order details. Do not send access based only on a screenshot/claim.
8. For indicator orders, collect the customer's TradingView username, manually grant invite-only access, record start/expiry, and manually remove/extend access when due.
9. For premium bundle orders, manually verify payment and add/remove Telegram member access.
10. Define and test refund, cancellation, access revocation and customer support process.

## Safety / not yet done

- No production deployment or production database migration.
- No checkout activation or live payment processing.
- Keep `USDT_CHECKOUT_ENABLED=false` and `INDICATOR_CHECKOUT_ENABLED=false` until payment verification and fulfilment are deliberately approved.
- No public TradingView script publication or customer invite has been performed.
- No live scanner, auto-trading, signal distribution or public auto-posting is enabled.
- No market data has been represented as live; Market Lab remains simulated educational demo.
- Do not merge PR #47 or deploy production until owner-side QA and release gates are accepted.

## Historical CSV validation

Run from `indicator/` using Node.js 20+:

```bash
node scripts/validate-tradingview-export.mjs /path/to/export.csv --timeframe 15m --json report.json
node scripts/validate-tradingview-export.mjs /path/to/export.csv --timeframe 1h --json report-1h.json
```

Final row is excluded by default as potentially unfinished. Use `--include-last` only when every row is a completed candle. No paid API key is required.
