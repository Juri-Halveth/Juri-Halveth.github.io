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
      ['Text setzen', 'Einen Ausgangszustand im Browsermodell festlegen.'],
      ['Variante ableiten', 'Unterschiede und Herkunft der Variante verfolgen.'],
      ['Modell ansehen', 'Die getrennte, endliche Zellensimulation untersuchen.']
    ]),
    'lucinet-seedspace': item('lucinet-seedspace', 'LUCINET / NOVA', diagram('nova',
      'Schematische Suche: Notizen und Code führen über eine Korrektur zum nächsten belegten Schritt.',
      'https://github.com/Juri-Halveth/lucinet-seedspace/tree/6d0e91c056caee46e2ca2d4faaf7bcdd1975dddc'), [
      ['Lokal suchen', 'Frühere Notizen und Code im eigenen Bestand finden.'],
      ['Korrekturen halten', 'Fundstellen und Änderungen nachvollziehbar zuordnen.'],
      ['Weiterarbeiten', 'Mit einem belegten nächsten Schritt fortsetzen.']
    ]),
    'halveth-forschungslabor': item('halveth-forschungslabor', 'FORSCHUNGSLABOR', {
      src: 'assets/previews/forschungslabor-chronosphere.png',
      alt: 'Projektvorschau der Chronosphere aus dem Forschungslabor.',
      label: 'Projektvorschau · Chronosphere-Experiment',
      source: 'https://github.com/Juri-Halveth/halveth-forschungslabor/blob/2cb8eb38e4276b0b821731d4f1056cd06a8b8631/branches/temporal-clock/preview.png',
      credit: 'HALVETH Open Research contributors · CC BY 4.0', kind: 'screenshot'
    }, [
      ['Werkzeug wählen', 'Im Katalog Perspektive, Optik, Ereignisse oder Regeln öffnen.'],
      ['Modell befragen', 'Annahmen und Eingaben des gewählten Experiments betrachten.'],
      ['Gegenprobe lesen', 'Unterschiede im jeweiligen Modell nachvollziehen.']
    ]),
    'halveth-tresor': item('halveth-tresor', 'TRESOR', {
      src: 'assets/teasers/tresor-dashboard.png',
      alt: 'Tatsächlicher Tresor-Dashboard-Screenshot mit synthetischen Beispieldaten.',
      label: 'Screenshot · Tresor-Dashboard mit Beispieldaten',
      source: 'https://github.com/Juri-Halveth/halveth-tresor/blob/e1ca9830e84099f0e4a9a4bfdede919a5ab0eee6/assets/screenshots/dashboard.png',
      credit: 'Juri Janovski / HALVETH · Bildbytes aus dem Projekt, Rechte dort maßgeblich', kind: 'screenshot'
    }, [
      ['Release prüfen', 'Windows-Version und Hinweise im Projekt ansehen.'],
      ['Lokal verwalten', 'Das Projekt beschreibt eine verschlüsselte lokale Datei.'],
      ['Sicherheitsmodell lesen', 'Quellcode, Release und Grenzen zusammen betrachten.']
    ]),
    'mein-lernportal': item('mein-lernportal', 'MEIN LERNPORTAL', diagram('lernportal',
      'Drei schematische Lernkarten für digitale Grundlagen, Programmierung und Übungen.',
      'https://github.com/Juri-Halveth/mein-lernportal/tree/8ff9c2fa3e4fbf3a5795b06d1d9c77819b592292'), [
      ['Thema finden', 'Digitale Grundlagen, Programmierung oder Mathematik wählen.'],
      ['Lektion lesen', 'Den Lernkatalog ohne Pflichtkonto öffnen.'],
      ['Übung angehen', 'Das gewählte Thema mit Aufgaben vertiefen.']
    ]),
    'halveth-field-difference-lab': item('halveth-field-difference-lab', 'FIELD DIFFERENCE', diagram('field-difference',
      'Zwei gezeichnete Bewegungsbahnen beginnen gleich und weichen unter verschiedenen Modellregeln ab.',
      'https://github.com/Juri-Halveth/halveth-field-difference-lab/tree/572734742951819993b10d89b22591951a49dbc8'), [
      ['Gleich starten', 'Dieselbe Ausgangslage für beide Ansichten verwenden.'],
      ['Regel variieren', 'Eine Modellregel gegenüberstellen.'],
      ['Bahnen vergleichen', 'Die entstehenden Bewegungsunterschiede ablesen.']
    ]),
    'c-drohne-red-room': item('c-drohne-red-room', 'C-DROHNE / RED ROOM', {
      src: 'assets/teasers/red-room-nightlight.webp',
      alt: 'Synthetische Nightlight-3D-Szene: Drohne über einer nächtlichen Straße neben einer Figur.',
      label: 'Projektbild · synthetische Nightlight-3D-Szene',
      source: 'https://github.com/Juri-Halveth/c-drohne-red-room/blob/f0b072571ccb1a7894a32b1ba03c9a8620995352/dist/assets/nightlight-3d-poster-20261027.png',
      credit: 'Juri Janovski / HALVETH · Projektbild, für diese Route skaliert und als WebP kodiert', kind: 'illustration'
    }, [
      ['Szene öffnen', 'Die synthetische 3D-Perspektive ansehen.'],
      ['Quellspur lesen', 'Meldung, Weitergabe und frische Beobachtung trennen.'],
      ['Blickwinkel wechseln', 'Dieselbe Fallskizze aus mehreren Ansichten betrachten.']
    ]),
    'halveth-realms': item('halveth-realms', 'HALVETH REALMS', diagram('realms',
      'Schematische Fantasy-Welt aus zwei Geländeabschnitten mit markierten Zustandsänderungen.',
      'https://github.com/Juri-Halveth/halveth-realms/blob/main/README.md'), [
      ['Weltidee ansehen', 'Den prozeduralen Fantasy-Sandbox-Prototyp einordnen.'],
      ['Laufzeit prüfen', 'Die lokale Weltlaufzeit und ihre Voraussetzungen lesen.'],
      ['Änderungen verstehen', 'Gespeicherte Veränderungen im Projektkontext betrachten.']
    ]),
    'halveth-cannabis-reform-forschung': item('halveth-cannabis-reform-forschung', 'QUELLEN & REFORM', {
      src: 'assets/teasers/cannabis-concept.webp',
      alt: 'Generierte Konzeptillustration mit Cannabispflanze und zwei abstrakten Strömen; keine Messdarstellung.',
      label: 'Projekt-Konzeptillustration · keine Messwerte',
      source: 'https://github.com/Juri-Halveth/halveth-cannabis-reform-forschung/blob/67e4145734cd81e9e7727e2a051da06f3145dc36/assets/hero-neu.png',
      credit: 'Juri Janovski / HALVETH · generierte Konzeptkunst des Projekts, für diese Route skaliert und als WebP kodiert',
      kind: 'illustration'
    }, [
      ['Quellen öffnen', 'Öffentliche Belege zur Reform und zu Verkehrsfragen lesen.'],
      ['Befund prüfen', 'Empirische Aussagen an ihre Quellen binden.'],
      ['Vorschlag trennen', 'Politische Positionen als eigene Ebene betrachten.']
    ]),
    'lernstudio': item('lernstudio', 'LERNSTUDIO', diagram('lernstudio',
      'Gezeichneter Lernpfad mit Lernkarte, Mission und Fortschrittslinie.',
      'https://github.com/Juri-Halveth/lernstudio/tree/9309f69883e9ae66290829722012deda5ed982c9'), [
      ['Lernkarte öffnen', 'Ein Thema für selbstständiges Lernen wählen.'],
      ['Übung starten', 'Aufgaben oder Spielmissionen bearbeiten.'],
      ['Stand ansehen', 'Die Fortschrittsansicht des Lernwegs öffnen.']
    ]),
    'fortuna': item('fortuna', 'FORTUNA', diagram('fortuna',
      'Schematische Eingabe mit drei nebeneinander sichtbaren Vergleichsmöglichkeiten.',
      'https://github.com/Juri-Halveth/fortuna/tree/69f436978b0492269fb66accd0beb6d3347750d9'), [
      ['Möglichkeiten eingeben', 'Eigene Optionen in der Browseroberfläche erfassen.'],
      ['Modell lesen', 'Die JavaScript-Vergleichsansicht betrachten.'],
      ['Varianten vergleichen', 'Unterschiede der eingegebenen Möglichkeiten prüfen.']
    ]),
    'halveth-project0-keeper': item('halveth-project0-keeper', 'PROJECT0 KEEPER', diagram('keeper',
      'PowerShell-Fenster neben einer schematischen lokalen Zustandsdatei.',
      'https://github.com/Juri-Halveth/halveth-project0-keeper/tree/f4349d013efb7105e2875784a0c7c16d2026e3da'), [
      ['Anleitung lesen', 'Den experimentellen lokalen Projektzweig einordnen.'],
      ['Werkzeuge sichten', 'PowerShell-Skripte und Zustandsdateien prüfen.'],
      ['Ablauf verstehen', 'Auftrags- und Projektzustände im Quellbestand verfolgen.']
    ]),
    'halveth-morrowind-genesis': item('halveth-morrowind-genesis', 'MORROWIND GENESIS', diagram('morrowind',
      'Schematische Inselkonturen und ein Modding-Baustein für OpenMW-Weltbau.',
      'https://github.com/Juri-Halveth/halveth-morrowind-genesis/blob/main/README.md'), [
      ['Quelle öffnen', 'Den OpenMW-Weltbauzweig im Repository ansehen.'],
      ['Setup lesen', 'Voraussetzungen und Startweg aus der Anleitung entnehmen.'],
      ['Stand prüfen', 'Den nutzbaren Projektstand an der Quelle einordnen.']
    ]),
    'halveth-unreal': item('halveth-unreal', 'HALVETH UNREAL', diagram('unreal',
      'Schematisches 3D-Szenengitter neben einer Entwicklungsnotiz.',
      'https://github.com/Juri-Halveth/halveth-unreal/blob/main/README.md'), [
      ['Prototypen sichten', 'Unreal-Entwicklungsnotizen im Repository öffnen.'],
      ['Stand unterscheiden', 'Nutzbare Fassungen und Validierungszweige trennen.'],
      ['Voraussetzungen lesen', 'Den jeweiligen Startweg an der Quelle prüfen.']
    ]),
    'halveth-tron-security-lab': item('halveth-tron-security-lab', 'TRON SECURITY LAB', diagram('tron',
      'Zwei schematische Quorummengen mit sichtbar markierter Schnittmenge.',
      'https://github.com/Juri-Halveth/halveth-tron-security-lab/pull/1'), [
      ['Forschungs-PR öffnen', 'Den Offline-Modellentwurf in PR #1 ansehen.'],
      ['Quoren vergleichen', 'Schnittmenge und Verfügbarkeit als Modellfragen lesen.'],
      ['Branch beachten', 'Der Entwurf liegt nicht auf dem Standardbranch.']
    ]),
    'leviathan-wallet-portal': item('leviathan-wallet-portal', 'LEVIATHAN PORTAL', diagram('wallet',
      'Öffentliche Adressansicht neben einem gesondert gesperrten Wallet-Bereich.',
      'https://github.com/Juri-Halveth/leviathan-wallet-portal/blob/main/README.md'), [
      ['Adresse ansehen', 'Öffentliche Adressen ohne Wallet betrachten.'],
      ['Wallet verbinden', 'Unterstützte Wallets erst gesondert verbinden.'],
      ['Aktion freigeben', 'Senden erfordert eigene Wallet-Freigabe und kann Gebühren auslösen.']
    ]),
    'Juri-Halveth.github.io': item('Juri-Halveth.github.io', 'HALVETH WEB-EINGANG', diagram('web',
      'Schematische Portfolio-Webseite mit drei Projekt- und Quellenfeldern.',
      'https://github.com/Juri-Halveth/Juri-Halveth.github.io/blob/main/README.md'), [
      ['Portfolio öffnen', 'Bestehende Arbeitsproben und Demos finden.'],
      ['Projekt wählen', 'Von der Übersicht zum eigenen Projektangebot gehen.'],
      ['Quelle lesen', 'Quellcode und technische Einordnung separat prüfen.']
    ]),
    'Juri-Halveth': item('Juri-Halveth', 'GITHUB-PROFIL', diagram('profile',
      'Schematische Profil-README mit Person, Projektlinks und Arbeitsproben.',
      'https://github.com/Juri-Halveth/Juri-Halveth/blob/main/README.md'), [
      ['Profil lesen', 'Die öffentliche GitHub-README als eigenen Einstieg öffnen.'],
      ['Arbeitsproben finden', 'Ausgewählte Projekte und Szenen ansehen.'],
      ['Weitergehen', 'Den Projektlinks zu ihren jeweiligen Quellen folgen.']
    ])
  };

  window.HALVETH_TEASERS = Object.freeze({
    schema: 'halveth.teasers.v1', entries: Object.freeze(entries)
  });
}());
