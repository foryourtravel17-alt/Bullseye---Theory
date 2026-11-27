import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const pine = readFileSync(new URL('../bullseye.pine', import.meta.url), 'utf8');
const levels = readFileSync(new URL('../lib/levels.mjs', import.meta.url), 'utf8');
const backtest = readFileSync(new URL('../lib/historical-backtest.mjs', import.meta.url), 'utf8');

const rules = [
  ['leftBars', 3, /const int LEFT_BARS = (\d+);/, /const int leftBars = (\d+)/],
  ['rightBars', 3, /const int RIGHT_BARS = (\d+);/, /const int rightBars = (\d+)/],
  ['atrLength', 14, /const int ATR_PERIOD = (\d+);/, /const int atrLength = (\d+)/],
  ['clusterAtr', 0.25, /const float CLUSTER_ATR = ([\d.]+);/, /const float clusterAtr = ([\d.]+)/],
  ['minTouches', 2, null, /const int minTouches = (\d+)/],
  ['breakoutAtr', 0.10, null, /const float breakoutAtr = ([\d.]+)/],
  ['volumeLength', 20, /const int VOLUME_PERIOD = (\d+);/, /const int volumeLength = (\d+)/],
  ['volumeMultiple', 1.5, /const float VOLUME_MULTIPLE = ([\d.]+);/, /const float volumeMultiple = ([\d.]+)/],
  ['stopAtr', 0.20, null, /const float stopAtr = ([\d.]+)/],
  ['targetRR', 2.0, null, /const float targetRR = ([\d.]+)/],
  ['cooldownBars', 12, /const int COOLDOWN_BARS = (\d+);/, /const int cooldownBars = (\d+)/],
];

function capture(source, pattern, label) {
  const match = source.match(pattern);
  assert.ok(match, label + ' constant missing');
  return Number(match[1]);
}

for (const [name, expected, nodePattern, pinePattern] of rules) {
  const pineValue = capture(pine, pinePattern, 'Pine ' + name);
  assert.equal(pineValue, expected, 'Pine ' + name + ' differs from approved rule');
  if (nodePattern) {
    const nodeValue = capture(backtest, nodePattern, 'Node ' + name);
    assert.equal(nodeValue, expected, 'Node ' + name + ' differs from approved rule');
  }
}

assert.match(pine, /timeframe\.period == "15" or timeframe\.period == "60"/,
  'Pine must restrict chart signals to 15m and 1h');
assert.match(levels, /tf === '15m' \|\| tf === '1h'/,
  'Node must restrict analyzer to 15m and 1h');
assert.match(pine, /barstate\.isconfirmed/,
  'Pine signals must be evaluated on confirmed bars');
assert.match(pine, /volume > volumeAverage \* volumeMultiple/,
  'Pine volume filter must use strict > 1.5x SMA20');
assert.match(pine, /close > top \+ breakoutAtr \* atrValue/,
  'Pine long breakout buffer is missing');
assert.match(pine, /close < bottom - breakoutAtr \* atrValue/,
  'Pine short breakout buffer is missing');
assert.match(pine, /bottom - stopAtr \* atrValue : top \+ stopAtr \* atrValue/,
  'Pine stop-loss formula differs from approved rule');
assert.match(pine, /risk \* targetRR/,
  'Pine target must be 2R');
assert.match(pine, /bar_index - lastSignal >= cooldownBars/,
  'Pine per-zone cooldown is missing');
assert.match(levels, /candle\.close > zone\.top \+ 0\.10 \* atr/,
  'Node long breakout buffer differs from approved rule');
assert.match(levels, /candle\.close < zone\.bottom - 0\.10 \* atr/,
  'Node short breakout buffer differs from approved rule');
assert.match(levels, /zone\.bottom - 0\.20 \* atr/,
  'Node long stop-loss formula differs from approved rule');
assert.match(levels, /zone\.top \+ 0\.20 \* atr/,
  'Node short stop-loss formula differs from approved rule');

console.log('Bullseye rule contract OK: Pine and Node fixed parameters match the approved 15m/1h specification.');
console.log('This is a static source-contract check only; it does not execute TradingView Pine or establish numerical runtime parity.');
