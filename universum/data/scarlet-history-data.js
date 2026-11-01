window.HALVETH_SCARLET_HISTORY = {
  "schema": "halveth.public-project-history.v1",
  "projectId": "halveth-scarlet",
  "repository": "Juri-Halveth/halveth-scarlet",
  "observedHead": "6913b81d3e2414b20149406cb3e2fe9bb314adf4",
  "retrievedAt": "2026-11-01T19:46:05Z",
  "coverage": {
    "selection": "SELECTED_PUBLIC_COMMITS_NOT_COMPLETE_HISTORY",
    "source": "GITHUB_COMMIT_AND_FILE_DIFF",
    "notes": "Vier ausgewählte öffentliche Merge-Commits aus 2026-10-16 bis 2026-10-24. GitHub-Compare bestätigte jeden als Vorfahren des beobachteten main-HEAD. Die Auswahl inventarisiert weder die gesamte Git-Geschichte noch alle Dateien oder Veröffentlichungen."
  },
  "events": [
    {
      "id": "SCARLET-RED-ROOM-20261016",
      "commit": "f6a19c72e34fd6228230750ebc1cd48fefe6a099",
      "authorAt": "2026-10-16T23:46:13Z",
      "committerAt": "2026-10-16T23:46:13Z",
      "eventTime": "2026-10-16T23:46:13Z",
      "eventTimeBasis": "COMMITTER_TIMESTAMP",
      "recordedAt": "2026-11-01T19:46:05Z",
      "title": "Fiktionales Red-Room-Schwarmmodell",
      "summary": "Dieser Merge fügte ein geschlossenes T±-Szenarienmodell, die zugehörige Browseransicht und Tests hinzu. Der Quelltext trennt erhaltene Daten von laufenden Kopien und bezeichnet Rollen, Mengen und Laufzeit als fiktionales Modell.",
      "url": "https://github.com/Juri-Halveth/halveth-scarlet/commit/f6a19c72e34fd6228230750ebc1cd48fefe6a099",
      "evidence": [
        {
          "path": "assets/red-room-swarm-model.mjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-scarlet/blob/f6a19c72e34fd6228230750ebc1cd48fefe6a099/assets/red-room-swarm-model.mjs",
          "note": "Exportiert TICKS, SCENARIOS, frameAt und compareScenarios; der Dateikopf begrenzt das Modell auf Fiktion ohne Netzwerk oder Identitätssuche."
        },
        {
          "path": "tests/red-room-swarm-model.test.cjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-scarlet/blob/f6a19c72e34fd6228230750ebc1cd48fefe6a099/tests/red-room-swarm-model.test.cjs",
          "note": "Fügt Gegenproben für getrennte Menschen-, Daten- und Laufzeitzustände hinzu; der Commit belegt Testquelltext, keinen hier ausgeführten Testlauf."
        }
      ],
      "claimCeiling": "PUBLIC_REPOSITORY_COMMIT_AND_CHANGED_FILES_ONLY"
    },
    {
      "id": "SCARLET-ENTITY-ATLAS-20261023",
      "commit": "e897868af97cf6f7476918164df688a7de3a29cc",
      "authorAt": "2026-10-23T20:28:27Z",
      "committerAt": "2026-10-23T20:28:27Z",
      "eventTime": "2026-10-23T20:28:27Z",
      "eventTimeBasis": "COMMITTER_TIMESTAMP",
      "recordedAt": "2026-11-01T19:46:05Z",
      "title": "Entitätssignaturen und Branch-Kontinuität",
      "summary": "Dieser Merge fügte sechs ausdrücklich entworfene Signaturkoordinaten sowie ein begrenztes Modell für FORK, Checkpoint und Restore hinzu. Die Signaturen sind Designwerte, keine gemessenen Persönlichkeits- oder Autonomieeigenschaften.",
      "url": "https://github.com/Juri-Halveth/halveth-scarlet/commit/e897868af97cf6f7476918164df688a7de3a29cc",
      "evidence": [
        {
          "path": "assets/entity-signatures.mjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-scarlet/blob/e897868af97cf6f7476918164df688a7de3a29cc/assets/entity-signatures.mjs",
          "note": "Definiert AXES und FAMILIES und bietet Funktionen für Signatur, Koordinatenänderung und Docking."
        },
        {
          "path": "assets/entity-continuity.mjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-scarlet/blob/e897868af97cf6f7476918164df688a7de3a29cc/assets/entity-continuity.mjs",
          "note": "Definiert createContinuity und transition mit maximal 16 Branches und 128 Transitionen; Restore erhält Ereignisgeschichte."
        },
        {
          "path": "tests/entity-signatures.test.mjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-scarlet/blob/e897868af97cf6f7476918164df688a7de3a29cc/tests/entity-signatures.test.mjs",
          "note": "Fügt Quelltests für gültige Formen, Grenzen, Branching und Docking hinzu; ihre Ausführung wurde für dieses Receipt nicht geprüft."
        }
      ],
      "claimCeiling": "PUBLIC_REPOSITORY_COMMIT_AND_CHANGED_FILES_ONLY"
    },
    {
      "id": "SCARLET-FUNCTION-ROOM-20261024",
      "commit": "3a70748b790e1c52142518ed6670b4579573a302",
      "authorAt": "2026-10-24T15:53:52Z",
      "committerAt": "2026-10-24T15:53:52Z",
      "eventTime": "2026-10-24T15:53:52Z",
      "eventTimeBasis": "COMMITTER_TIMESTAMP",
      "recordedAt": "2026-11-01T19:46:05Z",
      "title": "Lokaler Zustands- und Funktionsraum",
      "summary": "Dieser Merge ersetzte die öffentliche Startansicht durch einen bedienbaren lokalen Funktionsraum. Der Adapter verbindet den vorhandenen GStar-Textzustandskern mit einer getrennten endlichen Zellensimulation; die Tests definieren Eingabe-, Varianten-, Beobachtungs-, Replay- und Exportgrenzen.",
      "url": "https://github.com/Juri-Halveth/halveth-scarlet/commit/3a70748b790e1c52142518ed6670b4579573a302",
      "evidence": [
        {
          "path": "assets/capability-room-model.mjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-scarlet/blob/3a70748b790e1c52142518ed6670b4579573a302/assets/capability-room-model.mjs",
          "note": "createRoom bindet SEED und MATERIALIZE, Varianten, Beobachtung, Snapshot und Export an lokale GStar-Kerne; die Modellzeit ist begrenzt."
        },
        {
          "path": "tests/capability-room.test.mjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-scarlet/blob/3a70748b790e1c52142518ed6670b4579573a302/tests/capability-room.test.mjs",
          "note": "Fügt Tests für erhaltene Eingaben, Elternbezug, Replay, deterministische Simulation und Grenzen hinzu; kein Testlauf wird hier behauptet."
        }
      ],
      "claimCeiling": "PUBLIC_REPOSITORY_COMMIT_AND_CHANGED_FILES_ONLY"
    },
    {
      "id": "SCARLET-LIGHT-RENDERER-20261024",
      "commit": "a590ed6c35a9dd5fc89c259ef057bb143850bae5",
      "authorAt": "2026-10-24T17:13:08Z",
      "committerAt": "2026-10-24T17:13:08Z",
      "eventTime": "2026-10-24T17:13:08Z",
      "eventTimeBasis": "COMMITTER_TIMESTAMP",
      "recordedAt": "2026-11-01T19:46:05Z",
      "title": "Räumliche Lichtprojektion der Zustände",
      "summary": "Dieser Merge ergänzte einen Canvas-Licht-Renderer für materialisierte Textzustände und ihre gebundenen Elternlinks. Die Darstellungsgeometrie liest Modellzustand; sie schreibt keine Zustandsoperationen und beschreibt keine physische Geometrie.",
      "url": "https://github.com/Juri-Halveth/halveth-scarlet/commit/a590ed6c35a9dd5fc89c259ef057bb143850bae5",
      "evidence": [
        {
          "path": "assets/capability-room-visual.mjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-scarlet/blob/a590ed6c35a9dd5fc89c259ef057bb143850bae5/assets/capability-room-visual.mjs",
          "note": "layoutStates verwendet Zustands-IDs und Parent-Endpunkte; der Renderer ist ausdrücklich nur Darstellung."
        },
        {
          "path": "tests/capability-room-visual.test.mjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-scarlet/blob/a590ed6c35a9dd5fc89c259ef057bb143850bae5/tests/capability-room-visual.test.mjs",
          "note": "Fügt Invarianten für stabile Bodies, Parent-Links, fehlende Eltern und Pause hinzu; kein Browser-Frame oder Testlauf wurde hier beobachtet."
        }
      ],
      "claimCeiling": "PUBLIC_REPOSITORY_COMMIT_AND_CHANGED_FILES_ONLY"
    }
  ],
  "gaps": [
    {
      "id": "GAP-UNSELECTED-COMMITS",
      "kind": "UNSELECTED_PUBLIC_HISTORY",
      "scope": "GitHub-Geschichte von Juri-Halveth/halveth-scarlet bis 6913b81d3e2414b20149406cb3e2fe9bb314adf4",
      "reason": "Nur vier sachlich passende Merge-Commits wurden für diese kurze Projektzeitspur ausgewählt. Frühere, dazwischenliegende und spätere Commits sind in dieser Darstellung nicht inventarisiert.",
      "reopenTrigger": "Commitgraph und alle materiellen Diffs für einen konkret benannten weiteren Zeitraum oder Anspruch lesen."
    },
    {
      "id": "GAP-RUNTIME-UNOBSERVED",
      "kind": "NO_RUNTIME_VERIFICATION_IN_THIS_RECEIPT",
      "scope": "Tests, Browserdarstellung, lokaler und veröffentlichter Produktlauf",
      "reason": "Die hier herangezogene GitHub-Commit- und Dateiansicht belegt Quelländerungen, keine eigene Ausführung oder Abnahme zu diesen Commitzeitpunkten.",
      "reopenTrigger": "Gepinnten Checkout bauen, Tests ausführen und Browserzustände mit Version und Beobachtungsfenster binden."
    }
  ],
  "integrity": {
    "algorithm": "SHA-256-CANONICAL-JSON-V1",
    "digest": "aaef41a88e0a9f9d1f369b2241dbd464ec9234733b0587ddf42e6ca967db3374"
  }
}
;
