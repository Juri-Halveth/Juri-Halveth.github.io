# HALVETH · Wirbel & Wärme 0.3

Ein eigenständiger Dynamikversuch neben dem vorhandenen Sgr-A*-Optiklabor.
Entstanden aus der Frage: Was verändern 3, 4 oder mehr umlaufende Körper,
Dämpfung und zusätzliche Antriebsenergie am Verlauf und an der Wärmeabgabe?

## Start in Git Bash

Voraussetzungen: Python >= 3.10 und Node.js >= 18. Keine weiteren Pakete.

```bash
bash START.sh
```

Der Starter prüft das Paketmanifest, erzeugt `WIRBEL.html`, führt die
23 Engine-Tests aus und öffnet die lokale Seite. Ohne Browseröffnung:
`bash START.sh --no-open`. Die fertige `WIRBEL.html` lässt sich auch direkt
öffnen; dabei laufen aber die Node-Tests nicht automatisch.

Das Paket benötigt keinen Netzwerkzugriff, keine Anmeldung und keine globale
Installation. Es schreibt nicht in console-only, Garden, Wallets, Git oder den
Review-Worktree. Die neue Rechnung wird nicht in den bestehenden Renderer
injiziert. Sie ist ein eigener, unabhängig prüfbarer Modus.

Dein hochgeladenes Sgr-A*-Labor liegt vollständig und bytegleich unter
`vorheriges-labor/halveth-sgra-scharf-v02/`. Link unten in der Browseransicht,
oder `bash START.sh --previous`. Dessen ursprünglicher optionaler EHT-Download
wird beim neuen normalen Start nicht ausgeführt.

## Bedienung

- **Dämpfung → Wärme → Leuchten:** drei Körperpakete mit radialer Dämpfung.
- **Freier Umlauf:** gleiche Art von Gravitation, aber kein künstlicher
  Heizmechanismus. Ohne Dämpfung und Anfangswärme bleibt Modellwärme null.
- **Wirbel mit äußerem Antrieb:** eine explizite tangentiale Beschleunigung
  liefert bzw. entzieht mechanische Energie. Ihre tatsächliche Arbeit wird gezählt.
- **Vier Körper / enge Begegnungen:** geringe Anfangsdrehung und enge Vorbeiflüge.

Körperzahl, Seed, Anfangsdrehung, Dämpfung, Wärmeabgabe und Antrieb sind
Startparameter. Änderungen werden erst mit **Werte übernehmen & neu** wirksam.
Der Presetwechsel startet einen neuen pausierten Lauf. Kein stilles Vermischen
verschiedener Versuchsbedingungen.

**Start/Pause**, **Gleicher Seed**, Ziehen zum Drehen, Mausrad zum Zoomen.
Leertaste startet/pausiert bei fokussierter Modellansicht; R startet neu.
Zeittempo steuert nur, wie viele feste Rechenschritte angezeigt werden.
Belichtung steuert nur die Anzeige. Beides führt der Rechnung keine Energie zu.
Ein ausgeblendeter Browser-Tab pausiert den Versuch, statt Zeit nachzuholen.

Mehr Anfangsgeschwindigkeit bedeutet nicht zwangsläufig einen Zusammenstoß:
Körper können auch größere Bahnen erreichen oder auseinanderfliegen. Es gibt
keine fest vorgezeichnete Spirale und keinen eingebauten Explosionsauslöser.

## Was konkret modelliert ist

### 1. Newtonsche, räumliche Mehrkörperbewegung

Die Körper sind grobe, positiv-massige Modellpakete mit stabilen IDs,
Positionen, Geschwindigkeiten und einem Wärmereservoir. Keine Atome, keine
Elektronen oder Protonen und keine Schwarzen Löcher. G=1, alle Größen
sind dimensionslose Modelleinheiten.

Die potentielle Energie ist

```
U = -sum(i<j) G*m_i*m_j / sqrt(|r_i-r_j|^2 + eps^2)
```

Die Kräfte sind der negative Gradient dieses Potentials. `eps=0.18` glättet
die Begegnungen, damit kein numerischer 1/r-Kollaps als reale Explosion
missverstanden wird. Die Bewegung wird mit Velocity Verlet integriert;
Standardzeitschritt 1/480 Modelleinheiten. Die Glättung verändert die Physik
kurzer Abstände bewusst und ist keine horizonterhaltende Relativitätstheorie.

### 2. Genau bilanzierte, zentrale Dämpfung

Für jedes Paar wird ausschließlich die radiale relative Geschwindigkeit
verkleinert. Für den jeweiligen Teilschritt gilt

```
w = exp(-r^2 / 1.6^2)
s = exp(-gamma*w*dt)
v_rad_neu = s*v_rad_alt
mu = m_i*m_j/(m_i+m_j)
DeltaQ = 0.5*mu*v_rad_alt^2*(1-s^2)
```

Gleiche und entgegengesetzte zentrale Impulse erhalten Gesamtimpuls und
Drehimpuls dieses Teilschritts. Die exakt verlorene radiale kinetische
Energie wird massenproportional in die beiden Wärmereservoirs übertragen.
Hin- und Rückreihenfolge der Paarupdates werden symmetrisch angewandt.

Das ist ein **didaktischer Dissipationsansatz**, keine berechnete
Plasmaviskosität, keine Magnetorotationsinstabilität und keine echte
Stoßfrontrechnung. Tangentiale Relativbewegung alleine wird hier nicht
in Wärme umgewandelt. Die Reservoirwärme übt keinen Gasdruck aus.

### 3. Wärmeabgabe und Antrieb

Ein einfaches Abkühlgesetz reduziert jedes Reservoir:

```
Q_neu = Q_alt * exp(-k*dt)
E_abgegeben += Q_alt - Q_neu
```

Dies ist kein Stefan-Boltzmann-Gesetz, keine Synchrotronrechnung und kein
Strahlungstransport. Es gibt keine Kelvin-Kalibration. Die thermische
Modellhelligkeit folgt dem momentanen Wert `k*Q`; die Abbildung für den
Leuchthof ist `1-exp(-120*k*Q*Belichtung)`. Kernpunkte, ID-Ringe und
Spurlinien bleiben als Orientierung auch ohne Strahlung sichtbar.
Die Anzeigefarben sind keine astronomisch gemessenen Spektralfarben.

Der optionale Antrieb wirkt tangential um den Schwerpunkt. Eine gemeinsame
Beschleunigung wird abgezogen, damit kein Nettoimpuls erfunden wird. Er kann
Drehimpuls hinzufügen. Die Änderung der kinetischen Energie durch jeden
Antriebsteilschritt wird als tatsächliche äußere Arbeit W verbucht.

Die Diagnose überprüft

```
K + U + Q + E_abgegeben - W - E_anfang ≈ 0
```

Die relative Bilanzabweichung wird auf max(K_anfang, |U_anfang|, 1e-12)
normiert. Bei mehr als 0.5 % erscheint eine Warnung. Die GUI zeigt Rundung,
der JSON-Export die Zahlen mit voller JavaScript-Präzision.

### 4. Testspuren

300 zusätzliche **masselose Testspuren** folgen demselben zeitabhängigen
Gravitationsfeld ohne Rückwirkung. Sie machen Umlenkung und Auslenkung sichtbar.
Ihre Bewegungen sind nicht als ausgestoßene Photonen, Gas oder Jets zu lesen.
Sie werden nicht als Energiequellen im Körperbudget gezählt. Sie behalten
ihre IDs, werden bei Bildwechseln nicht neu gewürfelt und nicht heimlich
wieder ins Bild gesetzt. Das Modell enthält keine Photonenausbreitung mit c.

Enge Begegnungen werden protokolliert. Es gibt keine Verschmelzungsregel,
keine Fusion und keine Objektzerstörung. Aus einem engen Vorbeiflug wird
nicht automatisch ein neues Objekt oder Universum.

## Was daraus nicht folgt

Die Simulation ist kein Nachweis für drei Horizonte bei Sagittarius A*,
keine Ursprungserklärung des Universums und kein Beleg für atomare Smart
Contracts. Ereignishorizonte sind keine reibenden Materialflächen.

Die getrennt erhaltenen Ellis-/Schwarzschild-Optikansichten sind nicht
mit dieser Newtonschen Bewegung zu einem relativistischen Plasmamodell
gekoppelt. Hier fehlen insbesondere gekrümmte Raumzeit, Magnetfelder,
Elektronen-/Ionenverteilungen, Ionisation, Strahlungstransport und
Gravitationswellen. Ein vollständiger relativistischer Mehrfach-Schwarze-
Löcher-Versuch bräuchte einen entsprechend anderen Solver und weitere Tests.

## Reproduzieren und Bash

```bash
node simulate.cjs --preset heat --steps 7200
node simulate.cjs --preset encounter --seed 3491 --steps 6000 --out mein-versuch.json
node simulate.cjs --replay mein-versuch.json
```

`--out` überschreibt keine vorhandene Datei. **Versuch als JSON** in der
Browseransicht exportiert Seed, Parameter, Schrittzahl, vollständigen
Körperzustand, Energiebilanz und den SHA-256 der Engine. Die Himmelsansicht
und masselose Testspuren sind nicht Bestandteil des Energiebelegs.

Innerhalb derselben JavaScript-Laufzeit wurden identische Replays geprüft.
Zwischen Browser und Node können mathematische Bibliotheksfunktionen minimal
abweichen. Der mitgelieferte Browser-zu-Node-Test zeigte eine maximale absolute
Abweichung von 2.71e-20; der Prüfer meldet die Abweichung und verwendet eine
skalierte Toleranz von 1e-10. Er erklärt abweichende Replays nicht still für
identisch. Bei langen chaotischen Läufen können Unterschiede anwachsen.

Der JSON-Export ist ein nachvollziehbarer Versuchsdatensatz, keine externe
Beglaubigung und kein automatisch in Garden gespeicherter Blockchain-Eintrag.

## Aktuelle Tests

- 23 Engine-Tests bestanden, darunter eine Serie mit 256 generierten
  Parameterkombinationen zu je 1440 festen Schritten.
- Maximale relative Bilanzabweichung dieser Serie: 6.265207663154482e-6
  (= 0.0006265207663154482 %). Das gilt für genau diese untersuchte Serie,
  nicht als allgemeine Schranke für beliebig lange Läufe.
- 15 Browserprüfungen bestanden: UI, tatsächliche Bewegung, Wärme, keine
  Wärme im Kontrollversuch, Kameratrennung, Seed-Wiederholung, 8 Körper,
  Export, Wertevalidierung, mobile Breite, keine Netzwerkzugriffe/Skriptfehler.
- 28 Python- und 14 Node-Tests des bytegleich beigefügten alten Labors
  zusätzlich erneut ausgeführt und bestanden.

Umgebung: Linux, Python 3.13.5, Node 22.16.0, headless Chromium via Playwright.
Browserseite mit `set_content` geladen. Ein kompletter Windows-Chrome-
Dateistart, Vollbild und die native Windows-Bildrate sind nicht geprüft.
Keine Aussage über durchgehend 60 FPS. Entwicklungsprüfer benötigen Playwright;
der gewöhnliche Nutzerstart benötigt es nicht.

Prüfberichte und tatsächliche Browserbilder: `validation/`.

## Einordnung mit Primärquellen

1. EHT, Science: magnetisch erzeugte Turbulenz kann Energiedissipation
   ermöglichen, die wie Reibung wirkt, ohne direkte Atomstöße vorauszusetzen.
   https://eventhorizontelescope.org/science
2. Max-Planck-Institut für Radioastronomie, 14.01.2025: Beobachtungen eines
   Sgr-A*-Ausbruchs und Interpretation durch energiereiche Elektronen,
   Synchrotronstrahlung und magnetische Rekonnexion. Keine Dreihorizont-These.
   https://www.mpifr-bonn.mpg.de/pressreleases/2025/1
3. NASA, Black Hole Anatomy: Akkretionsgas, heiße Korona und Horizontbegriff.
   https://science.nasa.gov/universe/black-holes/anatomy/
4. Chael et al. 2018: unterschiedliche Elektronen-/Ionenheizung in dünnem
   Sgr-A*-Plasma; Vergleich von turbulenter Heizung und Rekonnexion.
   https://arxiv.org/abs/1804.06416

Diese Quellen ordnen die reale Astrophysik ein. Sie validieren nicht die hier
gewählte einfache Dämpfungs- oder Kühlregel.
