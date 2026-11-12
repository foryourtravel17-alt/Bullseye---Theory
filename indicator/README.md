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
```bash
npm install --ignore-scripts --no-audit --no-fund
npm test
node --check server.mjs
npm start
```
The local web app uses public Binance market klines. Signal results are displayed in the dashboard only. There is deliberately no Telegram sending path in this release: public Telegram alerts require a separate human-review and approval workflow.

## Security note
The source repository `ai-trending-content-factory` was verified private on 10 Nov 2026. Previously created forks, clones, downloads and caches are not automatically recalled; review those before commercial launch.

## India-market first use
- Open a TradingView chart for the NSE symbol you want to study, then add Bullseye India. Example symbols include NSE:RELIANCE, NSE:TCS, NSE:INFY, NSE:NIFTY and NSE:BANKNIFTY when available in the user's TradingView data entitlement.
- The Pine indicator reads the active chart's own OHLCV. It is not BTC-specific and does not need a separate script for every share.
- Decision signals are supported on 15-minute and 1-hour charts only. Other intervals display an unsupported-timeframe warning.
- Some index feeds may not provide usable volume. When volume is absent or zero, the indicator explicitly blocks volume-qualified signals. VWAP may show N/A when session volume is unavailable.
- It does not scan the whole NSE market in one click. Use TradingView watchlists and open each chart; automatic multi-symbol scanning requires a separate data service and is outside the free-first v1.
- This is an educational chart-analysis tool, not a buy/sell recommendation, guaranteed outcome, or broker execution system.

## Free context tools
The Pine chart includes EMA 20/50 trend, RSI 14 momentum, and intraday VWAP context. These are informational by default. The optional strict-confirmation switch is OFF by default; if enabled, only the confirmation toggles selected by the user gate new signals. The panel marks missing data as N/A.
