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

`/forschung/` zeigt einen ersten, statisch erzeugten Forschungsindex in drei
Sprachen. Portfolio, Seedspace, Field Difference Lab und C-DROHNE besitzen
quellgebundene Einträge, vier README-Belege, vier Capture-Ereignisse und zwei
Beziehungen aus dem gebundenen Portfolio-Katalog. Seedspace erhält keine
erfundene Katalogbeziehung. Offene Fragen bleiben auf den Karten sichtbar.

`data/research-index.json` ist ein geprüfter Snapshot aus dem separaten lokalen
Core-Kandidaten v0.1. `tools/render-research-os.cjs` prüft seinen Digest,
öffentliche Quellenadressen, Entitäts-Digests und Relationsendpunkte vor dem
Seitenbau. Die Website führt den Importer und die verknüpften Projekte nicht
aus. Ein gebundener README-Stand ist kein Funktions- oder Wirkungsnachweis.
Der Core-Kandidat und diese Version der Seite liegen zunächst lokal. Die neun
gebundenen öffentlichen README-, Katalog- und Demo-Adressen antworteten beim
HTTP-HEAD-Linkcheck am 22. Oktober 2026 mit Status 200; das ist kein
Funktionstest ihrer Inhalte.

## Ausgewählte Arbeiten auf dem ersten Blick

Startseite und Arbeitsprofil führen über drei direkte Einstiege: die native
ASHBOUND-Vorschau, SCARLETs Singularity Cannon und das Forschungslabor. Die
Darstellung entsteht aus `tools/render-showcase.cjs`; die Projektquellen und
Revisionen bleiben im bestehenden Katalog. `showcase.css` enthält die
responsive Gestaltung. Die neue Präsentation benötigt kein zusätzliches
JavaScript und erhält die vorhandene Bewegungssteuerung.

Das [datierte lokale Prüfprotokoll](docs/WORK-SAMPLE-VALIDATION-2026-10-20.md)
bindet den tatsächlich geprüften Forschungslabor-Commit und die Aufteilung
der 145 Tests. Es ist eine Momentaufnahme und kein Live-CI-Badge.

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
