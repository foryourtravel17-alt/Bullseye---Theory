# Bullseye India v1 Implementation Plan

> For agentic workers: use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make Bullseye Levels more useful for Indian-market clients without paid data or hosting, while preserving universal chart-symbol support.

**Architecture:** Pine Script v6 reads the active TradingView chart symbol and computes optional context filters locally. Node.js remains the deterministic reference for core levels and receives tests for any shared rule changes. Documentation explains Indian symbol selection and free-tier limitations.

**Tech Stack:** Pine Script v6, Node.js 20+, node:test, GitHub Actions.

**Spec:** docs/superpowers/specs/2026-11-13-bullseye-india-v1-design.md

## Global Constraints
- No paid API, hosting, or market data dependency.
- Core timeframes remain 15m and 1h.
- Completed candles only; no repainting by design.
- No broker execution or automatic public alerts.
- Do not merge to release or deploy production.

## Review Focus
- NSE symbols with no usable volume must show a warning and never create volume-qualified signals.
- Index symbols with missing VWAP/session volume must show N/A without runtime errors.
- Switching symbols/timeframes must not leak old zone drawings or cooldown state.
- EMA/RSI filters disabled must preserve existing core signal behavior.
- Large history must stay within Pine drawing-object limits.

---

### Task 1: Indian-market usage contract

**Files:**
- Modify: indicator/README.md
- Modify: indicator/RULES.md

**Interfaces:**
- Consumes: current Pine chart symbol and OHLCV.
- Produces: documented NSE share/index/futures setup and limitations.

- [x] Add Indian market examples, chart-symbol workflow, supported timeframe note, volume/VWAP limitations, and no-all-market-screener disclaimer.
- [x] Verify README/RULES agree and no paid service is required.

### Task 2: Context calculation tests

**Files:**
- Modify: indicator/lib/levels.mjs
- Modify: indicator/tests/levels.test.mjs

**Interfaces:**
- Add pure helpers for EMA trend state, RSI context and safe VWAP availability.
- Return explicit neutral/unavailable states for insufficient or invalid data.

- [x] Write tests for EMA alignment/price confirmation, RSI boundaries/insufficient history, and VWAP missing-volume handling.
- [x] Targeted Node helper tests authored.
- [x] Implement minimal helpers.
- [x] Full Node test suite passed in GitHub Actions run #16 on the latest commit (indicator-tests job, deterministic engine tests and server syntax check).

### Task 3: Pine India context panel and optional confirmations

**Files:**
- Modify: indicator/bullseye.pine

**Interfaces:**
- Preserve core zone/breakout equations.
- Add user toggles for EMA trend, RSI momentum and VWAP context; optional confirmation mode defaults OFF.
- Display ticker/exchange/timeframe, volume status and context in a compact panel.
- Cap visible zone drawings and signal labels.

- [x] Implement Pine changes matching documented rules.
- [x] TradingView Pine Editor compiled and added the indicator to a BTCUSD 15-minute chart; the context panel rendered successfully (owner screenshot, 13 Nov 2026).
- [x] Verify NSE equity charts: RELIANCE and TCS on 15m and 1h; owner screenshots show indicator panel, confirmed timeframe and available volume (13 Nov 2026).
- [x] Verify NSE index charts: NIFTY 50 and BANKNIFTY on 15m and 1h; owner screenshots show indicator panel, confirmed timeframe and available volume (13 Nov 2026).
- [ ] Verify NSE stock/index futures feeds separately; not required for the initial equity/index release and not yet tested.
- [ ] Validate historical signal parity, completed-bar behaviour and non-repainting across fixed candle fixtures; visual chart loading is not a profitability or signal-accuracy test.

### Task 4: Final validation and review

**Files:**
- Modify: indicator/README.md if needed.

- [x] Full Node test suite and server syntax checks passed in GitHub Actions run #16; v1.1 overlay contract tests and engine suite passed in run #21.
- [x] Fixed ATR % panel value contrast for light-theme charts and added a regression contract test; GitHub Actions run #26 passed on the resulting head.
- [x] Inspect current PR diff for secrets, paid dependencies, BTC-only assumptions, and public-publishing behavior.
- [x] Open draft PR #45; do not merge, publish, deploy, or activate checkout.
