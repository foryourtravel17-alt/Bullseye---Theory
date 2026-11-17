import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const migration = read("supabase/migrations/20261113140000_add_indicator_membership_365d.sql");
const order = read("supabase/functions/create-trc20-order/index.ts");
const paymentConfig = read("supabase/functions/get-trc20-payment-config/index.ts");
const orderStatus = read("supabase/functions/get-trc20-order-status/index.ts");
const accessEndpoint = read("supabase/functions/get-indicator-access/index.ts");
const plans = read("supabase/functions/_shared/product-plans.ts");
const paymentPage = read("payment.html");
const paymentClient = read("payment-checkout.js");
const config = read("supabase/config.toml");
const postgresTest = read("scripts/test-trc20-migration-postgres.sh");
const errors = [];

function requireText(source, text, message) {
  if (!source.includes(text)) errors.push(message);
}

requireText(migration, "create table if not exists public.indicator_access", "indicator_access table is missing");
requireText(migration, "alter table public.indicator_access enable row level security", "indicator_access must have RLS enabled");
requireText(migration, "revoke all on table public.indicator_access from public, anon, authenticated", "indicator_access must not be directly readable by browser roles");
requireText(migration, "grant select, insert, update on table public.indicator_access to service_role", "indicator_access must be server-managed");
requireText(migration, "plan_code = 'course' and inr_amount_paise = 99900 and access_days = 85", "course plan must remain ₹999 / 85 days");
requireText(migration, "plan_code = 'indicator' and inr_amount_paise = 999900 and access_days = 365", "indicator plan must be ₹9,999 / 365 days");
requireText(migration, "if v_order.plan_code = 'indicator' then", "payment finalizer must route indicator purchases separately");
requireText(migration, "insert into public.indicator_access", "payment finalizer must grant indicator_access");
requireText(migration, "insert into public.course_access", "payment finalizer must preserve the course entitlement path");
requireText(migration, "admin_set_indicator_access", "admin-only manual indicator entitlement control is missing");
requireText(migration, "public.is_admin()", "manual indicator entitlement control must verify admin role");

requireText(plans, 'indicator: { plan: "indicator", inrPaise: 999_900, accessDays: 365 }', "server-side indicator amount and duration must be fixed");
requireText(plans, 'course: { plan: "course", inrPaise: 99_900, accessDays: 85 }', "server-side course amount and duration must be fixed");
requireText(order, "resolveProductPlan(plan)", "order creation must resolve price and duration server-side");
requireText(order, 'Deno.env.get("INDICATOR_CHECKOUT_ENABLED") === "true"', "indicator order creation must have its own explicit enable flag");
requireText(order, "selected.accessDays", "order creation must persist the server-side duration");
requireText(order, "selected.inrPaise", "order creation must persist the server-side amount");
requireText(paymentConfig, 'Deno.env.get("INDICATOR_CHECKOUT_ENABLED") === "true"', "public config must keep indicator checkout independently gated");
requireText(paymentConfig, "indicator_access_days: indicatorEnabled ? 365 : null", "public config must only expose 365-day duration when enabled");

requireText(orderStatus, "indicator_access_active", "order status must independently verify indicator entitlement");
requireText(accessEndpoint, 'auth.getUser(', "indicator status endpoint must validate the user's JWT");
requireText(accessEndpoint, '.eq("user_id", userData.user.id)', "indicator status endpoint must use the authenticated user's id");
if (accessEndpoint.includes("req.json()") || accessEndpoint.includes("body.user_id")) {
  errors.push("indicator status endpoint must not accept a caller-selected user id");
}
requireText(config, "[functions.get-indicator-access]", "indicator access function must be registered in Supabase config");
requireText(config, "verify_jwt = true", "indicator access function must require JWT verification");

requireText(paymentPage, "₹9,999", "payment page must explain the planned annual indicator product");
requireText(paymentPage, "Bullseye India Indicator", "payment page must identify the annual indicator product");
requireText(paymentPage, "website-based historical analyzer", "payment page must explain the website analyzer v1 delivery");
requireText(paymentPage, "Planned 365-day access", "payment page must state the planned annual term");
if (/payment-checkout\\.js|<form|createOrder|walletAddress|copyWallet|data-payment-qr|UPI|USDT|TRC20|checkout/i.test(paymentPage)) {
  errors.push("public payment page must remain manual-only with no checkout, order form, wallet or QR controls");
}
requireText(paymentClient, "ENROLLMENT CLOSED", "legacy payment guard must keep cached order controls disabled");
requireText(paymentClient, "Do not transfer funds", "legacy payment guard must preserve the no-transfer warning");
if (/\\bfetch\\s*\\(|supabase|functions\\.invoke|create-trc20-order|get-trc20-order-status|get-trc20-payment-config/i.test(paymentClient)) {
  errors.push("legacy payment guard must not call payment APIs or create/poll orders");
}
requireText(order, "Premium membership duration is not finalized", "Premium orders must remain blocked until their access duration is set");
requireText(accessEndpoint, 'delivery: "website_historical_analyzer"', "indicator access must identify the website analyzer delivery route");
if (/tradingview_invite_required|invite-only access/i.test(accessEndpoint)) errors.push("indicator access endpoint must not claim TradingView invite-only delivery");
if (/TradingView invite-only|TradingView invitation is manual|invite-only access/i.test(paymentClient)) errors.push("checkout client must describe website analyzer delivery, not TradingView invitations");

requireText(postgresTest, "20261113140000_add_indicator_membership_365d.sql", "disposable PostgreSQL test must apply the indicator migration");
requireText(postgresTest, "indicator", "disposable PostgreSQL test must seed and test indicator orders");
requireText(postgresTest, "HASH_D", "disposable PostgreSQL test must cover indicator payment finalization");
requireText(postgresTest, "HASH_E", "disposable PostgreSQL test must cover indicator renewal");

if (errors.length) {
  console.error("Indicator entitlement contract failed:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}
console.log("Indicator entitlement contract OK: isolated 365-day product, server-side price, secure entitlement checks and manual-only enrollment.");
