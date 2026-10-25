// Lacuno service worker: makes the site installable as an app and shows visit
// reminders. It deliberately caches nothing, so health data never sits in a cache.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let data = { title: "Lacuno", body: "You have a doctor visit coming up.", url: "/case" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, { body: data.body, tag: data.tag, icon: "/icon.svg", data: { url: data.url } }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/case", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.startsWith(self.location.origin));
      return open ? open.navigate(url).then((c) => c && c.focus()) : self.clients.openWindow(url);
    }),
  );
});
