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
