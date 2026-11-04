import http from "node:http";
import { createReadStream, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const COOKIE = "bt_course_session";
const SESSION_MAX_AGE = 3600;
const PRIVATE_CACHE = "private, no-store, max-age=0";
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": PRIVATE_CACHE,
      "X-Content-Type-Options": "nosniff",
      ...headers
    }
  });
}

export function cookieValue(header, name = COOKIE) {
  for (const part of (header || "").split(";")) {
    const item = part.trim();
    const index = item.indexOf("=");
    if (index > 0 && item.slice(0, index) === name) return item.slice(index + 1);
  }
  return "";
}

export function tokenExpiry(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return 0;
    const claims = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    return Number.isFinite(claims.exp) ? claims.exp : 0;
  } catch {
    return 0;
  }
}

export function normalizedPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;
  return decoded.replace(/\\/g, "/");
}

export function isProtectedCourseAsset(pathname) {
  const normalized = normalizedPath(pathname);
  if (!normalized) return true;
  const clean = path.posix.normalize(normalized);
  const lessonFile = /(?:^|\/)lesson-(?:[1-9]|1[01])(?:[-./]|$)/i.test(clean);
  const freePreviewPage = /^\/lesson-1\.html$/i.test(clean);
  const courseDirectory = /^\/(?:lessons?|course-assets?|downloads?|pdf|pptx|videos?)\/.+$/i.test(clean);
  return (lessonFile && !freePreviewPage) || courseDirectory;
}

export function safeFilePath(pathname) {
  const normalized = normalizedPath(pathname);
  if (!normalized || !normalized.startsWith("/")) return null;
  const relative = normalized === "/" ? "index.html" : normalized.slice(1);
  const resolved = path.resolve(ROOT, relative);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
  return resolved;
}

function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers.host;
  if (!host) return false;
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const protocol = forwardedProto === "https" || req.socket.encrypted ? "https://" : "http://";
  const expected = protocol + host;
  return origin === expected;
}

function cookieHeader(token, maxAge) {
  return COOKIE + "=" + token + "; Path=/; Max-Age=" + maxAge + "; HttpOnly; Secure; SameSite=Lax";
}
function clearCookie() {
  return COOKIE + "=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
}

function envConfig() {
  const base = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || "";
  if (!base || !key) throw new Error("SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY is missing");
  return { base, key };
}

async function getVerifiedEntitlement(token) {
  const { base, key } = envConfig();
  const headers = { apikey: key, Authorization: "Bearer " + token };
  const auth = await fetch(base + "/auth/v1/user", {
    headers,
    signal: AbortSignal.timeout(10000),
    cache: "no-store"
  });
  if (!auth.ok) return { valid: false, unavailable: auth.status >= 500 };
  const user = await auth.json();
  if (!user?.id) return { valid: false, unavailable: false };

  const query = new URLSearchParams({
    select: "is_active,payment_verified,expires_at",
    user_id: "eq." + user.id,
    limit: "2"
  });
  const accessResponse = await fetch(base + "/rest/v1/course_access?" + query.toString(), {
    headers,
    signal: AbortSignal.timeout(10000),
    cache: "no-store"
  });
  if (!accessResponse.ok) return { valid: false, unavailable: true };
  const rows = await accessResponse.json();
  if (!Array.isArray(rows) || rows.length !== 1) return { valid: false, unavailable: false };
  const access = rows[0];
  const expiry = access?.expires_at ? Date.parse(access.expires_at) : 0;
  const active = !!access?.is_active && !!access?.payment_verified &&
    Number.isFinite(expiry) && expiry > Date.now();
  return { valid: active, unavailable: false };
}

async function readJson(req, maxBytes = 8192) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("Request body too large");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Invalid JSON");
  }
}

async function handleSession(req, res) {
  if (!originAllowed(req)) return sendJson(res, 403, { error: "Origin not allowed" });
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) return sendJson(res, 401, { error: "Sign-in required" });
  const token = authorization.slice(7).trim();
  const exp = tokenExpiry(token);
  const now = Math.floor(Date.now() / 1000);
  if (!token || !exp || exp <= now) return sendJson(res, 401, { error: "Session expired" });
  try {
    const access = await getVerifiedEntitlement(token);
    if (!access.valid) {
      if (access.unavailable) return sendJson(res, 503, { error: "Could not verify course access" });
      res.setHeader("Set-Cookie", clearCookie());
      return sendJson(res, 200, { active: false });
    }
    const maxAge = Math.max(1, Math.min(SESSION_MAX_AGE, exp - now));
    res.setHeader("Set-Cookie", cookieHeader(token, maxAge));
    return sendJson(res, 200, { active: true });
  } catch {
    return sendJson(res, 503, { error: "Could not verify course access" });
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": PRIVATE_CACHE,
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(body));
}

async function serveProtected(req, res, pathname) {
  const token = cookieValue(req.headers.cookie);
  if (!token) return redirect(res, "/auth.html");
  const exp = tokenExpiry(token);
  if (!exp || exp <= Math.floor(Date.now() / 1000)) return redirect(res, "/auth.html?session=expired");
  let access;
  try {
    access = await getVerifiedEntitlement(token);
  } catch {
    return sendText(res, 503, "Course access could not be verified. Please retry shortly.");
  }
  if (access.unavailable) return sendText(res, 503, "Course access could not be verified. Please retry shortly.");
  if (!access.valid) return sendText(res, 403, "Course access is not active. Please sign in and contact support if you believe this is an error.");
  return serveFile(req, res, pathname, true);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location, "Cache-Control": PRIVATE_CACHE, "Vary": "Cookie" });
  res.end();
}
function sendText(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": PRIVATE_CACHE,
    "Vary": "Cookie",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(body);
}

export function isInternalPath(pathname) {
  const normalized = normalizedPath(pathname);
  if (!normalized) return true;
  const rel = path.posix.normalize(normalized).replace(/^\/+/, "");
  if (!rel) return false;
  const first = rel.split("/")[0].toLowerCase();
  if (first.startsWith(".")) return true;
  return [".git", ".github", ".claude", ".wrangler", "node_modules", "supabase", "docs", "scripts", "tests"].includes(first) ||
    ["package.json", "package-lock.json", "wrangler.toml", "server.mjs", "_worker.js", ".assetsignore", ".mcp.json", "agents.md", "readme.md", "readme.txt", "design_skill_trial.md"].includes(rel.toLowerCase());
}

function serveFile(req, res, pathname, isPrivate = false) {
  if (isInternalPath(pathname)) return sendText(res, 404, "Not found");
  const file = safeFilePath(pathname);
  if (!file) return sendText(res, 400, "Invalid path");
  let info;
  try {
    const real = realpathSync(file);
    if (real !== ROOT && !real.startsWith(ROOT + path.sep)) return sendText(res, 404, "Not found");
    info = statSync(real);
    if (info.isDirectory()) {
      const indexPath = safeFilePath(pathname.replace(/\/$/, "") + "/index.html");
      if (!indexPath) return sendText(res, 400, "Invalid path");
      return serveFile(req, res, pathname.replace(/\/$/, "") + "/index.html", isPrivate);
    }
    if (!info.isFile()) return sendText(res, 404, "Not found");
  } catch {
    return sendText(res, 404, "Not found");
  }
  const headers = {
    "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Content-Length": info.size,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cache-Control": isPrivate ? PRIVATE_CACHE : "public, max-age=300",
    ...(isPrivate ? { "Vary": "Cookie" } : {})
  };
  res.writeHead(200, headers);
  if (req.method === "HEAD") return res.end();
  const stream = createReadStream(file);
  stream.on("error", () => {
    if (!res.headersSent) sendText(res, 500, "Unable to read file");
    else res.destroy();
  });
  stream.pipe(res);
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://" + (req.headers.host || "localhost"));
    const pathname = url.pathname;

    if (pathname === "/_health") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      return res.end("ok");
    }
    if (pathname === "/api/course-session" && req.method === "POST") return handleSession(req, res);
    if (pathname === "/api/course-session/logout" && req.method === "POST") {
      if (!originAllowed(req)) return sendJson(res, 403, { error: "Origin not allowed" });
      res.setHeader("Set-Cookie", clearCookie());
      return sendJson(res, 200, { success: true });
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD", "Cache-Control": "no-store" });
      return res.end("Method not allowed");
    }
    if (isProtectedCourseAsset(pathname)) return serveProtected(req, res, pathname);
    return serveFile(req, res, pathname, false);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 3000);
  const server = createServer();
  server.listen(port, "0.0.0.0", () => {
    console.log("Bullseye secure course runtime listening on " + port);
  });
}
