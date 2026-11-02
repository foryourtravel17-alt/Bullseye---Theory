// Cloudflare Worker-first entitlement gate for static course assets.
// The browser session stays in Supabase; this short-lived HttpOnly cookie lets
// a normal top-level navigation carry the authenticated session to this Worker.
const COOKIE = "bt_course_session";
const SESSION_MAX_AGE = 3600;
const PRIVATE_CACHE = "private, no-store, max-age=0";

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": PRIVATE_CACHE, ...extra },
  });
}

function cookieValue(header, name) {
  for (const part of (header || "").split(";")) {
    const item = part.trim();
    const index = item.indexOf("=");
    if (index > 0 && item.slice(0, index) === name) return item.slice(index + 1);
  }
  return "";
}

function tokenExpiry(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - payload.length % 4) % 4);
    const claims = JSON.parse(atob(padded));
    return Number.isFinite(claims.exp) ? claims.exp : 0;
  } catch { return 0; }
}

function isProtectedCourseAsset(pathname) {
  return /^\/lesson-(?:[1-9]|1[01])(?:[-./].*)?$/i.test(pathname) ||
    /^\/(?:lessons?|course-assets?|downloads?|pdf|pptx|videos?)\/.+$/i.test(pathname);
}

function originAllowed(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

async function getVerifiedEntitlement(token, env) {
  const base = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key) throw new Error("Worker Supabase configuration is missing");

  const auth = await fetch(base + "/auth/v1/user", {
    headers: { apikey: key, Authorization: "Bearer " + token },
    cf: { cacheTtl: 0, cacheEverything: false },
  });
  if (!auth.ok) return null;
  const user = await auth.json();
  if (!user?.id) return null;

  const query = new URLSearchParams({
    select: "is_active,payment_verified,expires_at",
    user_id: "eq." + user.id,
    limit: "1",
  });
  const accessResponse = await fetch(base + "/rest/v1/course_access?" + query.toString(), {
    headers: { apikey: key, Authorization: "Bearer " + token },
    cf: { cacheTtl: 0, cacheEverything: false },
  });
  if (!accessResponse.ok) throw new Error("Could not verify course entitlement");
  const rows = await accessResponse.json();
  const access = Array.isArray(rows) ? rows[0] : null;
  const expiry = access?.expires_at ? Date.parse(access.expires_at) : Infinity;
  return !!access?.is_active && !!access?.payment_verified && expiry > Date.now();
}

async function setSession(request, env) {
  if (!originAllowed(request)) return json({ error: "Origin not allowed" }, 403);
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Sign-in required" }, 401);
  const token = authorization.slice(7).trim();
  const exp = tokenExpiry(token);
  if (!token || !exp || exp <= Math.floor(Date.now() / 1000)) {
    return json({ error: "Session expired" }, 401);
  }
  try {
    const active = await getVerifiedEntitlement(token, env);
    if (!active) {
      return new Response(JSON.stringify({ active: false }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": PRIVATE_CACHE,
          "Set-Cookie": COOKIE + "=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
        },
      });
    }
    const maxAge = Math.max(1, Math.min(SESSION_MAX_AGE, exp - Math.floor(Date.now() / 1000)));
    return json({ active: true }, 200, {
      "Set-Cookie": COOKIE + "=" + token + "; Path=/; Max-Age=" + maxAge + "; HttpOnly; Secure; SameSite=Lax",
    });
  } catch {
    return json({ error: "Could not verify course access" }, 503);
  }
}

async function serveProtectedAsset(request, env) {
  const token = cookieValue(request.headers.get("Cookie"), COOKIE);
  if (!token) return Response.redirect(new URL("/auth.html", request.url), 302);
  const exp = tokenExpiry(token);
  if (!exp || exp <= Math.floor(Date.now() / 1000)) {
    return Response.redirect(new URL("/auth.html?session=expired", request.url), 302);
  }
  try {
    const active = await getVerifiedEntitlement(token, env);
    if (!active) {
      return new Response("Course access is not active. Please sign in and contact support if you believe this is an error.", {
        status: 403,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": PRIVATE_CACHE },
      });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD", "Cache-Control": PRIVATE_CACHE } });
    }
    const headers = new Headers(request.headers);
    headers.delete("Cookie");
    headers.delete("Authorization");
    const assetRequest = new Request(new URL(request.url), { method: request.method, headers });
    const asset = await env.ASSETS.fetch(assetRequest);
    const responseHeaders = new Headers(asset.headers);
    responseHeaders.set("Cache-Control", PRIVATE_CACHE);
    responseHeaders.set("Vary", "Cookie");
    return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers: responseHeaders });
  } catch {
    return new Response("Course access could not be verified. Please retry shortly.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": PRIVATE_CACHE },
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/course-session" && request.method === "POST") {
      return setSession(request, env);
    }
    if (url.pathname === "/api/course-session/logout" && request.method === "POST") {
      if (!originAllowed(request)) return json({ error: "Origin not allowed" }, 403);
      return json({ success: true }, 200, {
        "Set-Cookie": COOKIE + "=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
      });
    }
    if (isProtectedCourseAsset(url.pathname)) return serveProtectedAsset(request, env);
    return env.ASSETS.fetch(request);
  },
};

export { cookieValue, isProtectedCourseAsset, tokenExpiry };
