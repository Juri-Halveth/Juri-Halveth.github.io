# Öffentliche Netzsuche und Quellenstände

Die gemeinsame Suche verwendet einen zusätzlichen öffentlichen Index. Der
bestehende Website-Katalog, seine redaktionelle Auswahl und frühere Belege
behalten ihre datierten Quellen. Eine neue Beobachtung des Repository-HEADs
schreibt ältere Testergebnisse und Beschreibungen nicht um.

## Was durchsucht wird

`universum/api/search.json` und der inhaltsgleiche statische Export
`universum/api/search.mjs` enthalten Beschreibungen, Titel, Aliasse und
Stichworte. Der gemeinsame Abfragekern ist `network-search.mjs`.

- Öffentliche Repository-Metadaten und beschreibende Auszüge aus dem README
  des beobachteten Standardbranch-HEADs.
- Geprüfte zusätzliche Einstiege, darunter KORRIDOT, die GG24-Förder-Zeitspur
  und der Lichtpunkt. Ein Moduleinstieg zählt nicht als weiteres Repository
  oder als neue Portfolio-Karte.
- Explizit geprüfte öffentliche Websites mit eigenem Beobachtungsdatum.
  Solche Sites erhalten ohne Nachweis keine Repository- oder Commitzuordnung.
- Bei aktivierter Archivauswahl zusätzlich die früheren Katalogbeschreibungen,
  vier datierten Forschungsdatensätze und technischen Arbeitsproben.

Die Suche durchsucht keine vollständigen Repository-Dateibäume, sämtliche
Branches, Git-Historien, private Quellen, lokalen Journale oder Gesprächsarchive.
Auch die vollständigen Inhalte externer Websites werden nicht eingelesen.
Ein Begriff ohne Treffer bedeutet deshalb nur: kein Treffer in dieser
ausgewiesenen Indexabdeckung. Das ist kein Beleg, dass die Arbeit nie existiert hat.

Die drei redaktionell zurückgezogenen Spielpräsentationen bleiben aus der
Standardauswahl und den aktuellen Portfolio-Karten ausgeschlossen. Ihre
öffentlichen Repository-Metadaten erscheinen nur bei aktivierter Archivauswahl.

## Quellen und Ausgaben

| Datei | Rolle |
| --- | --- |
| `data/network-inventory.json` | Vollständiger öffentlicher Account-Abruf zu seinem Beobachtungszeitpunkt, mit HEAD und README-Digest |
| `data/network-readme-descriptions.json` | Redaktionell gelesene Kurzbeschreibungen an genau bezeichneten README-Revisionen |
| `data/network-entries.json` | Geprüfte zusätzliche öffentliche Module und ein bytegebundener Zusammenhang zwischen den Doppelacht-Quellen |
| `data/network-sites.json` | Unabhängige öffentliche Websites; ohne belegte Commitbindung |
| `data/site-catalog.json`, `data/project-briefs.json` | Bestehende datierte Auswahl und ihre gebundenen Beschreibungen |
| `data/research-index.json`, `data/technical-map.json` | Historische Forschungs- und Arbeitsbelege mit eigener Quellenbindung |
| `data/projects.json`, `data/public-repositories.json` | Frühere ausgewählte Teilmengen; im Abdeckungsmanifest als solche erfasst |
| `universum/api/network.json` | Repository-Identitäten, getrennte Zähler, Quellenabdeckung, Eingänge und belegte Beziehungen |
| `universum/api/search.json`, `universum/api/search.mjs` | Identische durchsuchbare Beschreibungssammlung |

Der Build hasht die verwendeten Quelldateien und die erzeugten Suchdaten. Der
Revisionswert erkennt Änderungen der Indexeingaben; er ist kein Beleg für
wissenschaftliche Richtigkeit, externe Wirkung oder Laufzeitverifikation.

`space.json` und `relations.json` bleiben die datierte Auswahl des bestehenden
Starship Labs. Sie verweisen auf die breitere Quelle `network.json` und
kennzeichnen die unterschiedliche Abdeckung. Ihr Zähler trennt jetzt
Repository-Einträge, Projektquellen, Meta-Einstiege und aktive Projektkarten.

## Identitäten und Beziehungen

Der kanonische Schlüssel einer Repository-Identität ist
`repo:juri-halveth/<kleingeschriebener-repositoryname>`. Die numerische GitHub-ID
bleibt zusätzlich erhalten, damit eine spätere Namensänderung nachvollzogen
werden kann. Die derzeitige Implementierung deutet Namensänderungen nicht
selbstständig als neue Produktidentitäten um.

Historische Forschungs-URNs werden explizit den öffentlichen
Repository-Identitäten zugeordnet. Beispielsweise bleibt
`urn:halveth:project:seedspace` ein historischer Alias von
`repo:juri-halveth/lucinet-seedspace`. NOVA, Seedspace und einzelne Browserräume
führen deshalb nicht durch ihre verschiedenen Namen zu zusätzlichen
Repository-Zählern.

Der Index unterscheidet drei Beziehungen:

- `PUBLIC_README_LINK`: Ein an eine Revision gebundenes README verlinkt eine
  andere, im aktuellen öffentlichen Inventar vorhandene Quelle. Dies behauptet
  weder technische Abhängigkeit noch Datenaustausch oder Kausalität.
- `PUBLIC_ENTRY_OF_REPOSITORY`: Ein überprüfter Browser- oder Moduleinstieg
  gehört zur angegebenen öffentlichen Quelle.
- `SHARED_SOURCE_BYTES_AT_REVISIONS`: Zwei explizit angegebene Quellversionen
  enthalten identische bezeichnete Bytes. Das ist kein wissenschaftlicher Test.

Die alten Kategoriezuordnungen des Fadennetzes bleiben ein eigener Relationstyp.
Die räumliche Nähe zweier Punkte erzeugt keine zusätzliche Wissensbeziehung.

## Aktualisieren und bauen

```sh
# Struktur des vorhandenen Inventars prüfen, ohne Netzabruf:
node tools/refresh-network-inventory.cjs --check

# Neue öffentliche Bestands-, HEAD- und README-Beobachtungen erfassen:
node tools/refresh-network-inventory.cjs

# Nur die zusätzliche Indexschicht erzeugen:
node tools/build-network-index.cjs

# Vollständiger Website-Build und Prüfungen:
npm run build
npm test
```

Der Refresh funktioniert lokal ohne Token. Im Workflow verwendet er das bereits
vorhandene, lesende `github.token` über `NETWORK_PUBLIC_READ_TOKEN`, damit die
öffentlichen API-Abrufe nicht vom gemeinsamen anonymen Runner-Kontingent abhängen.
Der Token wird ausschließlich an `api.github.com` gesendet, weder gespeichert
noch ausgegeben. Der feste Endpunkt `/users/Juri-Halveth/repos` liefert laut
[GitHub-Dokumentation](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user)
öffentliche Repositories; `/user/repos` wird nicht verwendet. Jede Antwort muss
zusätzlich `private: false` und `visibility: public` ausweisen.

Bei Token-Nutzung wird jedes gebundene README zusätzlich ohne Anmeldung von
`raw.githubusercontent.com` abgerufen und byteweise verglichen. Fehlende öffentliche
Lesbarkeit oder abweichende Bytes verhindern die Veröffentlichung. Der Abruf folgt
keinen Weiterleitungen, verarbeitet die Pagination und begrenzt die Parallelität
auf drei Repositories. Die aktuelle öffentliche Liste bildet die Allowlist. Eine
entfernte oder inzwischen private Quelle erhält keinen aktiven Suchdatensatz oder
Graph-Endpunkt aus einem früheren Inventar.

Fehlen ein HEAD, README-Bytes, eine paginierte Antwort oder eine gültige
Quellenbindung, endet der Refresh mit Fehlerstatus. Die bestehende Inventardatei
bleibt erhalten. Erst nach vollständiger Prüfung wird genau diese Datei durch
atomisches Umbenennen ersetzt. Redaktionelle und historische Quelldateien
werden vom Refresh nicht bearbeitet. Der Build ersetzt seine generierten
Ausgaben erst nach erfolgreicher inhaltlicher Validierung aller Eingaben.

Bei einem neuen HEAD wird die ältere redaktionelle README-Beschreibung als
historisch geführt. Die aktuelle Repository-Suche verwendet zunächst einen
gekennzeichneten, begrenzten automatischen README-Auszug. Sie übernimmt keine
alten Test- oder Wirkungsaussagen als neue Ergebnisse. Module mit älteren
geprüften Quellversionen behalten diese Version und erhalten den sichtbaren
Frischestatus `OLDER_REVIEWED_REVISION`.

## Abfragevertrag

```js
import index from './universum/api/search.mjs';
import {searchNetwork} from './network-search.mjs';

const results = searchNetwork(index, 'GG24 Gitcoin', {
  includeArchive: false,
  kinds: ['repository', 'module', 'site'],
  limit: 100
});
```

Das Ergebnis ist ein Array von Dokumenten mit zusätzlichem numerischem `score`.
Jedes Wort muss in Titel, Alias, Kurzbeschreibung oder Suchtext vorkommen.
Groß-/Kleinschreibung, kombinierte Akzente und `ß` werden normalisiert. Treffer
sortieren nach Gewicht, danach nach deutschem Titel und stabiler Dokument-ID.
Eine leere Anfrage liefert alle Einträge der gewählten Auswahl. Die Vorgabe
begrenzt auf 100 Ergebnisse, der technische Höchstwert liegt bei 500.

Der Kern führt keine Netzabfragen aus. Der statische Modulimport funktioniert
unter der bestehenden CSP mit `script-src 'self'` und `connect-src 'none'`.

`observedAt` bezeichnet eine Quellenbeobachtung. `source.revision` bindet den
beschriebenen Quellstand. `freshness.observedHead` nennt den zuletzt beobachteten
Standardbranch-HEAD. Eine davon unabhängige Website ohne Commitbeleg erhält
`NO_COMMIT_BINDING`. Diese Angaben sind bewusst keine Behauptung, dass jede
verlinkte Live-Seite exakt aus dem genannten Commit gebaut wurde.

## Prüfung

Die gezielten Tests prüfen die tatsächlichen Integrationsrisiken: neue
Module werden gefunden, historische Auswahl bleibt unverändert, Repository-
und Modulzähler werden getrennt abgeleitet, entfernte öffentliche Quellen
verschwinden aus dem aktiven Index, ältere Beschreibungen werden bei neuen
HEADs nicht neu etikettiert, Pagination und unvollständige Abrufe scheitern
geschlossen, unabhängige Sites erhalten keine erfundene Commitbindung und
JSON sowie statischer Modulimport liefern identische Suchdaten.
