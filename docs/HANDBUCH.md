# HALVETH / LUCINET · Was steht wo?

[Handbuch öffnen](https://juri-halveth.github.io/handbuch/) · [English](https://juri-halveth.github.io/en/handbuch/) · [Русский](https://juri-halveth.github.io/ru/handbuch/)

Öffnen, verstehen, weiterbauen. Jede Oberfläche führt zu ihrem Quellcode, den zugehörigen Daten und den Prüfungen. Die Namen erhalten hier einen Zweck und eine Adresse.

Dateiverweise öffnen den aktuellen main-Zweig des jeweiligen Projekts. Inhalte und Prüfergebnisse können sich weiterentwickeln. Das ursprüngliche Quellenregister bewahrt seine datierten Fassungen und Ergebnisse.

## HALVETH · Orientierung

Themen, Arbeiten und Quellen an einem gemeinsamen Einstieg finden.

[Oberfläche](https://juri-halveth.github.io/) · [Repository](https://github.com/Juri-Halveth/Juri-Halveth.github.io)

### Oberfläche, Daten, Verhalten und Build

- [index.html](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/index.html): Oberfläche
- [templates/index.html](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/templates/index.html): Vorlage
- [data/portfolio.json](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/data/portfolio.json): Themen
- [data/public-sources.json](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/data/public-sources.json): Quellenregister
- [landing-motion.js](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/landing-motion.js): Automatische Bewegung
- [motion-core.js](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/motion-core.js): Form, Licht und Zeit
- [motion/index.html](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/motion/index.html): Bewegungsstudie
- [tools/build-space.cjs](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/tools/build-space.cjs): Seitenbau
- [tools/build-languages.cjs](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/tools/build-languages.cjs): Sprachzugänge

### Prüfungen

- [tests/landing.test.cjs](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/tests/landing.test.cjs)
- [tests/landing-motion.test.cjs](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/tests/landing-motion.test.cjs)
- [tests/motion.test.cjs](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/tests/motion.test.cjs)
- [tests/motion-player.test.cjs](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/tests/motion-player.test.cjs)
- [tests/languages.test.cjs](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/tests/languages.test.cjs)

```bash
bash SPACE.sh verify
```

Die verlinkten Prüfdateien beschreiben den aktuellen Prüfweg. Ein neues Ergebnis entsteht beim Ausführen; das frühere Ergebnis steht im datierten Archiv.

Aktueller Code: `main`. Das [HTML-Seitenregister](https://juri-halveth.github.io/handbuch/#space) führt die erfassten Seiten zu ihrem Zweck, ihrer öffentlichen Adresse und ihrer Quellfassung.

## FORTUNA · Möglichkeiten vergleichen

Möglichkeiten, Bewertungsprofile und bewegte Zustände erkunden.

[Oberfläche](https://juri-halveth.github.io/fortuna/) · [Repository](https://github.com/Juri-Halveth/fortuna)

### Oberfläche, Daten, Verhalten und Build

- [docs/index.html](https://github.com/Juri-Halveth/fortuna/blob/main/docs/index.html): Oberfläche
- [docs/preview.mjs](https://github.com/Juri-Halveth/fortuna/blob/main/docs/preview.mjs): Szene
- [docs/curiosity.mjs](https://github.com/Juri-Halveth/fortuna/blob/main/docs/curiosity.mjs): Erkunden und Bewegung
- [docs/collective.mjs](https://github.com/Juri-Halveth/fortuna/blob/main/docs/collective.mjs): Berechnung
- [docs/collective-panel.mjs](https://github.com/Juri-Halveth/fortuna/blob/main/docs/collective-panel.mjs): Eingaben und Ergebnisse
- [docs/collective-members.json](https://github.com/Juri-Halveth/fortuna/blob/main/docs/collective-members.json): Profile
- [docs/object.json](https://github.com/Juri-Halveth/fortuna/blob/main/docs/object.json): Fundstück und Herkunft
- [docs/NOTICE.md](https://github.com/Juri-Halveth/fortuna/blob/main/docs/NOTICE.md): Herkunft der übernommenen Komponenten

### Prüfungen

- [docs/curiosity.test.mjs](https://github.com/Juri-Halveth/fortuna/blob/main/docs/curiosity.test.mjs)
- [docs/collective.test.mjs](https://github.com/Juri-Halveth/fortuna/blob/main/docs/collective.test.mjs)

```bash
node --test docs/curiosity.test.mjs docs/collective.test.mjs
```

Die verlinkten Prüfdateien beschreiben den aktuellen Prüfweg. Ein neues Ergebnis entsteht beim Ausführen; das frühere Ergebnis steht im datierten Archiv.

Aktueller Code: `main`. Das [HTML-Seitenregister](https://juri-halveth.github.io/handbuch/#fortuna) führt die erfassten Seiten zu ihrem Zweck, ihrer öffentlichen Adresse und ihrer Quellfassung.

## Scarlet · Erde, Figuren und Quellen

Erde, Figuren und Forschung über ihre eigenen Quellen erkunden.

[Oberfläche](https://juri-halveth.github.io/halveth-scarlet/) · [Repository](https://github.com/Juri-Halveth/halveth-scarlet)

### Oberfläche, Daten, Verhalten und Build

- [index.html](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/index.html): Portal
- [entities/index.html](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/entities/index.html): Figurenverzeichnis
- [assets/universe-data.js](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/assets/universe-data.js): Namen und Profile
- [assets/entity-world.mjs](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/assets/entity-world.mjs): Figurenraum
- [assets/entity-world-motion.mjs](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/assets/entity-world-motion.mjs): Laufwege und Zeitzustand
- [assets/entity-world-scene.mjs](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/assets/entity-world-scene.mjs): Darstellung der Szene
- [tools/build_profiles.mjs](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/tools/build_profiles.mjs): Profilseiten erzeugen
- [tools/build_site.mjs](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/tools/build_site.mjs): Öffentlicher Seitenbau
- [tools/check_links.mjs](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/tools/check_links.mjs): Lokale Verweise prüfen

### Prüfungen

- [tests/entity-roaming.test.cjs](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/tests/entity-roaming.test.cjs)
- [tests/entity-profiles.test.cjs](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/tests/entity-profiles.test.cjs)
- [tests/entity-world.test.cjs](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/tests/entity-world.test.cjs)
- [tests/portal-shell.test.cjs](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/tests/portal-shell.test.cjs)
- [tests/language-controls.test.cjs](https://github.com/Juri-Halveth/halveth-scarlet/blob/main/tests/language-controls.test.cjs)

```bash
node tools/build_site.mjs
node --test tests/*.test.cjs tests/*.test.mjs
```

Die verlinkten Prüfdateien beschreiben den aktuellen Prüfweg. Ein neues Ergebnis entsteht beim Ausführen; das frühere Ergebnis steht im datierten Archiv.

Aktueller Code: `main`. Das [HTML-Seitenregister](https://juri-halveth.github.io/handbuch/#scarlet) führt die erfassten Seiten zu ihrem Zweck, ihrer öffentlichen Adresse und ihrer Quellfassung.

## Lernstudio · Die Lernwelt

Lernwege, Alltag am Computer und praktische Übungen. Der russische Elternmodus hat einen eigenen einfachen Eingang.

[Oberfläche](https://juri-halveth.github.io/lernstudio/) · [Repository](https://github.com/Juri-Halveth/lernstudio)

### Oberfläche, Daten, Verhalten und Build

- [index.html](https://github.com/Juri-Halveth/lernstudio/blob/main/index.html): Einstieg
- [studio.html](https://github.com/Juri-Halveth/lernstudio/blob/main/studio.html): Lernoberfläche
- [curriculum.js](https://github.com/Juri-Halveth/lernstudio/blob/main/curriculum.js): Lektionen
- [app.js](https://github.com/Juri-Halveth/lernstudio/blob/main/app.js): Lektionsanzeige und Navigation
- [lesson-visuals.js](https://github.com/Juri-Halveth/lernstudio/blob/main/lesson-visuals.js): Denkmodelle
- [learning-profile.js](https://github.com/Juri-Halveth/lernstudio/blob/main/learning-profile.js): Lokaler Fortschritt
- [api/space.json](https://github.com/Juri-Halveth/lernstudio/blob/main/api/space.json): Kompakter Inhaltszugang
- [werkzeug/test.js](https://github.com/Juri-Halveth/lernstudio/blob/main/werkzeug/test.js): Liste der Prüfsuiten
- [werkzeug/website-bauen.js](https://github.com/Juri-Halveth/lernstudio/blob/main/werkzeug/website-bauen.js): Build und Export
- [werkzeug/public-files.js](https://github.com/Juri-Halveth/lernstudio/blob/main/werkzeug/public-files.js): freigegebene Dateien
- [eltern/index.html](https://github.com/Juri-Halveth/lernstudio/blob/main/eltern/index.html): Russischer Elternmodus
- [eltern/lessons.js](https://github.com/Juri-Halveth/lernstudio/blob/main/eltern/lessons.js): Alltagsübungen
- [eltern/progress.js](https://github.com/Juri-Halveth/lernstudio/blob/main/eltern/progress.js): Fortschritt und Import
- [eltern/app.js](https://github.com/Juri-Halveth/lernstudio/blob/main/eltern/app.js): Bedienung und Übungssimulation

### Prüfungen

- [werkzeug/test-free-app.js](https://github.com/Juri-Halveth/lernstudio/blob/main/werkzeug/test-free-app.js)
- [werkzeug/test-lesson-visuals.js](https://github.com/Juri-Halveth/lernstudio/blob/main/werkzeug/test-lesson-visuals.js)
- [werkzeug/test-universal-task-help.js](https://github.com/Juri-Halveth/lernstudio/blob/main/werkzeug/test-universal-task-help.js)
- [werkzeug/test-agent-space.cjs](https://github.com/Juri-Halveth/lernstudio/blob/main/werkzeug/test-agent-space.cjs)
- [tests/hub-languages.test.cjs](https://github.com/Juri-Halveth/lernstudio/blob/main/tests/hub-languages.test.cjs)
- [tests/elternmodus.test.cjs](https://github.com/Juri-Halveth/lernstudio/blob/main/tests/elternmodus.test.cjs)

```bash
npm run build
```

Die verlinkten Prüfdateien beschreiben den aktuellen Prüfweg. Ein neues Ergebnis entsteht beim Ausführen; das frühere Ergebnis steht im datierten Archiv.

Aktueller Code: `main`. Das [HTML-Seitenregister](https://juri-halveth.github.io/handbuch/#learning) führt die erfassten Seiten zu ihrem Zweck, ihrer öffentlichen Adresse und ihrer Quellfassung.

## Bash Big Bang · Code ausprobieren

Git Bash, Code und weitere Themen über Übungen verbinden.

[Oberfläche](https://juri-halveth.github.io/mein-lernportal/) · [Repository](https://github.com/Juri-Halveth/mein-lernportal)

### Oberfläche, Daten, Verhalten und Build

- [index.html](https://github.com/Juri-Halveth/mein-lernportal/blob/main/index.html): Einstieg
- [studio.html](https://github.com/Juri-Halveth/mein-lernportal/blob/main/studio.html): Lektionszugang
- [curriculum.js](https://github.com/Juri-Halveth/mein-lernportal/blob/main/curriculum.js): Gemeinsame Lektionen
- [big-bang/index.html](https://github.com/Juri-Halveth/mein-lernportal/blob/main/big-bang/index.html): Bash-Oberfläche
- [big-bang/app.js](https://github.com/Juri-Halveth/mein-lernportal/blob/main/big-bang/app.js): Themen und Beispiele anzeigen
- [big-bang/catalog.json](https://github.com/Juri-Halveth/mein-lernportal/blob/main/big-bang/catalog.json): Brücken und Rezepte
- [package.json](https://github.com/Juri-Halveth/mein-lernportal/blob/main/package.json): Prüfbefehle

### Prüfungen

- [tests/portal.test.cjs](https://github.com/Juri-Halveth/mein-lernportal/blob/main/tests/portal.test.cjs)
- [tests/hub-languages.test.cjs](https://github.com/Juri-Halveth/mein-lernportal/blob/main/tests/hub-languages.test.cjs)
- [tests/big-bang.cjs](https://github.com/Juri-Halveth/mein-lernportal/blob/main/tests/big-bang.cjs)

```bash
npm test
node tests/big-bang.cjs
```

Die verlinkten Prüfdateien beschreiben den aktuellen Prüfweg. Ein neues Ergebnis entsteht beim Ausführen; das frühere Ergebnis steht im datierten Archiv.

Aktueller Code: `main`. Das [HTML-Seitenregister](https://juri-halveth.github.io/handbuch/#bash) führt die erfassten Seiten zu ihrem Zweck, ihrer öffentlichen Adresse und ihrer Quellfassung.

## Normales Greifen und Zusammenhang

Aufnehmen, tragen, drehen, ansehen und ablegen: Derselbe Gegenstand bleibt erhalten. Der Codeversuch führt eine Tasse durch diese Aktionen und bewahrt Material, Umgebung und Zustandsverlauf. Rendering, Handanimation und physikalischer Kontakt bekommen darauf aufbauend ihren eigenen Integrationsschritt.

```bash
node examples/world-grip.mjs
```

[Greifmodell](../examples/world-grip.mjs) · [Modellprüfungen](../examples/world-grip.test.mjs)

## Der ganze Ablauf in Git Bash

HUB.sh verwendet dieses Hub-Repository und die angegebenen Quellordner. Es führt Builds und Tests aus und schreibt eine neue lokale Quittung unter .space-local/. Die Befehle unten holen die öffentlichen Quellen und installieren ihre vorhandenen Prüfabhängigkeiten.

```bash
git clone https://github.com/Juri-Halveth/Juri-Halveth.github.io.git hub
mkdir hub-quellen
git clone https://github.com/Juri-Halveth/fortuna.git hub-quellen/fortuna
git clone https://github.com/Juri-Halveth/halveth-scarlet.git hub-quellen/halveth-scarlet
git clone https://github.com/Juri-Halveth/lernstudio.git hub-quellen/lernstudio
git clone https://github.com/Juri-Halveth/mein-lernportal.git hub-quellen/mein-lernportal
(cd hub && npm ci --ignore-scripts --no-audit --no-fund)
(cd hub-quellen/lernstudio && npm ci --ignore-scripts --no-audit --no-fund)
(cd hub-quellen/mein-lernportal && npm ci --ignore-scripts --no-audit --no-fund)
bash hub/HUB.sh verify hub-quellen
```

[Veröffentlichter Operator](../HUB.sh) · [Quellenregister](../data/handbook.json)

Der Operator schreibt bei jedem Lauf eine neue lokale Quittung. Datierte Archivwerte bleiben bei ihrem Lauf; sie werden als Verlauf erhalten.

## Was der Prüflauf abdeckt

Der aktuelle Quellweg und ein tatsächlich ausgeführter Prüflauf sind verschiedene Stände. Das Archiv nennt die damalige Fassung, den Umfang und die offenen Prüfungen.

Die hier beschriebenen Bereiche sind Webprojekte. OpenMW und Unreal führen ihre eigenen Quellen, Builds und Prüfwege.

[OpenMW / Morrowind](https://github.com/Juri-Halveth/halveth-morrowind-genesis) · [Unreal](https://github.com/Juri-Halveth/halveth-unreal)

[Zur Startseite](https://juri-halveth.github.io/) · [Alle Arbeiten](https://juri-halveth.github.io/arbeiten/)
