/*
 * Offline shell for the public educational Market Lab only.
 * Never cache course lessons, auth pages, private resources, payments,
 * live quotes, or user/session data.
 */
const CACHE_NAME = "bullseye-terminal-shell-v1";
const SHELL_URLS = ["/terminal.html", "/market-briefs.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith("bullseye-terminal-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Explicit allow-list: for every other path, do not intercept or cache.
  const isTerminalPage = url.pathname === "/terminal.html";
  const isDemoPack = url.pathname === "/market-briefs.json";
  if (!isTerminalPage && !isDemoPack) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response && response.ok && response.type !== "opaque") {
        await cache.put(new Request(url.pathname), response.clone());
      }
      if (response && response.ok) return response;
      const fallback = await cache.match(url.pathname);
      return fallback || response;
    } catch {
      const fallback = await cache.match(url.pathname);
      if (fallback) return fallback;
      return new Response("Market Lab offline copy is not available yet. Open this demo once while online, then retry.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
      });
    }
  })());
});
