import { TRON_MAINNET_USDT_CONTRACT, TRON_RECEIVING_WALLET } from "../_shared/trc20.ts";

const SITE_ORIGIN = Deno.env.get("ALLOWED_SITE_ORIGIN") || "https://bullseye-theory.foryourtravel17.workers.dev";
const headers = {
  "Access-Control-Allow-Origin": SITE_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Vary": "Origin",
  "Cache-Control": "no-store",
};

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const accessDays = 85;
  const checkoutEnabled =
    Deno.env.get("USDT_CHECKOUT_ENABLED") === "true" &&
    Boolean(Deno.env.get("TRONGRID_API_KEY")) &&
    Boolean(Deno.env.get("TRC20_SCANNER_CRON_SECRET")) &&
    Boolean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const premiumEnabled = checkoutEnabled && Deno.env.get("PREMIUM_CHECKOUT_ENABLED") === "true";
  return new Response(JSON.stringify({
    checkout_enabled: checkoutEnabled,
    course_enabled: checkoutEnabled,
    premium_enabled: premiumEnabled,
    network: "TRON Mainnet · TRC-20",
    wallet_address: TRON_RECEIVING_WALLET,
    token_contract: TRON_MAINNET_USDT_CONTRACT,
    plans: { course_inr: 999, premium_inr: 1999 },
    course_access_days: checkoutEnabled ? accessDays : null,
    message: checkoutEnabled
      ? "Course checkout is configured. Sign in to create a time-limited payment order."
      : "Checkout is closed while payment verification is being configured and tested.",
  }), { headers: { ...headers, "Content-Type": "application/json" } });
});
