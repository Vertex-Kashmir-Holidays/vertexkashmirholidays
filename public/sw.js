// Minimal service worker. It exists so Chrome shows the automatic "Install app"
// prompt, which still requires a service worker with a real fetch handler
// (https://developer.chrome.com/blog/update-install-criteria).
//
// Deliberately caches nothing: every request goes to the network exactly as
// before, so ISR pages, auth cookies and admin data are never served stale.
// The only behaviour change is an offline fallback page for page navigations.
// Navigation preload is enabled so the worker's startup never delays a page.

const OFFLINE_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline · Vertex Kashmir Holidays</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B1F3A;color:#F8F1DD;font-family:system-ui,sans-serif;text-align:center;padding:24px}button{margin-top:16px;padding:10px 20px;border:0;border-radius:8px;background:#F8F1DD;color:#0B1F3A;font-weight:600}</style>
</head><body><div><h1>You're offline</h1><p>Check your internet connection and try again.</p>
<button onclick="location.reload()">Retry</button></div></body></html>`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only page navigations are handled; assets, API calls and POSTs bypass the
  // worker entirely and behave exactly as they did without it.
  if (request.mode !== "navigate" || request.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        const preloaded = await event.preloadResponse;
        if (preloaded) return preloaded;
        return await fetch(request);
      } catch {
        return new Response(OFFLINE_HTML, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    })(),
  );
});
