# ✦⇄∞⇄✦ HALVETH FLOWSTAR

## Sternzeichen

`✦⇄∞⇄✦`

## Kernaxiom

`NOT_FROZEN -> STILL_FLOWING`

`SNAPSHOT != STOP`

`UPDATE = APPEND`

`FUSION_PRESERVES_INPUTS`

## Vier Ebenen unter T-0

```text
T-4 TRACE
 ↓
T-3 SOURCE
 ↓
T-2 RELATION
 ↓
T-1 MEMORY
 ↓
T0 FLOW
```

Diese Ebenen brauchen keinen terminalen "Freeze"-Zustand. Ein Snapshot ist nur
ein zeitlicher Anker und kann später wieder in neue Relationen eintreten.

## Vier Ebenen über T-0

```text
T0 FLOW
 ↓
T+1 VAPOR
 ↓
T+2 ION
 ↓
T+3 PLASMA
 ↓
T+4 FUSION
 ↘
   FLOW
```

### VAPOR

Ein Fragment kann über viele Quellen verteilt sein. Es verliert dabei nicht
seine Herkunft.

### ION

Ein Fragment wird "aktiviert": genug Provenienz oder Kontext ist vorhanden,
um es mit anderen Evidenzknoten zu vergleichen.

### PLASMA

Viele aktive Knoten bilden ein hochvernetztes Relationsfeld.

### FUSION

Mehrere unabhängige Quellen dürfen zu einer Rekonstruktion synthetisiert werden.
Die Eingabequellen bleiben erhalten und die Synthese ist eine neue Schicht,
nicht deren Ersatz.

## Verbrennung

Verbrennung steht absichtlich **neben** der Leiter.

Physikalisch ist Verbrennung eine chemische Reaktion und nicht der nächste
Aggregatzustand nach Dampf. Software-semantisch benutzen wir sie als
Seitentransformation, die neue Evidenz erzeugen darf.

## Physik-Check

Die Metapher wurde gegen Standardquellen gegengeprüft:

- OpenStax Chemistry 2e: solid/liquid/gas und Plasma als eigener Zustand mit geladenen Teilchen
  https://openstax.org/books/chemistry-2e/pages/1-2-phases-and-classification-of-matter
- Conceptual Physics: Vaporisation ist liquid -> gas; Ionisation wandelt Gas in Plasma
  https://cod.pressbooks.pub/physics1100/chapter/phase-change/
- Stanford Understand Energy: Fusion benötigt extreme Bedingungen und Plasma; Fusion ist keine gewöhnliche nächste Phasenstufe
  https://understand-energy.stanford.edu/energy-resources/nuclear-energy/fusion

## Live-Audit vor diesem Commit

Der STREAM-Worker hat bereits einen erfolgreichen 20.000-Zeilen-Census erzeugt.
Der derzeitige Stream trennt `PUBLIC_ARCHIVE` von
`PERSONAL_ROUTE_METADATA`.

Zusätzlicher Pipeline-Fund:

STREAM und PRESTIGE können gleichzeitig von demselben Commit starten.
Wenn STREAM zuerst `main` fortschreibt, kann ein späteres PRESTIGE-`git push`
auf einem veralteten Checkout non-fast-forward scheitern.

Der Commit-Installer ergänzt deshalb künftig vor dem PRESTIGE-Push:

```bash
git pull --rebase origin main
git push
```

Das ist kein Freeze. Es ist ein sauberer Zusammenfluss zweier Ströme.

## Invariante

```text
PRESERVE
  != FREEZE

SNAPSHOT
  != TERMINAL

FLOW
  = RE-ENTERABLE

UNKNOWN
  = PRESERVED

DIFFERENT
  = PRESERVED

UNRESOLVED
  = PRESERVED
```