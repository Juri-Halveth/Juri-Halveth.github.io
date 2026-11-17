# Material im bestehenden Knotenlabor

Der vorhandene Knotenversuch bleibt der Ausgangspunkt. Seine frei beweglichen
Materialzellen besitzen jetzt zusätzlich stabile IDs, nematische Orientierung
`theta` und Drehgeschwindigkeit `omega`. Die Standardansicht zeigt die Zellen
selbst als Stäbchen. Die alten Kernzentren sind standardmäßig unsichtbar und
können als kleine, ausdrücklich benannte Anmerkungen eingeblendet werden.

Die vier Hauptaktionen sind **Pause, Neu, Aufnahme, Mehr**. Unter Mehr bleiben
Antrieb, die bisherigen Medium-/Druck-/Taktkontrollen, zwei/drei Kerne, eine/drei
Gruppen, Raster-/Einzelzellansicht, Filmansicht, 4K-PNG, WebM und JSON erhalten.
Das neue Orientierungsmodell kann dort für die alte Modellfamilie ausgeschaltet
werden. Die Farben Blau/Gold oder RGB A/B/C sind Beobachterklassen. RGB benennt
hier keine Protonen, Neutronen oder Elektronen.

## Gleicher Rechenkern

Die eingebettete Offline-Datei und die anderen HALVETH-Oberflächen verwenden
dieselben Quellen in `shared/material-engine.js`, `material-model.js` und
`material-view.js`. Der Standalone-Build enthält deren exakte Bytes, benötigt
keine Bibliotheken und hat `connect-src 'none'`. Ein neuer Build entsteht mit:

```bash
python website/UPLOAD_HALVETH_DE/modules/knoten/build.py
# Alternativ im öffentlichen Website-Repository:
python modelle/material-20261117/modules/knoten/build.py
```

Der erste Aufbau liest `shared/`, der öffentliche Aufbau seine vorhandenen
`assets/`. Der Build zeigt den gewählten Aufbau an, prüft den Engine-Hash gegen
den Adapter und erhält die UTF-8-Quellbytes einschließlich CRLF. Ein unpassender
Quellstand überschreibt keine vorhandene Standalone-Datei.

Der ursprüngliche Core-/Zell-Rückkopplungspfad, das Speicherpotential `q`, der
explizite Antrieb, Zellendruck, viskose Dämpfung und die zugehörigen Gegenkräfte
bleiben erhalten. `nematic:false` hält die ursprüngliche Zustandsbahn einschließlich
Arbeit, Dissipation und Ereignissen exakt; zusätzliche Metadaten sind explizit.
Die sichtbare Größe einer Anmerkung ist kein Kollisionsradius.

Für `nematic:true` gilt zusätzlich das dimensionslose Paarpotential

```
U_ij = J (1 - (r/R)^2)^2 (1 - cos(2(theta_i-theta_j)))   für r < R
U_ij = 0                                               sonst
```

Ortskräfte und Drehmomente stammen aus den Ableitungen desselben Potentials.
Die Nematik besitzt die Kopf-Schwanz-Symmetrie `theta ~ theta+pi`. Winkel werden
nicht aus der Bildrichtung oder Geschwindigkeit erfunden. Rotationsenergie ist
`I*omega^2/2`; Rotationsdämpfung trägt `gamma*omega^2` zur Dissipation bei.
Standardwerte: `J=.0015`, `R=.52`, `I=.0008`, `gamma=.00045` in Modelleinheiten.
Ändert ein gebundener Auftrag `rodCoupling`, wird die Potentialänderung bei
unverändertem Zustand als externe Parameterarbeit verbucht.

Der Integrator verwendet feste Schritte `1/120` und das explizite
Mittelpunktverfahren. Zeitguthaben bleibt erhalten. Der gemeinsame Adapter berechnet höchstens 120 Schritte je Aufruf; ein größerer Rückstand bleibt sichtbar und wird durch weitere Aufrufe abgetragen. Pause, Nulltempo und
verborgener Tab laufen nicht nachträglich weiter. Eine nichtendliche versuchte
Folgezustandsberechnung überschreibt keinen gültigen Zustand. Es gibt in diesem
Materialmodell weder einen programmierten Boom noch eine Deaktivierung beim
Erreichen eines Abstands. Die ursprünglichen glatten Nahkräfte bleiben
offengelegte Modellannahmen.

## Zustand, Ansicht und Wiederholung

`HALVETHMaterial.create(config)` liefert `step(dt,{drive,rodCoupling})`, `reset`,
`snapshot`, `diagnostics`, `restore` und `replay`. `step` liefert einen kleinen
Status; `snapshot({exact:false})` genügt zum Zeichnen. Vollständige Exporte führen
den Quellhash, alle Zellen/IDs, Winkel und Drehgeschwindigkeiten, Anfangszustand,
Eingaben, Ereignisse und Zeitguthaben. IEEE-754-Hexwerte erhalten auch `-0`, das
gewöhnliches JSON allein verlieren würde.

Beim Import begrenzt die Oberfläche die Datei vor dem Lesen auf 5 MB. Anschließend
werden Quellbindung, Abmessungen und Typen geprüft und bis zu 100.000 Schritte
numerisch nachgespielt. Nur ein vollständig übereinstimmender Zustand samt
Geschichte wird pausiert übernommen. Ein gescheiterter Import erhält den
bisherigen Versuch. Mehr Schritte sind eine ausdrücklich begrenzte API-Option.

Die Darstellung liest den Zustand. Zoom, Kameraprojektion, Palette, Filmansicht,
Anmerkungen und Export ändern weder Masse noch Kräfte, Eingaben oder Ereignisse.
Die Dichte ist eine kompakt gestützte Interpolation der tatsächlichen Zellen.
`material-view.js` bewahrt den bestehenden Canvas-Transform und kann ohne
Hintergrund zeichnen. Projektionszweige führen eigene Beobachtungs-IDs bei
unveränderter Material-ID.

## Gemessener Umfang und Grenzen

Die gelieferten acht neuen Tests, acht gezielten Altprüfungen und die gesamte
18er-Altsuite wurden auf diesem Windows-Rechner ausgeführt. Zusätzlich prüfen
zwölf Integrationstests vollständiges Replay, Identitäten, negative Null,
Energiearbeit, Ablehnung ungültiger Eingaben, 30/60/120/240-Hz-Gleichheit,
Fehlererhalt und Zeitschrittverfeinerung. Sechs echte Chromium-Gegenproben prüfen
Bedienung, Canvas-Zweige, JSON-Import, 4K-Ausgabe, Darstellungsreinheit und Mobil.
Diese Umfänge überschneiden sich; sie werden nicht als unabhängige Belege addiert.

Ein zusätzlicher Lauf mit 960 orientierbaren Zellen erreichte 195 Modellsekunden
und 23.400 Schritte in 28,083 Sekunden auf diesem Rechner. Alle IDs und Zellen
blieben erhalten, die Zustände endlich und die Dissipation monoton. Der maximale
absolute Bilanzrest betrug 0,00162816 Modelleinheiten. Eine kurze
Zeitschrittverfeinerung von 1/120 auf 1/240 und 1/480 verkleinerte die
Zustandsabweichungen und den Bilanzrest. Die Rohresultate stehen unter
`evidence/material-*`.

Das ist ein konstruiertes, dimensionsloses mechanisches Forschungsmodell. Es
liefert keine Kalibrierung auf 10^-13 Meter, keine realen LCD-Stoffwerte, kein
Maxwell-/Navier-Stokes-/GR-Modell, keine subatomare Teilchenidentifikation und
keine Masseerzeugung. Arbeit und Dissipation sind Modellgrößen; eine gemessene
Temperatur oder allgemeine thermodynamische Grenze folgt daraus nicht. Die
vorhandene `q`-Auslesung nutzt ausdrücklich gesetzte Schwellen und Haltezeit;
mehrere sichtbare Stäbchen sind kein Nachweis unabhängiger Bits. Eine allgemeine
Topologie-/Defektklassifikation wurde nicht implementiert. Diese offenen
Forschungsrichtungen bleiben getrennt vom ausgeführten Softwarestand.
