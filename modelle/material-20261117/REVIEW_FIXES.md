# Review-Nachprüfung · 17.11.2026

Die gemeldeten Funktionskombinationen wurden am geprüften Commit lokal mit
synthetischen Dateien, Zuständen und einer Loopback-Browservorschau nachgestellt.
Die Vorher-Prüfung reproduzierte die folgenden Fälle; dieselben Hauptgegenproben
bestehen gegen die Korrektur. Rohmails und ihre Benachrichtigungslinks werden
nicht veröffentlicht.

| Fall | Korrektur |
| --- | --- |
| W-REPLAY-01 | Aktive Modellkonfiguration, angezeigte Anfangsregler und erneuter Export stimmen nach einem Import überein. Newton und Inspiral wurden separat geprüft. |
| W-ZOOM-01 | Bildzoom wirkt auch in den zwölf nichtmateriellen 2D-Modell-/Stil-Kombinationen. Das Rechenmodell bleibt gleich. Das scharfe Feldraster wird nur innerhalb des sichtbaren Canvas angelegt. |
| W-HISTORY-01 | Ein Modellwechsel archiviert vorhandene Flugereignisse mit Modell, Lauf-ID und alter Modellzeit. Der neue Lauf beginnt mit eigener Ereignismenge und eigener Zeit; frühere Besuche werden nicht still unterdrückt. |

Die drei Gegenproben liegen im bestehenden Browserlauf:

```bash
npm run test:browser
```

Der bestehende Generator aktualisiert auch die tatsächlichen UI-Quellhashes
in assets/build-info.js. Die numerischen Solver und die Materialgleichungen
bleiben unverändert. Ein Flugereignisarchiv ist ausdrücklich kein vollständiger
Solver-Replaybeleg. Die vorhandene Rootseite und der öffentliche Faden bleiben
unverändert.

## Unterbrechbarer 3D-Import

Forschungsseite und Studio prüfen 3D-Speicherstände in begrenzten Rechenblöcken
mit Pausen für die Ereignisschleife. Der bisherige Versuch bleibt bestehen,
bis die vollständige Prüfung erfolgreich ist. Neustart, Modellwechsel oder
ein neuer Import brechen einen noch laufenden Import ab. Das gilt auf der
Forschungsseite auch dann, wenn die Dateilesung noch nicht abgeschlossen ist.
Der Prüfstatus bleibt während der Berechnung sichtbar.

Die Materialgleichungen bleiben unverändert. Exakte Exporte des vorherigen
Lichtpunkt-Quellstands werden über dessen vollständige bekannte Quellbindung
angenommen; veränderte oder unbekannte Bindungen werden weiterhin abgelehnt.
Die aktuelle Materialdatei und ihr Quellhash stimmen mit der korrigierten
Datei im getrennten `console-only`-Repository überein.

`tests/material-import.test.cjs` prüft fünf Fälle mit dem echten Modell und
DOM-Ereignissen: unterbrochene Prüfung, unveränderten Zustand bis zur Freigabe,
Abbruch durch einen neuen Auftrag, verzögerte Dateilesung und die konkrete
Quellmigration. Diese lokale Prüfung zeichnet kein Browserbild auf.
Zwei zusätzliche Chromium-Fälle in `tests/browser/doppelacht.spec.cjs` prüfen
die Ereignisschleife und den Modellwechsel über die laufende Website; der
bestehende Pages-Workflow führt sie mit den bisherigen Browserfällen aus.

## Notizen während eines Neustarts

Die Kommunikationsansicht wartet beim Neustart auf eine bereits abgegebene
Notiz, bevor sie den bisherigen Lauf archiviert. Dadurch enthält das Archiv
auch den Eintrag, dessen SHA-256-Prüfung beim Klick noch ausstand. Weitere
Abgaben und doppelte Neustarts sind währenddessen gesperrt; das Textfeld
bleibt für den nächsten Entwurf bearbeitbar. Ein inzwischen geänderter Text
wird nach Abschluss der ersten Notiz nicht gelöscht. Bei einem Fehler bleibt
der Entwurf erhalten und die Fehlermeldung sichtbar.

Drei DOM-Gegenproben in `tests/communication-notes.test.cjs` steuern eine
verzögerte beziehungsweise fehlgeschlagene Prüfsumme. Zwei Fälle reproduzierten
den verworfenen Ziel-Lauf vor der Korrektur; alle drei bestehen danach.
`tests/browser/communication-notes.spec.cjs` prüft denselben Ablauf mit den
sichtbaren Bedienelementen im vorhandenen Chromium-CI-Lauf.
