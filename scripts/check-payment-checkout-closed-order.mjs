import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const page = readFileSync("payment.html", "utf8");
const source = readFileSync("payment-checkout.js", "utf8");

assert.match(page, /Manual Course Activation/);
assert.match(page, /does not collect money or transaction details/i);
assert.match(page, /Do not transfer funds/i);
assert.doesNotMatch(page, /payment-checkout\.js/i,
  "the closed public page must not load any checkout script");
assert.doesNotMatch(page, /id=["'](?:createOrder|walletAddress|copyWallet|copyOrderWallet)["']/i);
assert.doesNotMatch(page, /TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV|assets\/usdt-tron-mainnet-trc20\.svg/i);
for (const forbidden of ["UPI", "QR", "PayPal", "USDT", "TRC20", "wallet address", "payment method", "checkout"]) {
  assert.doesNotMatch(page, new RegExp(forbidden, "i"), "public payment page contains forbidden marker: " + forbidden);
}

assert.doesNotMatch(source, /\bfetch\s*\(/i, "legacy guard must not make network calls");
assert.doesNotMatch(source, /supabase|functions\.invoke|create-trc20-order|get-trc20-order-status|get-trc20-payment-config|restorePendingOrder|pollOrder/i,
  "legacy guard must not call or restore any payment workflow");

const nodes = new Map([
  ["createOrder", { disabled: false, hidden: false, textContent: "Create order" }],
  ["orderPanel", { hidden: false }],
  ["paidDashboard", { hidden: false }],
  ["paymentForm", { hidden: false }],
  ["secureCheckout", { hidden: false }],
  ["walletAddress", { hidden: false, textContent: "old-wallet-address" }],
  ["copyWallet", { disabled: false, hidden: false }],
  ["copyOrderWallet", { disabled: false, hidden: false }],
  ["checkoutStatus", { textContent: "" }],
  ["topPaymentStatus", { textContent: "" }],
  ["paymentState", { textContent: "" }],
  ["paymentStateNote", { textContent: "" }]
]);
const hiddenSelectors = [];
let networkCalls = 0;
const context = {
  document: {
    getElementById: (id) => nodes.get(id) || null,
    querySelectorAll: (selector) => {
      hiddenSelectors.push(selector);
      return [{ hidden: false }, { hidden: false }];
    }
  },
  fetch: () => { networkCalls += 1; throw new Error("network must not be used"); },
  console: { error() {} }
};
vm.runInNewContext(source, context);

assert.equal(networkCalls, 0);
assert.equal(nodes.get("createOrder").disabled, true);
assert.match(nodes.get("createOrder").textContent, /closed/i);
for (const id of ["orderPanel", "paidDashboard", "paymentForm", "secureCheckout", "walletAddress", "copyWallet", "copyOrderWallet"]) {
  assert.equal(nodes.get(id).hidden, true, id + " must remain hidden");
}
assert.equal(nodes.get("walletAddress").textContent, "");
assert.equal(nodes.get("copyWallet").disabled, true);
assert.equal(nodes.get("copyOrderWallet").disabled, true);
assert.match(nodes.get("checkoutStatus").textContent, /Do not transfer funds/i);
assert.ok(hiddenSelectors.length >= 1);

console.log("PASS: no online payment UI, receiving details, order creation, network calls, or payment polling are available.");
