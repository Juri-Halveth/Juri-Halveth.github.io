[Handbuch: Was steht wo?](https://juri-halveth.github.io/handbuch/) · [HTML, Code und Prüfungen / HTML, code and checks / HTML, код и проверки](docs/HANDBUCH.md)

<!-- HUB_LANGUAGES_V1 -->
[Original / Deutsch](README.md) · [English](README.en.md) · [Русский](README.ru.md)
<!-- /HUB_LANGUAGES_V1 -->

# HALVETH · Forschung, Gestaltung & Wissen

Die öffentliche Startseite [HALVETH](https://juri-halveth.github.io/) erschließt die Arbeiten nach ihrem Zweck: **Forschung und Sicherheit**, **Grafik und Spiele**, **Lernen**, **Software und Ideen**, **Fähigkeiten und Nachweise**. Zusammengehörige Websites und Codebestände teilen sich einen thematischen Eintrag. Die Lernwelt enthält ihre Website, den Bash-Bereich und die zugehörigen Quellen.

Die leuchtende Bewegungskomposition startet direkt auf der Startseite. Organische Kurven, räumliche Rotation und wandernde Lichtpunkte werden zur Laufzeit gezeichnet. Der kontinuierliche Kompositionsmodus hat keine Titelkarten, Abspielregler oder Zeitleiste. Sichtbarkeit und die Systemeinstellung für reduzierte Bewegung steuern den Rechenaufwand; Text und Links bleiben vollständig zugänglich.

[Alle öffentlichen Arbeiten](https://juri-halveth.github.io/arbeiten/) · [Arbeitsprofil mit Nachweisen](https://juri-halveth.github.io/profil/) · [Elf private Werkzertifikate](https://juri-halveth.github.io/werkzertifikate/)

## Quellen und Arbeitsprofil

`data/portfolio.json` bindet fünf Themen und jede der 17 früheren Projektadressen genau einmal. `data/public-sources.json` dokumentiert den gelesenen öffentlichen Stand vom 05.10.2026: 15 eigene öffentliche Repositories sowie 66 Forschungsdokumente aus der Commitfassung `834352b21a2123137f55fbca22afbfda2be7c7fd`. Jeder gelesene Text besitzt Quelladresse, Git-Blob-ID, Bytezahl und SHA-256. Zwei bereits veröffentlichte Sites-Zugänge bleiben als zugehörige Alternativzugänge auffindbar.

Das Arbeitsprofil ordnet sechs Arbeitsfelder konkreten öffentlichen Artefakten zu. Die historischen HALVETH-Werkzertifikate sind private, KI-gestützt erstellte Werkdokumentationen mit Projekt, Quellstand und Prüfumfang. Sie werden mit ihrer eigenen Nachweisart geführt. Fachliche Arbeitsproben und institutionell ausgestellte Personenzertifikate haben jeweils ihre eigene Herkunft.

## Mit Git Bash arbeiten

Node.js und Git Bash reichen für Aufbau, Prüfung und Vorschau; die Website benötigt keine npm-Pakete.

```bash
bash SPACE.sh build      # Themen, Arbeitsverzeichnis, Profil und Rückwege erzeugen
bash SPACE.sh check      # Navigation, Quellenbindung und Bewegung prüfen
bash SPACE.sh preview    # Lokale Vorschau auf http://127.0.0.1:4187
bash SPACE.sh inventory  # Öffentliche eigene Repository-Metadaten lesen; benötigt gh
bash SPACE.sh motion --out motion-render  # Optionaler CPU-Filmexport
```

Der Build ist deterministisch. Die Landingpage wird aus `templates/index.html` erzeugt; Arbeitsverzeichnis und Profil folgen dem gebundenen Quellenregister. Die GitHub-Prüfung kontrolliert die generierten Seiten und die Tests. Der Vorschauprozess bindet ausschließlich Loopback.

## Navigation und Veröffentlichung

Normale Links führen direkt zu Themen, Arbeiten und Quellen. Frühere `?project=...`-Adressen gehen in den passenden Themenabschnitt über. Die eigenen Unterseiten, Werkzertifikate und sechs aktiven Archiv-/Medieneingänge führen zur Themenübersicht zurück. Eine eigene Fehlerseite erhält den Rückweg auch bei einer unbekannten Adresse. Historische Roharchive behalten ihren überlieferten Inhalt.

GitHub Pages veröffentlicht `main` aus dem Repository-Wurzelverzeichnis. Die verlinkten Lern-, Forschungs-, Software- und Spielprojekte besitzen ihre eigenen Quellen und Entwicklungsstände. Ein offener Spielentwicklungszweig wird auf der Website als Entwicklung bezeichnet.

## Rechte und Herkunft

Eigene Portaltexte, Anordnung und Oberflächencode sind **Source Available** unter [HALVETH PIRL 2.0](LICENSE-HALVETH-PIRL-2.0.md). Die eigenen Bewegungsrenderer und zugeordneten Dateien stehen unter [MIT](motion/LICENSE-MIT.txt). [LICENSES.md](LICENSES.md) ordnet den Umfang und die früheren Freigaben zu. Verlinkte Inhalte behalten ihre eigenen Rechte. Kontakt: **security@halveth.de**.

[Aufbau, Pflege und Quellenumfang](docs/JURIS-SPACE.md)
