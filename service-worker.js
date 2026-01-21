const CACHE_NAME = "ayvasa-cache-v6";

const ASSETS = [
  "/",
  "/index.html",
  "/practice.html",
  "/wiki.html",
  "/help.html",
  "/styles.css?v=20260120",
  "/app.js?v=20260120",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/wiki/index.json",
  "/wiki/search-index.json",
  "/wiki/original-intelligence.md",
  "/wiki/zero-field.md",
  "/wiki/field-coherence.md",
  "/help/index.json",
  "/help/search-index.json",
  "/help/what-this-app-is.md",
  "/help/starting-session.md",
  "/help/completing-saving.md",
  "/help/viewing-sessions.md",
  "/help/your-data.md",
  "/help/backing-up.md",
  "/help/restoring-moving.md",
  "/help/clearing-sessions.md",
  "/help/design-choices.md",
  "/help/troubleshooting.md",
  "/help/final-note.md"
];

const cacheResponse = async (request, response) => {
  if (!response || !response.ok) return response;
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
};

const networkFirst = async (request) => {
  try {
    const response = await fetch(request);
    await cacheResponse(request, response);
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || Response.error();
  }
};

const staleWhileRevalidate = async (request) => {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => cacheResponse(request, response))
    .catch(() => null);

  if (cached) {
    return cached;
  }
  const response = await fetchPromise;
  return response || Response.error();
};

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});
