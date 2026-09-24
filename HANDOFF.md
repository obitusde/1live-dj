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

## Stand 16.09.2026 – Tempo und Stabilität (Backend @100)
Messung: Das Skript beantwortet `status` in 0,4–0,8 s, Googles Web-App-Schicht
davor braucht aber 1–40 s (ein Drittel der Abrufe lief ins 12-s-Limit). Das ist
nicht per Code im Skript behebbar. Deshalb:
- **Spotify-Direktverbindung (PKCE)** im Frontend: Status, Pause, Weiter, Skip,
  Dislike-Skip und Pause/Fortsetzen rund um Beiträge gehen direkt an Spotify.
  Apps Script bleibt für Start (Songauswahl), Bewertung, Vorrat und Protokoll.
  Ohne Verbindung oder bei Störung läuft alles automatisch über den Server.
  Voraussetzung: Redirect URI `https://obitusde.github.io/1live-dj/` im
  Spotify-Dashboard eingetragen und einmal „Spotify verbinden" in der App.
- **Doppelt fragen**: Lese-Abrufe (status, stations, updateEpisodes,
  latestNews, spotifyClientId) schicken nach 4 s ohne Antwort eine zweite
  Anfrage. Nie für Start/Skip/Bewertung.
- **Beiträge**: Bildschirm bleibt an (Wake Lock), solange Session läuft und
  Aktuelles/Update/News aktiv sind; Aktuelles-Vorladen wiederholt sich bei
  Fehlern; Auslösen auch bei kurzzeitig veraltetem Stand; reaktives Fenster
  größer; hängt ein Beitrag beim Start, geht die Musik weiter statt Stille.
- **Wartezustand**: prüft Geräte direkt, startet nicht mehr mehrfach.
- **Backend**: Script Properties gebündelt gelesen (kurze Aufrufe),
  Trigger-Prüfung nur noch alle 6 h, Start holt Player+Geräte parallel,
  neuer Endpunkt `action=spotifyClientId`, `dislike&noskip=1`.
- Protokoll lesen: `?action=logTail&n=300&event=api,sp...` bzw.
  `?action=logStats&hours=24` (Direktabrufe erscheinen als `api:sp:*`).

## Was am 18.–30.08. gemacht wurde (in dieser Reihenfolge)
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

## Nachschub an der Songgrenze (Backend @101, 17.09.2026)
Das Neusetzen der Spotify-Liste mitten im Song gab einen kurzen hörbaren
Aussetzer (16.09., 00:20:38, „Axel F"). Der 5-Minuten-Trigger wartet jetzt bis
kurz vor Songende (max. 150 s, Lock währenddessen freigegeben) und setzt die
Liste ab dem nächsten Song. Liegt das Ende weiter weg, wird verschoben
(`nachschub_verschoben`); nur bei ≤1 offenen Songs noch sofort wie früher.
Pausiert die App gerade für einen Beitrag, bricht der Trigger ab.
Log: `liste_neu_gesetzt` hat jetzt `amSongende`. QUEUE_AHEAD_TARGET 3 → 4.

## Werbeschnitt für Podcasts (Backend @104, 24.09.2026)
`BEITRAG_SCHNITT` in `News.js` (D:\Coding\1live-webapp): pro Sendungsname
`{ ab: '1:15', bis: '9:05' }`, Zeiten als m:ss/h:mm:ss/Sekunden, `bis: null`
= bis zum Ende. Gesetzt: Morning Briefing 1:15–9:05. `feedItemPayload_`
liefert daraus `startMs`/`endeMs`/`vollDauerMs`; die App steigt dort ein,
beendet dort, rechnet Anzeige und Spultasten im geschnittenen Bereich
(Log: `beitrag_ende` mit `grund: schnitt_ende`). Die Feed-Länge wird NICHT
zur Plausibilisierung genutzt – sie ist oft zu kurz.

## Eigene Playlists bleiben unangetastet (Backend @102, 19.09.2026)
- Nachschub nur, wenn der laufende Song aus einer DJ-Liste stammt
  (`vonUns`); fremde Musik verlängert die Session nicht mehr. Vorher ersetzte
  der Trigger eine eigene Playlist durch DJ-Songs (18.09., 14:37).
- Start übernimmt nur noch laufende DJ-Musik; bei fremder Musik startet der DJ
  neu.
- 15 s Kulanz nach dem Setzen einer Liste (`LIST_SET_AT`): Spotify meldet
  kurz noch den alten Titel, das verwarf vorher die ganze DJ-Liste.
- Frontend: keine Beiträge in fremde Musik, Anzeige „nicht vom DJ".

## Beiträge nur bei offener App (Entscheidung 17.09.2026)
Android friert die PWA ~30–60 s nach dem Wegwechseln komplett ein (Log
16.09., 23:31 und 23:42: danach keinerlei Abrufe mehr). Beiträge laufen
deshalb nur, solange die App im Vordergrund ist (Wake Lock hält den
Bildschirm an). Geprüfte Alternative – Podcast-Folgen als spotify:episode in
den Spotify-Kontext legen (läuft auch im Hintergrund) – vom Nutzer bewusst
nicht gewählt; offen war dabei, ob Spotify das für Apps im Development Mode
zulässt. Stummer Dauerton zum Wachhalten verworfen (würde Spotify pausieren).

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
