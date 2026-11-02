window.HALVETH_CATALOG =
{
  "schema": "halveth.portal.catalog.v1",
  "source_date": "2026-11-02",
  "source_kind": "2026-11-01 connected GitHub inventory, supplemented by 2026-11-02 source-bound README/code review; editorial navigation, not runtime verification",
  "inventory_scope": "The 18 public entries come from the earlier connected inventory; account-wide completeness was not rechecked on 2026-11-02. No private names exported.",
  "categories": [
    {
      "id": "software",
      "label": "Software & Werkzeuge",
      "short": "SOFTWARE",
      "description": "Lokale Werkzeuge für Quellen, Zugangsdaten und Arbeitsabläufe."
    },
    {
      "id": "security",
      "label": "Sicherheit & Belege",
      "short": "SICHERHEIT",
      "description": "Quellcode, Gegenproben und nachvollziehbare Prüfungen."
    },
    {
      "id": "models",
      "label": "Modelle & Visualisierung",
      "short": "MODELLE",
      "description": "Zustände, Perspektiven, Zeit und Unterschiede selbst untersuchen."
    },
    {
      "id": "worlds",
      "label": "Welten & Interaktion",
      "short": "WELTEN",
      "description": "Spielwelten, Szenen und interaktive Experimente."
    },
    {
      "id": "learning",
      "label": "Lernen & Wissen",
      "short": "LERNEN",
      "description": "Digitale Grundlagen, Übungen und selbstständige Lernpfade."
    },
    {
      "id": "society",
      "label": "Gesellschaft & Quellen",
      "short": "GESELLSCHAFT",
      "description": "Öffentliche Quellenarbeit und ausdrücklich getrennte Reformvorschläge."
    }
  ],
  "projects": [
    {
      "id": "halveth-scarlet",
      "repository": "Juri-Halveth/halveth-scarlet",
      "title": "SCARLET",
      "tagline": "Zustandsledger, Herkunft und endliche Zellmodelle.",
      "description": "GStar bindet Textvarianten über IDs, Digests und Elternbezüge mit Snapshot, Replay und JSON-Export. GStarLiving ist ein getrenntes endliches Zellmodell.",
      "categories": [
        "models",
        "worlds"
      ],
      "kind": "Browsermodell",
      "url": "https://juri-halveth.github.io/halveth-scarlet/",
      "action": "Selbst ausprobieren",
      "evidence": "README gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": true,
      "source_url": "https://github.com/Juri-Halveth/halveth-scarlet/tree/9f706b9f6bba255f30cde703f851ba80cd64d9bc",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "research",
        "title": {
          "de": "Zustände, Zeit und Varianten",
          "en": "States, time and variants",
          "ru": "Состояния, время и варианты"
        },
        "summary": {
          "de": "Text setzen, eine Variante ableiten, Zustände beobachten und als JSON mitnehmen. Lichtkörper zeigen die Entwicklung des lokalen Modells.",
          "en": "Set text, derive a variant, observe states and take the result as JSON. Light bodies show how the local model evolves.",
          "ru": "Задайте текст, создайте вариант, наблюдайте состояния и сохраните результат в JSON. Световые тела показывают развитие локальной модели."
        },
        "action": {
          "de": "Zustandsmodell öffnen",
          "en": "Open state model",
          "ru": "Открыть модель состояний"
        },
        "status": "BROWSER_ENTRY",
        "revision": "9f706b9f6bba255f30cde703f851ba80cd64d9bc",
        "editorial_state": "CURRENT",
        "revision_observed_at": "2026-10-27"
      }
    },
    {
      "id": "lucinet-seedspace",
      "repository": "Juri-Halveth/lucinet-seedspace",
      "title": "LUCINET / NOVA",
      "tagline": "Frühere Arbeit quellgebunden fortsetzen.",
      "description": "Die lokale Python-CLI indiziert Quellspans und Revisionen, erhält Korrekturen und schreibt prüfbare Ergebnis- und Fortsetzungsbelege.",
      "categories": [
        "software",
        "security"
      ],
      "kind": "Lokales Python-Werkzeug",
      "url": "https://github.com/Juri-Halveth/lucinet-seedspace",
      "action": "Anleitung öffnen",
      "evidence": "README gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": true,
      "source_url": "https://github.com/Juri-Halveth/lucinet-seedspace/tree/6d0e91c056caee46e2ca2d4faaf7bcdd1975dddc",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "software",
        "title": {
          "de": "NOVA · frühere Arbeit wiederfinden",
          "en": "NOVA · recover earlier work",
          "ru": "NOVA · находить прежние результаты"
        },
        "summary": {
          "de": "Notizen und Code lokal durchsuchen, Korrekturen erhalten und mit belegtem nächsten Schritt weiterarbeiten.",
          "en": "Search local notes and code, preserve corrections and continue with a recorded next step.",
          "ru": "Ищите в локальных заметках и коде, сохраняйте исправления и продолжайте с записанным следующим шагом."
        },
        "action": {
          "de": "Anleitung & Offline-Demo",
          "en": "Guide & offline demo",
          "ru": "Руководство и офлайн-демо"
        },
        "status": "SOURCE_AND_GUIDE",
        "revision": "6d0e91c056caee46e2ca2d4faaf7bcdd1975dddc",
        "editorial_state": "CURRENT",
        "revision_observed_at": "2026-10-27"
      }
    },
    {
      "id": "halveth-forschungslabor",
      "repository": "Juri-Halveth/halveth-forschungslabor",
      "title": "FORSCHUNGSLABOR",
      "tagline": "Ausführbare Modelle. Sichtbare Gegenproben.",
      "description": "JavaScript- und Python-Experimente zu Projektionen, Optik, Ereignissen und Quellenpaketen mit eigenem Start- und Prüfweg.",
      "categories": [
        "models",
        "security",
        "software"
      ],
      "kind": "Modellsammlung",
      "url": "https://juri-halveth.github.io/halveth-forschungslabor/wissen/",
      "action": "Werkzeuge entdecken",
      "evidence": "Portfolioquelle gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": true,
      "source_url": "https://github.com/Juri-Halveth/halveth-forschungslabor/tree/07417d3cdadda426c2b51cc98bcbae72d7b5d651",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "research",
        "title": {
          "de": "Modelle und Gegenproben ausführen",
          "en": "Run models and counterexamples",
          "ru": "Выполнять модели и контрпримеры"
        },
        "summary": {
          "de": "Lokale JavaScript- und Python-Modelle: Perspektiven, Quellenpakete, Optik, Ereignisse und Regeln. Mit eigenem ausführbarem Prüfweg.",
          "en": "Local JavaScript and Python models for perspective, source packets, optics, events and rules, with an executable test path.",
          "ru": "Локальные модели JavaScript и Python: перспективы, пакеты источников, оптика, события и правила. С исполняемыми проверками."
        },
        "action": {
          "de": "Werkzeugauswahl öffnen",
          "en": "Open tool selector",
          "ru": "Открыть выбор инструментов"
        },
        "status": "BROWSER_ENTRY",
        "revision": "07417d3cdadda426c2b51cc98bcbae72d7b5d651",
        "editorial_state": "CURRENT",
        "revision_observed_at": "2026-10-27"
      }
    },
    {
      "id": "halveth-tresor",
      "repository": "Juri-Halveth/halveth-tresor",
      "title": "TRESOR",
      "tagline": "Ein verschlüsselter Vault für eigene Zugangsdaten.",
      "description": "Windows-Werkzeug mit scrypt, AES-256-GCM, lokalem Dateispeicher und getrenntem Wiederherstellungsschlüssel; v1.8.0 ist nicht codesigniert.",
      "categories": [
        "software",
        "security"
      ],
      "kind": "Desktopprojekt",
      "url": "https://github.com/Juri-Halveth/halveth-tresor/releases/tag/v1.8.0",
      "action": "Projekt ansehen",
      "evidence": "Profil- und Portfolioquelle gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": true,
      "source_url": "https://github.com/Juri-Halveth/halveth-tresor/tree/e1ca9830e84099f0e4a9a4bfdede919a5ab0eee6",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "software",
        "title": {
          "de": "Zugangsdaten lokal verwalten",
          "en": "Manage credentials locally",
          "ru": "Локально управлять учётными данными"
        },
        "summary": {
          "de": "Passwörter, Schlüssel und Verbindungsdaten in einer verschlüsselten lokalen Datei verwalten. Die Windows-EXE v1.8.0 ist derzeit nicht code-signiert.",
          "en": "Manage passwords, keys and connection details in an encrypted local file. The Windows executable v1.8.0 is currently not code signed.",
          "ru": "Храните пароли, ключи и параметры подключения в зашифрованном локальном файле. Исполняемый файл Windows v1.8.0 сейчас не подписан кодовой подписью."
        },
        "action": {
          "de": "Windows-Release v1.8.0",
          "en": "Windows release v1.8.0",
          "ru": "Выпуск для Windows v1.8.0"
        },
        "status": "RELEASE_ENTRY",
        "revision": "e1ca9830e84099f0e4a9a4bfdede919a5ab0eee6",
        "editorial_state": "CURRENT",
        "revision_observed_at": "2026-10-27",
        "release_tag": "v1.8.0"
      }
    },
    {
      "id": "mein-lernportal",
      "repository": "Juri-Halveth/mein-lernportal",
      "title": "LERNPORTAL",
      "tagline": "Lernen und üben ohne Pflichtkonto.",
      "description": "Ein Browserkatalog mit Lektionen, Übungen, Suche und lokalem Fortschritt zu digitalen Grundlagen, Programmierung und Mathematik.",
      "categories": [
        "learning"
      ],
      "kind": "Webanwendung",
      "url": "https://juri-halveth.github.io/mein-lernportal/",
      "action": "Lernen starten",
      "evidence": "Portfolioquelle gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": true,
      "source_url": "https://github.com/Juri-Halveth/mein-lernportal/tree/8ff9c2fa3e4fbf3a5795b06d1d9c77819b592292",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "learning",
        "title": {
          "de": "Digitale Grundlagen lernen",
          "en": "Learn digital foundations",
          "ru": "Изучать цифровые основы"
        },
        "summary": {
          "de": "Ein Lernkatalog mit Übungen zu digitalen Grundlagen, Programmierung und Mathematik. Ohne Pflichtkonto lesbar.",
          "en": "A lesson catalog with exercises on digital skills, programming and mathematics. Browse without a required account.",
          "ru": "Каталог уроков и упражнений по цифровым навыкам, программированию и математике. Чтение без обязательного аккаунта."
        },
        "action": {
          "de": "Im Browser lernen",
          "en": "Learn in the browser",
          "ru": "Учиться в браузере"
        },
        "status": "BROWSER_ENTRY",
        "revision": "8ff9c2fa3e4fbf3a5795b06d1d9c77819b592292",
        "editorial_state": "CURRENT",
        "revision_observed_at": "2026-10-27"
      }
    },
    {
      "id": "halveth-field-difference-lab",
      "repository": "Juri-Halveth/halveth-field-difference-lab",
      "title": "FIELD DIFFERENCE",
      "tagline": "Gleicher Start. Andere Regel. Messbarer Modellunterschied.",
      "description": "Drei Browserexperimente zu Feldbewegung, analytischem Übergang und doppelten Softwareschlüsseln trennen Eingabe, Regel und Ergebnis.",
      "categories": [
        "models"
      ],
      "kind": "Visuelles Modell",
      "url": "https://juri-halveth.github.io/halveth-field-difference-lab/",
      "action": "Modell öffnen",
      "evidence": "README gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": true,
      "source_url": "https://github.com/Juri-Halveth/halveth-field-difference-lab/tree/572734742951819993b10d89b22591951a49dbc8",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "research",
        "title": {
          "de": "Bewegung und Zustandsunterschiede",
          "en": "Motion and state differences",
          "ru": "Движение и различия состояний"
        },
        "summary": {
          "de": "Gleiche Ausgangslage, andere Regel: Bewegungen nebeneinander vergleichen und Unterschiede im Modell erklären.",
          "en": "Same initial state, different rule: compare motion side by side and explain model differences.",
          "ru": "Одинаковое начало, разные правила: сравните движение и объясните различия модели."
        },
        "action": {
          "de": "Modell ausprobieren",
          "en": "Try the model",
          "ru": "Открыть модель"
        },
        "status": "BROWSER_ENTRY",
        "revision": "572734742951819993b10d89b22591951a49dbc8",
        "editorial_state": "CURRENT",
        "revision_observed_at": "2026-10-27"
      }
    },
    {
      "id": "c-drohne-red-room",
      "repository": "Juri-Halveth/c-drohne-red-room",
      "title": "C-DROHNE / RED ROOM",
      "tagline": "Ein fiktiver Fall mit prüfbarer Quellenkette.",
      "description": "Das ausführbare Falllabor trennt Meldung, Kopie, Zeitpunkt und Gegenprobe; die Nightlight-3D-Szene zeigt den räumlichen Kontext.",
      "categories": [
        "models",
        "security",
        "worlds"
      ],
      "kind": "Synthetischer Prototyp",
      "url": "https://juri-halveth.github.io/c-drohne-red-room/#falllabor",
      "action": "Falllabor öffnen",
      "evidence": "README gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": false,
      "source_url": "https://github.com/Juri-Halveth/c-drohne-red-room/tree/f0b072571ccb1a7894a32b1ba03c9a8620995352",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "worlds",
        "title": {
          "de": "Schwarmkonzepte und Schnittstellen erklären",
          "en": "Explain swarm concepts and interfaces",
          "ru": "Объяснять концепции роёв и интерфейсы"
        },
        "summary": {
          "de": "Browseroberfläche, Visualisierung und Konzeptmaterial für Drohnen- und Schwarmideen. Schwerpunkt: Darstellung und Systementwurf.",
          "en": "A browser interface, visualisation and concept material for drone and swarm ideas. Focus: presentation and system design.",
          "ru": "Браузерный интерфейс, визуализация и концептуальные материалы для идей дронов и роёв. Акцент: представление и проектирование системы."
        },
        "action": {
          "de": "RED-ROOM-Szene öffnen",
          "en": "Open RED ROOM scene",
          "ru": "Открыть сцену RED ROOM"
        },
        "status": "BROWSER_ENTRY",
        "revision": "f0b072571ccb1a7894a32b1ba03c9a8620995352",
        "editorial_state": "CURRENT",
        "revision_observed_at": "2026-10-27"
      }
    },
    {
      "id": "halveth-realms",
      "repository": "Juri-Halveth/halveth-realms",
      "title": "HALVETH REALMS",
      "tagline": "Eine erzeugte Welt mit speicherbarer Geschichte.",
      "description": "Die lokale Electron-/WebGL-Vorschau verbindet Weltseed, Begegnungen und gespeicherte Veränderungen; sie ist ein Spielprototyp.",
      "categories": [
        "worlds"
      ],
      "kind": "Spielbare Desktop-Vorschau",
      "url": "https://github.com/Juri-Halveth/halveth-realms/releases/tag/v0.2.0",
      "action": "Windows-Vorschau v0.2.0 öffnen",
      "evidence": "README gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": false,
      "source_url": "https://github.com/Juri-Halveth/halveth-realms/blob/main/README.md",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "worlds",
        "title": {
          "de": "Spielwelten und Regeln erkunden",
          "en": "Explore game worlds and rules",
          "ru": "Исследовать игровые миры и правила"
        },
        "summary": {
          "de": "Ein Spielprototyp mit dokumentierten Weltregeln und lokalem Startweg.",
          "en": "A game prototype with documented world rules and a local start guide.",
          "ru": "Игровой прототип с описанными правилами мира и локальным запуском."
        },
        "action": {
          "de": "Code & Anleitung",
          "en": "Code & guide",
          "ru": "Код и руководство"
        },
        "status": "RELEASE_ENTRY",
        "revision": null,
        "editorial_state": "WITHDRAWN_FROM_PORTFOLIO",
        "revision_observed_at": null,
        "release_tag": "v0.2.0"
      }
    },
    {
      "id": "halveth-cannabis-reform-forschung",
      "repository": "Juri-Halveth/halveth-cannabis-reform-forschung",
      "title": "QUELLEN & REFORM",
      "tagline": "Quellen, Messplan und Reform getrennt prüfen.",
      "description": "Die öffentliche Arbeit trennt Studien zu Cannabis und Verkehr, einen technischen Messplan und politische Vorschläge; eigene Humanmessungen sind nicht belegt.",
      "categories": [
        "society"
      ],
      "kind": "Quellen- und Reformprojekt",
      "url": "https://juri-halveth.github.io/halveth-cannabis-reform-forschung/",
      "action": "Forschungsseite öffnen",
      "evidence": "README gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": false,
      "source_url": "https://github.com/Juri-Halveth/halveth-cannabis-reform-forschung/blob/main/README.md",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "research",
        "title": {
          "de": "Cannabisreform mit Quellen und Messplan",
          "en": "Cannabis reform with sources and a measurement plan",
          "ru": "Реформа каннабиса: источники и план измерений"
        },
        "summary": {
          "de": "Quellenbasierte Cannabisreform und ein dokumentierter Messplan.",
          "en": "Source-based cannabis reform research and a documented measurement plan.",
          "ru": "Исследование реформы каннабиса с источниками и планом измерений."
        },
        "action": {
          "de": "Quellenübersicht öffnen",
          "en": "Open source overview",
          "ru": "Открыть обзор источников"
        },
        "status": "BROWSER_ENTRY",
        "revision": null,
        "editorial_state": "CURRENT",
        "revision_observed_at": null
      }
    },
    {
      "id": "lernstudio",
      "repository": "Juri-Halveth/lernstudio",
      "title": "LERNSTUDIO",
      "tagline": "Lernpfade für Menschen und lesbare Daten für Agenten.",
      "description": "Interaktive Missionen, browserlokaler Fortschritt und ein gehashter, adressierbarer JSON-Lernkatalog verbinden Lernen und maschinenlesbare Orientierung.",
      "categories": [
        "learning"
      ],
      "kind": "Webanwendung",
      "url": "https://juri-halveth.github.io/lernstudio/",
      "action": "Lernpfade öffnen",
      "evidence": "Portfolioquelle gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": false,
      "source_url": "https://github.com/Juri-Halveth/lernstudio/tree/9309f69883e9ae66290829722012deda5ed982c9",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "learning",
        "title": {
          "de": "Lernpfade, Übungen und Fortschritt",
          "en": "Learning paths, exercises and progress",
          "ru": "Учебные маршруты, упражнения и прогресс"
        },
        "summary": {
          "de": "Lernkarte, Spielmissionen und Fortschrittsansicht für selbstständiges Lernen.",
          "en": "A learning map, small missions and progress views for self-directed learning.",
          "ru": "Учебная карта, игровые задания и отображение прогресса для самостоятельного обучения."
        },
        "action": {
          "de": "Lernstudio öffnen",
          "en": "Open learning studio",
          "ru": "Открыть учебную студию"
        },
        "status": "BROWSER_ENTRY",
        "revision": "9309f69883e9ae66290829722012deda5ed982c9",
        "editorial_state": "CURRENT",
        "revision_observed_at": "2026-10-27"
      }
    },
    {
      "id": "fortuna",
      "repository": "Juri-Halveth/fortuna",
      "title": "FORTUNA",
      "tagline": "Glück als berechenbares Modell und Integrationsziel.",
      "description": "Öffentlich: deterministischer Vergleich gewichteter Optionen. Getrennt lokal: Bernoulli-Ziehungen bis 1.000.000 pro Lauf. Autorisierte Serveradapter sind ein Ziel, keine veröffentlichte Funktion.",
      "categories": [
        "software",
        "models"
      ],
      "kind": "Browserprototyp",
      "url": "https://juri-halveth.github.io/fortuna/",
      "action": "Vergleich öffnen",
      "evidence": "README und Quellcode gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": false,
      "source_url": "https://github.com/Juri-Halveth/fortuna/tree/4bacf76726687ba2fa9c24d1da638da8fa130e10",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "software",
        "title": {
          "de": "Glücksmodell und Entscheidungsanalyse",
          "en": "Probability model and decision analysis",
          "ru": "Модель вероятности и анализ решений"
        },
        "summary": {
          "de": "Die öffentliche Browserfassung bewertet eigene Optionen deterministisch. Ein getrenntes lokales Wahrscheinlichkeitslabor kann Ziehungsserien ausführen; Serveradapter sind ein Entwicklungsziel.",
          "en": "The public browser version ranks entered options deterministically. A separate local probability lab can run draws; server adapters remain a development goal.",
          "ru": "Публичная браузерная версия детерминированно сравнивает варианты. Отдельная локальная лаборатория выполняет серии случайных проб; серверные адаптеры пока лишь цель разработки."
        },
        "action": {
          "de": "Direkt öffnen",
          "en": "Open directly",
          "ru": "Открыть"
        },
        "status": "BROWSER_ENTRY",
        "revision": "4bacf76726687ba2fa9c24d1da638da8fa130e10",
        "editorial_state": "CURRENT",
        "revision_observed_at": "2026-11-02"
      }
    },
    {
      "id": "halveth-project0-keeper",
      "repository": "Juri-Halveth/halveth-project0-keeper",
      "title": "PROJECT0 KEEPER",
      "tagline": "Lokale Zustände und Entscheidungen nachvollziehen.",
      "description": "PowerShell-Werkzeuge und Zustandsdateien halten Beobachtungen, Kontinuität und nächste Prüfungen für ASTER, RACHEL und SHELLA auseinander.",
      "categories": [
        "software"
      ],
      "kind": "Experimenteller Werkzeugzweig",
      "url": "https://github.com/Juri-Halveth/halveth-project0-keeper",
      "action": "Quellcode ansehen",
      "evidence": "Portfolioquelle gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": false,
      "source_url": "https://github.com/Juri-Halveth/halveth-project0-keeper/tree/f4349d013efb7105e2875784a0c7c16d2026e3da",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "software",
        "title": {
          "de": "Lokale Projekte steuern",
          "en": "Coordinate local projects",
          "ru": "Управлять локальными проектами"
        },
        "summary": {
          "de": "PowerShell-Werkzeuge und Zustandsdateien für experimentelle lokale Auftrags- und Projektsteuerung.",
          "en": "PowerShell tools and state files for experimental local task and project coordination.",
          "ru": "Инструменты PowerShell и файлы состояния для экспериментального локального управления задачами и проектами."
        },
        "action": {
          "de": "Code & Anleitung",
          "en": "Code & guide",
          "ru": "Код и руководство"
        },
        "status": "SOURCE_AND_GUIDE",
        "revision": "f4349d013efb7105e2875784a0c7c16d2026e3da",
        "editorial_state": "CURRENT",
        "revision_observed_at": "2026-10-27"
      }
    },
    {
      "id": "halveth-morrowind-genesis",
      "repository": "Juri-Halveth/halveth-morrowind-genesis",
      "title": "MORROWIND GENESIS",
      "tagline": "OpenMW erweitert: Dialoge, Gedächtnis und Weltwerkzeuge.",
      "description": "Die OpenMW-0.51-Erweiterung verbindet NPC-Dialoge, lokales Gedächtnis, Wissen, Alchemie und Weltleben mit einem dokumentierten Startweg.",
      "categories": [
        "worlds"
      ],
      "kind": "OpenMW-Erweiterung",
      "url": "https://github.com/Juri-Halveth/halveth-morrowind-genesis",
      "action": "Setup und Code öffnen",
      "evidence": "README gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": false,
      "source_url": "https://github.com/Juri-Halveth/halveth-morrowind-genesis/blob/main/README.md",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "worlds",
        "title": {
          "de": "Eine OpenMW-Welt gestalten",
          "en": "Build an OpenMW world",
          "ru": "Создать мир OpenMW"
        },
        "summary": {
          "de": "Modding- und Weltbauarbeit für OpenMW; Quellbestand und Startweg stehen im Repository.",
          "en": "Modding and world-building work for OpenMW; source and setup guide are in the repository.",
          "ru": "Моддинг и создание мира для OpenMW; исходники и запуск описаны в репозитории."
        },
        "action": {
          "de": "Code & Anleitung",
          "en": "Code & guide",
          "ru": "Код и руководство"
        },
        "status": "SOURCE_AND_GUIDE",
        "revision": null,
        "editorial_state": "WITHDRAWN_FROM_PORTFOLIO",
        "revision_observed_at": null
      }
    },
    {
      "id": "halveth-unreal",
      "repository": "Juri-Halveth/halveth-unreal",
      "title": "HALVETH UNREAL",
      "tagline": "Native Portalwelt mit Seed, Handwerk und Speicherstand.",
      "description": "Unreal C++ erzeugt vier Portalräume mit lokalen Weltregeln und einem Wissens- und Handwerkssystem. v0.1.0 ist eine Windows-Vorschau; 0.2 bleibt Validierungsstand.",
      "categories": [
        "worlds"
      ],
      "kind": "Unreal-Prototyp",
      "url": "https://github.com/Juri-Halveth/halveth-unreal/releases/tag/v0.1.0",
      "action": "Windows-Vorschau v0.1.0 öffnen",
      "evidence": "README gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": false,
      "source_url": "https://github.com/Juri-Halveth/halveth-unreal/blob/main/README.md",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "worlds",
        "title": {
          "de": "Interaktive 3D-Anwendungen entwickeln",
          "en": "Build interactive 3D applications",
          "ru": "Разрабатывать интерактивные 3D-приложения"
        },
        "summary": {
          "de": "Unreal-Prototypen und Entwicklungsnotizen; nutzbarer Stand und Voraussetzungen stehen im Repository.",
          "en": "Unreal prototypes and development notes; the repository identifies the current scope and prerequisites.",
          "ru": "Прототипы Unreal и заметки о разработке; текущий объём и требования указаны в репозитории."
        },
        "action": {
          "de": "Code & Anleitung",
          "en": "Code & guide",
          "ru": "Код и руководство"
        },
        "status": "RELEASE_ENTRY",
        "revision": null,
        "editorial_state": "WITHDRAWN_FROM_PORTFOLIO",
        "revision_observed_at": null,
        "release_tag": "v0.1.0"
      }
    },
    {
      "id": "halveth-tron-security-lab",
      "repository": "Juri-Halveth/halveth-tron-security-lab",
      "title": "TRON SECURITY LAB",
      "tagline": "Quellfork und Offline-Modell sauber trennen.",
      "description": "Der java-tron-Fork bewahrt Quellarbeit; ein Quorumschnittmengen-Modell liegt nur im offenen Entwurf PR #1. Kein Produktions- oder Schwachstellenbeleg.",
      "categories": [
        "security"
      ],
      "kind": "Forschungsfork mit PR-Entwurf",
      "url": "https://github.com/Juri-Halveth/halveth-tron-security-lab/pull/1",
      "action": "Repository ansehen",
      "evidence": "Fork-README und PR-Entwurf gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": false,
      "source_url": "https://github.com/Juri-Halveth/halveth-tron-security-lab/tree/0d25fb9945d01629c85beeb0768e102eb247c8d1",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "research",
        "title": {
          "de": "Quorum und Verfügbarkeit vergleichen",
          "en": "Compare quorum and availability",
          "ru": "Сравнивать кворум и доступность"
        },
        "summary": {
          "de": "Offline-Modell für Quorumschnittmenge und Verfügbarkeit im Entwurf PR #1; der Standardbranch enthält dieses Modell nicht.",
          "en": "Offline quorum intersection and availability model in draft PR #1; this model is not on the default branch.",
          "ru": "Офлайн-модель пересечения кворумов и доступности в черновом PR #1; в основной ветке этой модели нет."
        },
        "action": {
          "de": "Forschungs-PR #1 öffnen",
          "en": "Open research PR #1",
          "ru": "Открыть исследовательский PR #1"
        },
        "status": "PR_ENTRY",
        "revision": "0d25fb9945d01629c85beeb0768e102eb247c8d1",
        "editorial_state": "CURRENT",
        "revision_observed_at": "2026-10-27",
        "pr_number": 1
      }
    },
    {
      "id": "leviathan-wallet-portal",
      "repository": "Juri-Halveth/leviathan-wallet-portal",
      "title": "LEVIATHAN PORTAL",
      "tagline": "Öffentliche Positionen lesen. Aktionen bewusst freigeben.",
      "description": "Der Browser-Vault liest unterstützte Cosmos- und EVM-Adressen. Simulation, Vorprüfung, Signatur und Versand sind getrennte nutzerinitiierte Schritte.",
      "categories": [
        "software"
      ],
      "kind": "Browser-Vault",
      "url": "https://juri-halveth.github.io/leviathan-wallet-portal/",
      "action": "Vault öffnen",
      "evidence": "README gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": false,
      "source_url": "https://github.com/Juri-Halveth/leviathan-wallet-portal/blob/main/README.md",
      "site": {
        "entry_type": "PROJECT",
        "primary_category": "software",
        "title": {
          "de": "Eine Wallet-Oberfläche prüfen",
          "en": "Inspect a wallet interface",
          "ru": "Изучить интерфейс кошелька"
        },
        "summary": {
          "de": "Öffentliche Adressen ohne Wallet ansehen oder unterstützte Wallets verbinden. Senden benötigt gesonderte Wallet-Freigabe und kann Netzwerkgebühren auslösen; die Abdeckung bleibt begrenzt.",
          "en": "View public addresses without a wallet or connect supported wallets. Sending needs separate wallet approval and may incur network fees; coverage remains limited.",
          "ru": "Просматривайте публичные адреса без кошелька или подключайте поддерживаемые кошельки. Для отправки нужно отдельное подтверждение в кошельке, возможны сетевые комиссии; охват ограничен."
        },
        "action": {
          "de": "Browser-Vault öffnen",
          "en": "Open browser vault",
          "ru": "Открыть браузерный Vault"
        },
        "status": "BROWSER_ENTRY",
        "revision": null,
        "editorial_state": "CURRENT",
        "revision_observed_at": null
      }
    },
    {
      "id": "Juri-Halveth.github.io",
      "repository": "Juri-Halveth/Juri-Halveth.github.io",
      "title": "WEB-EINGANG",
      "tagline": "Anwendungen, Quellcode und Belege verbinden.",
      "description": "Das mehrsprachige Portfolio führt zu 13 aktuellen Projektkarten, zwei Fallstudien und dem Starship-Katalog mit 18 öffentlichen Einstiegen.",
      "categories": [
        "software"
      ],
      "kind": "Bestehende Website",
      "url": "https://juri-halveth.github.io/",
      "action": "Website öffnen",
      "evidence": "README gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": false,
      "source_url": "https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/README.md",
      "site": {
        "entry_type": "META",
        "primary_category": "software",
        "title": {
          "de": "Bedienbare Projekte und Quellnachweise",
          "en": "Usable projects and source evidence",
          "ru": "Доступные приложения и подтверждённые источники"
        },
        "summary": {
          "de": "Dieses Portfolio mit Demos, Quellen und Arbeitsproben.",
          "en": "This portfolio with demos, source and work samples.",
          "ru": "Это портфолио с демонстрациями, кодом и примерами работы."
        },
        "action": {
          "de": "Direkt öffnen",
          "en": "Open directly",
          "ru": "Открыть"
        },
        "status": "BROWSER_ENTRY",
        "revision": null,
        "editorial_state": "CURRENT",
        "revision_observed_at": null
      }
    },
    {
      "id": "Juri-Halveth",
      "repository": "Juri-Halveth/Juri-Halveth",
      "title": "PROFILQUELLE",
      "tagline": "Mensch, Projekte und erster Einstieg am selben Ort.",
      "description": "Die README auf der GitHub-Profilseite ist ein eigener öffentlicher Einstieg: Sie ordnet Juri und HALVETH zu und führt direkt zu Projektbeispielen, Fallstudien und dem Starship Lab.",
      "categories": [
        "software"
      ],
      "kind": "Profilrepository",
      "url": "https://github.com/Juri-Halveth/Juri-Halveth",
      "action": "Profilquelle ansehen",
      "evidence": "README gelesen",
      "reviewed": true,
      "visibility": "public",
      "featured": false,
      "source_url": "https://github.com/Juri-Halveth/Juri-Halveth/blob/main/README.md",
      "site": {
        "entry_type": "META",
        "primary_category": "software",
        "title": {
          "de": "Arbeitsproben und technische Fähigkeiten",
          "en": "Work samples and technical skills",
          "ru": "Примеры работы и технические навыки"
        },
        "summary": {
          "de": "Das öffentliche Profil mit ausgewählten Szenen und Arbeitsproben.",
          "en": "The public profile with selected scenes and work samples.",
          "ru": "Публичный профиль с избранными сценами и примерами работы."
        },
        "action": {
          "de": "Code & Anleitung",
          "en": "Code & guide",
          "ru": "Код и руководство"
        },
        "status": "SOURCE_AND_GUIDE",
        "revision": null,
        "editorial_state": "CURRENT",
        "revision_observed_at": null
      }
    }
  ],
  "home_featured_ids": [
    "mein-lernportal",
    "lucinet-seedspace",
    "halveth-tresor",
    "halveth-field-difference-lab"
  ]
};
