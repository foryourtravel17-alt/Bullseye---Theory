# Bullseye India v1 — Design

Date: 2026-11-13
Status: approved by owner delegation for free-first implementation
Owner intent: provide the most useful zero-cost TradingView indicator experience for Indian-market clients; owner will review a plain-language launch summary later.

## Intent
Turn Bullseye Levels into a symbol-agnostic indicator whose default guidance and examples prioritize NSE-listed shares and Indian indices. It must calculate from the chart's own OHLCV data, not depend on BTC, a paid data API, paid hosting, or a paid TradingView plan.

## Goals
- Work on any TradingView chart symbol with usable OHLCV, including NSE cash equities, NIFTY/BANKNIFTY indices where volume exists, and exchange-listed futures where TradingView supplies the data.
- Clearly identify the active exchange/ticker/timeframe and warn when chart volume is unavailable or the timeframe is unsupported.
- Keep the deterministic supply/demand breakout engine and confirmed-bar/no-repaint intent.
- Add optional, transparent trend/momentum context (EMA alignment, VWAP when meaningful, RSI) that can confirm or filter a setup without silently changing the core breakout rules.
- Improve chart readability by limiting visible historical zones/labels and providing simple display toggles.
- Keep all calculations local to TradingView Pine and the existing Node test engine; no paid API or server required.
- Keep the product educational; no broker orders or guaranteed returns.

## Non-goals
- No stock screener that scans all NSE tickers simultaneously; Pine indicators run on the chart symbol. Watchlists/multiple charts are the free-first workflow.
- No automatic broker execution, Telegram/WhatsApp signal delivery, paid market-data ingestion, or auto-granting TradingView access.
- No claim that every NSE symbol/index has reliable volume or supports every interval.

## Constraints
- Pine Script v6; existing Node.js ESM tests remain.
- Supported decision timeframes remain 15m and 1h in v1.
- Signals use completed candles only; barstate.isconfirmed and once-per-bar-close alerts.
- Default chart workflow is Indian exchange symbols selected by the client (for example NSE:RELIANCE, NSE:TCS, NSE:INFY, NSE:NIFTY, NSE:BANKNIFTY where available in their TradingView data plan).
- Existing ₹999 course and ₹9,999 annual indicator membership boundaries are not changed here.
- No production deploy, script publication, checkout activation, or merge into release branch in this task.

## Approaches considered
1. One universal chart-symbol indicator (chosen): no hard-coded instrument; reads current chart OHLCV and is configured for Indian symbols by default guidance. Lowest maintenance and works with available free chart data.
2. Separate stock/index/F&O scripts: rejected for v1 because it duplicates logic and creates drift.
3. External scanner/data service: rejected because it adds cost, keys, uptime and compliance burden.

## Design decisions
- Core breakout conditions remain unchanged.
- EMA 20/50 trend state, RSI 14 momentum context, and VWAP context are informational by default. Optional strict-confirmation mode can require selected confirmations before a label/alert.
- VWAP is shown only when the symbol/timeframe provides meaningful intraday session data; unavailable values are reported as N/A, never fabricated.
- A compact status panel reports symbol, exchange, timeframe support, volume availability, trend, RSI and VWAP context.
- Limit visible historical zones to a user-configurable small maximum; keep zone state and signal cooldown deterministic.
- NSE is a product focus, not a symbol lock: indicator remains usable on any supported chart symbol.
