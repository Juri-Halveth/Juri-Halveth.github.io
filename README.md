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
