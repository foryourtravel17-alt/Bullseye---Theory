export const TRON_MAINNET_USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
export const TRON_RECEIVING_WALLET = "TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV";
export const USDT_DECIMALS = 6;

export type PendingOrder = {
  id: string;
  plan_code: "course" | "premium";
  user_id: string;
  usdt_amount_atomic: string | number;
  created_at: string;
  expires_at: string;
  destination_wallet: string;
  token_contract: string;
  status: string;
};

export type TronTransfer = {
  transaction_id?: string;
  txID?: string;
  from?: string;
  to?: string;
  value?: string | number;
  block_timestamp?: number;
  confirmed?: boolean;
  type?: string;
  token_info?: { address?: string; decimals?: number };
};

export function parseAtomicUsdt(value: unknown, decimals: unknown): string | null {
  if (Number(decimals) !== USDT_DECIMALS) return null;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value);
  if (!/^\d+$/.test(text)) return null;
  try {
    const amount = BigInt(text);
    return amount > 0n ? amount.toString() : null;
  } catch {
    return null;
  }
}

export function validateIncomingTransfer(
  transfer: TronTransfer,
  destination = TRON_RECEIVING_WALLET,
  confirmedByQuery = false,
): { txHash: string; from: string; amountAtomic: string; blockTimestamp: number } | null {
  const txHash = transfer.transaction_id || transfer.txID || "";
  const from = transfer.from || "";
  const to = transfer.to || "";
  const token = transfer.token_info?.address || "";
  const amountAtomic = parseAtomicUsdt(transfer.value, transfer.token_info?.decimals);
  const blockTimestamp = Number(transfer.block_timestamp);

  if (!/^[a-fA-F0-9]{64}$/.test(txHash)) return null;
  if (!confirmedByQuery) return null;
  if (to !== destination || from.length < 20 || from === destination) return null;
  if (token !== TRON_MAINNET_USDT_CONTRACT || !amountAtomic) return null;
  if (!Number.isSafeInteger(blockTimestamp) || blockTimestamp <= 0) return null;
  return { txHash, from, amountAtomic, blockTimestamp };
}

export function isSolidifiedSuccessfulReceipt(
  txHash: string,
  body: { txID?: string; txid?: string; ret?: Array<{ contractRet?: string }> } | null,
  info: { id?: string; blockNumber?: number; receipt?: { result?: string } } | null,
): boolean {
  if (!body || !info) return false;
  const bodyId = body.txID || body.txid || "";
  if (bodyId.toLowerCase() !== txHash.toLowerCase()) return false;
  if ((info.id || "").toLowerCase() !== txHash.toLowerCase()) return false;
  if (!Number.isSafeInteger(Number(info.blockNumber)) || Number(info.blockNumber) <= 0) return false;
  if (info.receipt?.result !== "SUCCESS") return false;
  if (!Array.isArray(body.ret) || body.ret.length === 0) return false;
  return body.ret.every((result) => result.contractRet === "SUCCESS");
}

export function buildUsdtAmountAtomic(inrAmount: number, usdtInrRate: number, dustUnits: number): string {
  if (!Number.isFinite(inrAmount) || inrAmount <= 0) throw new Error("Invalid INR plan amount");
  if (!Number.isFinite(usdtInrRate) || usdtInrRate <= 0) throw new Error("Invalid USDT/INR rate");
  if (!Number.isInteger(dustUnits) || dustUnits < 1 || dustUnits > 999) throw new Error("Invalid unique order suffix");
  const baseAtomic = Math.round((inrAmount / usdtInrRate) * 10 ** USDT_DECIMALS);
  if (!Number.isSafeInteger(baseAtomic) || baseAtomic <= 0) throw new Error("Quoted amount is outside supported limits");
  return (BigInt(baseAtomic) + BigInt(dustUnits)).toString();
}

export function findMatchingOrders(
  transfer: { amountAtomic: string; blockTimestamp: number },
  orders: PendingOrder[],
): PendingOrder[] {
  return orders.filter((order) => {
    if (order.status !== "pending") return false;
    if (order.destination_wallet !== TRON_RECEIVING_WALLET) return false;
    if (order.token_contract !== TRON_MAINNET_USDT_CONTRACT) return false;
    if (BigInt(order.usdt_amount_atomic).toString() !== transfer.amountAtomic) return false;
    const created = Date.parse(order.created_at);
    const expires = Date.parse(order.expires_at);
    return Number.isFinite(created) && Number.isFinite(expires) &&
      transfer.blockTimestamp >= created && transfer.blockTimestamp <= expires;
  });
}

export function matchPendingOrder(
  transfer: { amountAtomic: string; blockTimestamp: number },
  orders: PendingOrder[],
): PendingOrder | null {
  const matching = findMatchingOrders(transfer, orders);
  return matching.length === 1 ? matching[0] : null;
}


const USDT_CONTRACT_HEX20 = "a614f803b6fd780986a42c78ec9c7f77e6ded13c";
const RECIPIENT_HEX20 = "389e7f090fe45d935a8f3b641f4fd11a54aeae54";
const TRC20_TRANSFER_EVENT_SIGNATURE = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export function hasExactUsdtTransferReceiptLog(
  info: {
    log?: Array<{ address?: string; topics?: string[]; data?: string }>;
  } | null,
  expectedAmountAtomic: string,
): boolean {
  if (!info || !Array.isArray(info.log) || info.log.length === 0) return false;
  let expected: bigint;
  try {
    expected = BigInt(expectedAmountAtomic);
  } catch {
    return false;
  }
  if (expected <= 0n) return false;

  return info.log.some((entry) => {
    const contract = (entry.address || "").replace(/^0x/i, "").toLowerCase();
    const topics = Array.isArray(entry.topics) ? entry.topics.map((x) => x.toLowerCase().replace(/^0x/i, "")) : [];
    const data = (entry.data || "").replace(/^0x/i, "");
    if (contract.slice(-40) !== USDT_CONTRACT_HEX20) return false;
    if (topics.length < 3 || topics[0] !== TRC20_TRANSFER_EVENT_SIGNATURE) return false;
    if (topics[2].slice(-40) !== RECIPIENT_HEX20) return false;
    if (!/^[a-f0-9]+$/i.test(data)) return false;
    try {
      return BigInt("0x" + data) === expected;
    } catch {
      return false;
    }
  });
}

export function timingSafeEqualText(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i++) diff |= (left[i] || 0) ^ (right[i] || 0);
  return diff === 0;
}
