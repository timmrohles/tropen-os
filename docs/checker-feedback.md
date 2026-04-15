# Checker Feedback Log

> Strukturiertes Tracking aller Checker-Verbesserungen.
> Jeder Eintrag hat ein GitHub Issue.
> Ziel: False-Positive-Rate <10% (MVP), <5% (Year 1).

## Metriken

| Metrik | Aktuell | Ziel MVP | Ziel Y1 |
|--------|---------|----------|---------|
| Regeln gesamt | 188 | -- | -- |
| Bekannte FP-Patterns | 3 | -- | -- |
| FP-Rate (geschaetzt) | unbekannt | <10% | <5% |
| Test-Repos | 0 | 5 | 10 |

## Feedback-Eintraege

### Format

| Datum | Regel-ID | Typ | Problem | Fix | Issue | Impact |
|-------|----------|-----|---------|-----|-------|--------|
| YYYY-MM-DD | cat-X-rule-Y | FP/Improvement/Severity | Was war falsch | Was wurde geaendert | #123 | Hoch/Mittel/Niedrig |

### Log

| Datum | Regel-ID | Typ | Problem | Fix | Issue | Impact |
|-------|----------|-----|---------|-----|-------|--------|
| 2026-04-14 | cat-3-rule-22 | FP | `error.message` in `log.error()` geflagt — security-scan-checker Regex unterschied nicht zwischen Logger und Response | Negative Lookahead `^(?!.*log(?:ger)?\.(?:error\|warn\|info\|debug)\()` in Pattern | -- | Hoch |
| 2026-04-14 | cat-3-rule-19 | FP | `error.message` in `log.error()` geflagt — agent-security-checker `responseLeakPattern` zu breit | Log-Zeilen aus Content entfernt bevor Regex laeuft (`content.replace(logPattern, '')`) | -- | Hoch |
| 2026-04-14 | cat-16-rule-7 | FP | Regel pruefte auf `lang="de"` statt auf Existenz des lang-Attributs. Englische Projekte wurden faelschlich geflagt. | Pruefung auf Existenz des Attributs geaendert, sprachunabhaeangig. Auch dynamisches `lang={locale}` erkannt. | -- | Hoch |

## Regeln mit bekannten FP-Problemen

Regeln die >10% False-Positive-Rate haben oder haeufig
gemeldet werden. Werden priorisiert gefixt.

| Regel-ID | Beschreibung | Geschaetzte FP-Rate | Status |
|----------|-------------|-------------------|--------|
| cat-3-rule-22 | stack-trace-response (security-scan) | gefixt 2026-04-14 | Behoben |
| cat-3-rule-19 | error-leak (agent-security) | gefixt 2026-04-14 | Behoben |
| cat-16-rule-7 | html-lang prueft auf "de" statt Existenz | gefixt 2026-04-14 | Behoben |

## Prozess

1. Finding faellt beim Dogfooding oder Beta-User-Feedback auf
2. Kategorisierung: Echtes Problem / False Positive / Bewusste Ausnahme
3. Bei False Positive: GitHub Issue erstellen (Template nutzen)
4. Checker-Fix implementieren
5. Fix gegen Test-Repos pruefen (keine neuen FPs erzeugen)
6. Eintrag in diesem Log ergaenzen
7. Bei Beta: "Finding falsch?"-Button-Feedback ebenfalls hier einpflegen
