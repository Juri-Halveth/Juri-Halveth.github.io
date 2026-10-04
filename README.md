# Juris Space · HALVETH / LUCINET

<!-- HALVETH_WORK_CERTIFICATES_V1_1 -->
## Juri Halveth / HALVETH · Private Werkzertifikate

[Alle elf privaten Werkzertifikate mit vollständigen Namen, Quellständen und SHA-256-Belegen](https://juri-halveth.github.io/werkzertifikate/). Private, mit Codex erstellte Werkdokumentation; keine ISTQB- oder sonstige Personenzertifizierung.
<!-- /HALVETH_WORK_CERTIFICATES_V1_1 -->

Der öffentliche Einstieg unter [juri-halveth.github.io](https://juri-halveth.github.io/) verbindet Weltenbau, Lernen, Forschung und Werkzeuge in einem ruhigen Projektatlas. Der Bestand vom 4. Oktober 2026 enthält die 15 öffentlich sichtbaren, eigenen GitHub-Repositories und die zwei benannten Sites-Veröffentlichungen. Die [Atlasdaten](data/juris-space.json) führen Herkunft, Erfassungszeit, Entwicklungsstand und nächste Schritte.

Ein Projekt als Fokus wählen, seinen Stand lesen und über den eigenen Öffnen-Link weitergehen. Sprache, Fokus und Abendansicht bleiben in diesem Browser gespeichert; bei gesperrtem Browserspeicher gilt die Auswahl für den aktuellen Besuch. Suche und Themenfilter erschließen den gesamten Atlas. `?lang=de` und `?lang=en` wählen die Sprache; `?project=UNREAL` bindet einen gültigen Projekteinstieg. Verlinkte Scarlet-Seiten übernehmen die Sprachauswahl.

Statische HTML-, CSS- und JavaScript-Dateien ohne externe Schriften oder Analyse-Tracker. Die 17 Projektkarten und direkten Links stehen auch ohne JavaScript bereit. [Aufbau und Quellen](docs/JURIS-SPACE.md) beschreiben den Bestand und seine Pflege.

## Mit Git Bash arbeiten

Node.js und Git Bash reichen aus; das Portal benötigt keine npm-Pakete.

```bash
bash SPACE.sh build      # Atlasdaten prüfen und statische Karten erzeugen
bash SPACE.sh check      # Navigations- und Datenverträge prüfen
bash SPACE.sh preview    # Vorschau auf http://127.0.0.1:4187
bash SPACE.sh inventory  # Öffentliche eigene Repositories lesen; benötigt gh
bash SPACE.sh motion --out motion-render  # Optionaler CPU-Bildexport; siehe motion/README.md
```

`build` erzeugt `space-data.js` und den markierten Kartenbereich in `index.html` aus `data/juris-space.json`. Die GitHub-Prüfung kontrolliert auch, dass diese Dateien zum Datensatz passen. Entwicklungs-PRs behalten ihren Status als Entwurf; ein Portal-Link ist keine Installation eines Spiels.

## Rechte und Herkunft

Die neue [Bewegungskomposition](motion/README.md) ergänzt das Portal um
kontinuierliche Formen, Lichtbahnen und Zeitnavigation. Ihr Renderer und
Exportwerkzeug sind unter MIT verfügbar. Browser-Playback benötigt keine
npm-Pakete; nur der optionale CPU-Export verwendet `@napi-rs/canvas`.

Neue eigene Portalbeiträge sind **Source Available** unter HALVETH PIRL 2.0. [LICENSES.md](LICENSES.md) ordnet den Umfang zu. Frühere wirksame Freigaben und Drittanbieterrechte bleiben bestehen. Externe Projektlinks übertragen keine Rechte am Zielinhalt. Kontakt für Quellen, Korrekturen und Lizenzen: **security@halveth.de**.

`robots.txt` liegt am Ursprung der GitHub-Pages-Domain. Es enthält Crawler-Anweisungen, keine Authentisierung oder Zugriffssperre.

## Veröffentlichung

GitHub Pages veröffentlicht `main` aus dem Repository-Wurzelverzeichnis. Scarlet, Lernstudio, Fortuna und die Spielprojekte besitzen eigene Quellen und Veröffentlichungsstände. Der Atlas verlinkt diese Ursprünge; ihre Software und Inhalte werden in den jeweiligen Projekten gepflegt.

## English

Juris Space is a calm bilingual project atlas connecting worlds, learning, research and tools. Its dated public snapshot includes 15 owned GitHub repositories and two selected Sites publications. Choose a focus, read its state and next step, then open the destination deliberately. Language, theme and focus are stored locally, with a session fallback when browser storage is unavailable. New original contributions are source available under HALVETH PIRL 2.0; earlier effective grants and third-party rights remain applicable. Pages is published from `main`, with no npm dependencies or analytics trackers.
