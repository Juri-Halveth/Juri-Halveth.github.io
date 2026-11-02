# Juri · Software und überprüfbare Projekte

Ich entwickle lokale Werkzeuge, Webanwendungen und interaktive Modelle. Die
[Portfolio-Startseite](https://juri-halveth.github.io/) zeigt direkt nutzbare
Ergebnisse; die [Projektübersicht](https://juri-halveth.github.io/arbeiten/)
führt zu Anwendung oder Anleitung und daneben zum Quellcode. Zwei
[Arbeitsproben](https://juri-halveth.github.io/belege/) zeigen Eingabe, Ergebnis
und Gegenprobe. **Person: Juri. Projekt: HALVETH.**
[Namenszuordnung](IDENTITY.md).

Der öffentliche Quellenkatalog bindet **18 Repository-Einträge**: **16
Projektrepositories**, die Website und das GitHub-Profil. Auf der
Projektübersicht stehen **13 aktuelle Projektkarten**. Drei früher
zurückgezogene Spielpräsentationen sind weiterhin nur im Quellenbestand und
im optionalen Lab erfasst; die redaktionelle Sperre aus
`tools/validate-portfolio-selection.cjs` bleibt bestehen.

[Starship Lab öffnen](https://juri-halveth.github.io/universum/) ·
[Szenen und Modelle ansehen](https://juri-halveth.github.io/modelle/) ·
[Technische Karte](https://juri-halveth.github.io/koennen/)

Die Portfolio-Oberfläche ist auf Deutsch, Englisch und Russisch verfügbar; das Starship Lab ist derzeit deutschsprachig. Projektleitung
und Auswahl: Juri / HALVETH; Entwicklung mit KI-Unterstützung.

Das [Starship Lab](universum/) ist ein eigenständiger interaktiver Browserraum
für 18 öffentliche Repository-Einträge. Er verbindet räumliche Navigation,
synthetische Modelle und drei ausgewählte Quellspuren. Die Kategorien bleiben
im Lab getrennt: Software, Sicherheit, Modelle und Visualisierung, Welten,
Lernen sowie gesellschaftliche Quellen. Seine Berechnungen laufen im Browser;
die [Quellen- und Lizenzkarte](universum/CREDITS.md) benennt die eingebundenen
Module und Bilder. Das Lab ist über die Projektübersicht und den Footer erreichbar.
Im Flugraum führt Scrollen vorwärts und rückwärts entlang einer festen Blickachse;
auf Touchgeräten dienen vertikales Wischen und Pinch der Tiefenbewegung.
Projekt- und Themensymbole behalten eigene Identitäten. Der Stern- und
Raumzeitraum ist eine künstlerische Projektion, keine physikalische Simulation.
Ein gewähltes Projekt öffnet seinen Bild- und Aktionsraum vom jeweiligen Portal
aus. Drei kurze, quellengebundene Einblicke führen zur direkten Projektaktion;
technische Details und ausgewählte Git-Zeiten liegen hinter „Mehr zum Projekt“.
Der Atlas zeigt alle Einstiege mit eigenen Motiven auf der gesamten Bühne.
Schematische Motive sind als Illustrationen gekennzeichnet und keine
Laufzeitaufnahmen.

Die SCARLET-Karte führt jetzt auch direkt in die öffentliche 1001-Konstellation
mit 68 Entitäten und in deren Wellenmodus. Beide Adressen gehören zum selben
SCARLET-Repository und sind keine zusätzlichen Projekte. Ihr eigener
Quellstand und Beobachtungstag stehen im Katalog getrennt vom älteren
Quellstand der Hauptkarte. Der Starship-Projektfokus zeigt dieselben direkten
Einstiege neben seinem eigenständigen lokalen Zellmodell.

Ein anderes Forschungslabor enthält den gemergten Quellstand „1001 Türen“ für
die Zahlen 0 bis 1000. Seine geplante Browseradresse ist im Katalog noch als
`PENDING_PUBLICATION` gebunden und erscheint bis zur geprüften
Pages-Veröffentlichung weder als Besucherlink noch im öffentlichen
Agent-Kontext.

## Lokal bauen

Auf der Projektübersicht lassen sich die 13 aktuell präsentierten Projekte nach
Aufgabe durchsuchen und auf Werkzeuge, Visualisierung, Lernen oder Modelle begrenzen.
Ein leeres Ergebnis besitzt einen direkten Rückweg zu allen Projekten.
Suche und Filter arbeiten lokal, ohne Navigation oder automatisches Scrollen.
Deutsch, Englisch und Russisch verwenden dieselben Projektquellen; ohne
JavaScript bleibt die vollständige Liste lesbar.

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

## Projektquellen aktuell halten

`npm run refresh` liest die öffentlichen Standardbranch-HEADs der ausgewählten
Repositories über die GitHub-API. Mit `GH_TOKEN` ist ein authentifizierter Abruf
möglich; ohne Token gilt das öffentliche API-Limit. Danach `npm run build` und
`npm test` ausführen und den Quelldiff prüfen. Ein geänderter HEAD erhält den
Prüfstatus „Quellstand aus GitHub“; alte Testergebnisse werden nicht auf neue
Revisionen übertragen. Der TRON-Arbeitsbeleg bleibt absichtlich auf seinen
unveröffentlichten PR-Quellstand gebunden.

Der Footer zeigt den Katalogstand aus `data/site-catalog.json`
(`source_date`). `npm run refresh` aktualisiert separat die ältere ausgewählte
Quellmenge in `data/projects.json`; es ändert den Website-Katalog derzeit nicht
automatisch. Ein neues öffentliches Projekt wird in den Website-Katalog
eingetragen und redaktionell geprüft, bevor es als Karte erscheint.
Ein HEAD-Refresh ändert nur das Datum und die Revisionen seiner eigenen
datierten Quellmenge. Der anschließende Build verlangt übereinstimmende
Repository-Identitäten, aber keine künstliche Gleichheit der getrennten
Snapshots; ältere gebundene Katalog-Links bleiben als historische Stände stehen.

## Quellen und Darstellung

- `data/scene-stage.json` bindet zwei Aufnahmen, Verarbeitung, Maße, Digests und
  den exakt übernommenen MIT-Modellcode. `assets/ASSET-SOURCES.json` erhält die
  Asset-Herkunft. Eine Bildschirmaufnahme ist eine zeitgebundene Beobachtung.
- `tools/render-showcase.cjs`, `scene-stage.mjs` und `showcase.css` erzeugen
  Darstellung und Bedienung. Eine statische SVG-Ansicht bleibt ohne JavaScript
  lesbar; die interaktiven Steuerelemente benötigen JavaScript. Abspielen ist
  bewusst, endlich und bei unsichtbarer Seite pausiert.
- `data/projects.json` enthält 11 ausgewählte Einstiege mit Zweck, Quellrevision
  und Prüfart. Lokale Modelltests sind an genau dieselbe Revision gebunden.
  Historische Download-Releases behalten ihren eigenen Stand.
- `data/public-repositories.json` führt 14 ausgewählte
  öffentliche Repositories aus dem datierten Abruf mit Zweck und beobachtetem Standardbranch-HEAD.
  Lizenzquellen haben ihre eigene Prüfungsrevision. Das Verzeichnis ist kein
  Vollaudit der verlinkten Produkte.
- `data/site-catalog.json` ist die öffentliche Identitäts- und
  Navigationsquelle für Website und Starship Lab: 18 Repository-Einträge,
  16 Projekte, 2 Meta-Einstiege. Ein eigener redaktioneller Status begrenzt die
  13 aktuell präsentierten Karten. Die alten datierten Teilmengen bleiben
  als Belege erhalten.

`tools/build-portfolio.cjs` erzeugt 43 HTML-Seiten deterministisch. Tests prüfen
Quelladressen, Darstellungsgrenzen, Sprachfassungen, lokale Dateipfade,
Zeitsteuerung und gezielte Gegenbeispiele. GitHub Pages veröffentlicht den
committeten Baum nach Build, Driftprüfung und Tests.

## Nachvollziehbare Arbeit

Das [öffentliche Prüfpaket](docs/review/2026-10-27/README.md) enthält die
69er-Projektkarte, Paketprüfsummen und einen frischen Bytebeleg für 48 Quell-
und Live-Ressourcen. ZIP, Veröffentlichung und Beobachtungszeit sind getrennt gebunden.

Die [Schnittstellenkarte](https://juri-halveth.github.io/koennen/) verbindet
12 Arbeitsproben in sechs Bereichen mit versionierten Funktionen, Tests und
Builddefinitionen. `data/technical-map.json` bleibt eine bytegebundene Kopie aus
dem Profilrepository; der Build prüft sie gegen `technical-map-source.json`.

`/belege/` zeigt zwei datierte Fälle. Das [Prüfprotokoll vom 20. Oktober](docs/WORK-SAMPLE-VALIDATION-2026-10-20.md)
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

Zusammenarbeit: **juri@halveth.de** · [Sicherheitsmeldungen](SECURITY.md): **security@halveth.de**
