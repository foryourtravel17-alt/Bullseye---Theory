// Supabase Edge Function: authoritative quiz grading for Bullseye Theory.
// Deploy only after staging validation. Never expose SUPABASE_SERVICE_ROLE_KEY to browsers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { gradeAnswers, normalizeAnswers } from "./grading.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_SITE_ORIGIN") || "https://bullseye-theory.foryourtravel17.workers.dev",
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

  const values = normalizeAnswers(lesson, payload.answers);
  if (!values) return respond({ error: "Submit exactly five valid answers" }, 400);

  // Service-role access is server-only and follows authentication + entitlement checks.
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: access, error: accessError } = await admin
    .from("course_access")
    .select("is_active,payment_verified,expires_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const expiry = access?.expires_at ? new Date(access.expires_at).getTime() : 0;
  const active = !!access?.is_active && !!access?.payment_verified &&
    Number.isFinite(expiry) && expiry > Date.now();
  if (accessError) return respond({ error: "Could not verify course access" }, 500);
  if (lesson !== 1 && !active) return respond({ error: "Active verified course access is required for paid lessons" }, 403);

  const grade = gradeAnswers(lesson, values);
  if (!grade) return respond({ error: "Invalid lesson or answers" }, 400);
  const { correct, score, passed } = grade;

  const { error: attemptError } = await admin.from("quiz_attempts").insert({
    user_id: user.id,
    lesson_number: lesson,
    score,
    passed,
  });
  if (attemptError) return respond({ error: "Could not save quiz attempt" }, 500);

  if (passed) {
    // Preserve completion state if a student retakes a quiz after completing a lesson.
    const { data: priorProgress, error: readProgressError } = await admin
      .from("lesson_progress")
      .select("completed,completed_at,progress_percent")
      .eq("user_id", user.id)
      .eq("lesson_number", lesson)
      .maybeSingle();
    if (readProgressError) return respond({ error: "Could not read existing progress" }, 500);
    const alreadyCompleted = !!priorProgress?.completed;
    const { error: progressError } = await admin.from("lesson_progress").upsert({
      user_id: user.id,
      lesson_number: lesson,
      quiz_passed: true,
      progress_percent: alreadyCompleted ? 100 : 90,
      completed: alreadyCompleted,
      ...(alreadyCompleted && priorProgress?.completed_at
        ? { completed_at: priorProgress.completed_at }
        : {}),
    }, { onConflict: "user_id,lesson_number" });
    if (progressError) return respond({ error: "Quiz passed but progress could not be saved" }, 500);
  }

  return respond({ lesson_number: lesson, score, correct, total: 5, passed });
});
