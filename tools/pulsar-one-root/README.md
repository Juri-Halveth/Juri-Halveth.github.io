# ◈ HALVETH PULSAR ROOT · EIN KLICK · GANZER BAUM

**Verbindungspunkt für alle GitHub-Repositories unter `Juri-Halveth`.**

Das ist ausdrücklich **kein einzelner Ast**. Eine Wurzel verbindet alle aktuell vorhandenen Repositories mit ihren Branches, Tags, Ordnern und Dateien. Das Werkzeug untersucht keine fremden Systeme, sondern ruft ausschließlich die GitHub-API ab, die der angemeldete Nutzer lesen kann.

## EIN KLICK (WINDOWS)

1. ZIP entpacken.
2. `START_HALVETH_ONE_CLICK.cmd` doppelklicken.
3. Warten, während alle verfügbaren GitHub-Bäume gelesen werden. Danach öffnet sich `HALVETH_PULSAR_ROOT.html` automatisch.
4. Auf **HALVETH ◈** klicken, um den **gesamten Universumsbaum** zu öffnen. Ordner lassen sich weiter entfalten. Über **GESAMTSUCHE** sind alle geladenen Pfade durchsuchbar.

Ohne zusätzliche Python-Pakete. Voraussetzung: Python 3.11+.

**Für private Repositories** ist zusätzlich eine installierte und mit deinem GitHub-Konto angemeldete GitHub CLI nötig: `gh auth login`. Die Anmeldung läuft über die offizielle GitHub CLI, **nicht** über dieses Skript. Das Skript speichert keinen Token und druckt ihn auch nicht aus.

Im Modus `--public-only` kann eine bereits angemeldete CLI das API-Limit für die Abfragen erhöhen. Die Repository-Liste kommt trotzdem ausschließlich vom öffentlichen `/users/{owner}/repos`-Endpunkt; der private `/user/repos`-Endpunkt wird in diesem Modus nicht verwendet.

Fehlt `gh` oder eine Anmeldung, wird ein **öffentlicher Teilbaum** erzeugt und dieser Teilzustand deutlich gekennzeichnet.

## ALLES, NICHT EINE STICHPROBE

Standardmäßig ermittelt das Programm:

- **ALLE** GitHub-Repositories, die unter dem angegebenen Konto erreichbar und diesem Eigentümer zugeordnet sind.
- **ALLE** gelisteten Branches jedes Repositories.
- **ALLE** gelisteten Tags jedes Repositories.
- Das rekursive Dateiverzeichnis für jede Referenz. Gemeinsame Commit-Snapshots werden nur einmal abgefragt und intern geteilt.
- Wenn die GitHub-API einen Baum als `truncated` markiert, versucht das Programm, die fehlenden Unterordner einzeln zu lesen. Bleibt etwas unzugänglich, steht das ausdrücklich als **PARTIAL** im Report.

Historische, in keiner aktuellen Branch oder Tag referenzierte Git-Objekte sind damit noch **nicht** Bestandteil des Baums. Git-Submodule werden als Verbindungen angezeigt; deren fremde Bäume werden nicht automatisch in die eigene Eigentumsstruktur eingezogen.

## BEWEISKRAFT / DATENSCHUTZ

- Die erzeugte Seite wird **nur lokal** im Ordner `%LOCALAPPDATA%\HALVETH\PULSAR` abgelegt.
- Enthalten sind GitHub-Namen, Pfade, Branches, Tags und Quell-Hashes. **Kein Quelltext wird abgerufen oder ausgeführt.**
- **Private Pfadmetadaten bleiben auf deinem PC.** Die generierte HTML-/JSON-Datei mit privaten Repos nicht in ein öffentliches Repository hochladen.
- Jeder Verbindungsfehler bleibt im Manifest sichtbar. Ein fehlender Pfad wird **nicht** durch einen erfundenen Platzhalter ersetzt.
- Ein unverändertes GitHub-Objekt wird an seiner Revision referenziert. Dadurch wird aus der Pfadliste keine unabhängige Bestätigung von Softwarewirkung.

## SHELL-PULSE (LESEND)

Das Skript verwendet ausschließlich `gh api -X GET` beziehungsweise `urllib.request` mit HTTP GET. Es ruft weder `git push` noch `git clone` noch fremden Programmcode auf. Ein "Pulsar-Impuls" ist hier eine kontrollierte GitHub-Metadatenabfrage. Alles wird zu einem verbundenen Wurzelpunkt vereint.

Optional manuell im Terminal:

```powershell
py -3 .\PULSAR_ONE_ROOT.py
py -3 .\PULSAR_ONE_ROOT.py --public-only
py -3 .\PULSAR_ONE_ROOT.py --no-browser --out C:\HALVETH\PULSAR
```

**Status:** eigenständiges, transparentes Python/HTML-Werkzeug. Aktive eigene Repositories bleiben unverändert. Es werden keine GitHub-Dateien geändert, keine PRs erstellt und keine privaten Daten veröffentlicht.
