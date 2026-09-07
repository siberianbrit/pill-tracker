const CACHE = 'pill-tracker-v5-badge';

const ASSETS = [
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/*
 * SERVER PUSH
 *
 * This is the part that receives the Web Push payload from the
 * Supabase Edge Function and turns it into a real system notification.
 */
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let data = {};

    try {
      data = event.data ? event.data.json() : {};
    } catch (error) {
      console.error('[PillTracker] Invalid push payload:', error);
    }

    const title = data.title || 'Pill Tracker';
    const body = data.body || 'Напоминание о лекарстве';
    const icon = data.icon || './icon-192.png';
    const badge = data.badge || './icon-192.png';
    const url = data?.data?.url || './';
    const badgeCount = Number(data?.data?.badgeCount || 0);

    try {
      if (badgeCount > 0 && typeof self.navigator?.setAppBadge === 'function') {
        await self.navigator.setAppBadge(badgeCount);
      } else if (badgeCount === 0 && typeof self.navigator?.clearAppBadge === 'function') {
        await self.navigator.clearAppBadge();
      }
    } catch (error) {
      console.warn('[PillTracker] Could not update app badge:', error);
    }

    await self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag: data?.data?.tag || 'pill-tracker-medication',
      renotify: true,
      data: { url }
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || './';

  event.waitUntil((async () => {
    const absoluteUrl = new URL(targetUrl, self.location.origin).href;
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    for (const client of clients) {
      if ('focus' in client) {
        try {
          await client.navigate(absoluteUrl);
        } catch (_) {
          // The existing client may already be at the correct URL.
        }
        return client.focus();
      }
    }

    if (self.clients.openWindow) {
      return self.clients.openWindow(absoluteUrl);
    }
  })());
});

/*
 * NETWORK / CACHE
 *
 * HTML is always refreshed from the network so GitHub Pages updates are
 * picked up immediately after the new service worker takes control.
 * Same-origin static assets may be cached. External requests are left alone.
 */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => response)
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (!response || !response.ok) return response;

        const copy = response.clone();
        caches.open(CACHE).then(cache => {
          cache.put(event.request, copy);
        });

        return response;
      });
    })
  );
});
