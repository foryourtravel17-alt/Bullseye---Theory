import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildUsdtAmountAtomic, TRON_MAINNET_USDT_CONTRACT, TRON_RECEIVING_WALLET } from "../_shared/trc20.ts";

const SITE_ORIGIN = Deno.env.get("ALLOWED_SITE_ORIGIN") || "https://bullseye-theory.foryourtravel17.workers.dev";
const COURSE_ACCESS_DAYS = 85;
const corsHeaders = {
  "Access-Control-Allow-Origin": SITE_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function formatUsdt(atomic: string): string {
  const padded = atomic.padStart(7, "0");
  return padded.slice(0, -6) + "." + padded.slice(-6);
}

async function getUsdtInrRate(): Promise<number> {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=inr",
    { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok) throw new Error("Live USDT/INR quote is temporarily unavailable");
  const payload = await response.json();
  const rate = Number(payload?.tether?.inr);
  if (!Number.isFinite(rate) || rate <= 0 || rate > 100000) {
    throw new Error("Price provider returned an invalid USDT/INR quote");
  }
  return rate;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  if (Deno.env.get("USDT_CHECKOUT_ENABLED") !== "true") {
    return respond({ error: "USDT checkout is not open yet. No payment has been created." }, 503);
  }
  if (!Deno.env.get("TRONGRID_API_KEY") || !Deno.env.get("TRC20_SCANNER_CRON_SECRET")) {
    return respond({ error: "Payment verification is not fully configured. Checkout remains closed." }, 503);
  }
  const accessDays = Number(Deno.env.get("COURSE_ACCESS_DAYS"));
  if (!Number.isInteger(accessDays) || accessDays < 1 || accessDays > 3650) {
    return respond({ error: "The course access duration has not been configured. Checkout remains closed." }, 503);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return respond({ error: "Server configuration is incomplete" }, 500);

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return respond({ error: "Sign in is required" }, 401);
  const accessToken = authorization.slice("Bearer ".length);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
  if (userError || !userData.user) return respond({ error: "Your session is invalid or expired. Sign in again." }, 401);

  let body: { plan?: unknown };
  try { body = await req.json(); } catch { return respond({ error: "Invalid request body" }, 400); }
  const plan = body?.plan;
  const plans = {
    course: { inrPaise: 99900 },
    premium: { inrPaise: 199900 },
  } as const;
  if (typeof plan !== "string" || !(plan in plans)) {
    return respond({ error: "Select a valid Bullseye plan" }, 400);
  }
  if (plan === "premium" && Deno.env.get("PREMIUM_CHECKOUT_ENABLED") !== "true") {
    return respond({ error: "Premium checkout remains closed until its benefits and access duration are formally published." }, 503);
  }
  const selected = plans[plan as keyof typeof plans];

  let rate: number;
  try {
    rate = await getUsdtInrRate();
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "Unable to create a fresh quote" }, 503);
  }

  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const now = new Date();
  const graceBoundary = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const { count: activeOrders, error: limitError } = await db.from("payment_orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userData.user.id)
    .eq("status", "pending")
    .gt("expires_at", graceBoundary);
  if (limitError) {
    console.error("Unable to apply Bullseye order rate limit:", limitError);
    return respond({ error: "Unable to check existing orders. Please try again." }, 503);
  }
  if ((activeOrders || 0) >= 3) {
    return respond({ error: "You already have three pending payment orders. Check their status or contact support before creating another." }, 429);
  }
  const inrAmount = selected.inrPaise / 100;
  const expiresAt = new Date(now.getTime() + 20 * 60 * 1000).toISOString();
  let order: { id: string; usdt_amount_atomic: string; expires_at: string } | null = null;
  let lastError: unknown = null;

  // The small six-decimal suffix makes concurrent orders distinguishable.
  // A unique partial index plus retry protects against collisions.
  for (let attempt = 0; attempt < 8; attempt++) {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const dust = (random[0] % 999) + 1;
    let atomic: string;
    try { atomic = buildUsdtAmountAtomic(inrAmount, rate, dust); }
    catch (error) { return respond({ error: "Unable to calculate a safe USDT quote" }, 500); }

    const { data, error } = await db.from("payment_orders").insert({
      user_id: userData.user.id,
      plan_code: plan,
      inr_amount_paise: selected.inrPaise,
      access_days: accessDays,
      usdt_inr_rate: rate,
      usdt_amount_atomic: atomic,
      destination_wallet: TRON_RECEIVING_WALLET,
      token_contract: TRON_MAINNET_USDT_CONTRACT,
      network: "TRON_MAINNET_TRC20",
      quote_source: "coingecko_tether_inr",
      quote_observed_at: now.toISOString(),
      status: "pending",
      expires_at: expiresAt,
    }).select("id,usdt_amount_atomic,expires_at").single();

    if (!error && data) { order = data; break; }
    lastError = error;
    if (error?.code !== "23505") break;
  }

  if (!order) {
    console.error("Bullseye create order failed:", lastError);
    return respond({ error: "Unable to reserve a unique payment amount. Please try again." }, 503);
  }

  return respond({
    order_id: order.id,
    plan,
    inr_amount: inrAmount,
    usdt_amount: formatUsdt(String(order.usdt_amount_atomic)),
    usdt_inr_rate: rate,
    quote_source: "CoinGecko USDT/INR spot quote",
    quote_observed_at: now.toISOString(),
    expires_at: order.expires_at,
    network: "TRON Mainnet · TRC-20",
    wallet_address: TRON_RECEIVING_WALLET,
    token_contract: TRON_MAINNET_USDT_CONTRACT,
    status: "pending",
  }, 201);
});
