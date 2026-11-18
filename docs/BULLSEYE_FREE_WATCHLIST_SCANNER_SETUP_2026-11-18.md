# Bullseye India — free personal watchlist scanner setup

Date: 18 November 2026  
Status: owner reports the separate private script was saved and added to the RELIANCE 1h chart on 18 Nov 2026; the `Bullseye Scan` pane appeared. This is a successful visual chart-load check, not a parity test or a live customer-alert test. Two individual RELIANCE 1h scanner alerts were accidentally created; keep one and remove the duplicate only after confirming they have the same condition and trigger. The 15m scanner alert and 10-symbol watchlist setup remain pending.

## What this adds

`indicator/bullseye-watchlist-screener.pine` is a separate Pine v6 indicator for the owner's **personal use inside SuperCharting**. It reuses the fixed Bullseye pivot/zone/breakout/volume/stop/target/cooldown rules from `indicator/RULES.md`, and adds titled outputs for the platform's Pine Screener plus named LONG/SHORT `alertcondition()` entries for watchlist alerts.

It does not replace `indicator/bullseye.pine`; keep the existing chart indicator and its two Reliance alerts intact.

## Why this route

SuperCharting currently documents:
- Pine Screener is included on Essential (free), scans up to 100 symbols in one watchlist, one scan at a time, and exposes only titled plots on the latest bar.
- Watchlist alerts can apply a script condition to every symbol in a list; one watchlist alert creates one alert per symbol. A list is copied when the alert is created.
- Essential currently allows up to 100 technical alerts and up to 15 watchlist alerts. One watchlist alert creates a separate technical alert per symbol. Four 10-symbol watchlist alerts (LONG and SHORT on both 15m and 1h) use 40 technical alert slots.
- Pine Screener is included on Essential: up to 100 symbols, one scan at a time, latest bar only, and no more than 20 scans in 10 minutes.
- Script/watchlist alerts run server-side after creation. Essential notifications are in-app toast/sound and the platform inbox. Telegram requires Plus or higher (3 Telegram alerts on Plus); webhook requires Premium or higher. Do not upgrade for this test.

References:
- https://supercharting.com/learn/free-pine-screener-nse
- https://supercharting.com/learn/watchlists-and-watchlist-alerts
- https://supercharting.com/help
- https://supercharting.com/pine-compatibility

## Data rights boundary — important

SuperCharting's data policy licenses market data for the account owner's personal, non-commercial analysis inside SuperCharting. It prohibits copying, scraping, bulk downloading, redistribution, feeding the data into another product/service, or commercial use.

Therefore this workflow is only a personal research/watchlist notification tool inside the owner's own SuperCharting account. Do not forward the market data/signals to Bullseye paid members, expose them on the Bullseye website, or use them as a data feed for the ₹9,999 indicator product. It is not the production data backend and does not remove the separate approved-data-source/Pine-Node parity gate.

## Starter watchlist

Create a private watchlist named `Bullseye India — Starter 10` with these NSE symbols:

- `NSE:RELIANCE`
- `NSE:HDFCBANK`
- `NSE:ICICIBANK`
- `NSE:SBIN`
- `NSE:INFY`
- `NSE:TCS`
- `NSE:LT`
- `NSE:AXISBANK`
- `NSE:BHARTIARTL`
- `NSE:ITC`

This is a starter observation universe, not a recommendation to buy or sell these stocks. The owner may replace names; keep the first validation list to 10 symbols.

## One-time setup

1. In SuperCharting Script Editor, create a new private script named `Bullseye India Watchlist Scanner`.
2. Paste the full contents of `indicator/bullseye-watchlist-screener.pine`, Save, and Add to chart.
3. Confirm it compiles without an error. Do not use Auto-fix or Publish.
4. For one-symbol personal validation, on the RELIANCE 15m chart create an alert with `Bullseye India Watchlist Scanner` → `Any alert() function call`, `Once per bar close`, Open-ended expiry, and Toasts only. This alert covers RELIANCE only; it is not a 10-symbol watchlist alert. For the full watchlist route, use the watchlist's `Alert on this list…` flow and select the named LONG and SHORT conditions separately.
5. For the full 10-symbol watchlist route, create LONG and SHORT list alerts separately at 15m and 1h. This creates four list alerts total, each applying to the 10-symbol list (40 technical-alert slots). The list is copied when each alert is created; later list edits require recreating the alerts.
6. Confirm the Alerts panel shows the four list alerts and their per-symbol alerts. Essential delivers through the platform/app only; Telegram is a paid feature (Plus) and webhook is a paid feature (Premium). No customer Telegram delivery is enabled in this free setup.
7. Run the Pine Screener separately on 15m and 1h, choosing the same watchlist and `Bullseye India Watchlist Scanner`. Filter `Bullseye Signal` greater than 0 for LONG or less than 0 for SHORT. The scan shows the latest bar only; it is not a historical scan and does not itself send alerts.
8. Read the `Bullseye Entry`, `Bullseye Stop`, and `Bullseye Target` columns for the latest signal and open the symbol's chart to review it. The named watchlist `alertcondition()` message carries direction/symbol/timeframe/close; the separate `alert()` call carries dynamic Entry/SL/TP for an individual chart-level alert.

## Limits and cautions

- The screener runs one watchlist at a time, is limited to 100 symbols, and allows at most 20 scans in 10 minutes; it only evaluates the latest bar.
- Four 10-symbol watchlist alerts use 40 of the 100 technical-alert slots. Keep room for the two existing original RELIANCE alerts and the individual scanner test alert.
- The Essential free plan cannot send Telegram alerts or webhook requests. Do not enter the Premium channel as an external data destination through unofficial workarounds.
- A watchlist alert snapshots the current symbols. If the list changes, recreate the watchlist alert to include new members.
- Alerts are best-effort and may be late, duplicated or missed. Check the chart and completed candle before acting.
- Owner-reported visual validation: the new scanner was saved and added to RELIANCE 1h; the separate `Bullseye Scan` pane appeared. The same scanner still needs a 15m chart-load check, latest-bar scan check and alert-delivery check. This does not establish identical-candle Pine/Node parity or signal performance.
- No broker order placement, automated trading, paid-member distribution, external market-data export, or production website feed is included.
