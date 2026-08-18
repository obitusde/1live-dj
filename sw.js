// Service Worker für 1LIVE DJ PWA — nur für Installierbarkeit, kein Offline-Cache
// (die App ist ohne Netzwerk sowieso nutzlos, sie steuert Spotify per API).

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request).catch(() => {
    return new Response('Offline – bitte Internetverbindung prüfen.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }));
});
