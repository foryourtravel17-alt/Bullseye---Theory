import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTradingViewCsv } from './lib/tradingview-csv.mjs';
import { runHistoricalBacktest } from './lib/historical-backtest.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const MAX_CSV_BYTES = 5 * 1024 * 1024;
const ACCESS_TIMEOUT_MS = 8000;
const INDICATOR_PRODUCT = 'bullseye-india-indicator';
const INDICATOR_ACCESS_DAYS = 365;
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SUPABASE_PUBLISHABLE_KEY = String(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

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

function bearerToken(req) {
  const value = String(req.headers.authorization || '');
  const match = /^Bearer\s+([^\s]+)$/i.exec(value);
  return match ? match[1] : '';
}

async function fetchSupabaseJson(url, token, { method = 'GET' } = {}) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(ACCESS_TIMEOUT_MS)
    });
  } catch {
    return { kind: 'unavailable' };
  }

  let body;
  try {
    body = await response.json();
  } catch {
    return { kind: 'malformed', status: response.status };
  }
  return { kind: 'response', status: response.status, body };
}

async function verifyIndicatorAccess(req) {
  const token = bearerToken(req);
  if (!token) {
    return { status: 401, body: { error: 'Sign in to check indicator access.', access_active: false } };
  }
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return { status: 503, body: { error: 'Indicator access service is not configured.', access_active: false } };
  }

  const auth = await fetchSupabaseJson(`${SUPABASE_URL}/auth/v1/user`, token);
  if (auth.kind === 'unavailable' || auth.kind === 'malformed') {
    return { status: 503, body: { error: 'Supabase Auth is temporarily unavailable.', access_active: false } };
  }
  if (auth.status === 401 || auth.status === 403) {
    return { status: 401, body: { error: 'Your sign-in session is invalid or expired.', access_active: false } };
  }
  if (auth.status < 200 || auth.status >= 300 || !auth.body || typeof auth.body.id !== 'string' || !auth.body.id) {
    return { status: 503, body: { error: 'Supabase Auth returned an invalid response.', access_active: false } };
  }

  const entitlement = await fetchSupabaseJson(`${SUPABASE_URL}/functions/v1/get-indicator-access`, token);
  if (entitlement.kind === 'unavailable' || entitlement.kind === 'malformed') {
    return { status: 503, body: { error: 'Indicator entitlement service is temporarily unavailable.', access_active: false } };
  }
  if (entitlement.status === 401 || entitlement.status === 403) {
    return { status: 401, body: { error: 'Indicator entitlement session could not be verified.', access_active: false } };
  }
  if (entitlement.status < 200 || entitlement.status >= 300 || !entitlement.body || typeof entitlement.body !== 'object') {
    return { status: 503, body: { error: 'Indicator entitlement service returned an invalid response.', access_active: false } };
  }

  const data = entitlement.body;
  if (typeof data.access_active !== 'boolean') {
    return { status: 503, body: { error: 'Indicator entitlement response is malformed.', access_active: false } };
  }
  if (data.access_active !== true) {
    return {
      status: 403,
      body: {
        product: INDICATOR_PRODUCT,
        access_active: false,
        access_days: INDICATOR_ACCESS_DAYS,
        expires_at: null,
        error: 'No active, manually verified 365-day indicator entitlement was found.'
      }
    };
  }
  if (data.product !== INDICATOR_PRODUCT || data.access_days !== INDICATOR_ACCESS_DAYS) {
    return { status: 503, body: { error: 'Indicator entitlement response does not match the expected product contract.', access_active: false } };
  }

  const expiresAt = Date.parse(data.expires_at || '');
  if (!Number.isFinite(expiresAt)) {
    return { status: 503, body: { error: 'Indicator entitlement expiry is missing or malformed.', access_active: false } };
  }
  if (expiresAt <= Date.now()) {
    return { status: 403, body: { product: INDICATOR_PRODUCT, access_active: false, access_days: INDICATOR_ACCESS_DAYS, expires_at: data.expires_at, error: 'Indicator access has expired.' } };
  }

  return {
    status: 200,
    body: {
      product: INDICATOR_PRODUCT,
      access_active: true,
      access_days: INDICATOR_ACCESS_DAYS,
      expires_at: new Date(expiresAt).toISOString()
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

async function analyzeCsv(req, res, url) {
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

    if (req.method === 'GET' && url.pathname === '/api/config') {
      if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
        return send(res, 503, { error: 'Analyzer sign-in is not configured.' });
      }
      return send(res, 200, {
        supabaseUrl: SUPABASE_URL,
        supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/access') {
      const access = await verifyIndicatorAccess(req);
      return send(res, access.status, access.body);
    }

    if (req.method === 'POST' && url.pathname === '/api/analyze-csv') {
      const access = await verifyIndicatorAccess(req);
      if (access.status !== 200) return send(res, access.status, access.body);
      if (!req.headers['content-type']?.toLowerCase().includes('text/csv')) {
        return send(res, 415, { error: 'Content-Type must be text/csv.' });
      }
      return await analyzeCsv(req, res, url);
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
