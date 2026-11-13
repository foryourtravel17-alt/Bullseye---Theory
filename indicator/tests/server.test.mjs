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
    env: { ...process.env, PORT: String(port) },
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
  const response = await fetch(`${baseUrl}/api/analyze-csv`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ csv: csvFixture(), timeframe: '15m', symbol: 'NSE:RELIANCE' })
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
  const unsupported = await fetch(`${baseUrl}/api/analyze-csv`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ csv: csvFixture(), timeframe: '5m' })
  });
  assert.equal(unsupported.status, 400);
  const malformed = await fetch(`${baseUrl}/api/analyze-csv`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ csv: 'time,open,high,low,close,volume\nnot-a-time,1,2,0,1,5', timeframe: '1h' })
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
