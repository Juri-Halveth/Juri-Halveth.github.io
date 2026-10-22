# Lokaler Prüfstand · Forschungslabor / GENESIS · 22. Oktober 2026

Repository: [Juri-Halveth/halveth-forschungslabor](https://github.com/Juri-Halveth/halveth-forschungslabor)

Geprüfter Quellstand: [1fa6e66d5836659aeb0277a87222135d273429de](https://github.com/Juri-Halveth/halveth-forschungslabor/tree/1fa6e66d5836659aeb0277a87222135d273429de)

Integration: [Draft-PR #6](https://github.com/Juri-Halveth/halveth-forschungslabor/pull/6)

## Ausgeführte Prüfungen

Ein lokaler Checkout dieses öffentlichen Branch-Commits wurde unter Windows
mit Node.js 24.18.0 und Python 3.14.6 durch `npm test` geprüft. Der Lauf vom
22. Oktober 2026 ergab:

| Suite | Bestanden | Fehlgeschlagen |
| --- | ---: | ---: |
| Ausgewählte JavaScript-Modul- und Skripttests | 144 | 0 |
| Python: Ereignis-/Provenienzmodell | 17 | 0 |
| Python: Regelmodell und Universe | 29 | 0 |
| Python: Metadateninventur | 3 | 0 |
| **Gesamt** | **193** | **0** |

Das GENESIS-Labor prüft unter anderem eine deterministische 100-Agenten-Folge,
Replay gegen manipulierte Records, ein blockiertes Relay, zwei
Beobachtungsoperatoren für denselben Zustandsvergleich und den endlichen
Scope-Prüfer mit 100 Zuständen, zwei Inputs und vier Linsen, einen
Rückweg-Prüfer für fünf gebundene Vorzustände mit explizitem Zwei-Bit-Residuum
und einen Vorhersageprüfer mit drei synthetischen Auswertungen. Hinzu kommt ein
gepaarter Serienvergleich, der Mittelwert und Mehrheitsbedingung als getrennte
Prüfgrößen behandelt. Der Browser wurde auf
Desktop sowie vor dem Linsenschalter auf 320 px und 390 px geprüft; dabei gab
es keinen horizontalen Überlauf. Der Linsenschalter wurde danach auf Desktop
mit beiden Ansichten und ohne Browser-Konsolenfehler geprüft. Der Scope-Prüfer
wurde danach auf Desktop in zwei Linsen mit konkretem Gegenzeugen und der
Singleton-Grenze visuell geprüft. Der Rückweg-Prüfer zeigte auf Desktop die
drei Nachzustände und fünf rekonstruierten Vorwerte ohne Konsolenfehler. Die
Vorhersageansicht zeigte auf Desktop denselben vorab gebundenen Kandidaten bei
passender und künstlich abweichender Kontrolle. Alle vier Modi des
Serienvergleichs wurden auf Desktop ausgelöst. Die neuen Sektionen wurden
anschließend bei 320 px und 390 px mobil visuell geprüft; der Inhalt blieb
innerhalb der jeweiligen Viewportbreite.

## Nachvollziehen

```sh
git clone https://github.com/Juri-Halveth/halveth-forschungslabor.git
cd halveth-forschungslabor
git checkout 1fa6e66d5836659aeb0277a87222135d273429de
npm test
python -m http.server 8847 --bind 127.0.0.1
```

Danach öffnet `http://127.0.0.1:8847/branches/genesis-state-lab/` die lokale
Browseransicht. Der öffentliche Branch ist ein lesbarer Quellstand. Für das
Forschungslabor war bei diesem Prüfstand noch keine GitHub-Pages-Adresse
eingerichtet; deshalb führt der Research OS-Eintrag zum Quellcode und zeigt
keinen erfundenen Demo-Link.

## Reichweite und Herkunft

Die Tests belegen die implementierten lokalen Verträge und konkreten
Gegenbeispiele. Sie belegen keine physische Emergenz, Produktionswirkung oder
unabhängige Prüfung fremder Systeme. Der frühere
[Prüfstand vom 20. Oktober](WORK-SAMPLE-VALIDATION-2026-10-20.md) bleibt als
separater Quell- und Teststand erhalten.

Projektleitung und Konzept: Juri Halveth / HALVETH. Entwicklung und Prüfung
mit KI-Unterstützung. Die [Lizenzzuordnung des Forschungslabors](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/1fa6e66d5836659aeb0277a87222135d273429de/LICENSES.md)
bleibt maßgeblich für dessen Quellcode und Texte.
