import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFile(path.join(ROOT, name), 'utf8');

test('payment page is closed and exposes no wallet, QR, order creation or payment polling', async () => {
  const page = await read('payment.html');
  const lower = page.toLowerCase();
  assert.match(lower, /enrollment is closed|enrollment closed/);
  assert.match(page, /₹999/);
  assert.match(page, /₹1,999/);
  assert.match(page, /₹9,999/);
  assert.match(lower, /365 days/);
  for (const forbidden of [
    'assets/usdt-tron-mainnet-trc20.svg',
    'TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV',
    'payment-checkout.js',
    'createOrder',
    'get-trc20-order-status',
    'create-trc20-order',
    'walletAddress'
  ]) {
    assert.equal(page.includes(forbidden), false, 'payment page must not expose ' + forbidden);
  }
});

test('legacy checkout script is a defensive manual-only closed stub', async () => {
  const source = await read('payment-checkout.js');
  assert.match(source, /disabled\s*=\s*true/);
  assert.match(source, /manual|closed|not open/i);
  for (const forbidden of [
    'supabase.createClient',
    'functions.invoke',
    'create-trc20-order',
    'get-trc20-order-status',
    'scan-trc20-payments',
    'fetch('
  ]) {
    assert.equal(source.includes(forbidden), false, 'closed checkout stub must not invoke ' + forbidden);
  }
});

test('indicator admin controls are separate and payment verification is explicit', async () => {
  const admin = await read('admin.html');
  const migration = await read('supabase/migrations/20261113140000_add_indicator_membership_365d.sql');
  assert.match(admin, /admin_list_indicator_members/);
  assert.match(admin, /admin_set_indicator_access/);
  assert.match(admin, /id="indicatorVerified"[^>]*type="checkbox"/);
  assert.doesNotMatch(admin.match(/<input[^>]*id="indicatorVerified"[^>]*>/)?.[0] || '', /checked/i);
  assert.match(admin, /confirm\(/);
  assert.match(migration, /function public\.admin_set_indicator_access/i);
  assert.match(migration, /function public\.admin_list_indicator_members/i);
  assert.match(migration, /is_admin\(\)/i);
  assert.doesNotMatch(admin, /SUPABASE_SERVICE_ROLE_KEY|service_role/i);
});

test('indicator analyzer requires its own server-verified 365-day entitlement', async () => {
  const server = await read('indicator/server.mjs');
  const html = await read('indicator/indicator.html');
  assert.match(server, /get-indicator-access/);
  assert.match(server, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(server, /api\/access/);
  assert.match(server, /verifyIndicatorAccess/);
  assert.doesNotMatch(server, /SUPABASE_SERVICE_ROLE_KEY|service_role/i);
  assert.match(html, /id="accessPanel"/);
  assert.match(html, /id="signIn"/);
  assert.match(html, /supabase-config\.js/);
  assert.match(html, /Authorization/);
});

test('membership page presents three independent products and the correct planned terms', async () => {
  const page = await read('membership.html');
  assert.match(page, /₹999/);
  assert.match(page, /85 DAYS/);
  assert.match(page, /₹1,999/);
  assert.match(page, /₹9,999/);
  assert.match(page, /365 DAYS/);
  assert.match(page, /three separate products/i);
  assert.doesNotMatch(page.toLowerCase(), /tradingview invite-only|tradingview invite/);
});
