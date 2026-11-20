# Bullseye Levels — TradingView Free-plan owner runbook

Date: 16 November 2026

## What works without a paid TradingView plan

The Pine source in `indicator/bullseye.pine` can be copied into Pine Editor, saved to the owner's personal script library, and added to the owner's own chart. This uses the chart's own OHLCV feed; it does **not** require exporting a CSV.

Official TradingView help:
- Create and save a personal Pine script: https://www.tradingview.com/support/solutions/43000711497-how-to-create-a-new-script/
- Pine Editor and personal library: https://www.tradingview.com/support/solutions/43000763320-how-to-work-with-pine-editor/
- Pine Script basics and save/add-to-chart: https://www.tradingview.com/support/solutions/43000561836-what-is-pine-script/

## Owner steps (TradingView Free)

1. Open TradingView and sign in to the owner's existing account.
2. Open a supported NSE/BSE chart (for example, a liquid NSE equity or index that the account's data entitlement provides).
3. Select **15 minutes**.
4. Open **Pine Editor** from the chart's bottom panel.
5. Choose **Open** / **Create new → Indicator** (or open the existing Bullseye India script if already saved).
6. Copy the complete contents of `indicator/bullseye.pine` from the private GitHub release branch into the editor.
7. Click **Save**, name it **Bullseye India**, then click **Add to chart**.
8. Resolve any compiler message shown by TradingView. CI/static source tests are not a substitute for TradingView's actual Pine compiler.
9. Confirm the status panel identifies the 15m timeframe as supported. Check the zone drawings, confirmed breakout labels, entry, stop and 2R target.
10. Switch the same chart to **1 hour** and repeat the visual check.
11. Use Bar Replay or forward bars to confirm a pivot is not shown before its three right-hand bars close and a signal does not change after its candle closes.
12. If the chart feed has missing/zero volume, the script must show N/A/no signal rather than invent a volume-qualified breakout.

No TradingView CSV download is part of these steps. Do not buy Pro/Premium just to export CSV.

## What the Free plan does not unlock for commercial distribution

A saved Pine script is in the owner's personal library; saving it does not share it with customers. TradingView says invite-only publication is available only to Premium users or higher. Its current selling guidance says vendors selling access through their own channels must publish a **public invite-only** script; private invite-only scripts are limited to five users and are not the correct paid-distribution route.

Official TradingView guidance:
- Script visibility and invite-only eligibility: https://www.tradingview.com/support/solutions/43000482573-what-are-the-different-types-of-published-scripts/
- Selling scripts through your own channels: https://in.tradingview.com/support/solutions/43000797373-selling-scripts-on-tradingview-faq/
- Invite-only script rules: https://www.tradingview.com/support/solutions/43000797311-invite-only-script-rules/

Therefore:
- Do not publish this paid indicator as Open or Protected and then charge for it; those modes do not provide paid access control.
- Do not use a private invite-only script for more than five customers.
- Keep the ₹9,999 indicator checkout closed while the owner remains on the Free plan.
- No workaround, second account, copied script or manual secret sharing should be used to bypass TradingView's eligibility rules.

## Pine/Node parity and data-source limitation

The Node reference analyzer accepts a user-supplied completed OHLCV CSV. TradingView Free export is unavailable to the owner, so the CSV does not have to come from TradingView.

For exact numerical Pine/Node comparison, both engines must receive the same completed 15m/1h candles, including volume, from a data source/broker whose terms permit the intended use. A daily NSE Bhavcopy file is not sufficient for 15m/1h validation. No permitted free 15m/1h source has yet been verified for this release.

Until a suitable source is confirmed:
- Pine can be compiled and visually reviewed on the owner's TradingView chart.
- Node unit tests can continue to run on fixed synthetic fixtures.
- Do not claim exact live Pine/Node parity, historical market validation, live NSE scanning or profitability.
- Keep the website CSV analyzer as a historical-only optional tool, not a live-data service.
- Keep indicator membership and checkout closed.

## Fixed Bullseye Levels contract

Do not change the rules without explicit owner approval:
- 15m and 1h only.
- Strict confirmed 3-left / 3-right swing pivots.
- Same-side pivot clustering within 0.25 × ATR(14), minimum 2 touches.
- LONG close > zone top + 0.10 × ATR(14), and volume > SMA(volume,20) × 1.5.
- SHORT close < zone bottom − 0.10 × ATR(14), with the same volume condition.
- Entry at breakout close; stop beyond opposite zone edge by 0.20 × ATR; target 2R.
- Per-zone cooldown 12 bars.
- Closed candles only; no repainting.
