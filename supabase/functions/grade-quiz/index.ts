// Supabase Edge Function: authoritative quiz grading for Bullseye Theory.
// Deploy only after staging validation. Never expose SUPABASE_SERVICE_ROLE_KEY to browsers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const answerKeys: Record<number, string[]> = {
  1: ["a", "b", "a", "c", "b"],
  2: ["a", "a", "a", "b", "b"],
  3: ["0", "1", "2", "0", "1"],
  4: ["2", "0", "1", "2", "0"],
  5: ["1", "2", "0", "1", "2"],
  6: ["1", "0", "2", "1", "0"],
  7: ["2", "1", "0", "2", "1"],
  8: ["0", "1", "2", "0", "1"],
  9: ["1", "0", "2", "0", "1"],
  10: ["2", "1", "0", "2", "1"],
  11: ["a", "b", "a", "b", "b"],
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return respond({ error: "Server configuration is incomplete" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return respond({ error: "Sign in is required" }, 401);
  }

  // Authenticate the caller with their JWT; never accept user_id from the request.
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: authError } = await userClient.auth.getUser();
  const user = userData.user;
  if (authError || !user) return respond({ error: "Session is invalid or expired" }, 401);

  let payload: { lesson_number?: unknown; answers?: unknown };
  try {
    payload = await req.json();
  } catch {
    return respond({ error: "Request body must be valid JSON" }, 400);
  }
  const lesson = Number(payload.lesson_number);
  if (!Number.isInteger(lesson) || lesson < 1 || lesson > 11) {
    return respond({ error: "lesson_number must be an integer from 1 to 11" }, 400);
  }

  const key = answerKeys[lesson];
  const submitted = payload.answers;
  let values: string[] | null = null;
  if (Array.isArray(submitted) && submitted.length === 5 && submitted.every((v) => typeof v === "string")) {
    values = submitted as string[];
  } else if (submitted && typeof submitted === "object" && !Array.isArray(submitted)) {
    const obj = submitted as Record<string, unknown>;
    const prefix = lesson === 1 || lesson === 2 || lesson === 11 ? "q" : "q";
    const candidate = Array.from({ length: 5 }, (_, i) => obj[prefix + (lesson === 1 || lesson === 2 || lesson === 11 ? i + 1 : i)]);
    if (candidate.every((v) => typeof v === "string")) values = candidate as string[];
  }
  if (!values || values.length !== key.length) {
    return respond({ error: "Submit exactly five answers" }, 400);
  }

  // Service-role access is server-only and follows authentication + entitlement checks.
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: access, error: accessError } = await admin
    .from("course_access")
    .select("is_active,payment_verified,expires_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const active = !!access?.is_active && !!access?.payment_verified &&
    (!access.expires_at || new Date(access.expires_at).getTime() > Date.now());
  if (accessError) return respond({ error: "Could not verify course access" }, 500);
  if (!active) return respond({ error: "Active verified course access is required" }, 403);

  const correct = values.reduce((sum, value, index) => sum + (value === key[index] ? 1 : 0), 0);
  const score = Math.round((correct / key.length) * 100);
  const passed = correct >= 4;

  const { error: attemptError } = await admin.from("quiz_attempts").insert({
    user_id: user.id,
    lesson_number: lesson,
    score,
    passed,
  });
  if (attemptError) return respond({ error: "Could not save quiz attempt" }, 500);

  if (passed) {
    // lesson_number uniqueness exists in the inspected live schema. This write is
    // intentionally additive; do not revoke browser writes until all pages migrate.
    const { error: progressError } = await admin.from("lesson_progress").upsert({
      user_id: user.id,
      lesson_number: lesson,
      quiz_passed: true,
      progress_percent: 90,
      completed: false,
    }, { onConflict: "user_id,lesson_number" });
    if (progressError) return respond({ error: "Quiz passed but progress could not be saved" }, 500);
  }

  return respond({ lesson_number: lesson, score, correct, total: key.length, passed });
});
