import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../bullseye-watchlist-screener.pine', import.meta.url), 'utf8');

test('watchlist scanner preserves the Bullseye fixed rule constants and close confirmation', () => {
  assert.match(source, /^\/\/@version=6/m);
  assert.match(source, /timeframe\.period == "15" or timeframe\.period == "60"/);
  assert.match(source, /const int leftBars = 3/);
  assert.match(source, /const int rightBars = 3/);
  assert.match(source, /const float clusterAtr = 0\.25/);
  assert.match(source, /const int minTouches = 2/);
  assert.match(source, /const float breakoutAtr = 0\.10/);
  assert.match(source, /const float volumeMultiple = 1\.5/);
  assert.match(source, /const float stopAtr = 0\.20/);
  assert.match(source, /const float targetRR = 2\.0/);
  assert.match(source, /const int cooldownBars = 12/);
  assert.match(source, /if barstate\.isconfirmed and supportedTf and volumeAvailable/);
  assert.match(source, /volume > volumeAverage \* volumeMultiple/);
});

test('scanner exposes titled outputs and separate LONG/SHORT watchlist alert conditions', () => {
  assert.match(source, /plot\(scannerSignal, "Bullseye Signal"/);
  assert.match(source, /plot\(signalEntry, "Bullseye Entry"/);
  assert.match(source, /plot\(signalStop, "Bullseye Stop"/);
  assert.match(source, /plot\(signalTarget, "Bullseye Target"/);
  assert.match(source, /alertcondition\(longSignalNow, title="Bullseye LONG"/);
  assert.match(source, /alertcondition\(shortSignalNow, title="Bullseye SHORT"/);
  assert.match(source, /longSignalNow := isLong/);
  assert.match(source, /shortSignalNow := not isLong/);
});

test('scanner does not request or export other symbols or enable broker execution', () => {
  assert.match(source, /indicator\("Bullseye India Watchlist Scanner", "Bullseye Scan", overlay=false/);
  assert.match(source, /No cross-symbol request\.security calls/);
  assert.doesNotMatch(source, /strategy\.entry|strategy\.order/);
});
