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


async function verifyIndicatorAccess(req) {
  const authorization = String(req.headers.authorization || '');
  if (!authorization.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Sign in is required.' };
  }
  const token = authorization.slice(7).trim();
  if (!token) return { ok: false, status: 401, error: 'Sign in is required.' };

  // This bypass exists only for isolated automated tests and cannot be enabled
  // in a production Node process.
  if (process.env.NODE_ENV === 'test'
    && process.env.ANALYZER_TEST_ACCESS_BYPASS === 'true'
    && token === 'test-entitled') {
    return { ok: true, access: { access_active: true, access_days: 365, expires_at: null } };
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\\/$/, '');
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return { ok: false, status: 503, error: 'Indicator access verification is not configured.' };
  }

  try {
    const userResponse = await fetch(supabaseUrl + '/auth/v1/user', {
      headers: { apikey: publishableKey, Authorization: authorization },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    if (userResponse.status === 401 || userResponse.status === 403) {
      return { ok: false, status: 401, error: 'Your sign-in session is invalid or expired.' };
    }
    if (!userResponse.ok) {
      return { ok: false, status: 503, error: 'Unable to verify your sign-in session.' };
    }
    const user = await userResponse.json();
    if (!user?.id) return { ok: false, status: 401, error: 'Your sign-in session is invalid or expired.' };

    const query = new URLSearchParams({
      select: 'is_active,payment_verified,expires_at',
      user_id: 'eq.' + user.id,
      limit: '2'
    });
    const accessResponse = await fetch(supabaseUrl + '/rest/v1/indicator_access?' + query.toString(), {
      headers: {
        apikey: serviceRoleKey,
        Authorization: 'Bearer ' + serviceRoleKey
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    if (!accessResponse.ok) {
      return { ok: false, status: 503, error: 'Indicator membership verification is not available yet.' };
    }
    const rows = await accessResponse.json();
    if (!Array.isArray(rows)) {
      return { ok: false, status: 503, error: 'Indicator membership returned an invalid response.' };
    }
    if (rows.length === 0) {
      return { ok: false, status: 403, error: 'No active Bullseye India analyzer membership was found for this account.' };
    }
    if (rows.length !== 1) {
      return { ok: false, status: 503, error: 'Indicator membership data needs administrator review.' };
    }

    const entitlement = rows[0];
    const expiry = entitlement?.expires_at ? Date.parse(entitlement.expires_at) : 0;
    const active = entitlement?.is_active === true
      && entitlement?.payment_verified === true
      && Number.isFinite(expiry)
      && expiry > Date.now();
    if (!active) {
      return { ok: false, status: 403, error: 'Your Bullseye India analyzer membership is not active.' };
    }
    return {
      ok: true,
      access: { access_active: true, access_days: 365, expires_at: entitlement.expires_at }
    };
  } catch {
    return { ok: false, status: 503, error: 'Indicator membership verification could not be completed.' };
  }
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
    if (url.pathname === '/api/access') {
      if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });
      const verified = await verifyIndicatorAccess(req);
      if (!verified.ok) return send(res, verified.status, { error: verified.error });
      return send(res, 200, verified.access);
    }
    if (req.method === 'POST' && url.pathname === '/api/analyze-csv') {
      const verified = await verifyIndicatorAccess(req);
      if (!verified.ok) return send(res, verified.status, { error: verified.error });
      if (!req.headers['content-type']?.includes('text/csv')) {
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
