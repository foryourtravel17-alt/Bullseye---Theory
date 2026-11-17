# Bullseye India — free personal watchlist scanner setup

Date: 18 November 2026  
Status: scanner script prepared in a separate branch; SuperCharting compile and alert test still require owner verification.

## What this adds

`indicator/bullseye-watchlist-screener.pine` is a separate Pine v6 indicator for the owner's **personal use inside SuperCharting**. It reuses the fixed Bullseye pivot/zone/breakout/volume/stop/target/cooldown rules from `indicator/RULES.md`, and adds titled outputs for the platform's Pine Screener plus named LONG/SHORT `alertcondition()` entries for watchlist alerts.

It does not replace `indicator/bullseye.pine`; keep the existing chart indicator and its two Reliance alerts intact.

## Why this route

SuperCharting currently documents:
- Pine Screener is included on Essential (free), scans up to 100 symbols in one watchlist, one scan at a time, and exposes only titled plots on the latest bar.
- Watchlist alerts can apply a script condition to every symbol in a list; one watchlist alert creates one alert per symbol. A list is copied when the alert is created.
- Essential currently allows up to 100 technical alerts and up to 15 watchlist alerts. A 10-symbol starter list with two conditions on two intervals uses 40 technical alert slots.
- Script alerts run server-side after the alert is created. Essential notifications are in-app (toast/sound); Telegram requires Plus or higher and webhook requires Premium or higher.

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
4. On a 15m chart, open `Alert on this list…` for `Bullseye India — Starter 10`. Select the new scanner and `Any alert() function call`, then choose `Once per bar close`. This single alert covers both LONG and SHORT and its message includes Entry, SL and TP.
5. Switch the active chart to 1h and create the same watchlist alert. This creates two watchlist alerts total, each applying to the 10-symbol list.
6. Confirm Alerts panel shows the two list alerts and their per-symbol alerts. Essential in-app notifications only; no Telegram/webhook on the free plan. If the watchlist dialog does not offer `Any alert() function call`, stop and send a screenshot rather than creating incomplete alerts.
7. Run the Pine Screener separately on 15m and 1h, choosing the same watchlist and `Bullseye India Watchlist Scanner`. Filter `Bullseye Signal` greater than 0 for LONG or less than 0 for SHORT. It reports the latest bar only; it is not a historical scan.
8. Check one signal row's Entry, Stop and Target columns against its chart. Treat the screener result as a research alert, not a trade instruction.

## Limits and cautions

- The screener runs one watchlist at a time and is limited to 100 symbols; do not run rapid repeated scans.
- The Essential free plan's technical-alert cap is 100. Two 10-symbol watchlist alerts use 20 technical alert slots; do not expand the list without checking remaining capacity.
- A watchlist alert snapshots the current symbols. If the list changes, recreate the watchlist alert to include new members.
- Alerts are best-effort and may be late, duplicated or missed. Check the chart and completed candle before acting.
- The Pine screener script has not yet been compiled on the user's account or parity-tested against the Node engine. Keep the original chart script and existing Reliance alerts until this new scanner script passes compile and one-symbol validation.
- No broker order placement, automated trading, paid-member distribution, external market-data export, or production website feed is included.
