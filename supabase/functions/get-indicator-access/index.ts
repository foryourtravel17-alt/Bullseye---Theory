import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_ORIGIN = Deno.env.get("ALLOWED_SITE_ORIGIN") || "https://bullseye-theory.foryourtravel17.workers.dev";
const corsHeaders = {
  "Access-Control-Allow-Origin": SITE_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Vary": "Origin",
  "Cache-Control": "no-store",
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

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

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: access, error } = await admin.from("indicator_access")
    .select("is_active,payment_verified,activated_at,expires_at")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) {
    console.error("Bullseye indicator entitlement read failed:", error);
    return respond({ error: "Unable to verify indicator access" }, 503);
  }

  const expiry = access?.expires_at ? Date.parse(access.expires_at) : 0;
  const active = !!access?.is_active && !!access?.payment_verified &&
    Number.isFinite(expiry) && expiry > Date.now();
  return respond({
    product: "bullseye-india-indicator",
    access_active: active,
    access_days: 365,
    expires_at: active ? access.expires_at : null,
    delivery: "website_historical_analyzer",
    message: active
      ? "Verified 365-day website analyzer entitlement is active."
      : "No active verified website analyzer entitlement was found for this account.",
  });
});
