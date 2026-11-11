# Ein vollständiger Besucherweg: Text → Variante → JSON

Stand: 11.11.2026. Der bestehende Modellraum wird weiterverwendet.
Der neue Einstieg ergänzt die bestehende Projektkarte und ersetzt keine Anwendung.

## Quelle und Beispiel

- Anwendung: https://juri-halveth.github.io/halveth-scarlet/
- Quellreferenz: `Juri-Halveth/halveth-scarlet` @ `c36150b55fe9ed4207f185d7092b3184c353df93`.
- Browserbeobachtung: 2026-11-11, 10:14 UTC; Windows, Codex In-App-Browser.
- Pause, Modell-Seed 555, Ausgangstext `Meine erste Idee.`, Variante `Meine erste Idee bekommt eine Fortsetzung.`, ein Schritt `+ 1 s`.
- Erwartet und im heruntergeladenen JSON separat geprüft: zwei verschiedene Zustands-IDs, beide Texte erhalten, zweiter Zustand verweist auf ersten; `ecology.modelMs = 1000`.
- Export: 101269 Bytes, SHA-256 `98de12edc6950523c22919de07596aa53842a0f5af599c8e7244557221875937`. Der Hash bindet nur diesen konkreten Testlauf; andere IDs und Zeitstempel erzeugen andere Dateien.

## Aussagekraft der Prüfungen

1. **Browserfunktion:** eigener Text, Variante, Zeitschritt, echter Download, Replay. Ein erneuter identischer Variantentext wurde sichtbar abgewiesen; die Zahl der Zustände blieb zwei. Reset zeigte einen Textzustand, Ausgangstext und Zeit 0.00.
2. **Unabhängiger Dateileser:** Node.js liest die heruntergeladene JSON-Datei und vergleicht Texte, IDs, Eltern-ID, Seed und Modellzeit mit vorher festgelegten Literalen.
3. **Implementierungsprüfung:** Der gebundene Textkern akzeptiert das exportierte Ledger. Eine kontrolliert geänderte Textprojektion scheitert mit `EXPORT_REPLAY_MISMATCH`; ein nicht vorhandener Elternzustand mit `UNKNOWN_STATE`. Die Kopien bleiben lokal. Die Replay-Funktion ist keine unabhängige Implementierung.
4. **Website-Regression:** `tests/visitor-corridor.test.cjs` prüft Einstieg, Fragmentziel, vier Erklärungsebenen, Sprachen und direkte Anwendungslinks. `tests/browser/visitor-corridor.spec.cjs` prüft Tastatur, schmale Darstellung, Rückweg und Lesbarkeit ohne JavaScript in Chromium. Bestehende Such- und 404-Prüfungen bleiben bestehen.
5. **Grenzen:** keine Messung mit unabhängigen Personen; die 10-Sekunden-/1-Minuten-/3-Minuten-Ziele sind ungemessen. Kein biologischer oder physikalischer Wirkungsnachweis, kein Vollaudit, keine native Windows-Abnahme anderer Produkte. Eine Quellreferenz ist nicht automatisch ein Nachweis der gesamten Deployment-Bytegleichheit.

## Pflegen und weiterbauen

`data/visitor-corridor.json` enthält das dreisprachige Beispiel und seine getrennte aktuelle Quellreferenz. `tools/render-visitor-corridor.cjs` bindet es in den vorhandenen Generator ein. Historische Katalogrevisionen bleiben unverändert. Der Einstieg bleibt eine Navigationsverbindung zu SCARLET, kein importierter Laufzeitkern.

Nach einer Änderung: `npm run build`, `npm test` und die bestehenden Chromium-Prüfungen ausführen; anschließend die veröffentlichten Links beobachten. Der Datenschutz- und Crawlervertrag sowie die zurückgenommenen Präsentationen bleiben unverändert.
