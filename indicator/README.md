# Bullseye Levels — private product source

## Product boundary
- Bullseye India Indicator is planned at ₹9,999 for 365 days, separate from the ₹999 / 85-day Complete Course.
- No broker execution. Educational historical analysis only.
- Payment, entitlement activation and customer access remain manual until separately verified.
- Do not open indicator checkout or deploy this app to production until data-source, Pine/Node parity, historical QA, customer access and compliance gates are complete.

## India-first free workflow
The Pine indicator in `bullseye.pine` reads the OHLCV data already present on the user's TradingView chart; compiling and running this personal script does not require a CSV export or a paid TradingView plan.

The separate website analyzer accepts a user-supplied OHLCV CSV for NSE/BSE symbols. It does not fetch market data. TradingView Free does not provide the CSV export the owner needs, so do not make TradingView CSV export a launch task. FYERS is a documented free historical-data candidate for the owner's own testing (15m/60m, authenticated Market Data app, daily token renewal), but no account is connected and no customer redistribution permission is verified. See `docs/FYERS_FREE_INTRADAY_DATA_SETUP.md`. Do not treat it as an approved commercial data source.
- Required CSV columns: time/date/timestamp, open, high, low, close. Volume is required for volume-qualified signals; when missing, the reference engine cannot emit signals.
- Supported intervals: 15m and 1h only.
- Upload limit: 5 MB. The server parses the file in memory; it does not save uploaded files.
- The final row is excluded by default because it may be unfinished.
- This workflow does not provide automatic NSE-wide scanning, exchange data licensing, or live data redistribution.

## Fixed Bullseye Levels rules
Do not change these without explicit owner approval:
- 3-bar left / 3-bar right confirmed swing pivots.
- Cluster same-side pivots within 0.25 x ATR(14); at least 2 touches per zone.
- Breakout close beyond zone edge by 0.10 x ATR(14), with volume > SMA(volume,20) x 1.5.
- Entry at breakout close; stop beyond opposite zone edge by 0.20 x ATR; target at 2R.
- 15m and 1h only; 12-bar per-zone cooldown.

## Local test
From this directory:
~~~bash
npm install --ignore-scripts --no-audit --no-fund
npm test
node --check server.mjs
npm start
~~~
Open http://localhost:3000. Upload a permitted OHLCV CSV from a broker/data source. The Pine script itself can be compiled and run on a TradingView chart without exporting a CSV.

The report executes the deterministic Node reference engine, not TradingView's Pine runtime. It cannot by itself prove Pine/TradingView parity, live non-repainting or profitability. Without the same completed candles, exact numerical Pine/Node parity remains unverified. Do not present the analyzer as a live signal service.

## Security and release gates
- No Telegram sending path or broker order execution is included.
- Checkout flags must remain disabled until payment verification and access controls are implemented and tested.
- Do not deploy to production or merge the release PR without owner approval.
- Before commercial launch, review previously created forks, clones, downloads and caches of the private source repository.
