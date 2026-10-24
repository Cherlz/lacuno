// Lacuno service worker: makes the site installable as an app.
// It deliberately caches nothing, so health data never sits in a cache.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
