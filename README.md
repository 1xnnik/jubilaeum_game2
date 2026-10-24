# Bring’s mit! – Jubiläumsedition

Suchspiel für vier Teams mit je einer Person, angelehnt an die Oberfläche von [jeoparty_Jubil-um](https://github.com/1xnnik/jeoparty_Jubil-um). Dunkelblau, Gold, Jubiläumslogo und feste Punktekarten wie in der Vorlage.

## Windows: per Doppelklick spielen

1. Node.js 24 LTS von https://nodejs.org/ installieren.
2. Das Repository herunterladen und die ZIP-Datei vollstaendig entpacken.
3. `Start.bat` doppelklicken. Beim ersten Start werden die Abhaengigkeiten installiert (Internet erforderlich). Danach oeffnet sich das Spiel im Browser.
4. Zum Beenden `Stop.bat` doppelklicken. Es wird nur der von `Start.bat` gestartete Spielserver dieses Ordners beendet. Der Browser-Spielstand bleibt erhalten.

Ein erneuter Start oeffnet das bereits laufende Spiel. Falls der Browser nicht automatisch startet, die angezeigte Adresse manuell oeffnen. Startfehler stehen in `.bringsmit-runtime/server.log`. Standardport: 5173; optional vor Start `BRINGSMIT_PORT` setzen und fuer Start und Stop denselben Wert verwenden. Spiele aus demselben Ordner und mit demselben Browserprofil, um gespeicherte Spielstaende fortzusetzen.

## Start im Terminal

Voraussetzung: Node.js 20.19+ oder 22.12+ und npm.

```sh
npm ci
npm run dev
```

`npm run build` prüft TypeScript und erstellt `dist/`. `npm run preview` startet die gebaute Version.

## Ablauf

- Unter „Teams & Gegenstände“ vier Namen und 15 Gegenstände vorbereiten.
- Die Spielleitung startet die erste Runde. Gegenstand und großes Bild erscheinen gemeinsam.
- Punkte werden unten bei den vier Teams mit Plus und Minus manuell eingetragen. Minus stoppt bei null.
- „Nächste Runde“ zeigt den nächsten Gegenstand. Der Rundenwechsel verändert keine Punkte.
- „Vorherige Runde“ geht zurück, ohne die Punkte zu verändern.
- Nach Runde 15 zeigt „Spiel beenden“ den Endstand. Punkte lassen sich auch dort korrigieren.
- „Neues Spiel“ setzt Punkte und Runden zurück und behält Namen, Gegenstände und Bilder.

Der Spielstand wird automatisch im lokalen Browser gespeichert. Kein Server, Konto oder externer Dienst nötig. Es gibt keine automatische Erkennung der Ankunft; die Spielleitung entscheidet. Die Gegenstandsliste ist während eines laufenden Spiels gesperrt.

## Tests

`npm test` testet manuelle Punkte, Rundenwechsel, Speichern, Bild-Uploads, Migration und Desktop-/Mobilansicht mit Playwright. Chromium muss unter `/usr/bin/chromium` installiert sein; alternativ `CHROMIUM_PATH` setzen.

Beim Aufdecken zeigt jede Runde ein fotorealistisches, KI-generiertes Bild und den Gegenstand als Überschrift. Unter „Teams & Gegenstände“ kann pro Runde ein eigenes PNG-, JPG- oder WebP-Bild (bis 5 MB) hochgeladen werden. Bilder werden lokal verkleinert und mit dem Spielstand im Browser gespeichert. Über „Standardbild verwenden“ lässt sich das jeweilige Original wiederherstellen. Bildnachweise stehen in `public/items/ATTRIBUTION.md`.

Die 15 Standardbilder sind fotorealistische KI-generierte Produktmotive und liegen lokal im Projekt; beim Spielen sind keine externen Bilddienste erforderlich. Eigene hochgeladene Bilder werden weiterhin verwendet.
