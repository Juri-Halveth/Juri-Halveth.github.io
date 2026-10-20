# Lokaler Prüfstand · Forschungslabor · 20. Oktober 2026

Repository: [Juri-Halveth/halveth-forschungslabor](https://github.com/Juri-Halveth/halveth-forschungslabor)
Quellrevision: [c6008ab5f8847921dc140d973b9a526750a89933](https://github.com/Juri-Halveth/halveth-forschungslabor/tree/c6008ab5f8847921dc140d973b9a526750a89933)

## Ausgeführte Prüfung

Ein frischer lokaler Checkout des genannten öffentlichen Quellstands wurde mit
Node.js 24.18.0 und Python 3.14 unter Windows geprüft. Der Projektbefehl
`npm test` ruft die ausgewählten JavaScript- und anschließend die beiden
Python-Suiten auf. Zusätzliche Pakete waren für diesen Lauf nicht erforderlich.

| Ausgeführte Suite | Ergebnis |
| --- | --- |
| JavaScript, ausgewählte Modul- und Skripttests | 99 bestanden, 0 fehlgeschlagen |
| Python, Ereignis-/Provenienzmodell | 17 bestanden |
| Python, Regelmodell und Universe | 29 bestanden |

Gesamt: **145 lokale Tests bestanden**. Dies ist ein datierter Lauf dieses
Quellstands. Die Zahlen sind keine laufend aktualisierte CI-Anzeige.

## Nachvollziehen

Voraussetzungen laut Projekt: Node.js 24 und Python 3.11 oder neuer.

```sh
git clone https://github.com/Juri-Halveth/halveth-forschungslabor.git
cd halveth-forschungslabor
git checkout c6008ab5f8847921dc140d973b9a526750a89933
npm test
```

Der Checkout-Schritt bindet den datierten Prüfstand auch dann, wenn sich der
Defaultbranch später ändert. Lokale Ergebnisse können von Betriebssystem und
Werkzeugversion abhängen.

## Was dabei geprüft wird

Die [Testauswahl](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/c6008ab5f8847921dc140d973b9a526750a89933/scripts/check-modules.mjs)
führt konkrete Modellverträge und Gegenproben aus. Dazu gehören Prüfungen für
veränderte Paketbytes, ungültige Zustände, explizit unbekannte Werte und
veränderte Replay-Ergebnisse. Die
[technische Schnittstellenkarte](https://juri-halveth.github.io/koennen/)
führt zu den einzelnen Funktionen und Gegenproben.

## Reichweite

Dies belegt den erfolgreichen lokalen Testlauf der mitgelieferten Modelle.
Ein externer Produktaudit, ein neuer Unreal-Enginebuild, Produktionsreife,
wissenschaftliche Außenwirkung und ein GitHub-Actions-Ergebnis sind davon
getrennte Prüfstände.

Projektleitung: Juri Halveth / HALVETH. Entwicklung und Prüfung mit
KI-Unterstützung. Quellen behalten ihre jeweiligen Lizenzen und Attribution.
