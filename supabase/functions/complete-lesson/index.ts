// Secure lesson completion endpoint for Bullseye Theory.
// Deploy to staging first; do not deploy to production without explicit approval.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function corsHeadersFor(req: Request): Record<string, string> | null {
  const configured = [
    Deno.env.get("ALLOWED_SITE_ORIGIN") || "",
    Deno.env.get("ALLOWED_SITE_ORIGINS") || "",
  ].flatMap((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean));
  const allowed = new Set([
    "https://bullseye-theory.foryourtravel17.workers.dev",
    "https://bullseye-theory-secure-preview.onrender.com",
    ...configured,
  ]);
  const origin = req.headers.get("Origin");
  if (origin && !allowed.has(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin || "https://bullseye-theory.foryourtravel17.workers.dev",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function respond(req: Request, body: Record<string, unknown>, status = 200) {
  const cors = corsHeadersFor(req);
  if (!cors) return new Response(JSON.stringify({ error: "Origin not allowed" }), {
    status: 403,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Origin" },
  });
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req);
  if (!cors) return new Response("Origin not allowed", { status: 403, headers: { "Cache-Control": "no-store", "Vary": "Origin" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return respond(req, { error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return respond(req, { error: "Server configuration is incomplete" }, 500);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return respond(req, { error: "Sign in is required" }, 401);
  }

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: authError } = await userClient.auth.getUser();
  if (authError || !userData.user) return respond(req, { error: "Invalid session" }, 401);
  const userId = userData.user.id;

  let payload: { lesson_number?: unknown };
  try {
    payload = await req.json();
  } catch {
    return respond(req, { error: "Invalid JSON body" }, 400);
  }
  const lessonNumber = payload.lesson_number;
  if (!Number.isInteger(lessonNumber) || (lessonNumber as number) < 1 || (lessonNumber as number) > 11) {
    return respond(req, { error: "lesson_number must be an integer from 1 to 11" }, 400);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: access, error: accessError } = await admin
    .from("course_access")
    .select("is_active,payment_verified,expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (accessError) return respond(req, { error: "Could not verify course access" }, 500);
  const expiry = access?.expires_at ? new Date(access.expires_at).getTime() : 0;
  const active = !!access?.is_active && !!access?.payment_verified &&
    Number.isFinite(expiry) && expiry > Date.now();
  if (lessonNumber !== 1 && !active) {
    return respond(req, { error: "Active verified course access is required for paid lessons" }, 403);
  }

  const { data: passingAttempt, error: attemptError } = await admin
    .from("quiz_attempts")
    .select("id")
    .eq("user_id", userId)
    .eq("lesson_number", lessonNumber)
    .eq("passed", true)
    .limit(1)
    .maybeSingle();
  if (attemptError) return respond(req, { error: "Could not verify a passing quiz attempt" }, 500);
  if (!passingAttempt) return respond(req, { error: "Pass this lesson quiz before completing the lesson" }, 409);

  const { data: previous, error: previousError } = await admin
    .from("lesson_progress")
    .select("completed,completed_at,quiz_passed,progress_percent")
    .eq("user_id", userId)
    .eq("lesson_number", lessonNumber)
    .maybeSingle();
  if (previousError) return respond(req, { error: "Could not read lesson progress" }, 500);

  const { error: saveError } = await admin.from("lesson_progress").upsert({
    user_id: userId,
    lesson_number: lessonNumber,
    quiz_passed: true,
    progress_percent: 100,
    completed: true,
    completed_at: previous?.completed_at || new Date().toISOString(),
  }, { onConflict: "user_id,lesson_number" });
  if (saveError) return respond(req, { error: "Could not save lesson completion" }, 500);

  return respond(req, {
    success: true,
    lesson_number: lessonNumber,
    completed: true,
    already_completed: !!previous?.completed,
  });
});
