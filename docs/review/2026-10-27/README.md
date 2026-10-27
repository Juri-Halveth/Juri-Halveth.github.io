# HALVETH · öffentliches Prüfpaket

Dieses Verzeichnis bindet das unveränderte Prüfpaket vom 27. Oktober 2026 an
eine öffentliche Git-Version. Die ZIP enthält die 69er-Projektkarte, öffentliche
Quellverweise und einen lesbaren Python-Prüfer. Ein frischer Bytevergleich für
den Portfolio-Quellstand `a0dd6c81f54a025c01c54b0408066c5f6daa3e01` liegt daneben.

| Datei | Zweck |
| --- | --- |
| [HALVETH_PRUEFPAKET_20261027.zip](HALVETH_PRUEFPAKET_20261027.zip) | Unveränderte ZIP mit elf Dateien; Einstieg darin: `START_HERE.md` |
| [SHA256SUMS.txt](SHA256SUMS.txt) | SHA-256 der ZIP und des neuen Prüfbelegs |
| [LIVE_OBSERVATION_a0dd6c81.json](LIVE_OBSERVATION_a0dd6c81.json) | Frischer Vergleich von 48 Quell- und 48 Live-Ressourcen mit URLs, Zeitfenster und Datei-Digests |

## Zuerst die Herkunft, dann den Inhalt prüfen

Den Vergleichswert aus diesem Verzeichnis an einem konkreten GitHub-Commit
aufrufen. Anschließend die heruntergeladene ZIP dagegen prüfen:

```powershell
(Get-FileHash .\HALVETH_PRUEFPAKET_20261027.zip -Algorithm SHA256).Hash.ToLowerInvariant()
```

Erwarteter Wert:

```text
7124f2b958f5bbbefe1d6554c98b8b9e7bc8b392ae8c2ee799e4ddf1366e5613
```

Mit `sha256sum` lassen sich beide Dateien gemeinsam prüfen:

```sh
sha256sum -c SHA256SUMS.txt
```

Nach dem Entpacken im Paketordner:

```sh
python verify.py
python verify.py --source --live
python verify.py --branches
```

Die erste Prüfung betrifft die zehn Nutzdateien des Pakets. Die zweite liest
48 Quellressourcen am gebundenen Commit und die entsprechende aktuelle
Website. Die dritte liest die Referenzlisten der vier benannten öffentlichen
Repositories und vergleicht die 69 erhaltenen Branch-Köpfe. Der Prüfer benötigt
Python 3.11+, für die Branchprüfung zusätzlich Git.

## Was der neue Prüfbeleg festhält

`LIVE_OBSERVATION_a0dd6c81.json` ist ein neuer, datierter HTTP-Abruf mit
SHA-256-Vergleich. Er protokolliert 96 Bytebeobachtungen: 48 am Quellcommit und
48 auf der öffentlichen Website. Die erwarteten Digests stammen aus
`PUBLIC_RESOURCES.json` innerhalb der unveränderten ZIP.

Die ZIP erhält ihren historischen Prüfbeleg für den früheren Stand
`1642310a4172dcb85f313677a9712f45a35858be`. Der neue Beleg daneben bindet
ausdrücklich den späteren Stand `a0dd6c81`. Beide Zeitstände bleiben getrennt.

Der öffentliche Commit dokumentiert die Veröffentlichung im Repository.
Die Prüfsumme bindet die Paketbytes; das Manifest bindet die enthaltenen
Dateien. Die Beobachtung betrifft den angegebenen Ressourcenumfang im
aufgezeichneten Zeitfenster. Die vier Anwendungsproben im Paket führen zum
nächsten Schritt: eigene Nutzung und dokumentierte Rückmeldung durch andere
Personen.
