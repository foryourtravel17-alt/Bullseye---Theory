# Bullseye Levels — private product source

This directory is the private-repository copy of the Bullseye Levels engine and TradingView Pine source.

## Product boundary
- Product: Bullseye Levels annual membership — ₹9,999 for 365 days, prepaid; customer initiates each renewal.
- Separate from the ₹999 / 85-day Complete Course.
- No broker execution. Educational scenarios only.
- TradingView grant, extension and removal remain manual owner/admin actions; no supported access-management API has been verified.
- Do not open indicator checkout or publish the script until TradingView Pine compilation, Node/Pine parity, historical and forward QA, eligibility, payment entitlement migration, and manual access audit are complete.

## Local test
From this directory:
~~~bash
npm install --ignore-scripts --no-audit --no-fund
npm test
node --check server.mjs
npm start
~~~
The local web app uses public Binance market klines. Signal results are displayed in the dashboard only. There is deliberately no Telegram sending path in this release: public Telegram alerts require a separate human-review and approval workflow.

## Security note
The source repository ai-trending-content-factory was verified private on 10 Nov 2026. Previously created forks, clones, downloads and caches are not automatically recalled; review those before commercial launch.

## India-market first use
- Open a TradingView chart for the NSE symbol you want to study, then add Bullseye India. Example symbols include NSE:RELIANCE, NSE:TCS, NSE:INFY, NSE:NIFTY and NSE:BANKNIFTY when available in the user's TradingView data entitlement.
- The Pine indicator reads the active chart's own OHLCV. It is not BTC-specific and does not need a separate script for every share.
- Decision signals are supported on 15-minute and 1-hour charts only. Other intervals display an unsupported-timeframe warning.
- Some index feeds may not provide usable volume. When volume is absent or zero, the indicator explicitly blocks volume-qualified signals. VWAP may show N/A when session volume is unavailable.
- It does not scan the whole NSE market in one click. Use TradingView watchlists and open each chart; automatic multi-symbol scanning requires a separate data service and is outside the free-first v1.
- This is an educational chart-analysis tool, not a buy/sell recommendation, guaranteed outcome, or broker execution system.

## Free context tools
The Pine chart includes EMA 20/50 trend, RSI 14 momentum, and intraday VWAP context. These are informational by default. The optional strict-confirmation switch is OFF by default; if enabled, only the confirmation toggles selected by the user gate new signals. The panel marks missing data as N/A.

## Expanded intraday toolkit (v1.1 draft)
- Previous Day High/Low reference levels from the prior completed daily candle.
- EMA 200 long-term trend reference.
- Relative volume (chart-bar volume / 20-bar average) and ATR percentage context.
- These are optional visual/context tools; they do not silently change the core breakout rules or guarantee a setup.
- The same universal indicator is intended for liquid NSE symbols; no stock-specific duplicate scripts are required. Example watchlist for owner/client QA: HDFCBANK, ICICIBANK, SBIN, AXISBANK, KOTAKBANK, RELIANCE, BHARTIARTL, BAJFINANCE, INFY, TCS, TATASTEEL and PNB. Check current liquidity and spreads before trading; symbol activity changes day to day.

## Automated historical CSV validation
A free, dependency-light validator is included for TradingView-style OHLCV CSV files. From this indicator directory:

~~~bash
node scripts/validate-tradingview-export.mjs /path/to/export.csv --timeframe 15m --json report.json
~~~

Use 1h for hourly data. The parser validates timestamps, chronological order, OHLC relationships, volume values and missing columns. It does not silently sort or repair candles. The deterministic Node reference engine then generates a JSON signal report. The final row is excluded by default because it may be an unfinished live candle; add --include-last only when the file is known to contain completed candles only.

This report executes the Node reference engine, not TradingView's Pine runtime. It cannot by itself prove Pine/TradingView parity, live non-repainting or profitability. It is a reproducible reference-engine cross-check, not a trading recommendation. No paid data dependency or API key is required.

Run npm test to execute CSV parser, invalid-data, missing-volume, signal risk/reward and historical-prefix stability checks.
