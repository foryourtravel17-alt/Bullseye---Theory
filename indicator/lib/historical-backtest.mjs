import { pivots, cluster, detectBreakout, cooldownAllows, recordSignal, isSupportedTimeframe } from './levels.mjs';

const ATR_PERIOD = 14;
const VOLUME_PERIOD = 20;
const LEFT_BARS = 3;
const RIGHT_BARS = 3;
const CLUSTER_ATR = 0.25;
const VOLUME_MULTIPLE = 1.5;
const COOLDOWN_BARS = 12;

function buildIndicators(candles) {
  const trueRanges = [];
  const enriched = [];
  let atr = null;
  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index];
    const previousClose = index > 0 ? candles[index - 1].close : candle.close;
    const trueRange = Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - previousClose),
      Math.abs(candle.low - previousClose)
    );
    if (index < ATR_PERIOD) {
      trueRanges.push(trueRange);
      if (index === ATR_PERIOD - 1) atr = trueRanges.reduce((sum, value) => sum + value, 0) / ATR_PERIOD;
    } else {
      atr = ((atr * (ATR_PERIOD - 1)) + trueRange) / ATR_PERIOD;
    }

    const volumeWindow = candles.slice(Math.max(0, index - VOLUME_PERIOD + 1), index + 1);
    const volumeSma = volumeWindow.length === VOLUME_PERIOD && volumeWindow.every((item) => Number.isFinite(item.volume))
      ? volumeWindow.reduce((sum, item) => sum + item.volume, 0) / VOLUME_PERIOD
      : null;
    enriched.push({ ...candle, atr: index >= ATR_PERIOD - 1 ? atr : null, volumeSma });
  }
  return enriched;
}

/**
 * Run the deterministic Node reference engine over completed OHLCV candles.
 * This is a reference-engine report, not execution of TradingView's Pine runtime.
 */
export function runHistoricalBacktest(inputCandles, timeframe, { excludeLast = true } = {}) {
  if (!Array.isArray(inputCandles)) throw new TypeError('candles must be an array');
  if (!isSupportedTimeframe(timeframe)) throw new RangeError('timeframe must be 15m or 1h');
  const candles = excludeLast ? inputCandles.slice(0, -1) : inputCandles.slice();
  const data = buildIndicators(candles);
  const lastSignalByZone = new Map();
  const signals = [];
  for (let barIndex = 0; barIndex < data.length; barIndex += 1) {
    const candle = data[barIndex];
    if (!Number.isFinite(candle.atr) || !Number.isFinite(candle.volumeSma)
      || !Number.isFinite(candle.volume) || candle.volume <= 0 || candle.volumeSma <= 0) continue;

    const visibleCandles = data.slice(0, barIndex + 1);
    const confirmedPivots = pivots(visibleCandles, LEFT_BARS, RIGHT_BARS);
    const zones = cluster(confirmedPivots, null, CLUSTER_ATR);
    for (const zone of zones) {
      if (!cooldownAllows(zone.id, barIndex, lastSignalByZone, COOLDOWN_BARS)) continue;
      const signal = detectBreakout(candle, zone, candle.atr, candle.volumeSma, VOLUME_MULTIPLE);
      if (!signal) continue;
      recordSignal(zone.id, barIndex, lastSignalByZone);
      signals.push({
        time: candle.time,
        barIndex,
        timeframe,
        zoneId: signal.zoneId,
        direction: signal.direction,
        entry: signal.entry,
        stopLoss: signal.stopLoss,
        target: signal.target,
        risk: signal.risk,
        rewardRisk: signal.rewardRisk,
        volume: candle.volume,
        volumeSma20: candle.volumeSma,
        atr14: candle.atr,
        zoneTouches: signal.touches
      });
      break;
    }
  }

  return {
    engine: 'Bullseye deterministic Node reference engine',
    pineRuntimeExecuted: false,
    timeframe,
    inputCandleCount: inputCandles.length,
    evaluatedCandleCount: candles.length,
    lastRowExcluded: excludeLast && inputCandles.length > 0,
    volumeAvailable: candles.length > 0 && candles.every((candle) => Number.isFinite(candle.volume)),
    firstEvaluatedTime: candles[0]?.time ?? null,
    lastEvaluatedTime: candles.at(-1)?.time ?? null,
    signalCount: signals.length,
    signals
  };
}
