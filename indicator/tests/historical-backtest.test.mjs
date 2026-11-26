import test from 'node:test';
import assert from 'node:assert/strict';
import { runHistoricalBacktest } from '../lib/historical-backtest.mjs';

function fixture(count = 100) {
  return Array.from({ length: count }, (_, index) => {
    const close = 100 + Math.sin(index / 3) * 2 + index * 0.08;
    return {
      time: new Date(Date.UTC(2026, 0, 1, 9, 15 + index * 15)).toISOString(),
      open: close - 0.2,
      high: close + 0.8,
      low: close - 0.8,
      close,
      volume: index % 21 === 0 ? 5000 : 1000
    };
  });
}

test('is deterministic and excludes the possibly unfinished last row by default', () => {
  const candles = fixture();
  const first = runHistoricalBacktest(candles, '15m');
  const second = runHistoricalBacktest(candles, '15m');
  assert.deepEqual(first, second);
  assert.equal(first.inputCandleCount, 100);
  assert.equal(first.evaluatedCandleCount, 99);
  assert.equal(first.lastRowExcluded, true);
  assert.equal(first.pineRuntimeExecuted, false);
});

test('including the final row is an explicit opt-in', () => {
  const report = runHistoricalBacktest(fixture(40), '1h', { excludeLast: false });
  assert.equal(report.evaluatedCandleCount, 40);
  assert.equal(report.lastRowExcluded, false);
});

test('rejects unsupported timeframes', () => {
  assert.throws(() => runHistoricalBacktest(fixture(), '5m'), /timeframe must be 15m or 1h/);
});

test('missing volume prevents volume-qualified signals', () => {
  const candles = fixture(80).map((candle) => ({ ...candle, volume: null }));
  const report = runHistoricalBacktest(candles, '15m');
  assert.equal(report.volumeAvailable, false);
  assert.equal(report.signalCount, 0);
});

test('future candles do not rewrite earlier reference-engine signals', () => {
  const candles = fixture(140);
  const prefix = runHistoricalBacktest(candles.slice(0, 100), '15m', { excludeLast: false });
  const full = runHistoricalBacktest(candles, '15m', { excludeLast: false });
  const prefixSignals = full.signals.filter((signal) => signal.barIndex < 100);
  assert.deepEqual(prefixSignals, prefix.signals);
});

test('signals pass volume gates and preserve the exact 1:2 risk/reward contract', () => {
  const closes = Array(30).fill(95).concat([
    97, 99, 104, 101, 98, 99, 101, 103.8, 104.1, 101, 98, 100, 103, 108, 109, 110,
    108, 106, 104, 102, 100, 102, 104, 106, 108, 110, 112, 110, 108, 106,
    104, 102, 100, 98, 100, 102, 104, 106, 108, 110
  ]);
  const candles = closes.map((close, index) => ({
    time: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
    open: close,
    high: close + 0.5,
    low: close - 0.5,
    close,
    volume: index === 43 || index === 44 || index === 57 ? 500 : 100
  }));
  const report = runHistoricalBacktest(candles, '15m', { excludeLast: false });
  assert.ok(report.signalCount > 0);
  for (const signal of report.signals) {
    assert.ok(signal.volume > signal.volumeSma20 * 1.5);
    assert.equal(signal.rewardRisk, 2);
    const actualRR = Math.abs(signal.target - signal.entry) / Math.abs(signal.entry - signal.stopLoss);
    assert.ok(Math.abs(actualRR - 2) < 1e-10);
  }
  assert.equal(new Set(report.signals.map((signal) => signal.barIndex)).size, report.signals.length);
});
