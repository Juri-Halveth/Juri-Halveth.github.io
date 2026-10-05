# Themen, Quellen und Pflege

Der Stand vom 05.10.2026 verwandelt den bisherigen Projektatlas in eine thematische Landingpage. Die Reihenfolge lautet Forschung/Sicherheit, Grafik/Spiele, Lernen, Software/Ideen und Fähigkeiten/Nachweise. Der Zweck einer Arbeit steht im sichtbaren Titel; Projektnamen bleiben als Herkunft erhalten.

## Gebundener öffentlicher Bestand

| Quelle | Umfang | Bindung |
| --- | --- | --- |
| Eigene öffentliche Repositories | 15 | Eigentümerzuordnung und Metadaten zum Erfassungszeitpunkt |
| Benannte Sites-Veröffentlichungen | 2 | Als Alternativzugänge derselben Forschungs- bzw. Lernwelt |
| Forschungsdokumente | 66 | Alle `branches/*/README.md` und `reports/*.md` im erfassten, vollständigen Git-Baum |
| Werkzertifikate | 11 | Historische Ausgabe vom 28.09.2026; eigene Dokumentation mit genanntem Prüfumfang |
| Arbeitsfelder | 6 | Jeweils konkrete öffentliche Arbeitsproben bzw. Werkdokumentation |

Die Forschungsfassung ist `834352b21a2123137f55fbca22afbfda2be7c7fd`. Die tatsächlich gelesenen Rohtexte wurden mit Pfad, Blob-ID, SHA-256 und Bytezahl gebunden. Das öffentliche Register trägt die Erfassungszeit; die Links bleiben auf die gelesene Commitfassung gerichtet. Eine Berichtsauswahl wird dadurch nicht zum Nachweis sämtlicher privater Arbeiten der vergangenen Monate. Das Profil bezieht seine Aussagen auf die zugeordneten öffentlichen Artefakte.

`data/juris-space.json` bleibt die historische Adresszuordnung. `data/portfolio.json` ordnet diese Adressen verlustfrei den neuen Themen zu. Das Arbeitsverzeichnis faltet die drei Lernadressen in einen Lernwelt-Eintrag und die zwei Scarlet-Zugänge in einen Forschungsvisualisierungs-Eintrag. Alle 66 Forschungsdokumente erscheinen genau einmal.

## Oberfläche und Bewegung

Die Landingpage verwendet statisches HTML für sämtliche Texte und Links. Systemschriften, klare Kapitel, erkennbare Tastaturfokusse und schmale Layouts halten die Oberfläche zugänglich. Der einzige Navigationscode löst frühere Projektadressen auf; es gibt keine gespeicherte Fokusauswahl oder Nutzungsverfolgung.

`motion-core.js` enthält neben der bestehenden Filmkomposition einen kontinuierlichen Artwork-Modus. Räumliche Formen behalten bei verschiedenen Seitenverhältnissen ihre Proportionen. Rotation, Verformung, Lichtbahnen und Glühen werden aus dem laufenden Zeitwert berechnet. `landing-motion.js` startet die sichtbaren Kompositionen automatisch, begrenzt die Pixeldichte und zeichnet höchstens 30 Bilder pro Sekunde. Verdeckte oder weit außerhalb der Ansicht liegende Kompositionen geben die Rechenzeit frei. Die Systemeinstellung für reduzierte Bewegung erhält eine beleuchtete ruhende Fassung. Ohne aktiven Renderer bleiben Texte und Links sichtbar und eine eigene Grafik hält den Bildbereich lesbar.

Die eigenständige Bewegungsstudie unter `/motion/` behält ihre experimentellen Zeitregler. Auf der Landingpage erscheint das Artwork unmittelbar und ohne diese Bedienelemente.

## Rückwege

Arbeitsverzeichnis, Profil und Fehlerseite verlinken zurück zum Ursprung und zum passenden Thema. Werkzertifikate, Bewegungsstudie und die sechs aktiven Archiv-/Medieneingänge tragen einen eigenen Rückweg. Die historische Rohüberlieferung wird dafür nicht umgeschrieben. Externe Quellen öffnen einen eigenen Tab, sodass der thematische Einstieg erhalten bleibt.

## Drei Sprachen

Die zehn aktiven Zugänge besitzen deutsche, englische und russische Ansichten. Der Build erzeugt für Englisch und Russisch eigene HTML-Dateien unter `/en/` und `/ru/`, jeweils mit kanonischer Adresse und Sprachverweisen. Die drei Sprachlinks sind normale Navigation. Die übrigen vier Websites verwenden den gemeinsamen lokalen Darstellungsadapter und den Parameter `lang=de`, `lang=en` oder `lang=ru`.

Übersetzte Oberfläche und historische Quelle behalten ihre jeweilige Herkunft: Quellcode, Nutzereingaben, Roharchive, Original-PDFs, IDs und gebundene Quelladressen behalten ihre Originaldarstellung. Die lokalen Übersetzungsmodelle benötigen redaktionelle Prüfung; fehlende Katalogeinträge und eine strukturell gültige Ausgabe beweisen keine Bedeutungsgleichheit. Die Themenübersicht und ihre Arbeitsprofil-Aussagen wurden redaktionell bearbeitet.

Für die DOM-Prüfungen wird `jsdom` als Entwicklungsabhängigkeit installiert: `npm ci --ignore-scripts --no-audit --no-fund`. Der gemeinsame Aufruf `bash SPACE.sh verify` erzeugt die Seiten und führt die Navigations-, Quellen-, Sprach- und Bewegungstests aus. Der Browserclient verwendet dafür keine zusätzliche Laufzeitbibliothek.

## Änderungen durchführen

1. Öffentliche Quelle, Zeitpunkt und behaupteten Arbeitsstand prüfen.
2. Themen und Quellen in `data/portfolio.json` bzw. `data/public-sources.json` aktualisieren. Jede frühere Adresse bleibt genau einem Thema zugeordnet.
3. Texte in `templates/index.html`, `tools/build-space.cjs` und den zugehörigen Gestaltungsdateien ändern.
4. `bash SPACE.sh build` und `bash SPACE.sh check` ausführen. Der zweite Build muss dieselben Seiten erzeugen.
5. Desktop- und Mobilansicht, sichtbare Bewegung, Browserfehler, Links und Rückwege prüfen.
6. Über geprüften Commit und Pull Request veröffentlichen. Anschließend die Pages-Veröffentlichung und den tatsächlich ausgelieferten Inhalt im Browser prüfen.

Lokale QA-Screenshots und Prüfprotokolle bleiben außerhalb der Veröffentlichung. Rechte und Lizenzumfang stehen in `LICENSES.md`; die verlinkten Projekte behalten ihre eigenen Freigaben.
