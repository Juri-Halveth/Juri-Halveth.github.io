# Juri · Werkzeuge, Modelle und Anwendungen

**Person: Juri. Projekt: HALVETH.** [Namenszuordnung](IDENTITY.md).

[Portfolio öffnen](https://juri-halveth.github.io/) · [Projekte](https://juri-halveth.github.io/arbeiten/) · [Technik & Code](https://juri-halveth.github.io/koennen/)

Der Einstieg zeigt bedienbare Funktionen für Textzustände, Varianten,
Beobachtungsvergleich und räumliche Anwendungen.
Direkt auf der Seite berechnet JavaScript zwei Ansichten derselben vier Punkte.
Zweck, Modellregeln, lokale Ausführung und mögliche Anwendung bleiben erkennbar.
Die Präsentationsreihenfolge ist getrennt von den unveränderten Quellpaket-IDs.

Die Oberfläche ist auf Deutsch, Englisch und Russisch verfügbar. Projektleitung
und Auswahl: Juri / HALVETH; Entwicklung mit KI-Unterstützung.

## Lokal bauen

Voraussetzung: Node.js 24.

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run preview
```

Die Vorschau bindet ausschließlich `127.0.0.1:4187`. `SPACE_PORT` kann einen
anderen lokalen Port wählen. Der Preview-Root ist ein öffentliches
Arbeitsverzeichnis; vertrauliche Dateien gehören in einen getrennten Speicher.

## Quellen und Darstellung

- `data/scene-stage.json` bindet drei Aufnahmen, Verarbeitung, Maße, Digests und
  den exakt übernommenen MIT-Modellcode. `assets/ASSET-SOURCES.json` erhält die
  Asset-Herkunft. Eine Bildschirmaufnahme ist eine zeitgebundene Beobachtung.
- `tools/render-showcase.cjs`, `scene-stage.mjs` und `showcase.css` erzeugen
  Darstellung und Bedienung. Eine statische SVG-Ansicht bleibt ohne JavaScript
  lesbar; die interaktiven Steuerelemente benötigen JavaScript. Abspielen ist
  bewusst, endlich und bei unsichtbarer Seite pausiert.
- `data/projects.json` enthält 14 ausgewählte Einstiege mit Zweck, Quellrevision
  und Prüfart. Lokale Modelltests sind an genau dieselbe Revision gebunden.
  Historische Download-Releases behalten ihren eigenen Stand.
- `data/public-repositories.json` führt alle 18 beim datierten Abruf sichtbaren
  öffentlichen Repositories mit Zweck und beobachtetem Standardbranch-HEAD.
  Lizenzquellen haben ihre eigene Prüfungsrevision. Das Verzeichnis ist kein
  Vollaudit der verlinkten Produkte.

`tools/build-portfolio.cjs` erzeugt 43 HTML-Seiten deterministisch. Tests prüfen
Quelladressen, Darstellungsgrenzen, Sprachfassungen, lokale Dateipfade,
Zeitsteuerung und gezielte Gegenbeispiele. GitHub Pages veröffentlicht den
committeten Baum nach Build, Driftprüfung und Tests.

## Nachvollziehbare Arbeit

Die [Schnittstellenkarte](https://juri-halveth.github.io/koennen/) verbindet
14 Arbeitsproben in sieben Bereichen mit versionierten Funktionen, Tests und
Builddefinitionen. `data/technical-map.json` bleibt eine bytegebundene Kopie aus
dem Profilrepository; der Build prüft sie gegen `technical-map-source.json`.

`/belege/` zeigt drei datierte Fälle. Das [Prüfprotokoll vom 20. Oktober](docs/WORK-SAMPLE-VALIDATION-2026-10-20.md)
und die damaligen CI-Zuordnungen bleiben historische Belege ihrer eigenen
Revision. Der neue [Änderungs- und Prüfstand](docs/SCENE-FIRST-2026-10-24.md)
trennt diese Ergebnisse vom aktuellen lokalen Lauf.

`/forschung/` zeigt den statischen Public-Research-OS-Index: vier Projekte,
gebundene README-Quellen und explizite Beziehungen. Er startet weder die
verlinkten Produkte noch den externen Importer. Der Build verwendet separat
den lokalen Geometriemodell zur SVG-Erzeugung. Forschungsseiten betten ihre
Styles mit CSP-Hash ein; Navigation und Ressourcen bleiben relativ.

## Zusammenarbeit und Rechte

Interaktive Prototypen, technische Erklärungen und lokale Werkzeuge können als
konkreter Auftrag mit Ziel, Umfang und Abnahme vereinbart werden.

Die Website ist source-available unter der pfad- und versionsgebundenen
[Lizenzkarte](LICENSES.md), mit erhaltenen MIT-Ausnahmen. Verlinkte Projekte
haben eigene Bedingungen; frühere wirksame Grants bleiben bestehen. Eine
kommerzielle Anfrage nennt das konkrete Werk, die Revision und den Einsatz.

[Sicherheit](SECURITY.md) · Kontakt: **security@halveth.de**
