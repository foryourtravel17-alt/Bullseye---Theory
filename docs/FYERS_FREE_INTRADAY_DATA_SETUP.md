# Free intraday data candidate — FYERS API

Status: **not approved for Bullseye Levels development or commercial use without written permission from FYERS. No FYERS account is connected. Do not build or enable an adapter on the assumption that free API access permits charting-tool development or redistribution.**

TradingView Basic does not provide the CSV export needed by the website's historical analyzer. Do not buy TradingView Pro just to export candles.

## What the official FYERS documentation says

- FYERS says its Trading API and historical/market-data access are free to FYERS clients; the account must be authenticated.
- A non-trading individual app is the right app type when the use is data-only. It does not grant order placement and does not require a static IP.
- The app needs the **Market Data** permission, which includes historical data, market depth and quotes.
- The historical endpoint supports 15-minute and 60-minute candles with OHLCV.
- Standard-plan intraday history is documented as the latest one year; each minute-resolution request is limited to 100 days.
- FYERS access tokens expire daily at 6:30 AM. An individual app belongs only to the account owner; it is not a shared student login.

Official references:
- FYERS API Terms & Conditions: https://fyers.in/terms-and-conditions-api
- https://support.fyers.in/portal/en/kb/articles/does-fyers-charge-any-subscription-fees-for-trading-api
- https://fyers.in/api-docs/v3/api/market-data/historical-data/
- https://fyers.in/api-docs/v3/getting-started/create-an-app/individual-app/
- https://fyers.in/api-docs/v3/getting-started/create-an-app/permission-templates/
- https://fyers.in/api-docs/v3/api/authentication/individual-app/authentication-flow/

## Why this candidate is blocked

FYERS' API Terms & Conditions state that exchange data must not be used for the development of different charting or technical tools, paper trading, gaming or virtual trading, and that scraping/copying/caching for redistribution requires written consent. Bullseye Levels and its website analyzer are charting/technical-analysis tools. Therefore, free API access alone does not grant permission to use FYERS candles for this project. Do not create an adapter or use FYERS data for parity tests unless FYERS confirms the intended use in writing.

The owner currently has no FYERS account, so the API is not connected or available for testing in any case.

## If FYERS later grants written permission

Only after written permission and a suitable account are confirmed, the owner may create an individual non-trading app with Market Data permission. Keep App ID, App Secret and access token private; never paste them into ChatGPT, GitHub source files, screenshots, or a public issue. The access token expires daily. Any approved integration must remain private until its exact use and redistribution scope are cleared.

## Boundaries

- This candidate is not an exchange-wide feed and does not automatically scan NSE/BSE.
- No FYERS API credentials are currently connected to Bullseye Theory.
- FYERS' published API terms restrict using exchange data to develop charting/technical tools and require written consent for redistribution. Do not use FYERS candles for this product, proxy/cache them for customers, republish them, or bundle them into a commercial service unless FYERS provides explicit written permission.
- Use the same completed 15m/1h candles in Pine and Node when checking signal parity. Reject incomplete candles, missing volume, stale data, and malformed OHLC.
- No broker order placement, account trading, or automatic trade execution is included.
