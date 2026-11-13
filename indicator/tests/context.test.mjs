import test from 'node:test';
import assert from 'node:assert/strict';
import { emaTrend, rsiValue, vwapValue } from '../lib/context.mjs';

test('EMA trend requires both EMA alignment and price confirmation', () => {
  assert.equal(emaTrend([1, 2, 3, 4, 5], 2, 3), 'BULLISH');
  assert.equal(emaTrend([5, 4, 3, 2, 1], 2, 3), 'BEARISH');
  assert.equal(emaTrend([1, 2, 3, 2.5], 2, 3), 'NEUTRAL');
  assert.equal(emaTrend([1, 2], 2, 3), 'UNAVAILABLE');
});

test('EMA helper uses the same first-value seed as TradingView ta.ema', () => {
  // EMA(2) over [10, 20, 30] = 10 -> 16.6667 -> 25.5556.
  // EMA(3) over [10, 20, 30] = 10 -> 15 -> 22.5.
  // The last close is above both, so the trend is bullish.
  assert.equal(emaTrend([10, 20, 30], 2, 3), 'BULLISH');
});

test('RSI uses Wilder smoothing and handles insufficient or flat data safely', () => {
  assert.equal(rsiValue([1, 2, 3, 4, 5], 3), 100);
  assert.equal(rsiValue([5, 4, 3, 2, 1], 3), 0);
  assert.equal(rsiValue([2, 2, 2, 2], 3), 50);
  assert.equal(rsiValue([1, 2], 3), null);
});

test('VWAP returns null when volume is missing, zero or invalid', () => {
  assert.equal(vwapValue([{ high: 11, low: 9, close: 10, volume: 0 }]), null);
  assert.equal(vwapValue([{ high: 11, low: 9, close: 10 }]), null);
  assert.equal(vwapValue([{ high: 11, low: 9, close: 10, volume: 5 }]), 10);
});
