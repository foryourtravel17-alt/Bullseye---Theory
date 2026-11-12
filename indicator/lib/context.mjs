function ema(values, period) {
  if (!Array.isArray(values) || !Number.isInteger(period) || period < 1 || values.length < period) return null;
  if (!values.every(Number.isFinite)) return null;
  const alpha = 2 / (period + 1);
  let current = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  for (let i = period; i < values.length; i += 1) current = values[i] * alpha + current * (1 - alpha);
  return current;
}

export function emaTrend(closes, fastPeriod = 20, slowPeriod = 50) {
  if (!Array.isArray(closes) || !Number.isInteger(fastPeriod) || !Number.isInteger(slowPeriod)
    || fastPeriod < 1 || slowPeriod <= fastPeriod || closes.length < slowPeriod) return 'UNAVAILABLE';
  const fast = ema(closes, fastPeriod);
  const slow = ema(closes, slowPeriod);
  if (!Number.isFinite(fast) || !Number.isFinite(slow)) return 'UNAVAILABLE';
  const latestClose = closes[closes.length - 1];
  if (fast > slow && latestClose > fast) return 'BULLISH';
  if (fast < slow && latestClose < fast) return 'BEARISH';
  return 'NEUTRAL';
}

export function rsiValue(closes, period = 14) {
  if (!Array.isArray(closes) || !Number.isInteger(period) || period < 1 || closes.length <= period
    || !closes.every(Number.isFinite)) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = closes[i] - closes[i - 1];
    gains += Math.max(change, 0);
    losses += Math.max(-change, 0);
  }
  let averageGain = gains / period;
  let averageLoss = losses / period;
  for (let i = period + 1; i < closes.length; i += 1) {
    const change = closes[i] - closes[i - 1];
    averageGain = (averageGain * (period - 1) + Math.max(change, 0)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(-change, 0)) / period;
  }
  if (averageGain === 0 && averageLoss === 0) return 50;
  if (averageLoss === 0) return 100;
  if (averageGain === 0) return 0;
  const rs = averageGain / averageLoss;
  return 100 - (100 / (1 + rs));
}

// Pass only candles from the current exchange session; this mirrors session VWAP.
export function vwapValue(candles) {
  if (!Array.isArray(candles) || candles.length === 0) return null;
  let cumulativePriceVolume = 0;
  let cumulativeVolume = 0;
  for (const candle of candles) {
    if (!Number.isFinite(candle?.high) || !Number.isFinite(candle?.low)
      || !Number.isFinite(candle?.close) || !Number.isFinite(candle?.volume) || candle.volume < 0) return null;
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativePriceVolume += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;
  }
  if (!(cumulativeVolume > 0)) return null;
  return cumulativePriceVolume / cumulativeVolume;
}
