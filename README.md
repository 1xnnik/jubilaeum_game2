# Bring’s mit! – Jubiläumsedition

Suchspiel für vier Teams mit je einer Person, angelehnt an die Oberfläche von [jeoparty_Jubil-um](https://github.com/1xnnik/jeoparty_Jubil-um). Dunkelblau, Gold, Jubiläumslogo und feste Punktekarten wie in der Vorlage.

## Start

Voraussetzung: Node.js 20.19+ oder 22.12+ und npm.

```sh
npm ci
npm run dev
```

`npm run build` prüft TypeScript und erstellt `dist/`. `npm run preview` startet die gebaute Version.

## Ablauf

- Unter „Teams & Gegenstände“ vier Namen und 15 Gegenstände vorbereiten.
- Die Spielleitung startet jede Runde. Erst dann wird der Gegenstand sichtbar.
- Alle suchen gleichzeitig. Wer ihn zuerst zur Spielleitung bringt, bekommt per Klick genau einen Punkt.
- Alternativ kann eine Runde ohne Punkt übersprungen werden. Die letzte Wertung lässt sich zurücknehmen.
- Nach 15 Runden werden Sieger oder Gleichstand angezeigt. „Neues Spiel“ setzt die Wertungen zurück und behält Namen und Gegenstände.

Der Spielstand wird automatisch im lokalen Browser gespeichert. Kein Server, Konto oder externer Dienst nötig. Es gibt keine automatische Erkennung der Ankunft; die Spielleitung entscheidet. Die Gegenstandsliste ist während eines laufenden Spiels gesperrt.

## Tests

`npm test` testet den vollständigen Spielablauf, Speichern, Rücknahme, Überspringen, Gleichstand und mobile Breite mit Playwright. Chromium muss unter `/usr/bin/chromium` installiert sein; alternativ `CHROMIUM_PATH` setzen.

Beim Aufdecken zeigt jede Runde eine Illustration und den Gegenstand als Überschrift. Unter „Teams & Gegenstände“ kann pro Runde ein eigenes PNG-, JPG- oder WebP-Bild (bis 5 MB) hochgeladen werden. Bilder werden lokal verkleinert und mit dem Spielstand im Browser gespeichert. Über „Standardbild verwenden“ lässt sich das jeweilige Original wiederherstellen. Bildnachweise stehen in `public/items/ATTRIBUTION.md`.
