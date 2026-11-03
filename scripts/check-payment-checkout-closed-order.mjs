import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("payment-checkout.js", "utf8");
assert.ok(source.includes("async function restorePendingOrder(checkoutEnabled)"),
  "restorePendingOrder must receive the server checkout flag");
assert.ok(source.includes("restorePendingOrder(data.checkout_enabled)"),
  "the server checkout flag must be passed into pending-order restoration");

const gateStart = source.indexOf("if (!checkoutEnabled)");
const pollStart = source.indexOf("pollOrder(savedOrderId)");
assert.ok(gateStart >= 0, "a closed-checkout guard must exist");
assert.ok(pollStart > gateStart, "the closed-checkout guard must run before polling a pending order");
const gate = source.slice(gateStart, pollStart);
assert.match(gate, /Do not transfer funds/,
  "the closed-checkout state must explicitly tell customers not to transfer");
assert.match(gate, /already sent funds/,
  "the closed-checkout state must direct prior senders to support");
assert.match(gate, /return true/,
  "a closed-checkout pending order must stop before the send/poll path");

console.log("PASS: restored pending orders cannot instruct transfers while checkout is closed.");
