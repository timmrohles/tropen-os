# Dogfooding & Checker Quality Feedback Loop — Committee Input

## Was ist Tropen OS?

Production Readiness Guide fuer Vibe-Coders. Scannt Quellcode mit 188 Regeln in 25 Kategorien, generiert Findings mit Fix-Prompts. Positionierung: "Advisor, not Mechanic" — findet Probleme, erklaert sie, hilft dem User sie zu beheben. EU-Compliance (DSGVO/BFSG/AI Act) als Differenziator.

## Das Dogfooding-Problem

Wir scannen unsere eigene Codebase (624 Dateien, 75K+ Zeilen). Dabei fallen drei Kategorien auf:

1. **Echtes Problem** → wir fixen unseren Code
2. **False Positive im Checker** → wir verbessern den Checker
3. **Bewusste Ausnahme** → User markiert als "Bekannt"

### Konkreter Fall heute

Der Security-Checker hat `error.message` in `log.error()` Zeilen geflagt — das ist kein Security-Problem sondern korrektes Logging. Die Regex `/(?:message|error|detail|stack)\s*:\s*(?:error|err|e)\.(?:message|stack)/` matcht `{ error: error.message }` egal ob in einem `log.error()` oder in `NextResponse.json()`.

Fix: Negative Lookahead fuer Logger-Zeilen. Aber: Unsere Codebase nutzt `log.error()` (via `createLogger()`). Externe Projekte nutzen `console.error`, `winston.error`, `pino.error`, etc.

### Was fehlt

- Kein System um False Positives zu tracken
- Kein System um Checker-Verbesserungen zu priorisieren
- Keine Daten darueber welche Regeln bei externen Projekten ebenfalls False Positives erzeugen
- Kein Unterschied zwischen "false positive nur bei uns" und "false positive bei allen Supabase-Projekten"

## Aktueller Stand

- 188 Regeln, 25 Kategorien
- 4 fixType-Kategorien: code-fix (62), code-gen (52), refactoring (9), manual (43)
- Solo-Founder-Team
- Noch keine externen User (Beta-Start geplant)
- Produkt scannt Code, nicht Live-Systeme
- Stack: Next.js + Supabase + Anthropic

## Moat-Strategie (aus Roadmap)

"Daten aus tausenden Scans → Pattern-Erkennung → bessere Checker → weniger False Positives → mehr Vertrauen → mehr Scans." Aber wenn wir diese Daten nicht sammeln, gibt es keinen Moat.

Wettbewerbsrisiko: "Wenn KI-IDEs eigene Scan-Features einbauen, muss der Guide seinen Wert neu definieren." Checker-Qualitaet und EU-Compliance-Tiefe koennten der eigentliche Moat sein.

## Constraints

- Solo-Founder: jedes System muss den Aufwand rechtfertigen
- Kein externes Feedback bis Beta-Start
- Produkt muss vor Feedback-System fertig sein
- Budget: begrenzt, keine eigene Infrastruktur fuer Analytics
