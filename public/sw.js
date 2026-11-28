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

// ── Push notifications (see src/lib/push.ts) ──────────────────────────────
// Payload: { title, body, link }. Tapping opens `link` — focusing an open
// Vertex tab/app window when there is one.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Vertex Kashmir Holidays", {
      body: data.body || "",
      icon: "/brand/app-icons/icon-192.png",
      // Android status-bar icon: drawn from the alpha channel only, so it must be
      // a white mark on transparent (a full-colour icon shows as a blank blob).
      badge: "/brand/app-icons/notification-badge.png",
      data: { link: data.link || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.link || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Prefer a window already in the same area (CRM / agent account).
      const area = new URL(url).pathname.split("/")[1];
      const same = windows.filter((w) => new URL(w.url).origin === self.location.origin);
      const existing = same.find((w) => new URL(w.url).pathname.split("/")[1] === area) ?? same[0];
      if (existing) {
        try {
          await existing.focus();
          // navigate() only works on windows this worker controls; else open fresh.
          if (await existing.navigate(url)) return;
        } catch {
          /* fall through */
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
