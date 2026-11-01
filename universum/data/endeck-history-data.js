window.HALVETH_ENDECK_HISTORY = {
  "schema": "halveth.public-project-history.v1",
  "projectId": "halveth-forschungslabor",
  "repository": "Juri-Halveth/halveth-forschungslabor",
  "observedHead": "2cb8eb38e4276b0b821731d4f1056cd06a8b8631",
  "retrievedAt": "2026-11-01T19:50:45Z",
  "coverage": {
    "selection": "SELECTED_PUBLIC_COMMITS_NOT_COMPLETE_HISTORY",
    "source": "GITHUB_COMMIT_AND_FILE_DIFF",
    "notes": "Vier ausgewählte öffentliche Commits aus 2026-10-24 bis 2026-10-27 zu ENDECK und seiner Darstellung. GitHub-Compare bestätigte jeden als Vorfahren des beobachteten main-HEAD. Die Auswahl deckt weder die vollständige Git-Geschichte noch einen damaligen oder heutigen Browserlauf ab."
  },
  "events": [
    {
      "id": "ENDECK-PROJECTION-20261024",
      "commit": "713d511e51ccb622f1331b7847dec6fd47cfb2d5",
      "authorAt": "2026-10-24T11:43:50Z",
      "committerAt": "2026-10-24T11:43:50Z",
      "eventTime": "2026-10-24T11:43:50Z",
      "eventTimeBasis": "COMMITTER_TIMESTAMP",
      "recordedAt": "2026-11-01T19:50:45Z",
      "title": "ENDECK: vier geometrische Gegenvergleiche",
      "summary": "Der Merge fügte eine eigenständige ENDECK-Ansicht mit vier modellierten Vergleichen hinzu: Projektionsmehrdeutigkeit, tatsächliches Zusammenfallen, schrittweise Ortsverschmelzung und verschiedene Zwischenwege bei gleichen Endbildern. Ein Quelltest definiert Modell- und Eingabeprüfungen; seine Ausführung wurde für diese Zeitspur nicht beobachtet.",
      "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/commit/713d511e51ccb622f1331b7847dec6fd47cfb2d5",
      "evidence": [
        {
          "path": "branches/endeck-observer/fragment.html",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/blob/713d511e51ccb622f1331b7847dec6fd47cfb2d5/branches/endeck-observer/fragment.html",
          "note": "Enthält vier auswählbare Modelle, Quellpunkte A bis D, flache und räumliche Ansicht sowie Modellzeit und Kamerakippung."
        },
        {
          "path": "branches/endeck-observer/model.test.mjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/blob/713d511e51ccb622f1331b7847dec6fd47cfb2d5/branches/endeck-observer/model.test.mjs",
          "note": "Fügt Tests für die geometrischen Gegenbeispiele, erhaltene IDs, 3.001 Modellzeiten und ungültige Eingaben hinzu; kein Testlauf wird behauptet."
        },
        {
          "path": "branches/endeck-observer/SOURCE.json",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/blob/713d511e51ccb622f1331b7847dec6fd47cfb2d5/branches/endeck-observer/SOURCE.json",
          "note": "Deklariert Version 1.0.0 und Digest des erhaltenen Quellfragments; diese Selbstauskunft ist kein unabhängiger Ursprungbeweis."
        }
      ],
      "claimCeiling": "PUBLIC_REPOSITORY_COMMIT_AND_CHANGED_FILES_ONLY"
    },
    {
      "id": "ENDECK-MODULAR-LEARNING-20261024",
      "commit": "8d6d53bd67d548c1f66923fa2eefa6295a13668b",
      "authorAt": "2026-10-24T12:16:33Z",
      "committerAt": "2026-10-24T12:16:33Z",
      "eventTime": "2026-10-24T12:16:33Z",
      "eventTimeBasis": "COMMITTER_TIMESTAMP",
      "recordedAt": "2026-11-01T19:50:45Z",
      "title": "Modulares Modell und lokale Lernaufgaben",
      "summary": "Der Merge löste den Projektionskern in model.mjs und die Ansicht in eigene Module aus. learning.mjs ergänzt vier Aufgaben mit lokal codiertem Fortschritt; neue Tests formulieren Gegenbeispiele und Eingabegrenzen. Die Dateien belegen die Implementierung im Repository, keinen hier ausgeführten Browser- oder Testlauf.",
      "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/commit/8d6d53bd67d548c1f66923fa2eefa6295a13668b",
      "evidence": [
        {
          "path": "branches/endeck-observer/model.mjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/blob/8d6d53bd67d548c1f66923fa2eefa6295a13668b/branches/endeck-observer/model.mjs",
          "note": "Exportiert die vier Modellmodi sowie source, observeXY, distinct und project als getrennte Funktionen."
        },
        {
          "path": "branches/endeck-observer/learning.mjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/blob/8d6d53bd67d548c1f66923fa2eefa6295a13668b/branches/endeck-observer/learning.mjs",
          "note": "Definiert vier Aufgaben und Funktionen zum Bewerten sowie Codieren und Decodieren eines lokalen Fortschrittsstands."
        },
        {
          "path": "branches/endeck-observer/learning.test.mjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/blob/8d6d53bd67d548c1f66923fa2eefa6295a13668b/branches/endeck-observer/learning.test.mjs",
          "note": "Fügt Quelltests für Gegenbeispiele, Antworten und begrenzten Fortschritts-Roundtrip hinzu."
        }
      ],
      "claimCeiling": "PUBLIC_REPOSITORY_COMMIT_AND_CHANGED_FILES_ONLY"
    },
    {
      "id": "ENDECK-FRAME-CLOCK-20261026",
      "commit": "c82fd2debd8c4a3e4eefc4b8b8abfca7ed5c2ea2",
      "authorAt": "2026-10-26T15:56:27Z",
      "committerAt": "2026-10-26T15:56:27Z",
      "eventTime": "2026-10-26T15:56:27Z",
      "eventTimeBasis": "COMMITTER_TIMESTAMP",
      "recordedAt": "2026-11-01T19:50:45Z",
      "title": "Playback am ersten Animation-Frame verankert",
      "summary": "Dieser Commit änderte den Startanker des ENDECK-Playbacks auf den ersten gelieferten Animation-Frame. Er ergänzte Browser-Testquelltext für versetzte Uhren, Moduswechsel, Kamera und den achtsekündigen Ablauf. Ob die Prüfung zu diesem Commitzeitpunkt lief oder bestand, ist aus diesen Dateidiffs allein nicht belegt.",
      "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/commit/c82fd2debd8c4a3e4eefc4b8b8abfca7ed5c2ea2",
      "evidence": [
        {
          "path": "branches/endeck-observer/view.mjs",
          "status": "modified",
          "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/blob/c82fd2debd8c4a3e4eefc4b8b8abfca7ed5c2ea2/branches/endeck-observer/view.mjs",
          "note": "Setzt startAt zunächst auf null und bindet ihn beim ersten Frame an dessen now-Zeitstempel; negative verstrichene Zeit wird auf null begrenzt."
        },
        {
          "path": "branches/encounter-systems/browser.spec.mjs",
          "status": "modified",
          "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/blob/c82fd2debd8c4a3e4eefc4b8b8abfca7ed5c2ea2/branches/encounter-systems/browser.spec.mjs",
          "note": "Ergänzt ENDECK-Browserfälle für Frame-Clock-Skew, alle vier Modi und sichtbare acht Sekunden; nur Testquelltext ist hier beobachtet."
        }
      ],
      "claimCeiling": "PUBLIC_REPOSITORY_COMMIT_AND_CHANGED_FILES_ONLY"
    },
    {
      "id": "ENDECK-CAMERA-LABELS-20261027",
      "commit": "07417d3cdadda426c2b51cc98bcbae72d7b5d651",
      "authorAt": "2026-10-27T01:30:06Z",
      "committerAt": "2026-10-27T01:30:06Z",
      "eventTime": "2026-10-27T01:30:06Z",
      "eventTimeBasis": "COMMITTER_TIMESTAMP",
      "recordedAt": "2026-11-01T19:50:45Z",
      "title": "Punktlabels bei schmaler Kameraansicht platziert",
      "summary": "Der Commit erweiterte die Labelsuche um ein endliches Raster, wenn nahe Positionen belegt sind. Neue Geometrie- und View-Tests beschreiben Identitätserhalt und fortgesetzte Kameraframes bei schmalen Ansichten. Die tatsächliche Darstellung in einem Browser wurde in dieser Zeitspur nicht nachgemessen.",
      "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/commit/07417d3cdadda426c2b51cc98bcbae72d7b5d651",
      "evidence": [
        {
          "path": "branches/endeck-observer/geometry.mjs",
          "status": "modified",
          "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/blob/07417d3cdadda426c2b51cc98bcbae72d7b5d651/branches/endeck-observer/geometry.mjs",
          "note": "Fügt labelPositions mit begrenzten nahen Positionen und einem 9×9-Raster für überfüllte Projektionen hinzu."
        },
        {
          "path": "branches/endeck-observer/geometry.test.mjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/blob/07417d3cdadda426c2b51cc98bcbae72d7b5d651/branches/endeck-observer/geometry.test.mjs",
          "note": "Fügt Layout-Gegenproben für Modi, Kamerawinkel und mobile Breiten hinzu; deren Ausführung wird nicht behauptet."
        },
        {
          "path": "branches/endeck-observer/view.test.mjs",
          "status": "added",
          "url": "https://github.com/Juri-Halveth/halveth-forschungslabor/blob/07417d3cdadda426c2b51cc98bcbae72d7b5d651/branches/endeck-observer/view.test.mjs",
          "note": "Simuliert DOM und Frame-Takt für Kamerarichtungen und Playback; kein realer Browser-Layouttest."
        }
      ],
      "claimCeiling": "PUBLIC_REPOSITORY_COMMIT_AND_CHANGED_FILES_ONLY"
    }
  ],
  "gaps": [
    {
      "id": "GAP-ENDECK-UNSELECTED-COMMITS",
      "kind": "UNSELECTED_PUBLIC_HISTORY",
      "scope": "GitHub-Geschichte von Juri-Halveth/halveth-forschungslabor bis 2cb8eb38e4276b0b821731d4f1056cd06a8b8631",
      "reason": "Die vier sachlich passenden Commits sind eine kuratierte Teilmenge. Dazwischenliegende und spätere Commits sowie andere Forschungslabor-Projekte sind nicht als Ereignisse inventarisiert.",
      "reopenTrigger": "Commitgraph und materielle Diffs für einen konkret benannten Zeitraum oder eine neue Behauptung prüfen."
    },
    {
      "id": "GAP-ENDECK-ORIGIN-AND-RUNTIME",
      "kind": "ORIGIN_AND_RUNTIME_NOT_VERIFIED",
      "scope": "Vorheriger Ideenursprung, damaliger Testlauf und veröffentlichter Browserzustand",
      "reason": "Commit-Metadaten und Dateidiffs datieren Repository-Änderungen. SOURCE.json deklariert Quellstand und Herkunft im Repository; ein unabhängiger Ursprungbeleg, eine eigene damalige Testausführung und ein versionsgebundener Browserlauf gehören nicht zu dieser Auswahl.",
      "reopenTrigger": "Für den jeweiligen Anspruch Originalquelle oder gepinnten Checkout und Test- beziehungsweise Browser-Witness mit Version, Zeit und Coverage binden."
    }
  ],
  "integrity": {
    "algorithm": "SHA-256-CANONICAL-JSON-V1",
    "digest": "7554797ccc79524000e44269a519234ee9a48db5f65bdfb0024752766a4bef5e"
  }
};
