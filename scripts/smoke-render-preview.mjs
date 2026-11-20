const base = process.env.RENDER_PREVIEW_URL || "https://bullseye-theory-secure-preview.onrender.com";

async function request(path) {
  return fetch(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(60000) });
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log("PASS " + message);
}

const health = await request("/_health");
assert(health.status === 200 && (await health.text()).trim() === "ok", "hosted health endpoint responds 200");

const freeLesson = await request("/lesson-1.html");
const freeBody = await freeLesson.text();
assert(freeLesson.status === 200 && /Lesson 1/i.test(freeBody), "free Lesson 1 is publicly served");

for (const route of ["/lesson-2.html", "/lesson-3.html", "/lesson-4.html", "/lesson-5.html", "/lesson-6.html", "/lesson-7.html", "/lesson-8.html", "/lesson-9.html", "/lesson-10.html", "/lesson-11.html", "/%6cesson-2.html", "/folder/../lesson-7.html", "/course-assets/sample.pdf", "/lessons/lesson-2.html", "/downloads/sample.pdf", "/videos/lesson-2.mp4", "/lessons/what-is-trading.pdf", "/lessons/lesson-2-how-financial-markets-work.pdf", "/lessons/lesson_10_trading_psychology_and_discipline.pptx"]) {
  const response = await request(route);
  assert(response.status === 302 && response.headers.get("location") === "/auth.html", "unauthorised paid lesson is redirected: " + route);
  assert((response.headers.get("cache-control") || "").includes("no-store"), "unauthorised paid lesson response is not cached: " + route);
  assert((response.headers.get("vary") || "").toLowerCase().includes("cookie"), "unauthorised paid lesson response varies by cookie: " + route);
}

for (const route of ["/server.mjs", "/.mcp.json", "/package.json", "/wrangler.toml", "/supabase/config.toml", "/docs/RENDER_SECURE_COURSE_RUNTIME.md"]) {
  const response = await request(route);
  assert(response.status === 404, "repository internals are not served: " + route);
}

console.log("Render hosted unauthorised-access smoke tests passed.");

const invalidSession = await fetch(new URL("/api/course-session", base), { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer invalid-token" }, body: "{}", redirect: "manual" });
assert(invalidSession.status === 401, "invalid Supabase session token is rejected");
