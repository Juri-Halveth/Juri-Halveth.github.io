/* Static, source-bound previews. Illustrations are diagrams, not captured runtime states. */
(function () {
  'use strict';

  const diagram = (name, alt, source) => ({
    src: `assets/teasers/${name}.svg`, alt,
    label: 'Schematische Funktionsillustration', source,
    credit: 'HALVETH · eigens gezeichnete Illustration nach der verlinkten Projektquelle',
    kind: 'illustration'
  });
  const item = (id, title, media, steps) => Object.freeze({
    id, title, media: Object.freeze(media),
    steps: Object.freeze(steps.map(step => Object.freeze({ title: step[0], detail: step[1] })))
  });
  const entries = {
    'halveth-scarlet': item('halveth-scarlet', 'SCARLET', {
      src: 'assets/previews/scarlet-capability.svg',
      alt: 'SCARLET Capability Room: farbige Zustandsbereiche und Verbindungen.',
      label: 'Projektgrafik · SCARLET Capability Room',
      source: 'https://github.com/Juri-Halveth/halveth-scarlet/blob/6913b81d3e2414b20149406cb3e2fe9bb314adf4/assets/capability-room-preview.svg',
      credit: 'Juri Janovski / HALVETH · HALVETH PIRL 2.0', kind: 'illustration'
    }, [
      ['Textzustand starten', 'Im Browser Text und Startwert setzen; GStar vergibt eine lokale Zustands-ID und einen Digest.'],
      ['Variante zurückverfolgen', 'Eine Variante ableiten und Elternbezug, Snapshot, Replay und JSON-Export prüfen.'],
      ['Zellmodell abgrenzen', 'GStarLiving zeigt endliche Modellereignisse; ein Replay prüft keine äußere Wirklichkeit.']
    ]),
    'lucinet-seedspace': item('lucinet-seedspace', 'LUCINET / NOVA', diagram('nova',
      'Schematische Suche: Notizen und Code führen über eine Korrektur zum nächsten belegten Schritt.',
      'https://github.com/Juri-Halveth/lucinet-seedspace/tree/6d0e91c056caee46e2ca2d4faaf7bcdd1975dddc'), [
      ['CLI-Demo starten', 'python nova/nova.py --workspace ./nova-demo demo erzeugt einen lokalen Beispielbestand.'],
      ['Quellspuren lesen', 'Datei, Fundspan und Revision mit Korrekturen und nächstem Schritt im Receipt prüfen.'],
      ['Lokal verifizieren', 'Der verify-Befehl prüft gespeicherte Quellen und Ergebnisse, nicht deren äußere Wahrheit.']
    ]),
    'halveth-forschungslabor': item('halveth-forschungslabor', 'FORSCHUNGSLABOR', {
      src: 'assets/previews/forschungslabor-chronosphere.png',
      alt: 'Projektvorschau der Chronosphere aus dem Forschungslabor.',
      label: 'Projektvorschau · Chronosphere-Experiment',
      source: 'https://github.com/Juri-Halveth/halveth-forschungslabor/blob/2cb8eb38e4276b0b821731d4f1056cd06a8b8631/branches/temporal-clock/preview.png',
      credit: 'HALVETH Open Research contributors ↗', kind: 'screenshot'
    }, [
      ['Experiment öffnen', 'Im Werkzeugkatalog ENDECK oder das ausführbare Encounter-Labor auswählen.'],
      ['Gegenprobe ausführen', 'Stabile Punkt-IDs gegen 2D/3D-Projektionen oder zwölf Encounter-Vergleiche prüfen.'],
      ['Geltung benennen', 'Quellcode und Tests binden Modellregeln; sie belegen keine äußere oder physische Wirkung.']
    ]),
    'halveth-tresor': item('halveth-tresor', 'TRESOR', {
      src: 'assets/teasers/tresor-dashboard.png',
      alt: 'Tatsächlicher Tresor-Dashboard-Screenshot mit synthetischen Beispieldaten.',
      label: 'Screenshot · Tresor-Dashboard mit Beispieldaten',
      source: 'https://github.com/Juri-Halveth/halveth-tresor/blob/e1ca9830e84099f0e4a9a4bfdede919a5ab0eee6/assets/screenshots/dashboard.png',
      credit: 'Juri Janovski / HALVETH ↗', kind: 'screenshot'
    }, [
      ['Release prüfen', 'Windows-v1.8.0-EXE herunterladen und ihren SHA-256-Wert mit der Releaseangabe vergleichen.'],
      ['Test-Tresor anlegen', 'Einträge lokal mit AES-256-GCM speichern; den Recovery-Key getrennt sichern.'],
      ['Schutzgrenze lesen', 'Masterpasswort und PIN sind kombiniert, keine 2FA; EXE ohne Signatur oder Fremdaudit.']
    ]),
    'mein-lernportal': item('mein-lernportal', 'MEIN LERNPORTAL', diagram('lernportal',
      'Drei schematische Lernkarten für digitale Grundlagen, Programmierung und Übungen.',
      'https://github.com/Juri-Halveth/mein-lernportal/tree/8ff9c2fa3e4fbf3a5795b06d1d9c77819b592292'), [
      ['Katalog öffnen', 'Aus 702 Lektionen und Quizzen in 13 Themenwelten ohne Pflichtkonto wählen.'],
      ['Aufgabe ausführen', 'Codeübungen laufen in einem kurzlebigen Worker in einem getrennten Browser-Frame.'],
      ['Lernstand mitnehmen', 'Fortschritt im Browser speichern, exportieren oder löschen; kein zertifizierter Abschluss.']
    ]),
    'halveth-field-difference-lab': item('halveth-field-difference-lab', 'FIELD DIFFERENCE', diagram('field-difference',
      'Zwei gezeichnete Bewegungsbahnen beginnen gleich und weichen unter verschiedenen Modellregeln ab.',
      'https://github.com/Juri-Halveth/halveth-field-difference-lab/tree/572734742951819993b10d89b22591951a49dbc8'), [
      ['Vier Welten starten', 'Dieselben festen Startwerte vergleichen; κ verändert die zentrale Beschleunigungsregel.'],
      ['Grenzen vergleichen', 'Analytischen Feldübergang und synthetische Erst-/Letztwert-Parserregel getrennt prüfen.'],
      ['Modellgrenze lesen', 'Dimensionslose Bahnen und Parserbeispiele sind weder Messung noch Sicherheitsbefund.']
    ]),
    'c-drohne-red-room': item('c-drohne-red-room', 'C-DROHNE / RED ROOM', {
      src: 'assets/teasers/red-room-nightlight.webp',
      alt: 'Synthetische Nightlight-3D-Szene: Drohne über einer nächtlichen Straße neben einer Figur.',
      label: 'Projektbild · synthetische Nightlight-3D-Szene',
      source: 'https://github.com/Juri-Halveth/c-drohne-red-room/blob/f0b072571ccb1a7894a32b1ba03c9a8620995352/dist/assets/nightlight-3d-poster-20261027.png',
      credit: 'Juri Janovski / HALVETH · Projektbild, für diese Route skaliert und als WebP kodiert', kind: 'illustration'
    }, [
      ['Falllabor öffnen', 'Auf der Projektseite drei erfundene Meldungen durch neun Gegenproben führen.'],
      ['Quellspur prüfen', 'Ursprung, Kopie, Zeit und spätere Korrektur getrennt auswerten; Nightlight zeigt die 3D-Idee.'],
      ['Entwurf einordnen', 'Film und Browserfälle sind synthetisch; keine Drohne ist angeschlossen oder im Feld geprüft.']
    ]),
    'halveth-realms': item('halveth-realms', 'HALVETH REALMS', diagram('realms',
      'Schematische Fantasy-Welt aus zwei Geländeabschnitten mit markierten Zustandsänderungen.',
      'https://github.com/Juri-Halveth/halveth-realms/blob/main/README.md'), [
      ['Vorschau spielen', 'Windows-v0.2.0-Vorschau starten oder den Quellstand lokal mit Node/WebGL öffnen.'],
      ['Welt verändern', 'Ein Seed erzeugt die Welt; Aktionen, NPC-Erinnerungen und Checkpoints bleiben lokal erhalten.'],
      ['Reife einordnen', 'Bis zu zehn lokale Gäste teilen einen Prototyp, keinen öffentlich betriebenen MMO-Dienst.']
    ]),
    'halveth-cannabis-reform-forschung': item('halveth-cannabis-reform-forschung', 'QUELLEN & REFORM', {
      src: 'assets/teasers/cannabis-concept.webp',
      alt: 'Generierte Konzeptillustration mit Cannabispflanze und zwei abstrakten Strömen; keine Messdarstellung.',
      label: 'Projekt-Konzeptillustration · keine Messwerte',
      source: 'https://github.com/Juri-Halveth/halveth-cannabis-reform-forschung/blob/67e4145734cd81e9e7727e2a051da06f3145dc36/assets/hero-neu.png',
      credit: 'Juri Janovski / HALVETH · generierte Konzeptkunst des Projekts, für diese Route skaliert und als WebP kodiert',
      kind: 'illustration'
    }, [
      ['Originalquellen öffnen', 'In quellen.html Studien und die Grenzen ihrer jeweiligen Aussage nachlesen.'],
      ['Messplan prüfen', 'labor.html trennt THC-Serumwert, Fahrleistung und prospektiv zu prüfende Fehlerquoten.'],
      ['Vorschlag einordnen', 'index.html enthält politische Forderungen; eigene Human- oder Gerätemesswerte liegen nicht vor.']
    ]),
    'lernstudio': item('lernstudio', 'LERNSTUDIO', diagram('lernstudio',
      'Gezeichneter Lernpfad mit Lernkarte, Mission und Fortschrittslinie.',
      'https://github.com/Juri-Halveth/lernstudio/tree/9309f69883e9ae66290829722012deda5ed982c9'), [
      ['Erste Mission starten', 'Im Browser einen Track wählen und eine konkrete Lernkarte oder Spielmission bearbeiten.'],
      ['Fortschritt prüfen', 'Lernstand lokal halten oder optional synchronisieren; api/space.json indiziert öffentliche Inhalte.'],
      ['Nachweis einordnen', 'Bearbeitete Aufgaben zeigen Lernaktivität, keinen zertifizierten Lernerfolg.']
    ]),
    'fortuna': item('fortuna', 'FORTUNA', {
      src: 'assets/teasers/fortuna.svg',
      alt: 'Schematische RNG-Konzeptgrafik: Bernoulli-Ziehungen im eigenen Browsermodell, Ergebniszähler und getrennte lokale Versuche.',
      label: 'Konzeptgrafik · Browserlabor und getrennte lokale Versuche',
      source: 'https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/universum/assets/teasers/fortuna.svg',
      credit: 'HALVETH · eigene Konzeptgrafik; Browserlabor und lokaler Prototyp haben unterschiedliche Grenzen',
      kind: 'illustration'
    }, [
      ['Glücksversuch starten', 'Zwei eigene Web-Crypto-Serien mit bis zu 999.999 Ziehungen je Serie ausführen; Treffer, Fortschritt und Abbruch sind sichtbar.'],
      ['Optionen separat vergleichen', 'Der zweite Browserpfad berechnet aus eingegebenen Optionen und Gewichten eine deterministische Rangfolge.'],
      ['Lokale und externe Wirkung trennen', 'Ein separater Loopback-Prototyp führt eigene Serverprozesse aus. Fremde Spiel- oder Serverergebnisse werden nicht verändert.']
    ]),
    'halveth-project0-keeper': item('halveth-project0-keeper', 'PROJECT0 KEEPER', diagram('keeper',
      'PowerShell-Fenster neben einer schematischen lokalen Zustandsdatei.',
      'https://github.com/Juri-Halveth/halveth-project0-keeper/tree/f4349d013efb7105e2875784a0c7c16d2026e3da'), [
      ['Skripte öffnen', 'Im Repository scripts/ und die Zustandsdateien unter constellation/ lesen.'],
      ['TRIAD verfolgen', 'Zustandsdateien dokumentieren Beobachtung, Kontinuität und Entscheidungen für ASTER, RACHEL und SHELLA.'],
      ['Scope einordnen', 'Der Quellzweig ist experimentelle Projektsteuerung, kein Handels- oder Ertragsdienst.']
    ]),
    'halveth-morrowind-genesis': item('halveth-morrowind-genesis', 'MORROWIND GENESIS', diagram('morrowind',
      'Schematische Inselkonturen und ein Modding-Baustein für OpenMW-Weltbau.',
      'https://github.com/Juri-Halveth/halveth-morrowind-genesis/blob/main/README.md'), [
      ['OpenMW einrichten', 'docs/SETUP.md führt durch OpenMW 0.51 mit eigener lizenzierter Morrowind-Installation.'],
      ['Im Spiel erproben', 'Figurendialog, Gedächtnis, Wissen, Alchemie und Kamera greifen auf geladene Spieldaten zu.'],
      ['Grenze beachten', 'Das Repo enthält keine Bethesda-Daten; Genesis Zero ist ein getrennter WebGL-Prototyp.']
    ]),
    'halveth-unreal': item('halveth-unreal', 'HALVETH UNREAL', diagram('unreal',
      'Schematisches 3D-Szenengitter neben einer Entwicklungsnotiz.',
      'https://github.com/Juri-Halveth/halveth-unreal/blob/main/README.md'), [
      ['Windows-v0.1 spielen', 'Das veröffentlichte Release startet den nativen Unreal-5.8-C++-Prototyp offline.'],
      ['Vier Reiche erkunden', 'Seed, Portale, Bibliothek, Rezepte und Bauzustände bilden den lokalen Spielkern.'],
      ['Versionen trennen', '0.2 hat einen validierten Quell-/Buildstand, aber kein veröffentlichtes 0.2-Release.']
    ]),
    'halveth-tron-security-lab': item('halveth-tron-security-lab', 'TRON SECURITY LAB', diagram('tron',
      'Zwei schematische Quorummengen mit sichtbar markierter Schnittmenge.',
      'https://github.com/Juri-Halveth/halveth-tron-security-lab/pull/1'), [
      ['PR #1 öffnen', 'Den Offline-Entwurf des java-tron-Forschungsforks direkt im Pull Request lesen.'],
      ['Quoren berechnen', 'Schnittmengen und Verfügbarkeit mit deklarierten Eingaben im lokalen Modell vergleichen.'],
      ['Evidenzgrenze prüfen', 'Der Entwurf liegt nicht auf main; kein produktiver Protokolleffekt ist damit belegt.']
    ]),
    'leviathan-wallet-portal': item('leviathan-wallet-portal', 'LEVIATHAN PORTAL', diagram('wallet',
      'Öffentliche Adressansicht neben einem gesondert gesperrten Wallet-Bereich.',
      'https://github.com/Juri-Halveth/leviathan-wallet-portal/blob/main/README.md'), [
      ['Öffentlich lesen', 'Cosmos- und EVM-Positionen per Adresse abrufen; Lücken und Quellenzeiten bleiben sichtbar.'],
      ['Wallet gezielt verbinden', 'Erst nach eigener Aktion fordert der Browser Kontozugriff für unterstützte Wallets an.'],
      ['Transfer selbst bestätigen', 'ETH/GTC-Vorprüfungen ersetzen keine Wallet-Signatur; Gebühren und Mainnet-Risiko bleiben real.']
    ]),
    'Juri-Halveth.github.io': item('Juri-Halveth.github.io', 'HALVETH WEB-EINGANG', diagram('web',
      'Schematische Portfolio-Webseite mit drei Projekt- und Quellenfeldern.',
      'https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/README.md'), [
      ['Arbeitsprobe öffnen', 'Die Portfolio-Startseite führt direkt zu laufenden Demos und zwei dokumentierten Fallstudien.'],
      ['Katalog abfragen', 'Der öffentliche Projektkatalog ordnet 18 Quellen und leitet zum jeweiligen Repository weiter.'],
      ['Quelle verifizieren', 'Starship ist ein Zugang; die technische Wirkung steht im Projektcode und dessen Prüfbelegen.']
    ]),
    'Juri-Halveth': item('Juri-Halveth', 'GITHUB-PROFIL', diagram('profile',
      'Schematische Profil-README mit Person, Projektlinks und Arbeitsproben.',
      'https://github.com/Juri-Halveth/Juri-Halveth/blob/main/README.md'), [
      ['Direkte Beispiele wählen', 'Die Profil-README zeigt vier konkrete Projekte mit unmittelbaren Startlinks.'],
      ['HALVETH zuordnen', 'Person, Projekt und Quellrepository sind im öffentlichen Profil getrennt benannt.'],
      ['Code am Ursprung prüfen', 'Profiltexte verlinken Arbeitsproben; sie sind selbst kein Funktions- oder Wirkungsbeleg.']
    ])
  };

  window.HALVETH_TEASERS = Object.freeze({
    schema: 'halveth.teasers.v1', entries: Object.freeze(entries)
  });
}());
