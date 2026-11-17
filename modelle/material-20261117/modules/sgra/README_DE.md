# HALVETH · Sgr-A*-Modelllabor 0.2 / Scharf

Darstellungsverbesserung für das eigenständige Labor 0.1. Kein Patch an
`console-only`, Garden oder einem Git-Worktree. Keine KI-Nachschärfung.

## Start

Python >= 3.10, Standardbibliothek. Keine Installation mit pip.

```bash
bash START.sh
```

Die Tests laufen zuerst. Node ist für die 14 zusätzlichen JavaScript-Tests
optional; wenn vorhanden, führt der Starter sie aus und stoppt bei Fehlern.
Ohne Node wird dieser Teil ausdrücklich als nicht ausgeführt gemeldet.
`results/index.html` wird erzeugt und im Browser geöffnet. Alternativ lässt
sich die mitgelieferte `VORSCHAU.html` direkt öffnen, ohne Python auszuführen.

Ein freiwilliger separater Abruf der bereits in 0.1 ausgewählten öffentlichen
EHT-Daten bleibt über `bash START.sh --eht` möglich. Der normale Start ist offline.
In dieser Arbeit wurde kein vollständiger EHT-Datenlauf ausgeführt.

## Bedienung

**SCHARF · 2048** berechnet 2048 × 2048 Bildwerte aus dem Modell neu und setzt
zusätzliche Geräteunschärfe auf null. Es verkleinert nicht die Quelle, ändert
keine Masse, verschiebt keine Quelle und ändert keine beobachteten Daten.

- Rechenauflösung: Auto nach Bildschirmdichte, 480, 1024 oder 2048.
- Ausdehnung der Modellquelle: angenommene Gauß-Standardabweichung, 0,25 bis
  14 Mikro-Bogensekunden (µas). Dies ist kein Fokusregler.
- Geräteunschärfe: separat angenommene kreissymmetrische Gauß-PSF für die vier
  Radio-Helligkeitsmodelle, 0 bis 12 µas. Kein vollständiges EHT-Instrumentmodell.
- Ausschnitt-Zoom: kleineres Bildfeld neu berechnen, nicht ein Bitmap vergrößern.
  Wahlweise auf Bildmitte oder eine der drei Modellquellen zentrieren.
- Belichtung: ändert nur die Anzeige. Bei fast weißen Profilen reduzieren.
- Quell-IDs: zeigen die gesetzten Modellzentren als Markierungen, keine Atome.
- Lichtablenkung ausschalten: gerade Strahlen zum selben Modellhimmel als
  Kontrollansicht. Die andere Seite ist dann nicht erreichbar. Dies ist keine
  Rekonstruktion einer unbekannten unlensierten astronomischen Szene.
- Prüfgitter: künstliche Winkelreferenz, um Krümmung und Abtastung zu erkennen.
- Diffuses Himmelsband: ausschaltbare synthetische Emissionskomponente. Es
  wegzulassen ändert die angenommene Quelle und ist kein Scharfstellen.

Während Regler bewegt werden und bei Animation wird eine gekennzeichnete
480er Vorschau verwendet. Nach dem Loslassen wird die gewählte Auflösung neu
berechnet; Animation bleibt bewusst eine Vorschau. Die Berechnung erfolgt
in unterbrechbaren Abschnitten im Browser, nicht als behauptete GPU-Echtzeitsimulation.

## Was gegenüber 0.1 geändert ist

1. Keine festgeschriebene 480er Endauflösung mehr; HiDPI wird berücksichtigt.
2. Die 1024×512-Himmelsbitmap wurde durch einen festen Katalog von 1400
   Modellquellen je Himmel ersetzt. Ihre Richtungen und Winkelprofile werden
   kontinuierlich ausgewertet. Seeds 17 und 37; stabile Quell-IDs. Die gleiche
   Zufallsfolge wie zuvor liefert Richtungen, Ausgangsbreiten und Amplituden.
   Die ehemalige equirektangulare Bitmap-Näherung wird nicht pixelidentisch
   reproduziert: Die neue Profilevaluation nutzt sphärische Richtungen.
3. Quellenprofile bleiben in Welt-/Winkelkoordinaten fest; sie werden nicht
   pro Bild neu ausgewürfelt. Ein räumlicher Suchindex stimmt in 1000 geprüften
   Richtungen mit einer direkten Summe über alle Quellen überein.
4. Der Ring ist nicht länger die Summe von 64 Flecken. Das kontinuierliche
   Ringprofil wird über die skalierte modifizierte Besselfunktion I0 ausgewertet.
5. Quellgröße, zusätzliche Geräteunschärfe und Rechenauflösung sind getrennt.
6. Die bisherige `physics.py`, `experiment.json` und EHT-Dateiliste sind bytegleich.
   Die Lichtweg-Gleichungen und Bash-Datenvorhersagen wurden nicht verändert.

## Rechenweg für den Ring und die Geräteunschärfe

Für einen dünnen Ring von Radius R, Gesamtfluss F und kreissymmetrischer
Gaußbreite sigma gilt im Bildraum mit Abstand r vom Mittelpunkt:

```
I(r) = F/(2*pi*sigma^2) * exp(-(r-R)^2/(2*sigma^2)) * I0e(r*R/sigma^2)
I0e(x) = exp(-abs(x)) * I0(x)
sigma_eff = hypot(sigma_quelle, sigma_geraet)
```

I0e wird für x < 50 durch eine konvergente Reihe, darüber durch eine
asymptotische Entwicklung berechnet. Der Ringvergleich benutzt unabhängig
16384 Winkelschritte pro Testfall. Im Browser beschleunigt eine fein aufgelöste
radiale Tabelle die Bildauswertung. Die Flussnormalisierung bleibt erhalten.

Quellkatalog: normalisierte dreidimensionale Richtungen und Gaußprofile in der
Sehnenentfernung auf der Einheitssphäre, entsprechend einer Kleinwinkelnäherung.
Zwischen 3 und 4 sigma werden die Enden glatt auf null ausgeblendet. Diese
Profilannahme ist keine Teilchenphysik oder reale Sternoberfläche.

## Grenzen, die höhere Pixelzahlen nicht beseitigen

Die ursprünglichen Ellis-/Schwarzschild-Integrale und ihre tabellierte
Interpolation bleiben bestehen. Die Zone |b-1| < 1e-5 sowie ein nicht sinnvoll
interpolierbarer Tabellenabschnitt werden als numerisch unaufgelöst markiert.
In der Anzeige erscheinen diese Pixel schraffiert statt als erfundene Quelle.
Unendlich feine kritische Bilder sind nicht aufgelöst. Pro Rechenpixel wird
in dieser Version eine Richtung ausgewertet; sehr feine Strukturen können
weiterhin aliasieren. Es gibt keine vollständige Pixel-Flächenintegration.

Eine breite angenommene Lichtquelle bleibt auch bei 2048 Pixeln breit.
Eine Gravitationslinse kann Bilder vergrößern und verformen; das ist weder ein
Nachweis einzelner Teilchen noch eine Kompression der Materie durch Bildbearbeitung.
Plasma entsteht durch Ionisation, nicht durch einen Schärferegler.

Die zwei Strahlenansichten sind weiter reine Hintergrundbeleuchtungen ohne
Gas, Spin, Strahlungstransport oder Plasma-Dynamik. Ein zweiter Himmel im
Ellis-Modell ist eine gesetzte Randbedingung, keine entdeckte andere Welt.

## Tatsächlich ausgeführte Prüfungen

- 28 vorhandene Python-Tests: bestanden.
- 14 zusätzliche Node-Tests: bestanden, inklusive 1000 Suchindex-Gegenproben,
  kontinuierlichem Ring, Flusserhaltung, Quellidentität und gerader Kontrollsicht.
- 12 Browserprüfungen: bestanden, darunter HiDPI, 2048er Neuberechnung,
  unveränderte Quellparameter, Zoom, Linsen-Aus und Null-Netzwerkzugriffe.

Testumgebung: Linux, Python 3.13, Node 22, headless Chromium. Die Seite wurde mit
Playwright `set_content` geladen, weil die Browserrichtlinie dieser Umgebung
`file://`-Navigation sperrt. Keine Browser-Sicherheitsrichtlinie wurde im Paket
abgeschwächt. Windows-Chrome, der lokale Dateistart dort, Vollbild und Animation
sind nicht vollständig abgenommen. Bericht und reproduzierbare Tests: `validation/`.

## Fachquellen zur Unterscheidung

Die folgenden Quellen dienen der Einordnung, nicht als Bestätigung der
synthetischen Quellen dieses Labors:

- EHT Imaging Paper III: Variabilität, Streuung und Rekonstruktionsverfahren.
  https://eventhorizontelescope.org/publications/first-sagittarius-event-horizon-telescope-results-iii-imaging-galactic-center
- EHT: Winkelauflösung einer Baseline ~ Wellenlänge / Basislänge;
  Streuung und optische Tiefe sind weitere Begrenzungen. Die Seite enthält
  historische Entwicklungspläne, die hier nicht als aktueller Status übernommen werden.
  https://eventhorizontelescope.org/moving-towards-higher-observing-frequencies
- NASA/Hubble: Gravitationslinsen vergrößern, verzerren und erzeugen Mehrfachbilder.
  https://science.nasa.gov/mission/hubble/science/science-highlights/focusing-in-on-gravitational-lenses/
- Princeton Plasma Physics Laboratory: Plasma und Ionisation.
  https://www.pppl.gov/about/about-plasmas-and-fusion

Die übrigen Literatur- und Datenverweise des Ausgangslabors stehen in SOURCES.json.

## Datensicherheit

Der normale Start liest ausschließlich Paketdateien und schreibt Ergebnisse
in dessen eigenen Ordner. Kein Git, keine Wallet, keine fremden Dateien,
keine Verbindung aus der Browseransicht. Optionaler EHT-Download wie in 0.1 nur
von gepinnten GitHub-Rohdateien, mit Dateigröße, Blobhash und Formatprüfung.
Das ist eine begrenzte Funktions- und Integritätsprüfung, keine vollständige
Sicherheitszertifizierung des Computers.
