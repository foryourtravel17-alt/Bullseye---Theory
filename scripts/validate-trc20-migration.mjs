import { readFileSync } from "node:fs";

const migrationPath = new URL("../supabase/migrations/20261102170000_add_automatic_trc20_payment_orders.sql", import.meta.url);
const sql = readFileSync(migrationPath, "utf8");
const policyPath = new URL("../supabase/migrations/20261102200000_set_course_access_validity_85_days.sql", import.meta.url);
const policySql = readFileSync(policyPath, "utf8");
const errors = [];

function tableBlock(name) {
  const pattern = new RegExp("create table if not exists public\\." + name + "\\s*\\(([\\s\\S]*?)\\n\\);", "i");
  const match = sql.match(pattern);
  if (!match) {
    errors.push("missing or unterminated CREATE TABLE block: " + name);
    return "";
  }
  return match[1];
}

const required = {
  payment_orders: [
    "id uuid primary key",
    "user_id uuid not null references auth.users",
    "plan_code text not null",
    "inr_amount_paise integer not null",
    "access_days integer not null",
    "usdt_inr_rate numeric",
    "usdt_amount_atomic numeric",
    "destination_wallet text not null",
    "token_contract text not null",
    "expires_at timestamptz not null",
    "payment_tx_hash text unique"
  ],
  payment_transactions: [
    "tx_hash text primary key",
    "order_id uuid not null unique",
    "from_address text not null",
    "to_address text not null",
    "token_contract text not null",
    "amount_atomic numeric",
    "block_number bigint",
    "block_timestamp timestamptz"
  ],
  payment_review_events: [
    "tx_hash text primary key",
    "from_address text not null",
    "to_address text not null",
    "token_contract text not null",
    "amount_atomic numeric",
    "block_number bigint",
    "block_timestamp timestamptz",
    "review_reason text not null",
    "resolution_note text",
    "resolved_at timestamptz"
  ]
};

for (const [name, columns] of Object.entries(required)) {
  const block = tableBlock(name).toLowerCase();
  for (const column of columns) {
    if (!block.includes(column.toLowerCase())) {
      errors.push(name + " missing expected definition: " + column);
    }
  }
}

for (const table of Object.keys(required)) {
  if (!new RegExp("alter table public\\." + table + " enable row level security", "i").test(sql)) {
    errors.push(table + " must enable RLS");
  }
  if (!new RegExp("revoke all on table public\\." + table + " from public, anon, authenticated", "i").test(sql)) {
    errors.push(table + " must revoke browser-role privileges");
  }
  if (!new RegExp("grant select, insert, update, delete on table public\\." + table + " to service_role", "i").test(sql)) {
    errors.push(table + " must grant server-only access to service_role");
  }
}

for (const marker of [
  "security invoker",
  "current_user <> 'service_role'",
  "for update",
  "v_order.access_days",
  "payment_tx_hash = p_tx_hash",
  "public.course_access",
  "greatest(coalesce(public.course_access.expires_at, now()), now())"
]) {
  if (!sql.toLowerCase().includes(marker.toLowerCase())) {
    errors.push("finalizer missing safety contract: " + marker);
  }
}

if (!/check\s*\(access_days\s*=\s*85\)/i.test(policySql)) errors.push("85-day policy migration must constrain every payment order to 85 days");
if (!/now\(\)\s*\+\s*interval '85 days'/i.test(policySql)) errors.push("85-day policy migration must set admin grants to 85 days");
if (!/course_access_verified_requires_expiry/i.test(policySql)) errors.push("85-day policy migration must prevent active verified access without expiry");
if ((sql.match(/create or replace function public\.finalize_trc20_payment/gi) || []).length !== 1) errors.push("payment migration must contain exactly one finalizer definition");
if (/expires_at\s*=\s*null/i.test(sql)) errors.push("payment finalizer must never write a null course expiry");
if (!/now\(\)\s*\+\s*make_interval\(days\s*=>\s*v_order\.access_days\)/i.test(sql)) errors.push("initial verified payment must grant the order's fixed access duration");

if (errors.length) {
  console.error("TRC-20 migration contract failed:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}
console.log("TRC-20 migration contract OK: all payment tables, RLS, server grants and atomic entitlement finalizer are present.");
