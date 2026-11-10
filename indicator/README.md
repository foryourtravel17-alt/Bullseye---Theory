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
The local web app uses public Binance market klines. Telegram alerts are disabled unless `BULLSEYE_TELEGRAM_ALERTS_ENABLED=true` is explicitly set together with `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. Do not set these in production before owner approval.

## Security note
The source also exists in the public `ai-trending-content-factory` pull request. This private copy does not make the public copy private. Before commercial launch, change that repository to private and review the public PR, branches, forks and any cached copies. Do not assume a private copy retracts already-public source.
