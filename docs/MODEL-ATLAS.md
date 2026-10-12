# Zustandsatlas · öffentliche Modellkarte

## Zweck

/modelle/raumzeit/ verbindet acht interaktive, browserseitige Darstellungen
aus der HALVETH-Zustandsmodellfamilie. Jede Darstellung bleibt als Visual
Model erkennbar: Sie macht eine definierte Beziehung sichtbar, ohne daraus
automatisch eine physikalische Messung, eine historische Rekonstruktion oder
eine allgemeine Weltbehauptung zu machen.

## Öffentliche Wege

| Modell | Laufzeitroute | Rechenkern | Prüfkante |
| --- | --- | --- | --- |
| Erste Regel · Plus / Minus | /modelle/raumzeit/#erste-regel | Gegenphasen und Kopplung | endliche Zeichenwerte über den Animationszyklus |
| Wellenfeld · erster Kontakt | /modelle/raumzeit/#wellenfeld | Phasenbahnen und Kontaktkern | endliche Zeichenwerte über den Animationszyklus |
| Dimensionen · Layer-Live-Modell | /modelle/raumzeit/#dimensionen | Ringe, Achsen und Perspektiven | eindeutige Szenen-ID |
| Schichten · Zwischenräume | /modelle/raumzeit/#schichten | getrennte Horizonte und Übergänge | eindeutige Szenen-ID |
| Strudel · räumliche Projektion | /modelle/raumzeit/#strudel-3d | perspektivische Spiralen | endliche Zeichenwerte über den Animationszyklus |
| Strudel · Zeitbahn | /modelle/raumzeit/#strudel-2d | Stationen auf einer Spirale | endliche Zeichenwerte über den Animationszyklus |
| Zwischenraum · Teilung | /modelle/raumzeit/#zwischenraum | rekursive Intervalle | lückenfreie Partition von [0, 1] |
| Beobachterraum | /modelle/raumzeit/#beobachterraum | Quelle, Blick und Ausschnitt | eindeutige Szenen-ID |

## Source lineage

Die öffentliche Runtime ist eine neue, kleine Implementierung in diesem
Repository. Sie fasst eine erhaltene frühere HALVETH-Modellfamilie als
eigenständige, browserseitig ausführbare Karten zusammen. Das aktuelle
Quellverzeichnis enthält nur die neue öffentliche Implementierung:

- modelle/raumzeit/core.mjs — DOM-freie Szenengeometrie
- modelle/raumzeit/view.mjs — Canvas-Renderer und zugängliche Szenenwahl
- modelle/raumzeit/core.test.mjs — Tests der Modellinvarianten

Frühere Fassungen bleiben als eigenständige historische Quellen behandelt.
Die neue Veröffentlichung übernimmt keine Rechte an verlinkten Werken oder
externen Begriffen.

## Prüfumfang

Der Testlauf prüft:

1. alle acht Modell-IDs sind eindeutig und besitzen einen vollständigen
   Metadatensatz;
2. jede Szene produziert an mehreren Punkten ihres Zyklus endliche
   Zeichenprimitive;
3. die rekursive Teilung partitioniert das Einheitsintervall lückenfrei.

Diese Prüfungen bestätigen die genannte Softwarestruktur. Sie sind keine
Messung einer physikalischen, biologischen oder kosmologischen Wirkung.
