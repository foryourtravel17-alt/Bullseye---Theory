import test from 'node:test';
import assert from 'node:assert/strict';
import { pivots, cluster, detectBreakout, cooldownAllows, recordSignal } from '../lib/levels.mjs';

const LEFT = 3;
const RIGHT = 3;
const CLUSTER_ATR = 0.25;
const MIN_TOUCHES = 2;
const BREAKOUT_ATR = 0.10;
const VOLUME_MULTIPLE = 1.5;
const STOP_ATR = 0.20;
const TARGET_RR = 2;
const COOLDOWN = 12;

function makeFixture() {
  const closes = Array(30).fill(95).concat([
    97, 99, 104, 101, 98, 99, 101, 103.8, 104.1, 101, 98, 100, 103, 108, 109, 110,
    108, 106, 104, 102, 100, 102, 104, 106, 108, 110, 112, 110, 108, 106,
    104, 102, 100, 98, 100, 102, 104, 106, 108, 110
  ]);
  return closes.map((close, index) => ({
    time: index,
    open: close,
    high: close + 0.5,
    low: close - 0.5,
    close,
    volume: index === 43 || index === 44 || index === 57 ? 500 : 100
  }));
}

function addIndicators(input) {
  const trSeed = [];
  const volumes = [];
  let atrValue = null;
  return input.map((c, i) => {
    const previousClose = i ? input[i - 1].close : c.close;
    const tr = Math.max(c.high - c.low, Math.abs(c.high - previousClose), Math.abs(c.low - previousClose));
    if (i < 14) {
      trSeed.push(tr);
      if (i === 13) atrValue = trSeed.reduce((sum, value) => sum + value, 0) / 14;
    } else {
      atrValue = ((atrValue * 13) + tr) / 14;
    }
    volumes.push(c.volume);
    const volSma = i >= 19
      ? volumes.slice(i - 19, i + 1).reduce((sum, value) => sum + value, 0) / 20
      : null;
    return { ...c, atr: i >= 13 ? atrValue : null, volSma };
  });
}

// Independent streaming model of the Pine pivot/zone/signal execution order.
// This does not execute TradingView's Pine runtime; it checks the documented
// sequential Pine algorithm against the batch Node reference on fixed candles.
function runPineStreamingModel(candles) {
  const zones = [];
  const lastSignalByZone = new Map();
  const signals = [];
  const addPivot = (price, pivotAtr, pivotIndex, kind) => {
    let bestIndex = -1;
    let bestDistance = Infinity;
    for (let z = 0; z < zones.length; z += 1) {
      const zone = zones[z];
      if (zone.type !== kind) continue;
      const distance = Math.abs(price - zone.seedPrice);
      const limit = CLUSTER_ATR * Math.min(pivotAtr, zone.seedAtr);
      if (distance <= limit && distance < bestDistance) {
        bestIndex = z;
        bestDistance = distance;
      }
    }
    if (bestIndex < 0) {
      zones.push({
        id: `${kind === 1 ? 'supply' : 'demand'}-${pivotIndex}`,
        type: kind,
        seedIndex: pivotIndex,
        seedPrice: price,
        seedAtr: pivotAtr,
        bottom: price,
        top: price,
        touches: 1
      });
    } else {
      const zone = zones[bestIndex];
      zone.bottom = Math.min(zone.bottom, price);
      zone.top = Math.max(zone.top, price);
      zone.touches += 1;
    }
  };

  for (let barIndex = 0; barIndex < candles.length; barIndex += 1) {
    const candle = candles[barIndex];
    const pivotIndex = barIndex - RIGHT;
    if (pivotIndex >= LEFT && Number.isFinite(candle.atr) && candle.atr > 0) {
      const candidate = candles[pivotIndex];
      let pivotHigh = true;
      let pivotLow = true;
      for (let j = 0; j < RIGHT; j += 1) {
        if (candidate.high <= candles[barIndex - j].high) pivotHigh = false;
        if (candidate.low >= candles[barIndex - j].low) pivotLow = false;
      }
      for (let j = 1; j <= LEFT; j += 1) {
        if (candidate.high <= candles[pivotIndex - j].high) pivotHigh = false;
        if (candidate.low >= candles[pivotIndex - j].low) pivotLow = false;
      }
      const pivotAtr = candidate.atr;
      if (pivotHigh && Number.isFinite(pivotAtr) && pivotAtr > 0) {
        addPivot(candidate.high, pivotAtr, pivotIndex, 1);
      }
      if (pivotLow && Number.isFinite(pivotAtr) && pivotAtr > 0) {
        addPivot(candidate.low, pivotAtr, pivotIndex, -1);
      }
    }

    if (!Number.isFinite(candle.atr) || !Number.isFinite(candle.volSma)
      || !(candle.volume > 0) || !(candle.volSma > 0)) continue;

    for (const zone of zones) {
      if (zone.touches < MIN_TOUCHES) continue;
      if (!cooldownAllows(zone.id, barIndex, lastSignalByZone, COOLDOWN)) continue;
      if (!(candle.volume > candle.volSma * VOLUME_MULTIPLE)) continue;
      let direction = null;
      if (candle.close > zone.top + BREAKOUT_ATR * candle.atr) direction = 'LONG';
      else if (candle.close < zone.bottom - BREAKOUT_ATR * candle.atr) direction = 'SHORT';
      if (!direction) continue;

      const entry = candle.close;
      const stopLoss = direction === 'LONG'
        ? zone.bottom - STOP_ATR * candle.atr
        : zone.top + STOP_ATR * candle.atr;
      const risk = Math.abs(entry - stopLoss);
      if (!(risk > 0)) continue;
      const target = direction === 'LONG' ? entry + TARGET_RR * risk : entry - TARGET_RR * risk;
      recordSignal(zone.id, barIndex, lastSignalByZone);
      signals.push({
        barIndex, zoneId: zone.id, direction, entry, stopLoss, target, risk, rewardRisk: TARGET_RR
      });
      break; // Pine emits at most one alert per confirmed candle.
    }
  }
  return { zones, signals };
}

function runNodeBatchReference(candles) {
  const lastSignalByZone = new Map();
  const signals = [];
  let finalZones = [];
  for (let barIndex = 0; barIndex < candles.length; barIndex += 1) {
    const visible = candles.slice(0, barIndex + 1);
    const confirmedPivots = pivots(visible, LEFT, RIGHT);
    const zones = cluster(confirmedPivots, null, CLUSTER_ATR);
    const candle = candles[barIndex];
    if (Number.isFinite(candle.atr) && Number.isFinite(candle.volSma)) {
      for (const zone of zones) {
        const signal = detectBreakout(candle, zone, candle.atr, candle.volSma, VOLUME_MULTIPLE);
        if (signal && cooldownAllows(zone.id, barIndex, lastSignalByZone, COOLDOWN)) {
          recordSignal(zone.id, barIndex, lastSignalByZone);
          signals.push({
            barIndex,
            zoneId: zone.id,
            direction: signal.direction,
            entry: signal.entry,
            stopLoss: signal.stopLoss,
            target: signal.target,
            risk: signal.risk,
            rewardRisk: signal.rewardRisk
          });
          break;
        }
      }
    }
    if (barIndex === candles.length - 1) finalZones = zones;
  }
  return { zones: finalZones, signals };
}

test('streaming Pine execution model matches Node batch zones and signals on fixed NSE-style fixture', () => {
  const candles = addIndicators(makeFixture());
  const pineModel = runPineStreamingModel(candles);
  const nodeReference = runNodeBatchReference(candles);

  const normalizeZones = (items) => items.filter((zone) => zone.touches >= MIN_TOUCHES).map((zone) => ({
    id: zone.id,
    type: typeof zone.type === 'number' ? (zone.type === 1 ? 'supply' : 'demand') : zone.type,
    seedIndex: zone.seedIndex,
    bottom: zone.bottom,
    top: zone.top,
    touches: zone.touches
  }));
  assert.deepEqual(normalizeZones(pineModel.zones), normalizeZones(nodeReference.zones));
  assert.deepEqual(pineModel.signals, nodeReference.signals);
  assert.ok(nodeReference.signals.length >= 1, 'fixture must exercise at least one confirmed breakout');
});

test('streaming model does not emit when all candles have unavailable volume', () => {
  const candles = addIndicators(makeFixture()).map((candle) => ({ ...candle, volume: 0, volSma: 0 }));
  const result = runPineStreamingModel(candles);
  assert.deepEqual(result.signals, []);
});
