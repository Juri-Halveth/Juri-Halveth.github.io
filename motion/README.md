# HALVETH · Form wird Bewegung

Eine eigene, durch Code gestaltete Komposition: 20 Sekunden, kontinuierliche
Raumkurven, warme Lichtbahnen und gestaffelte Typografie. Auf der Startseite und
unter [/motion/](https://juri-halveth.github.io/motion/) spielbar.

## Bedienung

Pause, Rückwärtslauf, Zeitregler, 0.25×/0.5×/1×/2×, Lichtstärke und fünf direkte
Kapitel. Wiederholung ist eine ausdrückliche Auswahl. Bei reduzierter Bewegung
öffnet sich eine ruhende Ansicht; Abspielen bleibt verfügbar. Verdeckte Tabs
und Bereiche außerhalb des Sichtfelds pausieren den Zeitfortschritt.

## Zeitvertrag und Gestaltung

`motion-core.js` bindet jeden Zustand direkt an `t` in `[0, 20]` Sekunden.
Formwachstum, Drehung, organische Verformung, Schrift und Licht besitzen eigene
Kurven auf derselben Zeitachse. Bei einer Rückkehr zu `t` bleibt der numerische
Zustand identisch. Browser, Schrift und Rasterisierung können die resultierenden
Pixel beeinflussen.

Der Übergang verwendet `S(u) = 6u⁵ − 15u⁴ + 10u³`. Geschwindigkeit und
Beschleunigung sind an beiden Übergangsenden null. Umlaufende Lichtpunkte
werden aus kontinuierlichen trigonometrischen Bahnen berechnet. Ihre Position
wird beim Spulen weder auf ein Frame noch auf einen Kurvenstützpunkt gerundet.

Räumliche Kurven werden perspektivisch auf Canvas projiziert. Leuchten entsteht
aus radialen Farbverläufen und weich gezeichneten Lichtspuren. Dies ist ein
Grafikmodell für die Komposition; die Darstellung bleibt eine Projektion.

Ein lokal bereitgestellter Referenzclip regte Lichtfarbe, typografische
Staffelung und gemeinsam veränderte Form-/Licht-/Zeitkurven an. Die Prüfung
dekodierte 2934 Frames und betrachtete 196 Bildproben über 97.8 Sekunden plus
36 Detailproben. Drei Ausschnitte wurden jeweils vorwärts und rückwärts in
Viertelgeschwindigkeit exportiert. Die Aufnahme zeigt vereinzelte
Kurvenanweisungen auf einem gefilmten Bildschirm; Originalprojektcode und
Autorschaft bleiben offen. Der hier veröffentlichte Renderer wurde eigenständig
geschrieben. Referenzvideo und abgeleitete Bildausschnitte bleiben lokal.

## Git Bash

```bash
bash SPACE.sh build
bash SPACE.sh check
bash SPACE.sh preview
```

Der Browser-Player benötigt Canvas 2D und eigene statische Dateien. Er lädt
keine externen Skripte, Schriften oder Pakete.

Der optionale CPU-Export verwendet Node.js, `@napi-rs/canvas` und FFmpeg.
Der lokale geprüfte Export verwendete `@napi-rs/canvas` 0.1.100.

```bash
npm install --no-save --package-lock=false @napi-rs/canvas@0.1.100
bash SPACE.sh motion --out motion-render --width 1920 --height 1080 --fps 30 --ffmpeg ffmpeg
```

Der Export erzeugt sechs PNGs, ein Poster, das H.264-Video und `RENDER.json`.
Ohne `--ffmpeg` entstehen nur die Standbilder und das Receipt.
Das Video ist eine eigene stumme Komposition.

## Prüfung und Weiterbau

Die Vertragstests prüfen 601 direkt und rückwärts aufgerufene Zeitstände,
Bildratenunabhängigkeit des Zustands, Enden und bewusste Wiederholung, stetiges
Wachstum, ungültige Eingaben und die Playback-Bedienung in einem DOM-Fixture.
Der CPU-Export erlaubt eine eigene Bildprüfung aus demselben Bewegungscode.
Das Fixture ersetzt eine Browserprüfung der tatsächlichen Darstellung.

Die Zeitfunktionen können später Magie, Materiallicht und Menüübergänge
steuern. Figurenanatomie, Bodenphysik und die native OpenMW-Anbindung besitzen
eigene Umsetzungs- und Prüfstände; diese Webkomposition installiert dort keine
Spielassets.

Renderer, Playback-Code, Exportwerkzeug und zugehörige Tests: MIT, siehe
[LICENSE-MIT.txt](LICENSE-MIT.txt). Das übrige Portal führt seine bisherige
Lizenzzuordnung in [LICENSES.md](../LICENSES.md).
