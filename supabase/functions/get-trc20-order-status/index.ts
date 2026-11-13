import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_ORIGIN = Deno.env.get("ALLOWED_SITE_ORIGIN") || "https://bullseye-theory.foryourtravel17.workers.dev";
const corsHeaders = {
  "Access-Control-Allow-Origin": SITE_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return respond({ error: "Server configuration is incomplete" }, 500);

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return respond({ error: "Sign in is required" }, 401);
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(authorization.slice(7));
  if (userError || !userData.user) return respond({ error: "Your session is invalid or expired" }, 401);

  let body: { order_id?: unknown };
  try { body = await req.json(); } catch { return respond({ error: "Invalid request body" }, 400); }
  if (typeof body.order_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.order_id)) {
    return respond({ error: "A valid order ID is required" }, 400);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: order, error } = await admin.from("payment_orders")
    .select("id,plan_code,status,usdt_amount_atomic,expires_at,paid_at,created_at")
    .eq("id", body.order_id)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) {
    console.error("Bullseye payment status read failed:", error);
    return respond({ error: "Unable to read payment status" }, 503);
  }
  if (!order) return respond({ error: "Payment order not found" }, 404);
  let indicatorEntitlement: { is_active: boolean; payment_verified: boolean; expires_at: string | null } | null = null;
  if (order.plan_code === "indicator" && order.status === "paid") {
    const { data: access, error: accessError } = await admin.from("indicator_access")
      .select("is_active,payment_verified,expires_at")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (accessError) {
      console.error("Bullseye indicator entitlement read failed:", accessError);
      return respond({ error: "Unable to verify indicator entitlement" }, 503);
    }
    indicatorEntitlement = access;
  }

  const atomic = String(order.usdt_amount_atomic).padStart(7, "0");
  const amount = atomic.slice(0, -6) + "." + atomic.slice(-6);
  return respond({
    order_id: order.id,
    plan: order.plan_code,
    status: order.status,
    usdt_amount: amount,
    expires_at: order.expires_at,
    paid_at: order.paid_at,
    access_days: order.plan_code === "indicator" ? 365 : 85,
    indicator_access_active: indicatorEntitlement ? indicatorEntitlement.is_active && indicatorEntitlement.payment_verified && !!indicatorEntitlement.expires_at && Date.parse(indicatorEntitlement.expires_at) > Date.now() : null,
    indicator_access_expires_at: indicatorEntitlement?.expires_at ?? null,
  });
});
