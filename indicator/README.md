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
