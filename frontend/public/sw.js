/**
 * Service Worker for Shop PWA
 * Provides offline support and caching strategies
 */

const CACHE_NAME = "shop-pwa-v1";
const STATIC_CACHE = "shop-static-v1";
const DYNAMIC_CACHE = "shop-dynamic-v1";

// Static assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/products",
  "/manifest.json",
  "/favicon.svg",
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  /\/api\/graphql/,
];

/**
 * Install event - cache static assets
 */
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("[SW] Static assets cached");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[SW] Failed to cache static assets:", error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return (
                name !== STATIC_CACHE &&
                name !== DYNAMIC_CACHE &&
                name !== CACHE_NAME
              );
            })
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log("[SW] Service worker activated");
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - serve from cache or network
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // API requests - network first, cache fallback
  if (API_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Static assets - cache first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation requests - network first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Default - stale while revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

/**
 * Check if URL is a static asset
 */
function isStaticAsset(url) {
  const staticExtensions = [
    ".js",
    ".css",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
  ];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

/**
 * Cache first strategy
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error("[SW] Cache first fetch failed:", error);
    return new Response("Offline", { status: 503 });
  }
}

/**
 * Network first strategy
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Network first with offline fallback for navigation
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    const offlineResponse = await caches.match("/");
    if (offlineResponse) {
      return offlineResponse;
    }

    return new Response(getOfflineHTML(), {
      status: 503,
      headers: { "Content-Type": "text/html" },
    });
  }
}

/**
 * Stale while revalidate strategy
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || fetchPromise;
}

/**
 * Get offline HTML page
 */
function getOfflineHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Shop PWA</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f8fafc;
      color: #0f172a;
      text-align: center;
      padding: 2rem;
    }
    .offline-container {
      max-width: 400px;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      color: #64748b;
      margin-bottom: 1.5rem;
    }
    button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
    }
    button:hover {
      background: #1d4ed8;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="offline-container">
    <div class="icon">📴</div>
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection. Please check your connection and try again.</p>
    <button onclick="window.location.reload()">Retry</button>
  </div>
</body>
</html>
  `;
}

/**
 * Handle push notifications
 */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || "New notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
    actions: [
      { action: "open", title: "Open" },
      { action: "close", title: "Close" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Shop PWA", options)
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

console.log("[SW] Service worker loaded");


