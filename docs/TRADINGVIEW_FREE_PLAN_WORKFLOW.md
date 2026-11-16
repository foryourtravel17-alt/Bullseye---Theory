# TradingView Free Plan — Bullseye Levels workflow

## What can be done without Pro
- Open the existing Pine Script v6 source at `indicator/bullseye.pine`.
- Open Supercharts → Pine Editor, paste the v6 source, then use **Add to chart** to compile/run it as a temporary chart draft. If the account blocks saving, do not buy a plan just for this check; use the temporary draft where available.
- Use only 15-minute and 1-hour charts. The script deliberately blocks other timeframes.
- Check that the indicator loads without a Pine compiler/runtime error and that the status panel shows a supported timeframe and volume availability.
- Do not select **Publish script** or try to create invite-only access on the Basic plan; public script publishing may be unavailable on Basic. Do not create a paid alert or purchase TradingView Pro/Premium for this project.

## What cannot be claimed yet
- The Node reference engine and synthetic tests are not the TradingView Pine runtime.
- The website analyzer accepts user-supplied OHLCV CSV; it does not fetch live NSE/BSE candles.
- TradingView Free CSV export is not a required workflow and must not be assumed available.
- If no permitted source can provide the same 15m/1h OHLCV candles to both implementations, real-market Pine/Node parity remains unverified.

## Free-first validation route
1. Compile the Pine source in TradingView Free and record any compiler error verbatim.
2. If the user already has access to a broker or market-data platform that permits OHLCV export, use its 15m/1h CSV. Do not share credentials or API tokens in chat.
3. Upload the same candle sequence to the private website analyzer preview and use the Pine chart on the matching symbol/timeframe.
4. Compare timestamps, signal side, entry, stop, target and cooldown behavior.
5. If no lawful/free CSV source is available, stop at deterministic regression fixtures and report the limitation; do not substitute daily Bhavcopy for 15m/1h validation.

## Fixed strategy rules — preserve
- 15m and 1h only.
- Confirmed 3-left / 3-right swing pivots.
- Same-side pivots cluster within 0.25 × ATR(14), minimum 2 touches.
- LONG close > zone top + 0.10 × ATR and volume > SMA(volume,20) × 1.5.
- SHORT close < zone bottom − 0.10 × ATR with the same volume filter.
- Entry at breakout close; stop beyond opposite zone edge by 0.20 × ATR; target 2R; 12-bar per-zone cooldown.
- No repainting: use confirmed pivots and confirmed candles only.

## Product distinction
The ₹9,999 / 365-day v1 product in the release candidate is the Bullseye India website-based historical analyzer, not a TradingView invite-only script entitlement. The Pine Script is a separate TradingView companion. Checkout remains closed until the data source, customer entitlement and support workflow are reviewed.
