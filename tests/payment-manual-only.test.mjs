import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("payment page is a closed notice and exposes no receiving wallet or checkout controls", async () => {
  const page = await readFile(resolve(root, "payment.html"), "utf8");
  assert.match(page, /MANUAL ENROLMENT ONLY/);
  assert.match(page, /Do not transfer funds based on old or unofficial instructions/);
  assert.doesNotMatch(page, /TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV/);
  assert.doesNotMatch(page, /assets\/usdt-tron-mainnet-trc20\.svg/);
  assert.doesNotMatch(page, /id="createOrder"/);
  assert.doesNotMatch(page, /id="walletAddress"/);
  assert.doesNotMatch(page, /id="copyWallet"/);
  assert.doesNotMatch(page, /id="copyOrderWallet"/);\n  assert.match(page, /does not collect money or transaction details/i);\n  assert.match(page, /written cancellation\/refund terms/i);
});

test("cached checkout script is a no-network closed stub", async () => {
  const source = await readFile(resolve(root, "payment-checkout.js"), "utf8");
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /supabase|functions\.invoke|create-trc20-order|get-trc20-order-status|get-trc20-payment-config/i);

  const nodes = new Map([
    ["createOrder", { disabled: false, hidden: false, textContent: "Create order" }],
    ["checkoutStatus", { textContent: "" }],
    ["topPaymentStatus", { textContent: "" }],
    ["orderPanel", { hidden: false }],
    ["paidDashboard", { hidden: false }],
    ["walletAddress", { hidden: false, textContent: "old-wallet-address" }],
    ["copyWallet", { disabled: false, hidden: false }],
    ["copyOrderWallet", { disabled: false, hidden: false }],
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
        return [];
      }
    },
    window: {},
    fetch: () => { networkCalls += 1; throw new Error("network must not be used"); },
    console: { error() {} }
  };
  vm.runInNewContext(source, context);

  assert.equal(networkCalls, 0);
  assert.equal(nodes.get("createOrder").disabled, true);
  assert.match(nodes.get("createOrder").textContent, /closed/i);
  assert.equal(nodes.get("orderPanel").hidden, true);
  assert.equal(nodes.get("paidDashboard").hidden, true);
  assert.equal(nodes.get("walletAddress").hidden, true);
  assert.equal(nodes.get("walletAddress").textContent, "");
  assert.equal(nodes.get("copyWallet").disabled, true);
  assert.equal(nodes.get("copyWallet").hidden, true);
  assert.equal(nodes.get("copyOrderWallet").disabled, true);
  assert.equal(nodes.get("copyOrderWallet").hidden, true);
  assert.match(nodes.get("checkoutStatus").textContent, /closed/i);
  assert.ok(hiddenSelectors.length >= 1);
});

test("pricing page displays prices but keeps all enrolment and payment arrangements manual", async () => {
  const page = await readFile(resolve(root, "membership.html"), "utf8");
  for (const price of ["₹999", "₹1,999", "₹9,999"]) assert.ok(page.includes(price), "missing listed price " + price);
  assert.match(page, /MANUAL ENROLMENT — NO WEBSITE CHECKOUT/);
  assert.match(page, /administrator manually enables course access/i);
  assert.match(page, /Contact administrator/);
  assert.doesNotMatch(page, /create-trc20-order|functions\.invoke|walletAddress|createOrder/i);
});

test("all deployed payment API source files are retired 410 stubs with no payment logic", async () => {
  const paths = [
    "supabase/functions/create-trc20-order/index.ts",
    "supabase/functions/get-trc20-order-status/index.ts",
    "supabase/functions/get-trc20-payment-config/index.ts",
    "supabase/functions/scan-trc20-payments/index.ts"
  ];
  for (const path of paths) {
    const source = await readFile(resolve(root, path), "utf8");
    assert.match(source, /status:\s*410/, path + " must return HTTP 410");
    assert.match(source, /Online payments are disabled/, path + " must explain payments are disabled");
    assert.match(source, /manual enrolment/, path + " must point to manual enrolment");
    assert.doesNotMatch(source, /\bfetch\s*\(|createClient|payment_orders|payment_transactions|TRONGRID_API_KEY|TRC20_SCANNER_CRON_SECRET/i, path + " must not perform payment work");
  }
});

test("scheduled TRC20 scanner has been retired", async () => {
  const workflow = await readFile(resolve(root, ".github/workflows/trc20-payment-scan.yml"), "utf8");
  assert.doesNotMatch(workflow, /^\s{2}schedule:/m);
  assert.doesNotMatch(workflow, /functions\/v1\/scan-trc20-payments/);
  assert.match(workflow, /payment scanning has been retired/i);
});
