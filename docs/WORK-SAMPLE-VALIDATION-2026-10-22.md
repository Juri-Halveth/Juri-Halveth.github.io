# Lokaler Prüfstand · Forschungslabor / GENESIS · 22. Oktober 2026

Repository: [Juri-Halveth/halveth-forschungslabor](https://github.com/Juri-Halveth/halveth-forschungslabor)

Geprüfter Quellstand: [c782d4a1ebb7a7cbc9031c6109bd58fe07b504ea](https://github.com/Juri-Halveth/halveth-forschungslabor/tree/c782d4a1ebb7a7cbc9031c6109bd58fe07b504ea)

Integration: [Draft-PR #6](https://github.com/Juri-Halveth/halveth-forschungslabor/pull/6)

## Ausgeführte Prüfungen

Ein lokaler Checkout dieses öffentlichen Branch-Commits wurde unter Windows
mit Node.js 24.18.0 und Python 3.14.6 durch `npm test` geprüft. Der Lauf vom
22. Oktober 2026 ergab:

| Suite | Bestanden | Fehlgeschlagen |
| --- | ---: | ---: |
| Ausgewählte JavaScript-Modul- und Skripttests | 148 | 0 |
| Python: Ereignis-/Provenienzmodell | 17 | 0 |
| Python: Regelmodell und Universe | 29 | 0 |
| Python: Metadateninventur | 3 | 0 |
| **Gesamt** | **197** | **0** |

Das GENESIS-Labor prüft unter anderem eine deterministische 100-Agenten-Folge,
Replay gegen manipulierte Records, ein blockiertes Relay, zwei
Beobachtungsoperatoren für denselben Zustandsvergleich und den endlichen
Scope-Prüfer mit 100 Zuständen, zwei Inputs und vier Linsen, einen
Rückweg-Prüfer für fünf gebundene Vorzustände mit explizitem Zwei-Bit-Residuum
und einen Vorhersageprüfer mit drei synthetischen Auswertungen. Hinzu kommt ein
gepaarter Serienvergleich, der Mittelwert und Mehrheitsbedingung als getrennte
Prüfgrößen behandelt. Eine weitere Prozessprobe erzeugt den Kandidaten in einem
frischen Node-Prozess und wertet ihn danach in einem getrennten Prozess aus;
abweichend gebundene und geänderte Kandidaten scheitern. Die zusätzliche
Restkanalprobe führt den Drei-Vorwerte-Rang durch 2 oder 3 Symbole und 1 oder
2 Takte; sie zeigt eine konkrete Kollision sowie zwei verlustfreie Varianten
innerhalb der gebundenen Rückfaser. Der Browser wurde auf
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
innerhalb der jeweiligen Viewportbreite. Auch die Restkanalprobe wurde auf
Desktop ausgelöst und bei 320 px und 390 px ohne horizontalen Dokumentüberlauf
kontrolliert.

Nach der visuellen Korrektur wurde ein Event von A001 erzeugt und die
Menüauswahl auf A002 geändert. Der Browser zeigte im Graphen weiter
„Ereignisquelle A001“ und im Menü „Agent A002“. Das frühere Ereignis wurde
durch die Vorbereitung des nächsten Impulses nicht ummarkiert. `npm test`
bestand anschließend erneut mit 197 ausgewählten Tests.

## Nachvollziehen

```sh
git clone https://github.com/Juri-Halveth/halveth-forschungslabor.git
cd halveth-forschungslabor
git checkout c782d4a1ebb7a7cbc9031c6109bd58fe07b504ea
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
mit KI-Unterstützung. Die [Lizenzzuordnung des Forschungslabors](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/c782d4a1ebb7a7cbc9031c6109bd58fe07b504ea/LICENSES.md)
bleibt maßgeblich für dessen Quellcode und Texte.
