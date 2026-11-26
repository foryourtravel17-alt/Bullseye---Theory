import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const errors = [];
const migration = read("supabase/migrations/20261126101500_retire_automatic_trc20_settlement.sql");
const workflow = read(".github/workflows/trc20-payment-scan.yml");
const paymentPage = read("payment.html");
const checkoutScript = read("payment-checkout.js");
const membershipPage = read("membership.html");

for (const table of ["payment_orders", "payment_transactions", "payment_review_events"]) {
  const pattern = new RegExp("revoke all on table public\\." + table + " from public, anon, authenticated, service_role", "i");
  if (!pattern.test(migration)) errors.push(table + " must be inaccessible to all API roles");
}
if (!/revoke all on function public\.finalize_trc20_payment/i.test(migration)) {
  errors.push("the historical payment finalizer must be revoked from API roles");
}
if (/^\s{2}schedule:/m.test(workflow)) errors.push("the payment scanner workflow must not have a schedule");
if (/functions\/v1\/scan-trc20-payments/.test(workflow)) errors.push("the retired workflow must not call the payment scanner");
if (!/MANUAL ENROLMENT ONLY/.test(paymentPage)) errors.push("the public activation page must explain manual enrolment");
if (!/does not collect money or transaction details/i.test(paymentPage)) errors.push("the public activation page must not accept funds or transaction details");
if (/TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV|TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t|createOrder|walletAddress/.test(paymentPage)) {
  errors.push("the public activation page must not expose payment rails, receiving addresses or order controls");
}
if (/\bfetch\s*\(|supabase|functions\.invoke|create-trc20-order|get-trc20-order-status|get-trc20-payment-config/i.test(checkoutScript)) {
  errors.push("the cached checkout script must remain a no-network stub");
}
for (const price of ["₹999", "₹1,999", "₹9,999"]) {
  if (!membershipPage.includes(price)) errors.push("membership page is missing listed price " + price);
}
if (!/MANUAL ENROLMENT — NO WEBSITE CHECKOUT/.test(membershipPage)) errors.push("membership page must describe manual-only enrolment");

for (const path of [
  "supabase/functions/create-trc20-order/index.ts",
  "supabase/functions/get-trc20-order-status/index.ts",
  "supabase/functions/get-trc20-payment-config/index.ts",
  "supabase/functions/scan-trc20-payments/index.ts"
]) {
  const source = read(path);
  if (!/status:\s*410/.test(source)) errors.push(path + " must return HTTP 410");
  if (!/Online payments are disabled/.test(source)) errors.push(path + " must explain that payments are disabled");
  if (/\bfetch\s*\(|createClient|payment_orders|payment_transactions|TRONGRID_API_KEY|TRC20_SCANNER_CRON_SECRET/i.test(source)) {
    errors.push(path + " must not execute payment logic");
  }
}

if (errors.length) {
  console.error("Manual enrolment / retired payment contract failed:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}
console.log("Manual enrolment contract OK: prices only, no checkout, disabled payment APIs, no scanner and no API-role settlement access.");
