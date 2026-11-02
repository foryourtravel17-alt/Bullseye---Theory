/* Secure lesson client: quiz keys and completion decisions stay server-side. */
(() => {
  const script = document.currentScript;
  const lesson = Number(script?.dataset.lessonNumber);
  const sb = window.supabase.createClient(
    window.BULLSEYE_SUPABASE_URL,
    window.BULLSEYE_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );
  const byId = (...ids) => ids.map(id => document.getElementById(id)).find(Boolean);
  const resultEl = byId("quizResult", "res", "result");
  const completeBtn = byId("completeBtn", "complete");
  const titleEl = byId("completeTitle", "ct");
  const textEl = byId("completeText", "cp");
  const statusEl = byId("saveStatus", "save");
  const wrapEl = byId("completeWrap");
  let signedIn = false;
  let passed = false;
  let completed = false;

  function showResult(message, ok) {
    if (!resultEl) return;
    resultEl.textContent = message;
    resultEl.className = "result show " + (ok ? "pass" : "fail");
  }
  function showCompletion(isComplete) {
    completed = isComplete;
    if (completeBtn) completeBtn.disabled = !passed || completed;
    if (titleEl && completed) titleEl.textContent = "Lesson " + lesson + " complete ✓";
    if (textEl && completed) textEl.textContent = "Your completion is saved. Return to the dashboard to continue.";
    if (wrapEl && passed) wrapEl.style.display = "block";
  }
  async function init() {
    if (!Number.isInteger(lesson) || lesson < 1 || lesson > 11) {
      showResult("Lesson configuration error. Please contact support.", false); return;
    }
    const { data: { session }, error: sessionError } = await sb.auth.getSession();
    if (sessionError || !session) { location.href = "auth.html"; return; }
    signedIn = true;
    // Lesson 1 is an authenticated free preview. Paid entitlement is required for lessons 2–11.
    if (lesson !== 1) {
      const { data: access, error: accessError } = await sb.from("course_access")
        .select("is_active,payment_verified,expires_at").eq("user_id", session.user.id).maybeSingle();
      const active = !accessError && !!access?.is_active && !!access?.payment_verified &&
        (!access.expires_at || new Date(access.expires_at) > new Date());
      if (!active) { alert("Verified course access is required for Lessons 2–11."); location.href = "dashboard.html"; return; }
    }

    const { data: progress } = await sb.from("lesson_progress")
      .select("completed,quiz_passed").eq("user_id", session.user.id)
      .eq("lesson_number", lesson).maybeSingle();
    passed = !!progress?.quiz_passed;
    completed = !!progress?.completed;
    if (passed) showResult("A passing quiz result is already recorded. You can complete this lesson.", true);
    showCompletion(completed);
  }

  const submitBtn = byId("submitQuiz", "submit");
  if (submitBtn) submitBtn.addEventListener("click", async () => {
    if (!signedIn) return;
    const zeroBased = document.querySelector('input[name="q0"]') !== null;
    const names = zeroBased ? ["q0","q1","q2","q3","q4"] : ["q1","q2","q3","q4","q5"];
    const answers = names.map(name => document.querySelector('input[name="' + name + '"]:checked')?.value ?? null);
    if (answers.some(value => value === null)) {
      showResult("Please answer all 5 questions before submitting.", false); return;
    }
    submitBtn.disabled = true;
    try {
      const { data, error } = await sb.functions.invoke("grade-quiz", {
        body: { lesson_number: lesson, answers }
      });
      if (error) throw error;
      if (!data || typeof data.passed !== "boolean") throw new Error("Unexpected grading response.");
      passed = data.passed;
      const score = Number(data.correct);
      const total = Number(data.total || 5);
      const percent = Math.round(score / total * 100);
      showResult("You scored " + score + "/" + total + " (" + percent + "%). " +
        (passed ? "Quiz passed. Now mark the lesson complete." : "You need at least 4/5 to pass. Review and retry."),
        passed);
      if (passed) {
        if (titleEl) titleEl.textContent = "Quiz passed ✓";
        if (textEl) textEl.textContent = "The server recorded your passing result. Mark the lesson complete below.";
        showCompletion(false);
      }
    } catch (err) {
      showResult("Quiz could not be verified by the server. Please retry. " + (err?.message || ""), false);
    } finally { submitBtn.disabled = false; }
  });

  if (completeBtn) completeBtn.addEventListener("click", async () => {
    if (!signedIn || !passed || completed) return;
    completeBtn.disabled = true;
    try {
      const { data, error } = await sb.functions.invoke("complete-lesson", {
        body: { lesson_number: lesson }
      });
      if (error) throw error;
      if (!data?.success || data.lesson_number !== lesson) throw new Error("Unexpected completion response.");
      showCompletion(true);
      if (statusEl) statusEl.textContent = "Saved securely to your student account.";
      showResult("Lesson " + lesson + " completed ✓", true);
    } catch (err) {
      completeBtn.disabled = false;
      if (statusEl) statusEl.textContent = "Completion could not be verified. Please retry.";
      showResult("Could not save completion. Please retry. " + (err?.message || ""), false);
    }
  });
  init().catch(() => showResult("Could not initialize the lesson. Refresh and sign in again.", false));
})();