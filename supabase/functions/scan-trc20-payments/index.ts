import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  findMatchingOrders,
  isSolidifiedSuccessfulReceipt,
  TRON_MAINNET_USDT_CONTRACT,
  TRON_RECEIVING_WALLET,
  timingSafeEqualText,
  validateIncomingTransfer,
  type PendingOrder,
  type TronTransfer,
} from "../_shared/trc20.ts";

const TRONGRID_BASE = "https://api.trongrid.io";
const MAX_PAGES_PER_SCAN = 5;
const PAGE_SIZE = 200;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function postNode(path: string, txHash: string, apiKey: string) {
  const response = await fetch(`${TRONGRID_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "TRON-PRO-API-KEY": apiKey },
    body: JSON.stringify({ value: txHash }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`TRON solidified-node request failed: ${response.status}`);
  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const expectedSecret = Deno.env.get("TRC20_SCANNER_CRON_SECRET") || "";
  const authorization = req.headers.get("Authorization") || "";
  const suppliedSecret = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!expectedSecret || !timingSafeEqualText(expectedSecret, suppliedSecret)) {
    return json({ error: "Unauthorized scanner request" }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const tronGridKey = Deno.env.get("TRONGRID_API_KEY");
  if (!url || !serviceKey || !tronGridKey) {
    return json({ error: "Payment scanner server secrets are incomplete" }, 503);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date();
  // Keep expired orders pending for a one-hour indexing/finality grace period.
  // This lets a transfer made before the deadline settle after its block is indexed.
  const finalExpiry = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const { data: expiredRows, error: expireError } = await admin.from("payment_orders")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lte("expires_at", finalExpiry)
    .select("id");
  if (expireError) {
    console.error("Unable to expire old Bullseye payment orders:", expireError);
    return json({ error: "Could not expire stale payment orders" }, 503);
  }

  const { data: orders, error: ordersError } = await admin.from("payment_orders")
    .select("id,user_id,plan_code,usdt_amount_atomic,created_at,expires_at,destination_wallet,token_contract,status")
    .eq("status", "pending")
    .gt("expires_at", finalExpiry)
    .order("created_at", { ascending: true })
    .limit(500);
  if (ordersError) {
    console.error("Unable to load pending Bullseye payment orders:", ordersError);
    return json({ error: "Could not load pending payment orders" }, 503);
  }
  if (!orders?.length) return json({ ok: true, expired: expiredRows?.length || 0, pending: 0, verified: 0 });

  const minTimestamp = Math.max(0, Math.min(...orders.map((o) => Date.parse(o.created_at)).filter(Number.isFinite)) - 120000);
  const candidates: TronTransfer[] = [];
  let fingerprint: string | null = null;
  for (let page = 0; page < MAX_PAGES_PER_SCAN; page++) {
    const query = new URLSearchParams({
      only_confirmed: "true",
      limit: String(PAGE_SIZE),
      contract_address: TRON_MAINNET_USDT_CONTRACT,
      min_timestamp: String(minTimestamp),
    });
    if (fingerprint) query.set("fingerprint", fingerprint);
    const response = await fetch(
      `${TRONGRID_BASE}/v1/accounts/${TRON_RECEIVING_WALLET}/transactions/trc20?${query.toString()}`,
      {
        headers: { Accept: "application/json", "TRON-PRO-API-KEY": tronGridKey },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!response.ok) {
      console.error("TronGrid transfer history request failed:", response.status);
      return json({ error: "TRON transfer history is temporarily unavailable; no payments were unlocked." }, 503);
    }
    const payload = await response.json();
    if (!Array.isArray(payload?.data)) {
      return json({ error: "TRON transfer history returned an unexpected response; no payments were unlocked." }, 502);
    }
    candidates.push(...payload.data);
    fingerprint = typeof payload?.meta?.fingerprint === "string" ? payload.meta.fingerprint : null;
    if (!fingerprint || payload.data.length < PAGE_SIZE) break;
  }

  let checked = 0;
  let paid = 0;
  let unmatched = 0;
  let duplicates = 0;
  const results: Array<{ tx_hash: string; result: string }> = [];

  for (const transfer of candidates) {
    const normalized = validateIncomingTransfer(transfer, TRON_RECEIVING_WALLET, true);
    if (!normalized) continue;
    const matches = findMatchingOrders(
      { amountAtomic: normalized.amountAtomic, blockTimestamp: normalized.blockTimestamp },
      orders as PendingOrder[],
    );

    const { data: knownPayment } = await admin.from("payment_transactions")
      .select("tx_hash").eq("tx_hash", normalized.txHash).maybeSingle();
    if (knownPayment) { duplicates++; continue; }

    const { data: knownReview } = await admin.from("payment_review_events")
      .select("tx_hash").eq("tx_hash", normalized.txHash).maybeSingle();
    if (knownReview) continue;

    checked++;
    let body: Record<string, unknown>;
    let info: Record<string, unknown>;
    try {
      [body, info] = await Promise.all([
        postNode("walletsolidity/gettransactionbyid", normalized.txHash, tronGridKey),
        postNode("walletsolidity/gettransactioninfobyid", normalized.txHash, tronGridKey),
      ]);
    } catch (error) {
      // Indexer sightings are not finality. Retry on the next scheduled pass.
      console.warn("Solidified receipt not available yet:", normalized.txHash, error);
      continue;
    }

    if (!isSolidifiedSuccessfulReceipt(
      normalized.txHash,
      body as { txID?: string; txid?: string; ret?: Array<{ contractRet?: string }> },
      info as { id?: string; blockNumber?: number; receipt?: { result?: string } },
    )) {
      continue;
    }

    if (matches.length !== 1) {
      const reviewReason = matches.length > 1 ? "multiple_matching_orders" : "no_matching_order";
      const { error: reviewError } = await admin.from("payment_review_events").insert({
        tx_hash: normalized.txHash,
        from_address: normalized.from,
        to_address: TRON_RECEIVING_WALLET,
        token_contract: TRON_MAINNET_USDT_CONTRACT,
        amount_atomic: normalized.amountAtomic,
        block_number: Number(info.blockNumber),
        block_timestamp: new Date(normalized.blockTimestamp).toISOString(),
        review_reason: reviewReason,
      });
      if (reviewError && reviewError.code !== "23505") {
        console.error("Could not record unmatched verified deposit:", normalized.txHash, reviewError);
      }
      unmatched++;
      results.push({ tx_hash: normalized.txHash, result: reviewReason });
      continue;
    }

    const order = matches[0];
    const { data: finalizeResult, error: finalizeError } = await admin.rpc("finalize_trc20_payment", {
      p_order_id: order.id,
      p_tx_hash: normalized.txHash,
      p_amount_atomic: normalized.amountAtomic,
      p_from_address: normalized.from,
      p_to_address: TRON_RECEIVING_WALLET,
      p_token_contract: TRON_MAINNET_USDT_CONTRACT,
      p_block_timestamp: new Date(normalized.blockTimestamp).toISOString(),
      p_block_number: Number(info.blockNumber),
    });
    if (finalizeError) {
      console.error("Atomic payment finalization failed:", normalized.txHash, finalizeError);
      results.push({ tx_hash: normalized.txHash, result: "finalization_error" });
      continue;
    }
    const outcome = String(finalizeResult);
    if (outcome === "paid") paid++;
    if (outcome === "duplicate_transaction" || outcome === "already_paid") duplicates++;
    results.push({ tx_hash: normalized.txHash, result: outcome });
  }

  return json({
    ok: true,
    network: "TRON Mainnet · TRC-20",
    pending: orders.length,
    expired: expiredRows?.length || 0,
    transfers_checked: checked,
    paid,
    unmatched_verified_deposits: unmatched,
    duplicates,
    results: results.slice(0, 40),
  });
});
