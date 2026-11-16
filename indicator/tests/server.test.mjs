import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer as createNetServer } from 'node:net';
import { createServer as createHttpServer } from 'node:http';

let child;
let baseUrl;
let entitlementServer;
let entitlementUrl;
let requestLog = [];

async function freePort() {
  const probe = createNetServer();
  await new Promise((resolve, reject) => probe.listen(0, '127.0.0.1', resolve).once('error', reject));
  const { port } = probe.address();
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function startHttpServer(server) {
  const port = await freePort();
  await new Promise((resolve, reject) => server.listen(port, '127.0.0.1', resolve).once('error', reject));
  return `http://127.0.0.1:${port}`;
}

before(async () => {
  entitlementServer = createHttpServer((req, res) => {
    requestLog.push({ path: req.url, authorization: req.headers.authorization || '' });
    if (req.url === '/auth/v1/user') {
      const token = req.headers.authorization || '';
      if (token === 'Bearer invalid-token') {
        res.writeHead(401, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'invalid session' }));
        return;
      }
      if (token === 'Bearer auth-outage') {
        res.writeHead(503, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'auth service unavailable' }));
        return;
      }
      if (!token.startsWith('Bearer ')) {
        res.writeHead(401, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'missing bearer token' }));
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ id: 'user-123', email: 'owner@example.test' }));
      return;
    }
    if (req.url !== '/functions/v1/get-indicator-access') {
      res.writeHead(404).end();
      return;
    }
    if (req.headers.apikey !== 'test-publishable-key') {
      res.writeHead(401, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'invalid api key' }));
      return;
    }
    const token = req.headers.authorization || '';
    if (token === 'Bearer invalid-token') {
      res.writeHead(401, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'invalid session' }));
      return;
    }
    if (token === 'Bearer upstream-failure') {
      res.writeHead(503, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'temporary outage' }));
      return;
    }
    if (token === 'Bearer malformed-response') {
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ access_active: 'true' }));
      return;
    }
    if (token === 'Bearer no-access') {
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({
        product: 'bullseye-india-indicator',
        access_active: false,
        access_days: 365,
        expires_at: null
      }));
      return;
    }
    if (token === 'Bearer expired-token') {
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({
        product: 'bullseye-india-indicator',
        access_active: true,
        access_days: 365,
        expires_at: '2020-01-01T00:00:00.000Z'
      }));
      return;
    }
    if (token === 'Bearer wrong-product') {
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({
        product: 'bullseye-course',
        access_active: true,
        access_days: 365,
        expires_at: '2035-01-01T00:00:00.000Z'
      }));
      return;
    }
    if (token === 'Bearer wrong-duration') {
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({
        product: 'bullseye-india-indicator',
        access_active: true,
        access_days: 85,
        expires_at: '2035-01-01T00:00:00.000Z'
      }));
      return;
    }
    if (token === 'Bearer active-token') {
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({
        product: 'bullseye-india-indicator',
        access_active: true,
        access_days: 365,
        expires_at: '2035-01-01T00:00:00.000Z'
      }));
      return;
    }
    res.writeHead(401, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'missing or invalid bearer token' }));
  });
  entitlementUrl = await startHttpServer(entitlementServer);

  const port = await freePort();
  baseUrl = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      PORT: String(port),
      SUPABASE_URL: entitlementUrl,
      SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key'
    },
    stdio: 'ignore'
  });
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) throw new Error('Indicator server exited before startup');
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Indicator server did not become ready');
});

after(async () => {
  if (child && child.exitCode === null) child.kill('SIGTERM');
  if (entitlementServer?.listening) {
    await new Promise((resolve, reject) => entitlementServer.close((error) => error ? reject(error) : resolve()));
  }
});

function csvFixture(count = 45) {
  const rows = ['time,open,high,low,close,volume'];
  for (let i = 0; i < count; i += 1) {
    const close = 100 + Math.sin(i / 3);
    rows.push(`${new Date(Date.UTC(2026, 0, 1, 9, 15 + i * 15)).toISOString()},${close},${close + 1},${close - 1},${close},1000`);
  }
  return rows.join('\n');
}

test('indicator access API requires a bearer token', async () => {
  const response = await fetch(baseUrl + '/api/access');
  assert.equal(response.status, 401);
});

test('indicator access API denies a signed-in user without a verified entitlement', async () => {
  const response = await fetch(baseUrl + '/api/access', {
    headers: { authorization: 'Bearer no-access' }
  });
  assert.equal(response.status, 403);
  const result = await response.json();
  assert.equal(result.access_active, false);
});

test('indicator access API allows only an active verified 365-day entitlement', async () => {
  const response = await fetch(baseUrl + '/api/access', {
    headers: { authorization: 'Bearer active-token' }
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.access_active, true);
  assert.equal(result.access_days, 365);
  assert.equal(result.expires_at, '2035-01-01T00:00:00.000Z');
});

test('Supabase Auth validates the bearer token before entitlement lookup', async () => {
  requestLog = [];
  const invalid = await fetch(baseUrl + '/api/access', {
    headers: { authorization: 'Bearer invalid-token' }
  });
  assert.equal(invalid.status, 401);
  assert.deepEqual(requestLog.map((item) => item.path), ['/auth/v1/user']);
  requestLog = [];
  const authOutage = await fetch(baseUrl + '/api/access', {
    headers: { authorization: 'Bearer auth-outage' }
  });
  assert.equal(authOutage.status, 503);
  assert.deepEqual(requestLog.map((item) => item.path), ['/auth/v1/user']);
  const unavailable = await fetch(baseUrl + '/api/access', {
    headers: { authorization: 'Bearer upstream-failure' }
  });
  assert.equal(unavailable.status, 503);
  const malformed = await fetch(baseUrl + '/api/access', {
    headers: { authorization: 'Bearer malformed-response' }
  });
  assert.equal(malformed.status, 503);
});

test('CSV analysis is blocked before parsing when no indicator entitlement exists', async () => {
  const response = await fetch(baseUrl + '/api/analyze-csv?timeframe=15m', {
    method: 'POST',
    headers: { 'content-type': 'text/csv', authorization: 'Bearer no-access' },
    body: 'this is deliberately not a valid OHLCV CSV'
  });
  assert.equal(response.status, 403);
});

test('CSV API returns a historical-only report for an entitled user and excludes the final row', async () => {
  const response = await fetch(`${baseUrl}/api/analyze-csv?timeframe=15m&symbol=NSE%3ARELIANCE`, {
    method: 'POST',
    headers: { 'content-type': 'text/csv', authorization: 'Bearer active-token' },
    body: csvFixture()
  });
  assert.equal(response.status, 200);
  const report = await response.json();
  assert.equal(report.symbol, 'NSE:RELIANCE');
  assert.equal(report.timeframe, '15m');
  assert.equal(report.fileRows, 45);
  assert.equal(report.evaluatedCandleCount, 44);
  assert.equal(report.lastRowExcluded, true);
  assert.equal(report.pineRuntimeExecuted, false);
  assert.equal(report.candles.length, 45);
});

test('CSV API rejects unsupported intervals and malformed candle data for entitled users', async () => {
  const unsupported = await fetch(`${baseUrl}/api/analyze-csv?timeframe=5m`, {
    method: 'POST',
    headers: { 'content-type': 'text/csv', authorization: 'Bearer active-token' },
    body: csvFixture()
  });
  assert.equal(unsupported.status, 400);
  const malformed = await fetch(`${baseUrl}/api/analyze-csv?timeframe=1h`, {
    method: 'POST',
    headers: { 'content-type': 'text/csv', authorization: 'Bearer active-token' },
    body: 'time,open,high,low,close,volume\nnot-a-time,1,2,0,1,5'
  });
  assert.equal(malformed.status, 400);
});

test('server exposes only the dashboard and chart library, not private source files', async () => {
  const page = await fetch(baseUrl + '/');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);
  const source = await fetch(baseUrl + '/server.mjs');
  assert.equal(source.status, 404);
  const engine = await fetch(baseUrl + '/lib/levels.mjs');
  assert.equal(engine.status, 404);
  const packageFile = await fetch(baseUrl + '/package.json');
  assert.equal(packageFile.status, 404);
});

test('access API rejects a different product or non-365-day entitlement', async () => {
  for (const token of ['wrong-product', 'wrong-duration']) {
    const response = await fetch(baseUrl + '/api/access', {
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(response.status, 503);
  }
});

test('CSV API rejects a missing bearer token before reading or parsing the upload', async () => {
  const response = await fetch(baseUrl + '/api/analyze-csv?timeframe=15m', {
    method: 'POST',
    headers: { 'content-type': 'text/csv' },
    body: 'this body must never reach the CSV parser'
  });
  assert.equal(response.status, 401);
});

test('access endpoint denies anonymous callers and never caches entitlement responses', async () => {
  const response = await fetch(baseUrl + '/api/access');
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});

test('browser config exposes only the public Supabase key', async () => {
  const response = await fetch(baseUrl + '/api/config');
  assert.equal(response.status, 200);
  const config = await response.json();
  assert.equal(config.supabaseUrl, entitlementUrl);
  assert.equal(config.supabasePublishableKey, 'test-publishable-key');
  assert.equal(Object.keys(config).some((key) => /service.?role/i.test(key)), false);
});

test('analyzer page contains member sign-in and never sends CSV without a bearer token', async () => {
  const response = await fetch(baseUrl + '/');
  assert.equal(response.status, 200);
  const page = await response.text();
  assert.match(page, /id="authEmail"/);
  assert.match(page, /id="authPassword"/);
  assert.match(page, /signInWithPassword/);
  assert.match(page, /Authorization:'Bearer '\+currentSession\.access_token/);
  assert.match(page, /\/api\/access/);
});

test('an expired 365-day entitlement is denied', async () => {
  const response = await fetch(baseUrl + '/api/access', {
    headers: { authorization: 'Bearer expired-token' }
  });
  assert.equal(response.status, 403);
  const result = await response.json();
  assert.equal(result.access_active, false);
});
