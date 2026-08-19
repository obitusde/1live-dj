# 1LIVE DJ – Stand und offene Punkte

Alles unten ist bereits committed, gepusht (GitHub Pages) und deployt (Apps
Script @51). Nichts hängt offen. Das hier ist nur eine Übergabe, damit du auf
dem PC weißt, wo wir stehen und was noch sinnvoll wäre.

## Projektstruktur
- `D:\Coding\1live-dj` – PWA-Frontend, GitHub Pages (`obitusde/1live-dj`)
- `D:\Coding\1live-webapp` – Apps-Script-Backend (clasp), Script-ID
  `19PfFc6kisaUKyJ2RqKZ_BADzG0c3dMvXB3nCpdg7a-uA0D-ym0VjKWJv`
- `D:\Coding\1live` – alter Radioplayer, **teilt sich dasselbe Apps-Script-
  Projekt** über ein zweites Deployment (`AKfycbwoAI846…`, nur
  `action=playlist`/`streamtitle`). Beim Deployen **immer** die passende
  Deployment-ID angeben (`clasp update-deployment <id>`), nie blind neu
  deployen, sonst zieht man versehentlich den falschen Frontend-Stand mit.
- DJ-Deployment-ID: `AKfycbxBbH87136ak1xaEq16iz-x52AiasndeZUhFcrQYbIgNlx2NfWBA_NZlhw7SP7hx6hxrQ`
  (aktuell @51, gleiche `/exec`-URL bleibt bei jedem Redeploy erhalten)
- `clasp run` funktioniert nicht (Skript ist nicht als API-Executable
  deployt) – Diagnose läuft über eigene `action=`-Endpunkte im Backend.

## Was heute gemacht wurde (in dieser Reihenfolge)
1. **Kompletter Umbau der Spotify-DJ-Engine** (`Queue.js`, `Spotify.js`,
   `Code.js`): Start ist jetzt synchron (~4 s statt bis zu 90 s blindem
   Warten), spielt nur noch fertig aufgelöste Songs aus einem
   vorbereiteten Pool (~15 pro aktivem Sender), Scrapen/Suchen läuft nur
   noch im 5-Minuten-Hintergrund-Trigger. Alter Einmal-Trigger-Leak (Apps
   Script löscht abgefeuerte Einmal-Trigger nicht, ab 20 Stück scheiterte
   jeder Start) behoben.
2. **Frontend neu geschrieben** (`index.html`): serverseitige Phase statt
   Client-Flag, ehrliche Statuszeile mit aufklappbaren Details (Vorrat,
   letzter Nachschub, letzter Fehler), Fortschrittsbalken, adaptives
   Polling, „Spotify öffnen"-Deep-Link + Geräteauswahl bei Offline-Gerät.
3. **Layout-Fixes**: `viewport-fit=cover` ergänzt (ohne das lieferte
   `env(safe-area-inset-bottom)` immer 0), Steuerleiste kompakter,
   Mindestabstand unten 22 px, Scrollen als Notnagel statt
   `overflow:hidden`, Statuszeile bleibt einzeilig.
4. **Eigenes Icon** (schwarzer Grund, pinkes „DJ") – vorher war es
   byte-identisch mit dem Radioplayer-Icon.
5. **Bugfix Spotify-404 beim Start**: Gerät war gelistet, aber noch nicht
   aufnahmebereit (Spotify-App gerade erst wieder in Connect aufgetaucht).
   `spotifyPlay`/`spotifyResume` übertragen jetzt bei diesem Fehlerbild
   erst die Wiedergabe aufs Gerät und versuchen es erneut, statt sofort
   aufzugeben.
6. **Bugfix sporadische Google-404**: gelegentlich lieferte die
   `/exec`-URL Googles eigene HTML-Fehlerseite statt JSON (Aussetzer auf
   Google-Seite, 20/20 Testaufrufe von hier liefen sauber). Frontend parst
   jetzt defensiv, fasst einmal still nach, wirft bei Fehlern nicht mehr
   den kompletten UI-Zustand weg (vorher verschwanden dadurch Sender-/
   Geräteliste kurzzeitig).
7. **Bugfix veraltete Anzeige nach App-Wechsel**: War die App > 35 s im
   Hintergrund, zeigte sie beim Zurückkommen kurz den alten Song samt
   hochgerechnetem (erfundenem) Fortschritt. Zeigt jetzt „Aktualisiere…"
   bis der echte Stand da ist.
8. **Songs aus Spotifys eigener Warteschlange kenntlich gemacht** – die
   DJ-Engine kann Spotifys interne Queue nicht leeren (kein API dafür),
   Reste aus alten Sessions werden jetzt als „aus Spotifys Warteschlange"
   markiert statt verwirrend wie ein normaler DJ-Song auszusehen.
9. **Automatische Reparatur falsch verknüpfter Songs**: einmal pro Song
   wird geprüft, ob die im Sheet gespeicherte Spotify-URI wirklich zum
   Titel passt; bei Abweichung wird zurückgesetzt und neu gesucht. Zusatz-
   Endpunkt `action=verifyUris` prüft das ganze Sheet auf einen Schlag
   (beim letzten Lauf: 179 geprüft, 0 falsch).

## Bekannte, nicht code-behebbare Einschränkung
Spotifys eigene Wiedergabe-Warteschlange (User Queue) lässt sich über die
Web-API nicht leeren – nur per manuellem „Leeren" in der Spotify-App. Reste
aus alten Sessions können daher weiterhin zwischendurch auftauchen, sind
aber jetzt als „aus Spotifys Warteschlange" erkennbar statt verwirrend.

## Vom Nutzer bewusst abgelehnte Vorschläge (nicht wieder vorschlagen)
- Verlaufsliste mit nachträglichem Bewerten
- Dedup über Spotify-URI bei unterschiedlichen Sender-Schreibweisen
- Sleep-Timer
- Cloudflare-Worker-Umbau (zu komplex, Apps Script reicht)

## Was noch offen sein könnte (nichts davon dringend)
- Kein automatisierter Test/CI – Änderungen werden manuell per
  `clasp push` + `clasp update-deployment` und `git push` geprüft.
- Kein Cloud Logging am Apps-Script-Projekt (`clasp logs` liefert „GCP
  project ID is not set") – Diagnose läuft über den persistierten
  `LAST_ERROR`/`LAST_REFILL`-Zustand, den `action=status` mitliefert.
- Falls der Nutzer weitere Sender freischalten will: `diggi`, `wdr2sw`,
  `njoy`, `br3` sind in `STATIONS` (Code.js) technisch vorhanden, aber
  nicht in `AVAILABLE_STATIONS` (Queue.js) freigeschaltet.
