# Doppelacht im Materiallabor

Der Versuch startet mit zwei Familien von je 480 Zellen im selben Raum. Ihre Mittellinien liegen in XY und YZ und teilen den Ursprung. Vier versetzte Reihen geben jeder Familie eine endliche Dicke von ungefähr 0,12 Längeneinheiten im Radius. Die Saat bestimmt kleine Abweichungen und Drehungen. Die von den Tangenten abgeleiteten Geschwindigkeiten sind Anfangsdaten. Ab Schritt eins stehen den Bewegungsgleichungen nur Position, Geschwindigkeit, Direktor und Winkelgeschwindigkeit jeder Zelle zur Verfügung.

Eine Zelle hat Masse 1 und isotropes Trägheitsmoment 0,08. Das Modell verwendet dimensionslose Einheiten. Der Direktor ist ein Einheitsvektor mit nematischer Symmetrie. Für den Abstand r < R = 0,46, q = 1 − r²/R² und d = nᵢ·nⱼ gilt

    Uᵢⱼ = s [ A q³ − B q² + J q² (1 − d²) ].

A = 0,030, B = 0,026 und J = 0,012. Innerhalb einer Familie ist s = 1. Zwischen den Familien lässt sich s bei identischer Saat auf 0 oder 1 stellen. Die Kräfte sind der negative Ortsgradient, das Drehmoment auf i ist 2sJq²d(nᵢ×nⱼ), das auf j entgegengesetzt. Ab R verschwinden Potential und erster Ortsgradient. Bei identischer Position bleibt die Kraft endlich und null. Die weichen Zellen dürfen einander durchdringen. Es gibt keine Verschmelzungsregel. Die kompakte dreidimensionale Dichte an jedem Zellzentrum wird aus den realen Nachbarabständen berechnet.

Der Integrator verwendet zwei halbe Impulse um einen freien Orts- und Rotationsschritt. Der Direktor rotiert um die aktuelle Winkelgeschwindigkeit. Optionale lineare Reibung wirkt halb vor und halb nach dem konservativen Schritt. Der Verlust an Translations- und Rotationsenergie wird als Wärme gezählt. Die räumliche Suche dient ausschließlich dazu, Kandidatenpaare zu finden. Der tatsächliche paarweise Abstand in drei Dimensionen entscheidet über die Wechselwirkung.

## Vor der Rechnung festgelegte Prüfwerte

| Vergleich | Akzeptanz |
| --- | --- |
| Kräfte und Paarmomente | Betrag jeder Komponente der Gegensumme < 10⁻¹¹. Numerischer Gradient und Drehableitung weichen pro Komponente < 10⁻⁷ ab. |
| Gesamtimpuls und Gesamtdrehimpuls, einschließlich Eigendrehung | Änderung im konservativen Standardlauf über 2 Modellsekunden < 10⁻⁸ je Komponente. |
| Energie | Betrag von E + Wärme − E₀, normiert mit max(1, Betrag der initialen kinetischen Energie), < 0,002 über 2 Modellsekunden. |
| Zeitschritt | h = 1/120, 1/240, 1/480. Der RMS-Ortsfehler zum feinsten Lauf bei 0,5 Modellsekunden muss beim Halbieren sinken. |
| Räumliche Nachbarschaft | Halbierte Suchzellen bei gleicher physischer Reichweite und gleicher Reihenfolge der Paare liefern identische Zellzustände. Gegenprobe gegen alle ungefilterten Paare einer kleineren Szene. |
| Gekoppelt / entkoppelt | Bei gleicher Saat müssen die Anfangskoordinaten identisch und der RMS-Ortsunterschied nach 2 Modellsekunden > 10⁻⁵ sein. |
| Formbeobachtung | Zu t = 0, 0,5, 2, 5, 10, 20 den Anteil innerhalb von 0,35 Einheiten der eigenen anfänglichen Mittellinie und den RMS-Abstand zur ursprünglichen Ebene messen. Die Referenz wird nur für die Auswertung benutzt. |
| Replay, Kamera und Auswahl | Alle Zellen, IDs und Vektoren müssen nach JSON-Rundlauf und weiterer Rechnung exakt übereinstimmen. Beobachtung beim pausierten Modell erhält den gesamten Zustand. |

Die historischen 2D-Körper-, Druck-, Speicher- und Materialgleichungen bleiben im Vergleichsmodus verfügbar. Das räumliche Paarpotential definiert einen zusätzlichen freien Materialversuch. Eine Aussage über dauerhafte Stabilität, einen topologischen Knoten oder eine physische Kalibrierung erfordert andere Belege. Die mathematische Referenz beschreibt drei gleich schwere Punktmassen auf einer ebenen Achterbahn. [Chenciner und Montgomery, 2000](https://annals.math.princeton.edu/articles/12364)

## Lichtpunkt und Rundumblick

Der Einstieg zeigt zwölf anfangs gleich weit entfernte Musterpaare. Ihre Mittelpunkte liegen an den Ecken eines Ikosaeders auf einem Radius von 3,8 Modelleinheiten. Jede Nachbarschaft enthält zu Beginn 40 blaue und 40 goldene Zellen. Die Form bestimmt den Anfangszustand. Ab dem ersten Schritt wirken die freien Translationen und Drehungen des Materialsolvers.

Die Kamera beginnt bei 6.400 Modelleinheiten. Die projizierten Zellpositionen ergeben einen gemeinsamen Lichtfleck, solange ihre Ausdehnung unter der Bildauflösung liegt. Beim Heranfahren geht der Fleck kontinuierlich in die einzeln projizierten Zellen über. Während der ersten sechs Sekunden fährt die Kamera bis zum Übersichtsabstand von 19,2. Ein Klick oder Tippen auf den fernen Punkt öffnet die Übersicht direkt. Mausrad und Zwei-Finger-Zoom regeln den Abstand. Ziehen dreht den Blick. Unter **Mehr** sind Abstand, Einzelzellverfolgung und die ursprüngliche Doppelacht in zwei Ebenen erreichbar. Reduzierte Bewegung startet pausiert.

Abstand und Kamerawinkel gehören zur Beobachtung. Die zwölf Richtungen liefern eine endliche räumliche Anordnung. Die Darstellung ist ein dimensionsloser Modellversuch. Historische 3D-Replays verwenden ihre ursprünglichen Startbedingungen.
