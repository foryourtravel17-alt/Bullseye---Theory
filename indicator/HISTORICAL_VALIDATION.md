# Historical OHLCV CSV validation

Run from the indicator directory with Node.js 20 or newer:

~~~bash
node scripts/validate-tradingview-export.mjs /path/to/export.csv --timeframe 15m --json report.json
~~~

Use --timeframe 1h for hourly candles. The file must contain time/date, open, high, low, close and preferably volume columns. Timestamps must be strictly chronological; malformed OHLC, duplicate/out-of-order timestamps and negative volume are rejected. The tool does not silently sort or repair the data.

The final CSV row is excluded by default because it may be an unfinished live candle. Use --include-last only when you know the file contains completed candles only.

The report runs the deterministic Node reference engine. It does NOT execute TradingView Pine runtime and cannot alone prove Pine parity, live non-repainting or profitability. It is a reproducible reference-engine cross-check, not a trading recommendation.

The validator includes no paid data dependency and requires no API key.
