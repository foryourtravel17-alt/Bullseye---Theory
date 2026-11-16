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

async function verifyIndicatorAccess(req) {
  const authorization = String(req.headers.authorization || '');
  if (!authorization.startsWith('Bearer ') || !authorization.slice(7).trim()) {
    return { ok: false, status: 401, error: 'Sign in is required.' };
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const publishableKey = String(process.env.SUPABASE_PUBLISHABLE_KEY || '').trim();
  if (!supabaseUrl || !publishableKey) {
    return { ok: false, status: 503, error: 'Indicator access verification is not configured.' };
  }

  let response;
  try {
    response = await fetch(supabaseUrl + '/functions/v1/get-indicator-access', {
      method: 'GET',
      headers: {
        apikey: publishableKey,
        Authorization: authorization,
        Accept: 'application/json'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    return { ok: false, status: 503, error: 'Indicator membership verification could not be reached.' };
  }

  if (response.status === 401) {
    return { ok: false, status: 401, error: 'Your sign-in session is invalid or expired.' };
  }
  if (response.status === 403) {
    return { ok: false, status: 403, error: 'This account does not have analyzer access.' };
  }
  if (!response.ok) {
    return { ok: false, status: 503, error: 'Indicator membership verification is temporarily unavailable.' };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return { ok: false, status: 503, error: 'Indicator membership service returned an invalid response.' };
  }

  if (!data || data.product !== 'bullseye-india-indicator'
    || data.access_days !== 365 || typeof data.access_active !== 'boolean') {
    return { ok: false, status: 503, error: 'Indicator membership service returned an unsupported entitlement.' };
  }
  if (!data.access_active) {
    return { ok: false, status: 403, error: data.message || 'No active verified Bullseye India analyzer membership was found.' };
  }

  const expiry = data.expires_at ? Date.parse(data.expires_at) : NaN;
  if (!Number.isFinite(expiry) || expiry <= Date.now()) {
    return { ok: false, status: 403, error: 'Your Bullseye India analyzer membership is not active.' };
  }

  return {
    ok: true,
    access: {
      access_active: true,
      access_days: 365,
      expires_at: new Date(expiry).toISOString()
    }
  };
}

async function readCsv(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_CSV_BYTES) {
      const error = new Error('CSV upload exceeds the 5 MB limit.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function analyzeCsv(req, res, url, access) {
  const csv = await readCsv(req);
  if (!csv.trim()) return send(res, 400, { error: 'CSV file is empty.' });
  const timeframe = url.searchParams.get('timeframe');
  if (timeframe !== '15m' && timeframe !== '1h') {
    return send(res, 400, { error: 'Only 15m and 1h timeframes are supported.' });
  }
  const rawSymbol = url.searchParams.get('symbol') || 'Uploaded market';
  const symbol = rawSymbol.trim().slice(0, 32) || 'Uploaded market';
  try {
    const parsed = parseTradingViewCsv(csv);
    const report = runHistoricalBacktest(parsed.candles, timeframe);
    return send(res, 200, {
      symbol: symbol || 'Uploaded market',
      timeframe,
      access_active: access.access_active,
      access_expires_at: access.expires_at,
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
    if (req.method === 'GET' && url.pathname === '/supabase-config.js') {
      const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\\/+$/, '');
      const publishableKey = String(process.env.SUPABASE_PUBLISHABLE_KEY || '').trim();
      if (!supabaseUrl || !publishableKey) {
        return send(res, 503, 'window.BULLSEYE_SUPABASE_URL = ""; window.BULLSEYE_SUPABASE_PUBLISHABLE_KEY = "";', 'text/javascript; charset=utf-8');
      }
      const config = [
        'window.BULLSEYE_SUPABASE_URL = ' + JSON.stringify(supabaseUrl) + ';',
        'window.BULLSEYE_SUPABASE_PUBLISHABLE_KEY = ' + JSON.stringify(publishableKey) + ';'
      ].join('\\n');
      return send(res, 200, config, 'text/javascript; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { ok: true });
    if (req.method === 'GET' && url.pathname === '/supabase-config.js') {
      const publicConfig = {
        url: String(process.env.SUPABASE_URL || ''),
        publishableKey: String(process.env.SUPABASE_PUBLISHABLE_KEY || '')
      };
      const script = [
        `window.BULLSEYE_SUPABASE_URL = ${JSON.stringify(publicConfig.url)};`,
        `window.BULLSEYE_SUPABASE_PUBLISHABLE_KEY = ${JSON.stringify(publicConfig.publishableKey)};`
      ].join('\n');
      return send(res, 200, script, 'application/javascript; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/supabase-config.js') {
      const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
      const publishableKey = String(process.env.SUPABASE_PUBLISHABLE_KEY || '').trim();
      if (!supabaseUrl || !publishableKey) {
        return send(res, 503, { error: 'Analyzer sign-in is not configured.' });
      }
      const script = [
        'window.BULLSEYE_SUPABASE_URL = ' + JSON.stringify(supabaseUrl) + ';',
        'window.BULLSEYE_SUPABASE_PUBLISHABLE_KEY = ' + JSON.stringify(publishableKey) + ';'
      ].join('\\n');
      return send(res, 200, script, 'application/javascript; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/api/access') {
      const result = await verifyIndicatorAccess(req);
      if (!result.ok) return send(res, result.status, { access_active: false, error: result.error });
      return send(res, 200, result.access);
    }
    if (req.method === 'POST' && url.pathname === '/api/analyze-csv') {
      if (!req.headers['content-type']?.includes('text/csv')) {
        return send(res, 415, { error: 'Content-Type must be text/csv.' });
      }
      const access = await verifyIndicatorAccess(req);
      if (!access.ok) return send(res, access.status, { access_active: false, error: access.error });
      return await analyzeCsv(req, res, url, access.access);
    }
    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });
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
