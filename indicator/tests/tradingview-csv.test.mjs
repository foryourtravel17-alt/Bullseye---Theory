import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTradingViewCsv } from '../lib/tradingview-csv.mjs';

const makeCsv = (...lines) => lines.join('\n');

test('parses TradingView OHLCV CSV and converts timezone-aware timestamps', () => {
  const csv = makeCsv(
    'time,open,high,low,close,Volume',
    '2026-11-12T09:15:00+05:30,100,102,99,101,1500',
    '2026-11-12T09:30:00+05:30,101,103,100,102,1800'
  );
  const result = parseTradingViewCsv(csv);
  assert.equal(result.candles.length, 2);
  assert.equal(result.hasVolumeColumn, true);
  assert.equal(result.candles[0].time, '2026-11-12T03:45:00.000Z');
  assert.equal(result.candles[1].volume, 1800);
});

test('supports quoted numeric fields and embedded thousands separators', () => {
  const csv = makeCsv(
    '"Time","Open","High","Low","Close","Volume"',
    '"1794455100","1,000","1,010","990","1,005","2,500"'
  );
  const result = parseTradingViewCsv(csv);
  assert.equal(result.candles[0].open, 1000);
  assert.equal(result.candles[0].volume, 2500);
  assert.equal(result.candles[0].epochMs, 1794455100000);
});

test('missing volume is explicit and never fabricated', () => {
  const csv = makeCsv('time,open,high,low,close', '2026-11-12T09:15:00Z,100,102,99,101');
  const result = parseTradingViewCsv(csv);
  assert.equal(result.hasVolumeColumn, false);
  assert.equal(result.candles[0].volume, null);
});

test('rejects duplicate and out-of-order timestamps', () => {
  const descending = makeCsv(
    'time,open,high,low,close,volume',
    '2026-11-12T09:30:00Z,1,2,0,1,2',
    '2026-11-12T09:15:00Z,1,2,0,1,2'
  );
  const duplicate = makeCsv(
    'time,open,high,low,close,volume',
    '2026-11-12T09:15:00Z,1,2,0,1,2',
    '2026-11-12T09:15:00Z,1,2,0,1,2'
  );
  assert.throws(() => parseTradingViewCsv(descending), /strictly chronological/);
  assert.throws(() => parseTradingViewCsv(duplicate), /strictly chronological/);
});

test('rejects invalid OHLC, negative volume, and broken quotes', () => {
  assert.throws(() => parseTradingViewCsv(makeCsv(
    'time,open,high,low,close,volume',
    '2026-11-12T09:15:00Z,100,99,98,100,1'
  )), /OHLC relationship/);
  assert.throws(() => parseTradingViewCsv(makeCsv(
    'time,open,high,low,close,volume',
    '2026-11-12T09:15:00Z,100,102,98,101,-1'
  )), /Negative volume/);
  assert.throws(() => parseTradingViewCsv('time,open,high,low,close\n2026-11-12T09:15:00Z,"100,102,98,101'), /Unclosed quoted field/);
});
