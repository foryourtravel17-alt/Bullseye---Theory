#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { parseTradingViewCsv } from '../lib/tradingview-csv.mjs';
import { runHistoricalBacktest } from '../lib/historical-backtest.mjs';

function usage() {
  return [
    'Usage: node scripts/validate-tradingview-export.mjs <file.csv> --timeframe <15m|1h> [--json <report.json>] [--include-last]',
    'Safely parses OHLCV data and runs the deterministic Node reference engine.',
    'By default the final CSV candle is excluded because it could be an unfinished live candle.',
    'This does not execute Pine Script or prove TradingView runtime parity.'
  ].join('\n');
}

const args = process.argv.slice(2);
const file = args.find((arg) => !arg.startsWith('--'));
const timeframeIndex = args.indexOf('--timeframe');
const timeframe = timeframeIndex >= 0 ? args[timeframeIndex + 1] : null;
const jsonIndex = args.indexOf('--json');
const jsonPath = jsonIndex >= 0 ? args[jsonIndex + 1] : null;
const includeLast = args.includes('--include-last');

if (!file || !timeframe || (jsonIndex >= 0 && !jsonPath)) {
  process.stderr.write(`${usage()}\n`);
  process.exitCode = 2;
} else {
  try {
    const fullPath = resolve(file);
    const parsed = parseTradingViewCsv(await readFile(fullPath, 'utf8'));
    const report = {
      file: basename(fullPath),
      parsedRows: parsed.candles.length,
      hasVolumeColumn: parsed.hasVolumeColumn,
      firstCsvTime: parsed.firstTime,
      lastCsvTime: parsed.lastTime,
      validation: 'passed',
      ...runHistoricalBacktest(parsed.candles, timeframe, { excludeLast: !includeLast })
    };
    if (jsonPath) await writeFile(resolve(jsonPath), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (!parsed.hasVolumeColumn) process.stderr.write('WARNING: volume column missing; no volume-qualified signals can be validated.\n');
    if (report.evaluatedCandleCount < 100) process.stderr.write('WARNING: fewer than 100 candles; treat the report as a small smoke test, not robust historical validation.\n');
  } catch (error) {
    process.stderr.write(`Validation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
