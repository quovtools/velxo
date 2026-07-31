// Piyrox Service Worker — Push Notifications
// Registered by NotificationProvider.tsx on first authenticated load

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Piyrox', {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      data: data.data || {},
      tag: data.data?.type || 'piyrox',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  // Re-subscribe when the push subscription expires
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then((subscription) => {
        // POST to backend to update the subscription
        return fetch('/api/v1/notifications/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
              auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
            },
          }),
        });
      })
  );
});
