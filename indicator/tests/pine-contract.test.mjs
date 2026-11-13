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

test('Pine drawing cleanup tracks zone indices without comparing drawing object IDs', () => {
  assert.match(source, /var array<int> visibleZoneIndices = array.new_int\(\)/);
  assert.match(source, /array.push\(visibleZoneIndices, bestIndex\)/);
  assert.match(source, /int oldestZoneIndex = array.shift\(visibleZoneIndices\)/);
  assert.match(source, /array.set\(zoneBoxes, oldestZoneIndex, na\)/);
  assert.doesNotMatch(source, /array\.get\(zoneBoxes, zoneIndex\) == oldest/);
});

test('India intraday toolkit includes prior-day levels, EMA200, relative volume and ATR context', () => {
  assert.ok(source.includes('request.security(syminfo.tickerid, "D", high[1], lookahead=barmerge.lookahead_on)'));
  assert.ok(source.includes('request.security(syminfo.tickerid, "D", low[1], lookahead=barmerge.lookahead_on)'));
  assert.ok(source.includes('plot(showPriorDayLevels ? previousDayHigh'));
  assert.ok(source.includes('plot(showPriorDayLevels ? previousDayLow'));
  assert.ok(source.includes('plot(showEma200 ? emaLong'));
  assert.ok(source.includes('relativeVolume = volumeAvailable ? volume / volumeAverage : na'));
  assert.ok(source.includes('"Rel. Volume"'));
  assert.ok(source.includes('"ATR %"'));
  assert.ok(source.includes('table.new(position.top_right, 2, 10'));
});


test('ATR percentage value uses a contrasting panel cell style on light charts', () => {
  assert.match(source, /table\.cell\(statusTable, 1, 9, na\(atrPercent\) \? "N\/A" : str\.tostring\(atrPercent, "#\.00"\) \+ "%", text_color=color\.black, bgcolor=color\.new\(color\.silver, 75\)\)/);
});
