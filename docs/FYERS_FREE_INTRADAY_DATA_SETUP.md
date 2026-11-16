# Free intraday data candidate — FYERS API

Status: **candidate for the owner's own testing only; not connected to the website and not approved as a commercial customer data feed.**

TradingView Basic does not provide the CSV export needed by the website's historical analyzer. Do not buy TradingView Pro just to export candles.

## What the official FYERS documentation says

- FYERS says its Trading API and historical/market-data access are free; the account must be authenticated.
- A non-trading individual app is the right app type when the use is data-only. It does not grant order placement and does not require a static IP.
- The app needs the **Market Data** permission, which includes historical data, market depth and quotes.
- The historical endpoint supports 15-minute and 60-minute candles with OHLCV.
- Standard-plan intraday history is documented as the latest one year; each minute-resolution request is limited to 100 days.
- FYERS access tokens expire daily at 6:30 AM. An individual app belongs only to the account owner; it is not a shared student login.

Official references:
- https://support.fyers.in/portal/en/kb/articles/does-fyers-charge-any-subscription-fees-for-trading-api
- https://fyers.in/api-docs/v3/api/market-data/historical-data/
- https://fyers.in/api-docs/v3/getting-started/create-an-app/individual-app/
- https://fyers.in/api-docs/v3/getting-started/create-an-app/permission-templates/
- https://fyers.in/api-docs/v3/api/authentication/individual-app/authentication-flow/

## Owner setup (manual)

1. If you already have a FYERS account, sign in to the official FYERS API dashboard.
2. Create an **individual non-trading app** (not a trading app).
3. Set the redirect URI exactly as required by FYERS; their documented default redirect page is shown in the official app guide.
4. Choose the **Market Data** permission only. Do not enable order placement.
5. Keep the App ID, App Secret and access token private. Never paste them into ChatGPT, GitHub source files, screenshots, or a public issue.
6. The access token expires daily. Expect a fresh owner login/token step for each testing day.
7. Only after the account is available can we add and test a local Node.js candle-fetch adapter that writes the existing analyzer's CSV format.

## Boundaries

- This candidate is not an exchange-wide feed and does not automatically scan NSE/BSE.
- No FYERS API credentials are currently connected to Bullseye Theory.
- No market-data license or redistribution permission for a paid multi-user website has been verified. Do not proxy, cache for customers, republish, or bundle FYERS candles into a commercial service until the applicable FYERS terms/permissions are confirmed.
- Use the same completed 15m/1h candles in Pine and Node when checking signal parity. Reject incomplete candles, missing volume, stale data, and malformed OHLC.
- No broker order placement, account trading, or automatic trade execution is included.
