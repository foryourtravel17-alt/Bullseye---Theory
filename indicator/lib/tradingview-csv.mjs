const REQUIRED_COLUMNS = ['open', 'high', 'low', 'close'];

function splitCsvLine(line, lineNumber) {
  const fields = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === ',') {
      fields.push(value);
      value = '';
    } else if (char === '"') {
      if (value.length !== 0) throw new Error(`Unexpected quote on CSV line ${lineNumber}`);
      quoted = true;
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error(`Unclosed quoted field on CSV line ${lineNumber}`);
  fields.push(value);
  return fields;
}

function normalizeHeader(value) {
  return value.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseTime(value, lineNumber) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`Missing time on CSV line ${lineNumber}`);
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    const numeric = Number(trimmed);
    const epochMs = Math.abs(numeric) < 100_000_000_000 ? numeric * 1000 : numeric;
    if (!Number.isFinite(epochMs) || !Number.isFinite(new Date(epochMs).getTime())) {
      throw new Error(`Invalid numeric timestamp on CSV line ${lineNumber}`);
    }
    return { epochMs, isoTime: new Date(epochMs).toISOString() };
  }
  const epochMs = Date.parse(trimmed);
  if (!Number.isFinite(epochMs)) throw new Error(`Invalid timestamp on CSV line ${lineNumber}: ${trimmed}`);
  return { epochMs, isoTime: new Date(epochMs).toISOString() };
}

function parseNumber(value, column, lineNumber, { optional = false } = {}) {
  const trimmed = value.trim();
  if (optional && trimmed === '') return null;
  if (trimmed === '') throw new Error(`Missing ${column} on CSV line ${lineNumber}`);
  const parsed = Number(trimmed.replaceAll(',', ''));
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${column} on CSV line ${lineNumber}`);
  return parsed;
}

/** Parse TradingView-style OHLCV CSV without silently sorting or repairing candles. */
export function parseTradingViewCsv(csvText) {
  if (typeof csvText !== 'string' || csvText.trim() === '') throw new TypeError('CSV content must be a non-empty string');
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length < 2) throw new Error('CSV must contain a header and at least one candle row');

  const headers = splitCsvLine(lines[0], 1).map(normalizeHeader);
  const timeAliases = ['time', 'date', 'timestamp', 'time (utc)', 'time (exchange)'];
  const indexes = {
    time: headers.findIndex((header) => timeAliases.includes(header)),
    open: headers.indexOf('open'),
    high: headers.indexOf('high'),
    low: headers.indexOf('low'),
    close: headers.indexOf('close'),
    volume: headers.indexOf('volume')
  };
  if (indexes.time < 0) throw new Error('CSV is missing a time/date/timestamp column');
  for (const column of REQUIRED_COLUMNS) {
    if (indexes[column] < 0) throw new Error(`CSV is missing required ${column} column`);
  }
  if (new Set(headers).size !== headers.length) throw new Error('CSV contains duplicate column headers');

  const candles = [];
  let previousEpochMs = -Infinity;
  for (let row = 1; row < lines.length; row += 1) {
    const lineNumber = row + 1;
    const fields = splitCsvLine(lines[row], lineNumber);
    if (fields.length !== headers.length) {
      throw new Error(`CSV line ${lineNumber} has ${fields.length} fields; expected ${headers.length}`);
    }
    const { epochMs, isoTime } = parseTime(fields[indexes.time], lineNumber);
    if (epochMs <= previousEpochMs) {
      throw new Error(`Candles must be strictly chronological; duplicate or out-of-order timestamp on CSV line ${lineNumber}`);
    }
    previousEpochMs = epochMs;

    const candle = {
      time: isoTime,
      epochMs,
      open: parseNumber(fields[indexes.open], 'open', lineNumber),
      high: parseNumber(fields[indexes.high], 'high', lineNumber),
      low: parseNumber(fields[indexes.low], 'low', lineNumber),
      close: parseNumber(fields[indexes.close], 'close', lineNumber),
      volume: indexes.volume < 0 ? null : parseNumber(fields[indexes.volume], 'volume', lineNumber, { optional: true })
    };
    if (candle.high < Math.max(candle.open, candle.close)
      || candle.low > Math.min(candle.open, candle.close)
      || candle.high < candle.low) {
      throw new Error(`Invalid OHLC relationship on CSV line ${lineNumber}`);
    }
    if (candle.volume !== null && candle.volume < 0) throw new Error(`Negative volume on CSV line ${lineNumber}`);
    candles.push(candle);
  }

  return {
    headers,
    hasVolumeColumn: indexes.volume >= 0,
    candles,
    firstTime: candles[0].time,
    lastTime: candles.at(-1).time
  };
}
