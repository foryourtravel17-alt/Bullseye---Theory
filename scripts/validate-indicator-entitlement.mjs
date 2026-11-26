import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const manualMigration = read("supabase/migrations/20261126110000_manual_indicator_entitlements.sql");
const retirementMigration = read("supabase/migrations/20261126101546_retire_automatic_trc20_settlement.sql");
const createOrder = read("supabase/functions/create-trc20-order/index.ts");
const orderStatus = read("supabase/functions/get-trc20-order-status/index.ts");
const paymentConfig = read("supabase/functions/get-trc20-payment-config/index.ts");
const paymentScanner = read("supabase/functions/scan-trc20-payments/index.ts");
const accessEndpoint = read("supabase/functions/get-indicator-access/index.ts");
const worker = read("_worker.js");
const paymentPage = read("payment.html");
const membershipPage = read("membership.html");
const paymentClient = read("payment-checkout.js");
const adminPage = read("admin.html");
const indicatorPage = read("indicator/indicator.html");
const config = read("supabase/config.toml");
const errors = [];

function requireText(source, text, message) {
  if (!source.includes(text)) errors.push(message);
}

// Manual indicator entitlement is independent of all online-payment tables and APIs.
requireText(manualMigration, "create table if not exists public.indicator_access", "manual indicator entitlement table is missing");
requireText(manualMigration, "alter table public.indicator_access enable row level security", "indicator entitlement table must have RLS enabled");
requireText(manualMigration, "revoke all on table public.indicator_access from public, anon, authenticated, service_role", "indicator entitlement table must deny direct API-role access");
requireText(manualMigration, "grant select on table public.indicator_access to service_role", "authenticated access endpoint needs read-only service-role access");
requireText(manualMigration, "now() + interval '365 days'", "default indicator entitlement must be 365 days");
requireText(manualMigration, "create or replace function public.admin_set_indicator_access", "admin indicator grant/revoke RPC is missing");
requireText(manualMigration, "create or replace function public.admin_list_indicator_members", "admin indicator member-list RPC is missing");
requireText(manualMigration, "if not public.is_admin() then", "indicator RPCs must enforce admin authorization");
requireText(manualMigration, "grant execute on function public.admin_set_indicator_access", "authenticated admin grant/revoke RPC permission is missing");
requireText(manualMigration, "grant execute on function public.admin_list_indicator_members()", "authenticated admin member-list RPC permission is missing");
if (/payment_orders|payment_transactions|finalize_trc20_payment|trc20|wallet|checkout/i.test(manualMigration)) {
  errors.push("manual indicator entitlement migration must not depend on payment-order or blockchain settlement code");
}

// The retired payment system is inaccessible even if historical objects remain in the database.
for (const table of ["payment_orders", "payment_transactions", "payment_review_events"]) {
  requireText(retirementMigration, `revoke all on table public.${table} from public, anon, authenticated, service_role`, `${table} must be inaccessible to all API roles`);
}
requireText(retirementMigration, "revoke all on function public.finalize_trc20_payment", "automatic payment finalizer must be disabled");
for (const [name, source] of [
  ["create-trc20-order", createOrder],
  ["get-trc20-order-status", orderStatus],
  ["get-trc20-payment-config", paymentConfig],
  ["scan-trc20-payments", paymentScanner],
]) {
  requireText(source, "status: 410", name + " must return HTTP 410 while online payments are disabled");
  requireText(source, "Online payments are disabled", name + " must clearly report disabled payments");
}

// Public pricing/enrolment pages only display prices and explain manual handling.
requireText(membershipPage, "₹999", "course price must be displayed");
requireText(membershipPage, "₹1,999", "premium bundle price must be displayed");
requireText(membershipPage, "₹9,999", "indicator price must be displayed");
requireText(membershipPage, "NO WEBSITE CHECKOUT", "pricing page must explain that there is no website checkout");
requireText(membershipPage, "activated manually", "pricing page must explain manual activation");
requireText(paymentPage, "Manual Course Activation", "manual activation page marker is missing");
requireText(paymentPage, "does not collect money or transaction details", "activation page must not collect payment data");
requireText(paymentPage, "process payments", "activation page must explicitly rule out payment processing");
if (/payment-checkout\.js|<form|create-trc20-order|wallet address|upi|usdt|trc20/i.test(paymentPage)) {
  errors.push("public activation page must not expose checkout, wallet, UPI or crypto payment controls");
}
if (/payment-checkout\.js/i.test(membershipPage)) errors.push("pricing page must not load the legacy checkout client");
const legacyPaymentForbidden = ["fetch(", "supabase", "functions.invoke", "create-trc20-order", "get-trc20-order-status", "get-trc20-payment-config"];
for (const marker of legacyPaymentForbidden) {
  if (paymentClient.toLowerCase().includes(marker)) errors.push("legacy payment client must not call payment APIs or create/poll orders: " + marker);
}

// Course activation and indicator access remain admin-controlled.
requireText(adminPage, "admin_set_course_access", "admin course access RPC is not wired");
requireText(adminPage, "admin_list_course_students", "admin course student list RPC is not wired");
requireText(adminPage, "admin_set_indicator_access", "admin manual indicator grant/revoke RPC is not wired");
requireText(adminPage, "admin_list_indicator_members", "admin indicator member list RPC is not wired");
requireText(adminPage, "independently checked the payment settlement", "admin indicator activation must require explicit manual verification");
requireText(accessEndpoint, "auth.getUser(", "indicator access endpoint must validate the user's JWT");
requireText(accessEndpoint, '.eq("user_id", userData.user.id)', "indicator access endpoint must query only the authenticated user's entitlement");
requireText(accessEndpoint, 'delivery: "website_historical_analyzer"', "indicator access must identify the actual website analyzer delivery");
if (accessEndpoint.includes("req.json()") || accessEndpoint.includes("body.user_id")) {
  errors.push("indicator access endpoint must not accept a caller-selected user id");
}
requireText(config, "[functions.get-indicator-access]", "indicator access function must be registered in Supabase config");
requireText(config, "verify_jwt = true", "indicator access function must require JWT verification");
requireText(worker, `url.pathname === "/api/access"`, "Cloudflare Worker must expose the indicator access API route");
requireText(worker, "/functions/v1/get-indicator-access", "Cloudflare Worker must proxy the authenticated indicator entitlement to Supabase");
requireText(indicatorPage, "fetch('/api/access'", "indicator analyzer must call the protected Worker entitlement endpoint");
requireText(indicatorPage, "access_active", "indicator analyzer must gate access on verified entitlement");

if (errors.length) {
  console.error("Manual indicator / payment-retirement contract failed:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}
console.log("Manual-only contract OK: informational pricing, disabled payment APIs, admin-only 85/365-day access and JWT-protected analyzer entitlement.");
