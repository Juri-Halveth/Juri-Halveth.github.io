# Juris Space: Bestand und Pflege

Der Projektatlas ist eine datierte Ansicht des öffentlichen Bestands. Am 4. Oktober 2026 wurden 15 eigene öffentliche GitHub-Repositories und die beiden benannten Sites-Veröffentlichungen erfasst. Weitere, private oder künftig entstehende Projekte gehören erst nach einer eigenen Bestandsprüfung in diesen Datensatz.

## Öffentliche Quellen

GitHub lieferte den Bestand über die authentisierte Eigentümerzuordnung (`affiliation=owner`). Der Datensatz enthält öffentliche Projektnamen, URLs, Standardbranches und eigene Beschreibungen. Die Sites-Veröffentlichungen wurden in der verbundenen Projektübersicht geprüft. Private Anhänge, lokale Dateipfade und Gesprächsexporte gehören nicht in diesen Atlas.

| Einstieg | Gebundener Stand am Erfassungstag | Weiterer Weg |
| --- | --- | --- |
| [HALVETH Unreal](https://github.com/Juri-Halveth/halveth-unreal) | [Entwurfs-PR #1](https://github.com/Juri-Halveth/halveth-unreal/pull/1), offen | Figuren, Gang und Bodenkontakt im Spiel prüfen |
| [Morrowind Genesis](https://github.com/Juri-Halveth/halveth-morrowind-genesis) | [Entwurfs-PR #5](https://github.com/Juri-Halveth/halveth-morrowind-genesis/pull/5), offen | Aktuelle Spielentwicklung und Quellbestand öffnen |
| [Fortuna](https://github.com/Juri-Halveth/fortuna) | [PR #1](https://github.com/Juri-Halveth/fortuna/pull/1), zusammengeführt | Veröffentlichte Oberfläche und Bewertungsmodell prüfen |
| [Scarlet auf GitHub](https://juri-halveth.github.io/halveth-scarlet/) | Eigener veröffentlichter GitHub-Stand | Figurenraum und Quellen öffnen |
| [Scarlet Question auf Sites](https://halveth-scarlet-question.juri-janovski.chatgpt.site) | Veröffentlichte Version 12 | Den benannten Sites-Stand öffnen |
| [Lernstudio auf Sites](https://lernstudio-wissen-fuer-alle.juri-janovski.chatgpt.site) | Veröffentlichte Version 3 | Den benannten Sites-Stand öffnen |

Die genaue Erfassungszeit steht in `data/juris-space.json`. Ein geöffneter Entwurf bleibt ein Entwurf, bis sein eigenes Repository die nächste Änderung tatsächlich übernimmt. Die Karten zeigen keine fortlaufend abgefragten Live-Zustände.

## Oberfläche

Fokusauswahl, Suche, Themenfilter, Deutsch/Englisch und Abendansicht verwenden ausschließlich lokale Skripte. Die Auswahl öffnet zunächst den Zusammenhang im selben Raum. Ein eigener Link führt zum Ziel. Gespeicherte Einstellungen tragen die Version 1; unbekannte Werte werden durch gültige Einstellungen ersetzt. Eine ungültige Projekt-ID im Datenmodell wird abgelehnt.

Die Oberfläche nutzt klare Tastaturfokusse, stabile Bedienelemente und eine ruhende SVG-Illustration. Nach einer Auswahl aus den verbundenen Wegen erhält die neue Fokusüberschrift den Tastaturfokus. Eine leere Suche lässt sich mit dem Rücksetzknopf vollständig öffnen. Das ist keine vollständige WCAG-Konformitätsbescheinigung.

Die Gestaltung berücksichtigt die [W3C-Erklärung zu interaktionsbedingter Animation](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) und die [W3C-Technik zu reduzierter Bewegung](https://www.w3.org/WAI/WCAG22/Techniques/css/C39). Der Standardzustand enthält keine laufenden Animationen.

## Daten ändern und veröffentlichen

1. Öffentliche Quellen und den konkreten Entwicklungsstand prüfen.
2. `data/juris-space.json` mit Erfassungszeit, Quelle, gültiger ID, DE/EN-Texten und verbundenen Projekten aktualisieren.
3. `bash SPACE.sh build` und `bash SPACE.sh check` ausführen.
4. Die Oberfläche im Browser mit Tastatur und schmaler Ansicht prüfen.
5. Die Änderung über einen Git-Commit und geprüften Pull Request auf `main` übernehmen; anschließend die veröffentlichte Seite kontrollieren.

Die bestehenden Archiv-, Rechte- und Werkzertifikatdateien behalten ihre eigenen Quellen. `LICENSES.md` beschreibt den Lizenzumfang; verlinkte Projekte behalten ihre jeweils geltenden Rechte.
