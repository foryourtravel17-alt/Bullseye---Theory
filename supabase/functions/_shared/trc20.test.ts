import {
  buildUsdtAmountAtomic,
  findMatchingOrders,
  hasExactUsdtTransferReceiptLog,
  isSolidifiedSuccessfulReceipt,
  parseAtomicUsdt,
  timingSafeEqualText,
  validateIncomingTransfer,
  TRON_MAINNET_USDT_CONTRACT,
  TRON_RECEIVING_WALLET,
  type PendingOrder,
  type TronTransfer,
} from "./trc20.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function same(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

const HASH = "a".repeat(64);
const baseTransfer: TronTransfer = {
  transaction_id: HASH,
  from: "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8",
  to: TRON_RECEIVING_WALLET,
  value: "12500000",
  block_timestamp: 1793600000000,
  confirmed: true,
  token_info: { address: TRON_MAINNET_USDT_CONTRACT, decimals: 6 },
};

const pendingOrder: PendingOrder = {
  id: "order-1",
  plan_code: "course",
  user_id: "user-1",
  usdt_amount_atomic: "12500000",
  created_at: "2026-11-02T00:00:00.000Z",
  expires_at: "2026-11-02T01:00:00.000Z",
  destination_wallet: TRON_RECEIVING_WALLET,
  token_contract: TRON_MAINNET_USDT_CONTRACT,
  status: "pending",
};

Deno.test("accepts only confirmed incoming USDT TRC-20 transfers to the exact wallet", () => {
  const valid = validateIncomingTransfer(baseTransfer, TRON_RECEIVING_WALLET, true);
  assert(valid, "valid transfer should pass");
  same(valid.amountAtomic, "12500000", "atomic amount should be preserved");
  same(valid.txHash, HASH, "transaction hash should be preserved");

  same(validateIncomingTransfer({ ...baseTransfer, confirmed: false }, TRON_RECEIVING_WALLET, false), null, "unconfirmed history is rejected");
  same(validateIncomingTransfer({ ...baseTransfer, to: "TWrongWallet111111111111111111111" }, TRON_RECEIVING_WALLET, true), null, "wrong recipient rejected");
  same(validateIncomingTransfer({ ...baseTransfer, token_info: { address: "TWrongToken", decimals: 6 } }, TRON_RECEIVING_WALLET, true), null, "wrong token rejected");
  same(validateIncomingTransfer({ ...baseTransfer, token_info: { address: TRON_MAINNET_USDT_CONTRACT, decimals: 18 } }, TRON_RECEIVING_WALLET, true), null, "wrong decimals rejected");
  same(validateIncomingTransfer({ ...baseTransfer, value: "0" }, TRON_RECEIVING_WALLET, true), null, "zero transfer rejected");
  same(validateIncomingTransfer({ ...baseTransfer, transaction_id: "not-a-tx" }, TRON_RECEIVING_WALLET, true), null, "invalid transaction hash rejected");
});

Deno.test("USDT atomic parser requires positive integer base units and six decimals", () => {
  same(parseAtomicUsdt("1", 6), "1", "one atomic unit");
  same(parseAtomicUsdt("1000000", 6), "1000000", "one USDT");
  same(parseAtomicUsdt("1.2", 6), null, "decimal string rejected");
  same(parseAtomicUsdt("-1", 6), null, "negative amount rejected");
  same(parseAtomicUsdt("10", 18), null, "wrong decimal precision rejected");
});

Deno.test("only a matching unique order in its exact payment window can be matched", () => {
  const candidate = { amountAtomic: "12500000", blockTimestamp: Date.parse("2026-11-02T00:30:00.000Z") };
  same(findMatchingOrders(candidate, [pendingOrder]).length, 1, "one exact order matches");
  same(findMatchingOrders({ ...candidate, amountAtomic: "12500001" }, [pendingOrder]).length, 0, "wrong amount does not match");
  same(findMatchingOrders({ ...candidate, blockTimestamp: Date.parse("2026-11-02T02:00:00.000Z") }, [pendingOrder]).length, 0, "out-of-window transfer does not match");
  same(findMatchingOrders(candidate, [{ ...pendingOrder, status: "paid" }]).length, 0, "paid order does not match");
  same(findMatchingOrders(candidate, [pendingOrder, { ...pendingOrder, id: "order-2" }]).length, 2, "ambiguous orders are detected, not auto-credited");
});

Deno.test("solidified successful body and receipt are both required", () => {
  const body = { txID: HASH, ret: [{ contractRet: "SUCCESS" }] };
  const receipt = { id: HASH, blockNumber: 123456, receipt: { result: "SUCCESS" } };
  same(isSolidifiedSuccessfulReceipt(HASH, body, receipt), true, "success receipt passes");
  same(isSolidifiedSuccessfulReceipt(HASH, body, { ...receipt, receipt: { result: "FAILED" } }), false, "failed execution rejected");
  same(isSolidifiedSuccessfulReceipt(HASH, { ...body, ret: [{ contractRet: "REVERT" }] }, receipt), false, "reverted contract rejected");
  same(isSolidifiedSuccessfulReceipt("b".repeat(64), body, receipt), false, "mismatched transaction IDs rejected");
  same(isSolidifiedSuccessfulReceipt(HASH, body, { ...receipt, blockNumber: 0 }), false, "missing solidified block rejected");
});

Deno.test("order quote uses six-decimal USDT units and unique suffix", () => {
  const amount = BigInt(buildUsdtAmountAtomic(999, 83, 321));
  assert(amount > 0n, "quoted amount should be positive");
  same(amount % 1000n, (BigInt(Math.round((999 / 83) * 1_000_000)) + 321n) % 1000n, "unique suffix is included");
});


Deno.test("requires the exact official USDT Transfer event in the solidified receipt", () => {
  const log = {
    address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c",
    topics: [
      "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0000000000000000000000001111111111111111111111111111111111111111",
      "000000000000000000000000389e7f090fe45d935a8f3b641f4fd11a54aeae54",
    ],
    data: "0000000000000000000000000000000000000000000000000000000000bebc20",
  };
  same(hasExactUsdtTransferReceiptLog({ log: [log] }, "12500000"), true, "exact USDT Transfer receipt accepted");
  same(hasExactUsdtTransferReceiptLog({ log: [log] }, "12500001"), false, "wrong receipt amount rejected");
  same(hasExactUsdtTransferReceiptLog({ log: [{ ...log, address: "41" + "0".repeat(40) }] }, "12500000"), false, "wrong contract rejected");
  same(hasExactUsdtTransferReceiptLog({ log: [{ ...log, topics: [log.topics[0], log.topics[1], "0".repeat(64)] }] }, "12500000"), false, "wrong receipt recipient rejected");
  same(hasExactUsdtTransferReceiptLog({ log: [{ ...log, topics: ["0".repeat(64), ...log.topics.slice(1)] }] }, "12500000"), false, "wrong event signature rejected");
});

Deno.test("cron bearer secret comparison is exact", () => {
  same(timingSafeEqualText("strong-secret", "strong-secret"), true, "matching secret");
  same(timingSafeEqualText("strong-secret", "strong-secret-x"), false, "different secret");
});
