import { cookieValue, isProtectedCourseAsset, tokenExpiry, default as worker } from "../_worker.js";

function testToken(exp: number): string {
  const payload = btoa(JSON.stringify({ exp })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return "e30." + payload + ".signature";
}

Deno.test("course asset matcher protects lesson pages and course resource directories", () => {
  for (const path of ["/lesson-2.html", "/lesson-11.pdf", "/lesson-2-slides.pptx", "/lesson-3/video.mp4", "/assets/lesson-2.pdf", "/lesson-2%2Fslides.pdf", "/lessons/lesson-1.html", "/course-assets/chart.pdf", "/downloads/workbook.pdf"]) {
    if (!isProtectedCourseAsset(path)) throw new Error("Expected protected path: " + path);
  }
  for (const path of ["/", "/index.html", "/auth.html", "/lesson-1.html", "/lesson-12.html", "/lesson-notes.html"]) {
    if (isProtectedCourseAsset(path)) throw new Error("Unexpected protected path: " + path);
  }
});


Deno.test("signed-in free preview HTML is served without paid entitlement cookie", async () => {
  let assetFetched = false;
  const response = await worker.fetch(
    new Request("https://bullseye-theory.foryourtravel17.workers.dev/lesson-1.html"),
    {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "public-key",
      ASSETS: {
        fetch: async () => {
          assetFetched = true;
          return new Response("free preview html", { status: 200 });
        },
      },
    } as never,
  );
  if (response.status !== 200) throw new Error("Expected free preview response 200, got " + response.status);
  if (!assetFetched) throw new Error("Free preview must reach the static asset binding");
  if (await response.text() !== "free preview html") throw new Error("Unexpected free preview body");
});

Deno.test("cookie parser reads the exact session cookie", () => {
  const value = cookieValue("theme=dark; bt_course_session=abc.def.sig; other=x", "bt_course_session");
  if (value !== "abc.def.sig") throw new Error("Unexpected cookie value: " + value);
  if (cookieValue("not_bt_course_session=x", "bt_course_session") !== "") throw new Error("Matched a partial cookie name");
});

Deno.test("token expiry rejects malformed and expired JWT payloads", () => {
  const expired = testToken(Math.floor(Date.now() / 1000) - 60);
  const future = testToken(Math.floor(Date.now() / 1000) + 600);
  if (tokenExpiry(expired) >= Math.floor(Date.now() / 1000)) throw new Error("Expired token was accepted");
  if (tokenExpiry(future) <= Math.floor(Date.now() / 1000)) throw new Error("Valid future expiry was rejected");
  if (tokenExpiry("not-a-jwt") !== 0) throw new Error("Malformed token did not fail closed");
});

Deno.test("lesson URL without HttpOnly entitlement cookie is redirected before asset fetch", async () => {
  let assetFetched = false;
  const response = await worker.fetch(new Request("https://bullseye-theory.foryourtravel17.workers.dev/lesson-2.html"), {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "public-key",
    ASSETS: { fetch: async () => { assetFetched = true; return new Response("secret lesson"); } },
  } as never);
  if (response.status !== 302) throw new Error("Expected 302, got " + response.status);
  if (assetFetched) throw new Error("Protected static asset was fetched before authorization");
  if (response.headers.get("Location") !== "https://bullseye-theory.foryourtravel17.workers.dev/auth.html") {
    throw new Error("Unexpected redirect destination");
  }
});

Deno.test("session exchange sets a short-lived HttpOnly cookie only after verified entitlement", async () => {
  const originalFetch = globalThis.fetch;
  const token = testToken(Math.floor(Date.now() / 1000) + 1800);
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/auth/v1/user")) return new Response(JSON.stringify({ id: "student-1" }), { status: 200 });
    if (url.includes("/rest/v1/course_access?")) {
      return new Response(JSON.stringify([{ is_active: true, payment_verified: true, expires_at: null }]), { status: 200 });
    }
    throw new Error("Unexpected upstream request: " + url);
  }) as typeof fetch;
  try {
    const response = await worker.fetch(new Request("https://bullseye-theory.foryourtravel17.workers.dev/api/course-session", {
      method: "POST",
      headers: {
        Origin: "https://bullseye-theory.foryourtravel17.workers.dev",
        Authorization: "Bearer " + token,
      },
    }), {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "public-key",
      ASSETS: { fetch: async () => new Response("asset") },
    } as never);
    const cookie = response.headers.get("Set-Cookie") || "";
    if (response.status !== 200) throw new Error("Expected 200, got " + response.status);
    if (!cookie.includes("bt_course_session=") || !cookie.includes("HttpOnly") || !cookie.includes("Secure") || !cookie.includes("SameSite=Lax")) {
      throw new Error("Session cookie missing required security attributes: " + cookie);
    }
    const body = await response.json();
    if (body.active !== true) throw new Error("Expected active entitlement");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("expired or unentitled sessions never receive protected asset bytes", async () => {
  const originalFetch = globalThis.fetch;
  const token = testToken(Math.floor(Date.now() / 1000) + 1800);
  let assetFetched = false;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/auth/v1/user")) return new Response(JSON.stringify({ id: "student-2" }), { status: 200 });
    if (url.includes("/rest/v1/course_access?")) {
      return new Response(JSON.stringify([{ is_active: true, payment_verified: false, expires_at: null }]), { status: 200 });
    }
    throw new Error("Unexpected upstream request: " + url);
  }) as typeof fetch;
  try {
    const response = await worker.fetch(new Request("https://bullseye-theory.foryourtravel17.workers.dev/lesson-4.html", {
      headers: { Cookie: "bt_course_session=" + token },
    }), {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "public-key",
      ASSETS: { fetch: async () => { assetFetched = true; return new Response("secret lesson"); } },
    } as never);
    if (response.status !== 403) throw new Error("Expected 403, got " + response.status);
    if (assetFetched) throw new Error("Unverified student received protected asset bytes");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("duplicate entitlement rows fail closed", async () => {
  const originalFetch = globalThis.fetch;
  const token = testToken(Math.floor(Date.now() / 1000) + 1800);
  let assetFetched = false;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/auth/v1/user")) return new Response(JSON.stringify({ id: "student-duplicate" }), { status: 200 });
    if (url.includes("/rest/v1/course_access?")) {
      return new Response(JSON.stringify([
        { is_active: true, payment_verified: true, expires_at: null },
        { is_active: false, payment_verified: false, expires_at: null },
      ]), { status: 200 });
    }
    throw new Error("Unexpected upstream request: " + url);
  }) as typeof fetch;
  try {
    const response = await worker.fetch(new Request("https://bullseye-theory.foryourtravel17.workers.dev/lesson-5.html", {
      headers: { Cookie: "bt_course_session=" + token },
    }), {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "public-key",
      ASSETS: { fetch: async () => { assetFetched = true; return new Response("secret lesson"); } },
    } as never);
    if (response.status !== 403) throw new Error("Expected 403 for duplicate entitlement rows, got " + response.status);
    if (assetFetched) throw new Error("Duplicate entitlement rows must never return asset bytes");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("active entitled student receives the lesson with private cache headers", async () => {
  const originalFetch = globalThis.fetch;
  const token = testToken(Math.floor(Date.now() / 1000) + 1800);
  let forwardedCookie = "";
  let forwardedAuthorization = "";
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/auth/v1/user")) return new Response(JSON.stringify({ id: "student-active" }), { status: 200 });
    if (url.includes("/rest/v1/course_access?")) {
      return new Response(JSON.stringify([{ is_active: true, payment_verified: true, expires_at: null }]), { status: 200 });
    }
    throw new Error("Unexpected upstream request: " + url);
  }) as typeof fetch;
  try {
    const response = await worker.fetch(new Request("https://bullseye-theory.foryourtravel17.workers.dev/lesson-2.html", {
      headers: { Cookie: "bt_course_session=" + token },
    }), {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "public-key",
      ASSETS: { fetch: async (request: Request) => {
        forwardedCookie = request.headers.get("Cookie") || "";
        forwardedAuthorization = request.headers.get("Authorization") || "";
        return new Response("<h1>Lesson content</h1>", { status: 200, headers: { "Content-Type": "text/html" } });
      } },
    } as never);
    if (response.status !== 200) throw new Error("Expected 200, got " + response.status);
    if (await response.text() !== "<h1>Lesson content</h1>") throw new Error("Unexpected lesson body");
    if (response.headers.get("Cache-Control") !== "private, no-store, max-age=0") throw new Error("Protected asset cache policy missing");
    if (response.headers.get("Vary") !== "Cookie") throw new Error("Protected asset must vary by cookie");
    if (forwardedCookie || forwardedAuthorization) throw new Error("Credentials were forwarded to the static asset binding");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("cross-origin session exchange is rejected", async () => {
  const token = testToken(Math.floor(Date.now() / 1000) + 1800);
  const response = await worker.fetch(new Request("https://bullseye-theory.foryourtravel17.workers.dev/api/course-session", {
    method: "POST",
    headers: {
      Origin: "https://attacker.example",
      Authorization: "Bearer " + token,
    },
  }), {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "public-key",
    ASSETS: { fetch: async () => new Response("asset") },
  } as never);
  if (response.status !== 403) throw new Error("Expected 403 for cross-origin exchange, got " + response.status);
});
