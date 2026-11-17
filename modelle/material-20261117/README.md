# Material und Kommunikation · additive Vorschau vom 17.11.2026

[Berechnete Forschungsszene](forschung.html) · [Eigenständige Paaransicht](Realitaet_Erste_Regel_Plus_Minus.html) · [Studio](studio/index.html) · [Kommunikationsansicht](labore/beziehungsfaden.html)

Diese Vorschau ergänzt das vorhandene Portfolio unter einem eigenen Pfad.
Sie übernimmt die vollständige aktuelle Forschungs-Website einschließlich
ihrer bisherigen Ansichten, Sprachfunktionen, Sgr-A*-, Wirbel- und Knotenmodule.
Portfolio-Startseite, öffentliche Projektinventur und das vorhandene
[öffentliche Fadennetz](../../universum/faden/) bleiben eigenständiger Bestand.
Kein privates Journal, keine Originalgespräche und kein privates PDF sind enthalten.

## Einstieg und Quellen

Vom Repository-Root aus:

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run preview
```

Danach im lokalen Browser:
`http://127.0.0.1:4187/modelle/material-20261117/forschung.html`.
Die Vorschau wird ausschließlich an Loopback gebunden. Die Modellübersicht
`/modelle/` und ihre EN/RU-Fassungen verlinken diesen Einstieg.

Die Forschungsseite und das Studio verwenden die gleichen browserfähigen
Materialdateien aus `assets/`: `material-engine.js`, `material-model.js` und
`material-view.js`. Der Adapter prüft seinen versionierten Zustand; JSON
erhält Material-IDs, Positionen, Geschwindigkeiten und Orientierungen.
Ansicht und Kamera lesen diesen Zustand. Die gleiche Modellfamilie wird im
separaten [console-only-Repository](https://github.com/Juri-Halveth/console-only)
verwendet; dessen eigener Commit- und Teststand ist gesondert zu prüfen.
Die lokalen Dateihashes dieser Vorschau stehen in [SHARED_SOURCES.json](SHARED_SOURCES.json).
Ein Hash bindet Bytes, nicht die wissenschaftliche Richtigkeit eines Modells.

Die Kommunikationsschicht übernimmt vier vorhandene Projekt-IDs, drei
Kategorien und fünf Membership-Zuordnungen aus dem öffentlichen Katalog vom
02.11.2026, gebunden an [Commit 145d87a](https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/145d87a0943ec5f26652af8cad4cd6bad174bb91/universum/api/relations.json).
Der gesamte damalige Katalog umfasst 18 Projekte, 6 Kategorien und 26 Zuordnungen.
Die neuen Mitteilungen und ihre Reihenfolge sind synthetische Beispiele in
einem eigenen Namensraum; sie sind keine tatsächlichen Projektaktionen.
Der ursprüngliche Faden wird dafür nicht verändert.

## Modell- und Darstellungsgrenzen

- Das Material ist ein dimensionsloses Anschlussexperiment mit eigenen
  Orientierungen und offen gelegter Wechselwirkung. Es ist keine gemessene
  LCD-Wechselwirkung, keine vollständige Flüssigkristallkontinuumsrechnung
  und kein Nachweis elektrischer oder topologischer Teilchenladungen.
- Bildschirmgröße, Zoom, Symbolgröße und die räumliche Modellausdehnung sind
  getrennt von den Masse-/Energieparametern. RGB ist eine
  Darstellungskonvention, keine bewiesene Zuordnung zu Proton/Neutron/Elektron.
- Newton und GW-Inspiral bleiben eigene Referenzmodelle. Gültigkeitsgrenzen
  werden als Grenzen angezeigt; eine unaufgelöste Verschmelzung wird nicht
  als gerechnete Physik ausgegeben.
- Sgr-A* bleibt ein synthetisches Modelllabor mit Quellenhinweisen, keine
  neue EHT-Messung. Das Wirbellabor bucht Reservoirwärme; diese ist nicht
  automatisch rückwirkender Gasdruck oder eine Kelvin-Temperatur.
- Die Kommunikationsansicht trifft keine Rechtsentscheidung und leitet
  aus einer Linie weder Kausalität, Datenzugriff noch menschlichen Konsens ab.
  Sonifikation beginnt nur auf Klick; Canvas-Videos enthalten keinen Ton.
- Die Hauptaktionen und zentrale Hinweise unterstützen DE/EN/RU. Neuere
  Fachartikel sind teilweise deutsch; die vorhandene Sprachanzeige nennt
  ihre tatsächliche Teilabdeckung.
- Browseraufnahme und Offline-Export haben unterschiedliche Zeit-/Bildraten.
  Eine angefragte Bildrate ist keine garantierte tatsächliche Bildrate.

## Pfadgebundene Rechte

| Bestandteil | Bedingungen und Herkunft |
| --- | --- |
| `assets/material-engine.js`, `assets/material-model.js`, `assets/material-view.js` | MIT. Vollständiger vorhandener `console-only`-Hinweis unter [materials-LICENSE-MIT.txt](materials-LICENSE-MIT.txt), SHA-256 `bb02fcf3da07ae972aa4f9048207f21f7514428106b33decf2dd29f02e904028`. Der ursprüngliche MIT-Header im Rechenkern bleibt erhalten. |
| `assets/narrative-channels.js`, `labore/beziehungsfaden.html` und neue originale Portalpräsentation | Bestehende [HALVETH PIRL 2.0](../../LICENSE-HALVETH-PIRL-2.0.md), soweit die entsprechenden Rechte bestehen. Keine pauschale Umlizenzierung übernommener Programme. |
| `modules/sgra/` | Eigene erhaltene [MIT-Notice](modules/sgra/LICENSE.txt). Externe EHT-Daten und Forschung behalten ihre eigenen Bedingungen. |
| `modules/wirbel/` | Eigene erhaltene [MIT-Notice](modules/wirbel/LICENSE.txt); ursprüngliche Quell- und Datenhinweise bleiben maßgeblich. |
| Weitere übernommene Rechen-/Sprachmodule, ursprüngliche Illustrationen, externe Quellen | Ihre ursprünglichen pfad- und versionsgebundenen Hinweise und wirksamen Grants bleiben erhalten. Die Portal-Lizenz erweitert keine Drittbedingungen und zieht frühere Grants nicht zurück. |

Die vollständige Zuordnung des Repositorys steht in [LICENSES.md](../../LICENSES.md).
PIRL 2.0 ist source-available und keine OSI-anerkannte Open-Source-Lizenz.

## Doppelacht in drei Dimensionen

[Versuch öffnen](forschung.html?modell=doppelacht). Blau und Gold kennzeichnen je 480 frei bewegliche Materialzellen. Ziehen dreht die Kamera. Unter **Mehr** lassen sich Front-, Seiten- und Draufsicht, Familienkopplung und Zellverfolgung wählen. JSON speichert Ort, Geschwindigkeit, Orientierung, Drehung, Dichte und Modellzeit. Der Flugraum kann denselben Materialzustand laden. [Modell und vorab festgelegte Toleranzen](DOPPELACHT.md).

[Aus dem Lichtpunkt in den Rundumblick](forschung.html?modell=doppelacht) · [Ursprüngliche Doppelacht in zwei Ebenen](forschung.html?modell=doppelacht&start=klassisch). Mausrad oder zwei Finger regeln den Abstand. Die Einzelzellen bleiben beim Wechsel der Perspektive identifizierbar.
