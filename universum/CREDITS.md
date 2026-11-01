# Starship Lab · Quellen und Rechte

Diese öffentliche Browserfassung entstand am 1. November 2026 als statische Teilmenge des lokal geprüften Starship Lab v0.13. Spätere Korrekturen an Bedienung und Katalogtext brachten die öffentliche Oberfläche auf v0.15. Das aktuelle vollständige lokale Paket v0.15 wurde frisch entpackt und mit 173/173 bestandenen Tests geprüft; Paket und Testumgebung sind von der veröffentlichten Route getrennt. Die Route enthält die für die Browseransicht benötigten statischen Dateien, aber keine lokale Startsoftware oder internen Arbeitsbelege. Die Modelle arbeiten im Browser; aus ihnen folgt keine Aussage über reale Physik, Biologie, Personen oder eine vollständige Projektgeschichte. Öffentliche Projektlinks werden erst nach einer Auswahl geöffnet.

Die neue Oberfläche und ihre Adapter stehen unter [HALVETH PIRL 2.0](vendor/licenses/LICENSE-HALVETH-PIRL-2.0.md), soweit eigene schutzfähige Rechte bestehen. Die folgenden übernommenen Module und Bilder behalten **ihre jeweiligen** Bedingungen. Die Zuordnung ist auch in der [Lizenzkarte des Website-Repositories](../LICENSES.md) vermerkt.

| Datei in dieser Route | Gepinnte öffentliche Quelle oder Herkunft | Bedingungen |
| --- | --- | --- |
| `vendor/scarlet/core.js`, `vendor/scarlet/live-core.js` | [SCARLET Weltkeimwerk, Commit 6913b81](https://github.com/Juri-Halveth/halveth-scarlet/tree/6913b81d3e2414b20149406cb3e2fe9bb314adf4/forschung/weltkeimwerk) | [HALVETH PIRL 2.0](vendor/licenses/LICENSE-HALVETH-PIRL-2.0.md), Juri Janovski / HALVETH |
| `vendor/red-room/assets/red-room-swarm-model.mjs` | [SCARLET Modell, Commit 6913b81](https://github.com/Juri-Halveth/halveth-scarlet/blob/6913b81d3e2414b20149406cb3e2fe9bb314adf4/assets/red-room-swarm-model.mjs) | [HALVETH PIRL 2.0](vendor/red-room/LICENSE-HALVETH-PIRL-2.0.md), Juri Janovski / HALVETH |
| `vendor/endeck/model.mjs` | [Forschungslabor ENDECK, Commit 2cb8eb3](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/2cb8eb38e4276b0b821731d4f1056cd06a8b8631/branches/endeck-observer/model.mjs) | [MIT](vendor/licenses/ENDECK-MIT-LICENSE.txt), HALVETH Open Research contributors |
| `vendor/fold/model.js` | [Forschungslabor Faltgrenze, Commit 2cb8eb3](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/2cb8eb38e4276b0b821731d4f1056cd06a8b8631/branches/fold-resolution-lab/model.js) | [MIT](vendor/fold/LICENSE), HALVETH Open Research contributors |
| `vendor/realms/shared/world.mjs` | [Realms, Commit 01a8400](https://github.com/Juri-Halveth/halveth-realms/blob/01a84005c19379e9fe7bee9567c3cb7140fe3d37/shared/world.mjs) | [MIT](vendor/realms/LICENSE), Realms contributors |
| `vendor/field-difference/physics.js` | [Field Difference Lab, Commit 7ed3788](https://github.com/Juri-Halveth/halveth-field-difference-lab/blob/7ed3788aec2593bfbaa4d6433aec8870ccbc4ff7/physics.js) | [Apache 2.0](vendor/field-difference/LICENSE) und [NOTICE](vendor/field-difference/NOTICE), Juri Janovski / HALVETH |
| `vendor/perspective/source-model.mjs` | Eigenständiges, synthetisches Perspektivmodell, abgeleitet aus [Field Difference Lab, Commit 4b7fb2f](https://github.com/Juri-Halveth/halveth-field-difference-lab/commit/4b7fb2fe07e6b8287588f861eeb7859c0c64525a) | [Apache 2.0](vendor/perspective/SOURCE_MODEL_LICENSE.txt), Copyright 2026 Juri Janovski |

## Bilder

| Datei | Gepinnte Bildquelle | Zuordnung |
| --- | --- | --- |
| `assets/previews/scarlet-capability.svg` | [SCARLET Capability Room](https://github.com/Juri-Halveth/halveth-scarlet/blob/6913b81d3e2414b20149406cb3e2fe9bb314adf4/assets/capability-room-preview.svg) | Juri Janovski / HALVETH, [HALVETH PIRL 2.0](vendor/licenses/LICENSE-HALVETH-PIRL-2.0.md); Dateiname für diese Route angepasst |
| `assets/previews/scarlet-wegweiser.png` | [SCARLET Wegweiser](https://github.com/Juri-Halveth/halveth-scarlet/blob/6913b81d3e2414b20149406cb3e2fe9bb314adf4/forschung/wegweiser/preview.png) | Juri Janovski / HALVETH, [HALVETH PIRL 2.0](vendor/licenses/LICENSE-HALVETH-PIRL-2.0.md); Dateiname für diese Route angepasst |
| `assets/previews/forschungslabor-chronosphere.png` | [Forschungslabor Chronosphere](https://github.com/Juri-Halveth/halveth-forschungslabor/blob/2cb8eb38e4276b0b821731d4f1056cd06a8b8631/branches/temporal-clock/preview.png) | HALVETH Open Research contributors, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); Dateiname für diese Route angepasst, Bildbytes unverändert |

`assets/mark.svg` und `assets/system-banner.svg` sind HALVETH-Systemgrafiken der neuen Oberfläche; die Bildreferenzen in Projektkarten bezeichnen ihre jeweilige Quelle direkt in der Ansicht.

## Atlas

Der Atlas-Raum verwendet einen eigenen JavaScript-Adapter zu einem für die lokale Prototypentwicklung bereitgestellten PRO-ATLAS-Pythonmodell. Diese öffentliche Route enthält weder das Quellarchiv noch dessen interne Prüfschritte. Der Adapter erzeugt Modellansichten; er belegt keine physikalische Materialisierung, fremde Zustimmung oder Release-Autorität.

Alle gepinnten Quellangaben bezeichnen einen Quellstand. Sie sind kein Beweis für die Wirkung der neuen Browserintegration. Die lokalen Tests des vollständigen v0.15-Pakets und die Beobachtung dieser veröffentlichten Route werden getrennt geführt.
