import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../bullseye.pine', import.meta.url), 'utf8');

test('Pine source retains confirmed-bar, supported-timeframe and strict volume gates', () => {
  assert.match(source, /^\/\/@version=6/m);
  assert.match(source, /timeframe\.period == "15" or timeframe\.period == "60"/);
  assert.match(source, /barstate\.isconfirmed/);
  assert.match(source, /volume > volumeAverage \* volumeMultiple/);
  assert.match(source, /alert\.freq_once_per_bar_close/);
});

test('optional context confirmations are off by default and do not alter default core signals', () => {
  assert.match(source, /strictConfirmations = input\.bool\(false/);
  assert.match(source, /useEmaConfirm = input\.bool\(false/);
  assert.match(source, /useRsiConfirm = input\.bool\(false/);
  assert.match(source, /useVwapConfirm = input\.bool\(false/);
  assert.match(source, /longContextPass = not strictConfirmations or longContextReady/);
  assert.match(source, /shortContextPass = not strictConfirmations or shortContextReady/);
});

test('Pine source includes chart symbol context and bounded chart drawings', () => {
  assert.match(source, /syminfo\.tickerid/);
  assert.match(source, /maxVisibleZones/);
  assert.match(source, /maxVisibleLabels/);
  assert.match(source, /N\/A · NO SIGNAL/);
});
