# LUCINET × LUCINETA · öffentliches GHOST-Zelllabor

Dies ist eine **synthetische, rein lokale Browser-Gegenprobe** des HALVETH Starship Lab. Sie ist eine neue, getrennte JavaScript-Implementierung einfacher Zellregeln, **nicht** die Übertragung oder Fernsteuerung des privaten Bash-/Pi-Projekts.

## Tatsächlich implementiert

- Zwei 22×16-Zellwelten, B3/S23, feste Außenränder und ein wahlweise offenes Kopplungsportal.
- Gleichzeitig zwei Kontrollwelten, die nie miteinander verbunden werden.
- Derselbe deterministische Seed erzeugt denselben Zustand; bekannte Portal-Startzellen sind absichtlich gesetzt und dienen als reproduzierbare Test-Fixierung.
- Besucher können Portal, Zeit, Einzelschritt und Seed steuern. Golden umrandete Plätze markieren Abweichungen zum unverbundenen Kontrolllauf.
- Kein Netzwerkzugriff, keine Cookies, keine persönlichen Daten, keine Wallet-/SSH-/Pi-/Contract-Verbindung, keine eigenständigen Betriebssystemprozesse.

## Gegenprobe und Test

```sh
node --test tests/lucineta-worlds.test.cjs
```

Die Gegenprobe verlangt:
1. Geschlossenes Portal -> dieselben Zellen wie in der isolierten Kontrolle, zu jeder Generation.
2. Offenes Portal -> dokumentierte Geburten in **beiden** Welten bei Generation 1.
3. Gleicher Seed und gleiches Portalverhalten -> reproduzierbarer Verlauf.
4. Portal später schließen -> spätere gegenseitige Signale enden, die bereits entstandene Geschichte wird nicht zurückgedreht.

## Bedeutung der Namen

- **LUCINET**: Konstruktionsperspektive, die etwas nach Regeln baut.
- **LUCINETA**: kritische Gegenlesung, die eine Behauptung mit einem Kontrollversuch widerlegen können muss.

Das sind **Prüfrollen**, keine Behauptungen über autonome KI-Personen oder lebendige Computersysteme.

## Grenzen

Die Zahlen sind aus einem zellulären Automaten berechnet. Eine Simulation belegt nicht echte Physik, biologische Entstehung, externe Operator-Sicherheit, Konsensfinalität, FIDO2-Authentisierung oder Echtzeit-Status des Raspberry Pi. Der bereits besprochene URSTERN-/GHOST-Labortest bleibt ein **separates** Belegpaket; dieses Browserlab nutzt keine privaten Belege. Wer eine echte verteilte Ausführung prüfen möchte, muss deren originalen Quellstand und Freigabe-/Ausführungsbelege getrennt inspizieren.

Quelle und Rechte: neue Original-Presentation und Modellcode dieses Website-Repositories, [LICENSES.md](../../LICENSES.md); keine importierten fremden Assets.
