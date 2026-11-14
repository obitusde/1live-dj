// Service Worker für 1LIVE DJ PWA — nur für Installierbarkeit, kein Offline-Cache
// (die App ist ohne Netzwerk sowieso nutzlos, sie steuert Spotify per API).
//
// Version 2 (14.11.2026): Worker und Manifest gelten nur fuer den eigenen
// Unterordner (/1live-dj/). Auf obitusde.github.io laufen mehrere Apps; ein
// Scope auf der ganzen Domain liesse Android deren Links in dieser App oeffnen.
// Dieser Worker legt keinen Cache an, ein Cache-Praefix ist hier nicht noetig.

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  // Fremde Adressen (Apps Script, Spotify-API und -Anmeldung) gar nicht erst
  // anfassen: der Umweg ueber den Worker kostete bei jedem Status-Abruf Zeit
  // und machte aus einem echten Netzfehler eine kuenstliche 503-Antwort.
  if (new URL(event.request.url).origin !== self.location.origin) return;

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
