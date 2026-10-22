# Juri Halveth · Software, Grafik und Lernen

[Portfolio öffnen](https://juri-halveth.github.io/) · [Arbeitsproben](https://juri-halveth.github.io/koennen/)

Diese Website präsentiert ausgewählte technische Projekte mit Zweck, Einstieg,
Quellrevision und Entwicklungsstand. Die Oberfläche ist auf Deutsch, Englisch
und Russisch verfügbar. Projektleitung: Juri Halveth / HALVETH; Entwicklung
mit KI-Unterstützung.

## Lokal bauen

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run preview
```

`data/projects.json` ist der technische Projektkatalog. Der deterministische
Builder `tools/build-portfolio.cjs` erzeugt alle Seiten. Tests prüfen Katalog,
lokale Links, Sprachfassungen sowie Bewegung, Sichtbarkeit und reduzierte
Animation. Projektprüfungen bleiben beim jeweiligen Codebestand.

## Public Research OS · lokaler Kandidat

`/forschung/` zeigt einen statisch erzeugten Forschungsindex in drei Sprachen.
Portfolio, Seedspace, Field Difference Lab, C-DROHNE und das Forschungslabor mit
GENESIS besitzen quellgebundene Einträge, fünf README-Belege, fünf
Capture-Ereignisse und drei Beziehungen aus dem gebundenen Portfolio-Katalog.
Seedspace erhält keine erfundene Katalogbeziehung. Beim Forschungslabor führt
der Quelllink zu einem öffentlichen Branch-Commit; solange es keine
veröffentlichte Browserdemo gibt, zeigt die Karte keinen Demo-Link.
Offene Fragen bleiben auf den Karten sichtbar.

`data/research-index.json` ist ein geprüfter Snapshot aus dem separaten lokalen
Core-Kandidaten v0.1. `tools/render-research-os.cjs` prüft seinen Digest,
öffentliche Quellenadressen, Entitäts-Digests und Relationsendpunkte vor dem
Seitenbau. Die Website führt den Importer und die verknüpften Projekte nicht
aus. Ein gebundener README-Stand ist kein Funktions- oder Wirkungsnachweis.
Die Forschungsseiten enthalten ihre geprüften Styles mit CSP-Hash direkt im
HTML und verwenden relative interne Pfade, damit auch ein direktes Öffnen der
erzeugten `forschung/index.html` über `file://` gestaltet bleibt. Für die
übrigen Routen bleiben Styles eigene Dateien; die Navigation löst lokal und
unter GitHub Pages dieselben Ziele auf.
Der Core-Kandidat liegt separat lokal; die öffentliche Webseite zeigt nur den
geprüften statischen Index. Der
[Linkcheck des Fünferstands](docs/RESEARCH-OS-LINKCHECK-2026-10-22.md)
ergab für alle zehn unterschiedlichen externen Adressen HTTP `200` per `HEAD`.
Ein Linkstatus ist kein Funktionstest.

## Ausgewählte Arbeiten auf dem ersten Blick

Startseite und Arbeitsprofil führen über drei direkte Einstiege: die native
ASHBOUND-Vorschau, SCARLETs Singularity Cannon und das Forschungslabor. Die
Darstellung entsteht aus `tools/render-showcase.cjs`; die Projektquellen und
Revisionen bleiben im bestehenden Katalog. `showcase.css` enthält die
responsive Gestaltung. Die neue Präsentation benötigt kein zusätzliches
JavaScript und erhält die vorhandene Bewegungssteuerung.

Das [neue lokale Prüfprotokoll](docs/WORK-SAMPLE-VALIDATION-2026-10-22.md)
bindet den GENESIS-Branch-Commit und die Aufteilung der 184 Tests.
Der [vorherige Prüfstand](docs/WORK-SAMPLE-VALIDATION-2026-10-20.md)
bleibt unverändert nachvollziehbar. Beide sind Momentaufnahmen und keine
Live-CI-Badges.

## Technische Schnittstellenkarte

`/koennen/` ordnet 14 konkrete Arbeitsproben in sieben technischen Gebieten.
Vier Querwege verbinden wiederkehrende Arbeitsweisen über die Projekte hinweg.
Die Belege führen direkt zu versionierten Funktionen, Gegenproben, Buildskripten
und Workflows. Die Bereiche lassen sich ohne JavaScript anspringen; native
Details-Elemente öffnen die jeweiligen Quellverweise.

`data/technical-map.json` ist eine exakte Kopie des Quellenkatalogs aus dem
Profilrepository. `data/technical-map-source.json` bindet dessen Commit, Pfad
und SHA-256. Änderungen erfolgen zuerst dort, anschließend wird die Kopie bewusst
übernommen. Die Website prüft lokale Struktur, Quelladressen und Kopierintegrität;
sie führt die fremden Produkte beim Build nicht aus und behauptet keine neue
Laufzeitprüfung dieser Produkte.

Die frühere gemischte Sammlung wurde privat gesichert und aus dem aktuellen
öffentlichen Baum entfernt. Alte Zertifikatsadressen zeigen jetzt Arbeitsproben.
Ein Redaktionscommit schreibt keine Git-Historie um.

[Lizenzen](LICENSES.md) · [Sicherheit](SECURITY.md) · Kontakt: security@halveth.de

## Dated evidence and hardening

The three concise, source-pinned cases are generated at `/belege/` (also English and Russian) from `data/work-samples.json`. See [implementation and remaining checks](docs/HARDENING-2026-10-20.md). CI snapshots are matched to exact source revisions at build time.
