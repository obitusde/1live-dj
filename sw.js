// Service Worker für 1LIVE DJ PWA — nur für Installierbarkeit, kein Offline-Cache
// (die App ist ohne Netzwerk sowieso nutzlos, sie steuert Spotify per API).

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  // Fuer die Seite selbst (HTML/JS) den HTTP-Cache umgehen - GitHub Pages
  // setzt Cache-Control: max-age=600, das PWA-Chrome hielt dadurch bis zu
  // 10 Minuten lang eine veraltete Version fest (App-Updates kamen auf dem
  // Handy nicht an, obwohl der Server schon laengst die neue Version hatte).
  const isDocument = event.request.mode === 'navigate' || event.request.destination === 'document';
  const fetchOptions = isDocument ? { cache: 'no-store' } : undefined;

  event.respondWith(fetch(event.request, fetchOptions).catch(() => {
    return new Response('Offline – bitte Internetverbindung prüfen.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }));
});
