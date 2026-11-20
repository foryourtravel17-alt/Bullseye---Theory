# Temporary free chart testing — SuperCharting Essential

Date checked: 17 November 2026  
Purpose: let the owner test the existing Bullseye Pine reference script on regular NSE charts without buying TradingView Pro/Premium or opening a broker account.

## Decision

Use [SuperCharting](https://supercharting.com/) Essential only as a **temporary personal charting and script-test environment**. Do not use it as Bullseye's production market-data backend, do not copy its market data into the Bullseye website/analyzer, and do not redistribute its data or alerts to customers.

SuperCharting is an independent product and is not affiliated with TradingView. Its site currently advertises Pine Script v6-compatible indicators/strategies, NSE/BSE charts, and a free Essential plan. Paid plans started on 12 November 2026, so “free” is a current plan, not a promise that every feature will remain free forever.

## Current Essential plan limits

As checked on 17 November 2026, the Essential plan lists:
- 4 charts per layout.
- 10 indicators per chart.
- 10,000 historical bars per chart.
- 100 price alerts and 100 technical alerts.
- Script Editor, Pine-compatible v6 scripts, chart drawings and Strategy Tester.
- Free app/on-site notifications and inbox.

Telegram delivery is not included in Essential. Plus is listed at ₹299/month with 3 Telegram alerts; Premium is listed at ₹499/month with unlimited Telegram alerts and webhook delivery. Do not purchase a plan for this test.

## Data and legal boundary

- NSE/BSE charts may be live during exchange hours when the platform's feed is available.
- If the live feed is unavailable or busy, charts may use fallback data that can be delayed. Verify the feed/status on the chart before comparing candle values.
- SuperCharting's data-use policy limits licensed market data to the user's own personal, non-commercial analysis inside the service. It prohibits scraping/bulk downloading, redistribution, resale, publication/streaming, feeding the data into another product/service, and commercial reuse.
- Therefore this platform is **not an approved source** for the Bullseye customer website, paid ₹9,999 indicator membership, Telegram customer alerts, a data warehouse, or automated external scanner.
- Do not use the chart's CSV export as input to the Bullseye analyzer. Use only an independently approved OHLCV source for Node/website parity tests.
- Do not save the broker credentials into SuperCharting. No broker connection is required for the initial chart check.

## One-time owner setup

1. Open https://supercharting.com/ in the Chromebook or phone browser.
2. Create an Essential account using an email address the owner controls and confirm the six-digit email code. Do not enter payment details.
3. Open the symbol `NSE:RELIANCE`.
4. Open a 15-minute chart and then a 1-hour chart. Confirm the symbol, interval, exchange time zone (Asia/Kolkata), and live/fallback feed status.
5. Open Script Editor and paste the private source from `indicator/bullseye.pine` in this repository. Save it privately under the owner's account; do not publish it to the community library or mark it open-source.
6. Compile and add the script to the chart. Record any compile error with the line number; do not change the Bullseye rules to silence an error.
7. Confirm the chart displays the Bullseye India status panel, supply/demand zone boxes and any historical LONG/SHORT labels. Check the same symbol on both 15m and 1h.
8. Only after compile and visual checks, create a technical alert using the script's `alert()` event and a once-per-bar-close trigger, if that option is available. On Essential, notifications remain inside the platform/app; Telegram and webhooks are paid features.
9. Keep this as personal research/testing only. No broker order placement and no automatic trading.

## Pine compatibility notes for this exact script

The current `indicator/bullseye.pine` already implements strict 3-left/3-right swing-high and swing-low checks manually; it does not depend on `ta.pivothigh()` or `ta.pivotlow()`. The compatibility page marks common series functions (`ta.atr`, `ta.sma`, `ta.ema`, `ta.rsi`), arrays, loops, boxes/labels/plots, and alert functions as tested/supported. `ta.vwap` is listed among functions that run but are not yet test-compared, and realtime alert checking is not tick-for-tick identical to TradingView. Optional confirmations are OFF by default; keep them off for the initial core-rule test.

The compatibility test suite is maintained by the third-party platform. Passing compilation is not evidence of Pine/Node parity. Compare the same completed candle values and signal outputs independently before treating the port as verified.

## What remains separate from this chart test

- The website analyzer continues to use permitted user-supplied OHLCV CSV files only.
- No approved live NSE/BSE intraday source is connected to the Bullseye website.
- No live market-wide scanner or customer alert feed is enabled.
- The existing fixed rule specification in `indicator/RULES.md` remains unchanged: 15m/1h only; 3/3 confirmed pivots; same-side seed-anchored clustering within 0.25 x ATR(14); at least two touches; 0.10 x ATR breakout buffer; volume greater than 1.5 x SMA(volume,20); entry at close; stop 0.20 x ATR beyond the opposite zone edge; 2R target; 12-bar per-zone cooldown.
- Do not merge PR #47, deploy production, enable checkout, deploy the indicator membership migration, or open customer access as part of this test.

## Official platform references

- https://supercharting.com/learn/free-tradingview-alternative
- https://supercharting.com/pine-compatibility
- https://supercharting.com/data-coverage
- https://supercharting.com/disclaimer
- https://supercharting.com/learn/free-telegram-stock-alerts
