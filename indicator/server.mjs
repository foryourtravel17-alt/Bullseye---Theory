import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTradingViewCsv } from './lib/tradingview-csv.mjs';
import { runHistoricalBacktest } from './lib/historical-backtest.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const MAX_CSV_BYTES = 5 * 1024 * 1024;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store'
  });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_CSV_BYTES + 32_768) {
      const error = new Error('CSV upload exceeds the 5 MB limit.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('Request must contain valid JSON.');
    error.statusCode = 400;
    throw error;
  }
}

async function analyzeCsv(req, res) {
  const payload = await readJson(req);
  if (typeof payload.csv !== 'string' || Buffer.byteLength(payload.csv, 'utf8') > MAX_CSV_BYTES) {
    return send(res, 413, { error: 'Provide a CSV file no larger than 5 MB.' });
  }
  const timeframe = payload.timeframe;
  if (timeframe !== '15m' && timeframe !== '1h') {
    return send(res, 400, { error: 'Only 15m and 1h timeframes are supported.' });
  }
  const symbol = typeof payload.symbol === 'string'
    ? payload.symbol.trim().slice(0, 32)
    : 'Uploaded market';
  try {
    const parsed = parseTradingViewCsv(payload.csv);
    const report = runHistoricalBacktest(parsed.candles, timeframe);
    return send(res, 200, {
      symbol: symbol || 'Uploaded market',
      timeframe,
      fileRows: parsed.candles.length,
      firstCsvTime: parsed.firstTime,
      lastCsvTime: parsed.lastTime,
      hasVolumeColumn: parsed.hasVolumeColumn,
      candles: parsed.candles.map(({ time, open, high, low, close, volume }) => ({
        time: Math.floor(Date.parse(time) / 1000), open, high, low, close, volume
      })),
      ...report
    });
  } catch (error) {
    return send(res, 400, { error: error.message });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'POST' && url.pathname === '/api/analyze-csv') {
      if (!req.headers['content-type']?.includes('application/json')) {
        return send(res, 415, { error: 'Content-Type must be application/json.' });
      }
      return await analyzeCsv(req, res);
    }
    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });
    if (url.pathname === '/health') return send(res, 200, { ok: true });
    const relative = url.pathname === '/' ? 'indicator.html' : decodeURIComponent(url.pathname.slice(1));
    const allowedAssets = new Set([
      'indicator.html',
      'node_modules/lightweight-charts/dist/lightweight-charts.standalone.production.js'
    ]);
    if (!allowedAssets.has(relative)) return send(res, 404, { error: 'Not found.' });
    const file = path.resolve(ROOT, relative);
    const data = await readFile(file);
    return send(res, 200, data, MIME[path.extname(file)] || 'application/octet-stream');
  } catch (error) {
    if (error.code === 'ENOENT') return send(res, 404, { error: 'Not found.' });
    return send(res, error.statusCode || 500, { error: error.statusCode ? error.message : 'Request failed.' });
  }
});

server.listen(PORT, () => console.log(`Bullseye India CSV analysis listening on :${PORT}`));
