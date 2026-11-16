import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

let child;
let baseUrl;

async function freePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => probe.listen(0, '127.0.0.1', resolve).once('error', reject));
  const { port } = probe.address();
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
  return port;
}

before(async () => {
  const port = await freePort();
  baseUrl = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: String(port), NODE_ENV: 'test', ANALYZER_TEST_ACCESS_BYPASS: 'true' },
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

after(() => {
  if (child && child.exitCode === null) child.kill('SIGTERM');
});

function csvFixture(count = 45) {
  const rows = ['time,open,high,low,close,volume'];
  for (let i = 0; i < count; i += 1) {
    const close = 100 + Math.sin(i / 3);
    rows.push(`${new Date(Date.UTC(2026, 0, 1, 9, 15 + i * 15)).toISOString()},${close},${close + 1},${close - 1},${close},1000`);
  }
  return rows.join('\n');
}

test('CSV API returns a historical-only report and excludes the final row', async () => {
  const response = await fetch(`${baseUrl}/api/analyze-csv?timeframe=15m&symbol=NSE%3ARELIANCE`, {
    method: 'POST',
    headers: { 'content-type': 'text/csv', authorization: 'Bearer test-entitled' },
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

test('CSV API rejects unsupported intervals and malformed candle data', async () => {
  const unsupported = await fetch(`${baseUrl}/api/analyze-csv?timeframe=5m`, {
    method: 'POST',
    headers: { 'content-type': 'text/csv' },
    body: csvFixture()
  });
  assert.equal(unsupported.status, 400);
  const malformed = await fetch(`${baseUrl}/api/analyze-csv?timeframe=1h`, {
    method: 'POST',
    headers: { 'content-type': 'text/csv' },
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

test('indicator API requires an authenticated entitled user before CSV processing', async () => {
  const noAuth = await fetch(`${baseUrl}/api/analyze-csv?timeframe=15m`, {
    method: 'POST',
    headers: { 'content-type': 'text/csv' },
    body: csvFixture()
  });
  assert.equal(noAuth.status, 401);

  const noSession = await fetch(`${baseUrl}/api/access`);
  assert.equal(noSession.status, 401);

  const access = await fetch(`${baseUrl}/api/access`, {
    headers: { authorization: 'Bearer test-entitled' }
  });
  assert.equal(access.status, 200);
  const body = await access.json();
  assert.equal(body.access_active, true);
  assert.equal(body.access_days, 365);
});

test('authenticated requests fail closed until Supabase indicator entitlement verification is configured', async () => {
  const response = await fetch(`${baseUrl}/api/access`, {
    headers: { authorization: 'Bearer test-not-entitled-bypass' }
  });
  assert.equal(response.status, 503);
});
