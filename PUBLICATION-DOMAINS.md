# Öffentliche Einstiege und getrennte Veröffentlichungen

## Beobachtung vom 17. November 2026

Die öffentliche Prüfung zwischen **22:18 und 22:22 UTC** las 79 verschiedene
Adressen mit normalen HTTP-GETs: 75 antworteten mit HTTP 200, vier mit HTTP 404.
Alle 54 in den beiden eigenen Domain-Sitemaps genannten HTML-Seiten waren
erreichbar: 29 auf `halveth.de`, 25 auf `juri.halveth.de`. Das ist eine Prüfung
dieser URLs und ihrer gelieferten Inhalte, kein Vollaudit des gesamten Internets,
keine Laufzeitabnahme aller Modelle und kein Zugriff auf private Arbeitsstände.

Die Vergleichsbasis der GitHub-Kopie war Commit
[`e1ae68ac6428caa30dfc12739b1c0dfecd6fb8a1`](https://github.com/Juri-Halveth/Juri-Halveth.github.io/commit/e1ae68ac6428caa30dfc12739b1c0dfecd6fb8a1).
Die späteren Navigations- und Metadatenkorrekturen dieses Änderungsstands sind
von dieser Beobachtung zu unterscheiden. Eine Änderung in diesem Repository
aktualisiert die unten genannten eigenen Domains nicht automatisch.

## Welche Adresse zeigt welchen Bestand?

| Öffentlicher Einstieg | Beobachteter Inhalt | Veröffentlichung und offene Zuordnung |
| --- | --- | --- |
| [GitHub-Portfolio](https://juri-halveth.github.io/) | Portfolio mit Projekten, Quellständen und KORRIDOT-Demo; die neue gemeinsame Suche liegt unter `/suche/`. | Dieses Repository veröffentlicht über `.github/workflows/pages.yml` zu GitHub Pages. |
| [HALVETH-Forschung](https://halveth.de/) | Eigenständige Forschungsedition mit Fassung 2026.11.17. Die Domain lieferte ältere Modell- und Quellenfassungen als die GitHub-Vorschau. | Separates Veröffentlichungsziel. Im geprüften Repository ist kein Upload zu dieser Domain konfiguriert. Hostinganbieter und zuständiges Uploadkonto wurden aus den geprüften öffentlichen Quellen nicht bestimmt. |
| [WWW-Adresse](https://www.halveth.de/) | Derselbe Startseiteninhalt wie `halveth.de`, mit Canonical auf `https://halveth.de/index.html`. | Alias beziehungsweise zweite öffentliche Adresse desselben beobachteten Inhalts; kein zusätzliches Projekt. HTTP auf `halveth.de` wurde zu HTTPS umgeleitet. |
| [Persönliches Portfolio](https://juri.halveth.de/) | Eigenständige Edition mit 18 kuratierten Projekteinträgen und individuellen Bestandsdaten. | Eine eigene Domainkopie; ihre Quell- und Uploadkonfiguration ist in diesem Repository nicht enthalten. |
| [Gratis lernen](https://gratis-lernen.de/) | Wegweiser zu Lernstudio und Mein Lernportal auf GitHub Pages; der Personenlink führt zu `juri.halveth.de`. | Eigenständige Startseite. Kein dazugehöriger Quell- oder Uploadpfad wurde aus den geprüften Selbstverlinkungen bestimmt. |

Die getrennten Inhalte und Veröffentlichungspfade sind belegt. Daraus folgt
keine Aussage darüber, bei welchem Anbieter die eigenen Domains technisch
gehostet werden. Weder Konten noch nicht öffentliche Serverkonfigurationen
wurden untersucht.

## Konkreter Drift zwischen Domain und GitHub-Kopie

Alle 29 HTML-Pfade aus der HALVETH-Domain-Sitemap unterschieden sich byteweise
von den gleichnamigen Dateien unter `modelle/material-20261117/` der genannten
GitHub-Basis. Bei zwölf Pfaden gab es auch sichtbare Text- oder Funktionsunterschiede.
Die übrigen Änderungen betrafen insbesondere die zusätzliche Buildbindung und
die Übersetzungseinbindung. Die vier zusätzlich verglichenen gemeinsamen
CSS-/JavaScript-Dateien waren ebenfalls verschieden.

| Domainpfad | Stand auf der Domain beim Abruf | Bereits vorhandener Stand in der GitHub-Kopie |
| --- | --- | --- |
| [`forschung.html`](https://halveth.de/forschung.html) | 11.355 Bytes; einfache Wellenansicht, zwei eingebundene Skripte. | 19.048 Bytes; Lichtpunkt/Doppelacht, Materialzellen, Modellwahl und gebundene Rechenmodule. |
| [`quellen.html`](https://halveth.de/quellen.html) | Elf Quellen. S3 bezeichnet Landauer 1961, verlinkt jedoch eine spätere Arbeit von 2021. | Zwölf Quellen. S3 ist die Originalarbeit von 1961; die Arbeit von Wimsatt und Kollegen von 2021 hat einen eigenen Eintrag S12. |
| [`Realitaet_Erste_Regel_Plus_Minus.html`](https://halveth.de/Realitaet_Erste_Regel_Plus_Minus.html) | Parametrisierte Zwei-Quellen-Ansicht. | Material- und Referenzmodelle, Zustandsdaten und zusätzliche Bedienung. |
| [`Realitaet_als_Zustand_Live_Wellenmodell.html`](https://halveth.de/Realitaet_als_Zustand_Live_Wellenmodell.html) | Allgemeine Parameterbeschriftung und verkürzter Gegenversuch. | Benannte Nachbarkopplung, feste Rechenschritte, Pausen-/Hintergrundverhalten und JSON-Export beschrieben. |
| [`Realitaet_als_Zustand_Livemodell.html`](https://halveth.de/Realitaet_als_Zustand_Livemodell.html) | Bisherige Dimensionsansicht. | Zusätzlicher Zustands-JSON-Export. |
| [`Realitaet_Schichten_Modell.html`](https://halveth.de/Realitaet_Schichten_Modell.html) | Allgemeiner Modellhinweis. | Präzisere Illustrationsgrenze und Zustands-JSON-Export. |
| [`Realitaet_Strudel_Modell.html`](https://halveth.de/Realitaet_Strudel_Modell.html) | Allgemeiner Modellhinweis. | Präzisere Illustrationsgrenze und Zustands-JSON-Export. |
| [`Realitaet_Strudel_3D.html`](https://halveth.de/Realitaet_Strudel_3D.html) | Allgemeiner Modellhinweis. | Präzisere Illustrationsgrenze und Zustands-JSON-Export. |
| [`Realitaet_Zwei_Teile_Modell.html`](https://halveth.de/Realitaet_Zwei_Teile_Modell.html) | Allgemeiner Modellhinweis. | Präzisere Illustrationsgrenze und Zustands-JSON-Export. |
| [`labore/sgr-a.html`](https://halveth.de/labore/sgr-a.html) | Parametrisierte Illustration. | Zusätzlicher Einstieg in das numerische Lichtweg- und Sichtbarkeitslabor. |
| [`labore/wirbel.html`](https://halveth.de/labore/wirbel.html) | Parametrisierte Illustration. | Zusätzliches numerisches Mehrkörper-/Energielabor und dokumentierte Reservoirgrenze. |
| [`studio/index.html`](https://halveth.de/studio/index.html) | 5.087 Bytes; bisheriger Flugraum. | 10.786 Bytes; Modellwahl, Materialansichten und erweiterter Zustandsvertrag. |
| [`assets/site.js`](https://halveth.de/assets/site.js) | 2.632 Bytes. | 2.968 Bytes. |
| [`assets/lab.js`](https://halveth.de/assets/lab.js) | 10.401 Bytes. | 39.396 Bytes. |
| [`assets/studio.js`](https://halveth.de/assets/studio.js) | 7.846 Bytes. | 17.999 Bytes. |
| [`assets/cosmos.css`](https://halveth.de/assets/cosmos.css) | 13.542 Bytes. | 18.170 Bytes. |

Die übrigen siebzehn HTML-Pfade waren `404.html`, `audits.html`, `baum.html`,
`datenschutz.html`, `edition.html`, `ergebnisse.html`, `grenzen.html`,
`impressum.html`, `index.html`, `labor.html`, `labs.html`, `modell.html`,
`notation.html`, `prinzip.html`, `systemstand.html`, `vision.html` und
`werkstatt.html`. Die Gleichheit ihrer damaligen sichtbaren Texte bedeutet
keine Gleichheit der eingebundenen Laufzeitdateien.

### Nachprüfbare Quellbindung des Beispiels

| Abgerufenes Dokument | SHA-256 des gelieferten Inhalts |
| --- | --- |
| `https://halveth.de/quellen.html` | `ec92189f0da1f3cde637e88ee44de176cb9171cf30dc0453d0453650ec1601ba` |
| `https://juri-halveth.github.io/modelle/material-20261117/quellen.html` | `44ccd1fa848836b11bd553571426feb5685b8d88bcda8d4b7832e649940144a5` |

Die historische Originalarbeit ist
[R. Landauer, 1961, DOI 10.1147/rd.53.0183](https://doi.org/10.1147/rd.53.0183).
Die bisher falsch zugeordnete Adresse gehört zu
[Wimsatt, Boyd, Riechers und Crutchfield, 2021, DOI 10.1007/s10955-021-02733-1](https://doi.org/10.1007/s10955-021-02733-1).
Die GitHub-Korrektur war bereits öffentlich abrufbar, während die Domain noch
die frühere Zuordnung lieferte. Die Canonicals der GitHub-Kopie verwiesen
zusätzlich auf diese ältere Domainfassung.

## Zahlen, Zeitstände und Auffindbarkeit

Der [Projektatlas auf der persönlichen Domain](https://juri.halveth.de/projekte.html)
enthält tatsächlich **18 Projekteinträge**. Sechzehn beziehen ihren Status
aus einem Inventar vom Juli 2026; Lernstudio nennt Oktober und KORRIDOT November.
Die Seitenfassung vom 17. November ist deshalb kein neuer Nachweis für den
Funktionsstand aller Projekte. Dieser kuratierte Atlas ist auch keine Zählung
aller öffentlichen GitHub-Repositories. Die
[öffentliche GitHub-API](https://api.github.com/users/Juri-Halveth) meldete am
Beobachtungstag 21 öffentliche Repositories; darin sind auch Profil, Website
und ein Beitragsfork enthalten.

Vier Exa-Suchabfragen mit insgesamt 40 angeforderten Treffern und fünf
anschließenden Exa-Abrufen dienten der Entdeckung. Sie lieferten teilweise
ältere Texte: unter anderem eine frühere persönliche Startseite und die
GitHub-Zahl 19. Diese Such-/Abrufstände wurden nicht als aktueller Liveinhalt
gewertet. Die oben genannten Livebefunde stammen aus direkten GETs.

Die Domainseiten verlinken untereinander, führen aber bislang nur punktuell
zum aktuellen GitHub-Netz: zu Lernstudio, Tresor und dem Console-Only-Quellprojekt.
Ein allgemeiner Einstieg in die aktuelle GitHub-Projektübersicht oder Suche
fehlt in den geprüften Domain-Navigationen. Die KORRIDOT-Projektseite verlinkt
den Quellcode, aber nicht die inzwischen öffentliche Demo oder die GG24-Spur.
Atlas und NOVA bleiben getrennte Projektidentitäten; eine funktionierende
NOVA-Suche beweist nicht den Funktionsstand von Atlas.

Ein zusätzlicher eindeutiger Zählfehler betraf die Auditseite: ihre Überschrift
kündigte vier Belegebenen an, der Abschnitt enthielt drei Karten. Der neue
Repository-Stand benennt diese drei Ebenen korrekt.

Beide Domain-Sitemaps enthielten zudem die jeweilige `404.html`. Diese Dateien
antworteten direkt aufgerufen mit 200 und ohne `noindex`. Die lokale
Materialkopie schließt ihre Fehlerseite nun aus der Sitemap aus und markiert
sie als `noindex,follow`. Die vier beobachteten 404-Antworten im Scan betrafen
optionale Dateien: `llms.txt` auf beiden eigenen Domains sowie `robots.txt`
und `sitemap.xml` auf `gratis-lernen.de`. Das Fehlen dieser optionalen Dateien
ist kein Beleg dafür, dass die Startseiten nicht funktionieren.

## Änderungen in der vorhandenen GitHub-Kopie

- Vorhandene Canonical- und Open-Graph-URL-Tags nennen den tatsächlichen
  GitHub-Pages-Pfad der jeweiligen Datei, auch im gesonderten Spracharchiv.
- Die dreißig aktuellen globalen Navigationen sowie ihre Footer führen zur
  gemeinsamen Suche. Die Suche erhält keinen Zugriff auf private Quellen.
- Der Kommunikationsraum verlinkt den öffentlichen Faden auf dessen echter
  GitHub-Pages-Adresse. Seine frühere Adresse auf der persönlichen Domain
  wird nicht mehr als vorhandener Faden ausgegeben.
- Die Belegebenen sind im aktuellen Artikel und den neuen EN/RU-Übersetzungen
  auf drei berichtigt. Historische Archivtexte bleiben ihrem Stand zugeordnet.
- Die Vorschau-Sitemap zeigt auf ihre eigenen URLs und enthält den
  Kommunikationsraum. Die Datei `robots.txt` im Unterverzeichnis dokumentiert
  nur diese Sitemap; wirksame Crawl-Regeln werden am Host-Root gelesen.

Diese Änderungen betreffen Navigation, Metadaten und die belegte Zählkorrektur.
Rechenkerne, Solver und Simulationsparameter wurden dadurch nicht geändert.

## Prüffähiges Paket für die eigene Forschungsdomain

Nach Build und Tests erzeugt folgender Befehl einen **neuen Ordner außerhalb
des Repositorys**:

```sh
npm run build
node tools/stage-material-domain.cjs /tmp/halveth-domain-20261117
```

Der Generator überschreibt keinen vorhandenen Ausgabeordner. Er übernimmt
nur vorhandene, versionierte Dateien der öffentlichen Materialkopie sowie
die ausdrücklich benannten Quellen- und Lizenzdokumente. Die Canonicals und
Sitemap werden für `https://halveth.de/` umgeschrieben. Der Suchlink bleibt als
absolute Adresse an die gemeinsame GitHub-Suche gebunden. Vorhandene
MIT-Hinweise und die Portal-Lizenzkarte werden mitgeliefert; Bedingungen und
frühere wirksame Grants bleiben erhalten.

`PUBLICATION-MANIFEST.json` nennt Dateigrößen, SHA-256, Quellbasis und ausdrücklich
`STAGED_ONLY_NOT_UPLOADED`. Die Dateihashes binden den erzeugten Arbeitsstand;
der genannte Git-Commit ist die Basis und behauptet nicht, dass seitdem keine
Arbeitskopie geändert wurde. Das Werkzeug enthält weder Netzwerk- noch
Uploadfunktionen und aktualisiert keine Domain.

Das Paket gilt ausschließlich für die Forschungsdomain. Die nicht in diesem
Repository enthaltenen Quellen von `juri.halveth.de` und `gratis-lernen.de`
werden weder rekonstruiert noch durch eine andere Website überschrieben.
Für die persönliche Domain bleibt die konkrete Anschlussarbeit: die
gemeinsame Suche, den aktuellen Projektbestand und die öffentliche
KORRIDOT-/GG24-Demo aus dem tatsächlichen Domain-Quellprojekt verlinken.

Erst ein gesonderter veröffentlichter Upload mit anschließendem Direktabruf
von Quellenregister, Forschungseinstieg, Auditseite, Sitemap und ihren
Laufzeitdateien kann die eigene Domain als aktualisiert bestätigen.
