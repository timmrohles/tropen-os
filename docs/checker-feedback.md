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
| 2026-04-22 | cat-3-rule-21 | FP | `hardcoded-secret` flaggte `src/scripts/agent-gen-defs.ts`. Datei enthält Engineering-Standard-Dokumentation als Template-String-Literale. Wörter wie "Service Role Key nie im Frontend" und "Secret-Rewrite" sind Regeltext-Vokabular, keine Credential-Zuweisungen. Besonderheit: Finding wurde vom Multi-Model Komitee (alle 4 Modelle + Opus-Judge) als gültig bestätigt — Common-Mode-Failure weil alle Modelle dieselbe Heuristik "Security-Vokabular = Credential-Risiko" gelernt haben. | `excludePattern` für `hardcoded-secret` um `[\\/]scripts[\\/]agent-gen` erweitert. Pattern: P5 (Checker trifft Dokumentations-Code) + P13 (Security-Checker braucht Muster-Matching, nicht Keyword-Matching). | -- | Mittel |
| 2026-04-21 | cat-9-rule-5 | FP (56 Findings) | Framework-blinde Kalibrierung (P4.1): Checker flaggte fetch-in-useEffect in Next.js App Router ohne Framework-Kontext. Server Components (kein useEffect möglich), Client Components mit Auth/Realtime-Bedarf (useAuth, WebSocket, supabase.channel) und API Route Handlers wurden alle als Anti-Pattern geflagt. | Framework-Kontext-Guard: Server Components in `app/` → skip; API Routes → skip; Client Components mit CLIENT_STATE_INDICATORS-Pattern → skip. Nur Client Components in `app/` ohne Client-State-Bedarf und alle Nicht-App-Router-Dateien werden noch geflagt. 15 Unit-Tests. | -- | Hoch |
| 2026-04-14 | cat-3-rule-22 | FP | `error.message` in `log.error()` geflagt — security-scan-checker Regex unterschied nicht zwischen Logger und Response | Negative Lookahead `^(?!.*log(?:ger)?\.(?:error\|warn\|info\|debug)\()` in Pattern | -- | Hoch |
| 2026-04-20 | cat-3-rule-22 | FP (42 Findings) | `select-star-api` scannte alle `.ts`-Dateien ohne Pfad-Einschränkung — flaggte `src/actions/`, `src/lib/`, `scripts/`, `supabase/functions/` die keine direkten HTTP-Response-Quellen sind | `includePattern: /(?:\/app\/api\/\|\/pages\/api\/).*\.[jt]sx?$/` in `SecurityPattern` Interface + `select-star-api` Pattern | -- | Hoch |
| 2026-04-14 | cat-3-rule-19 | FP | `error.message` in `log.error()` geflagt — agent-security-checker `responseLeakPattern` zu breit | Log-Zeilen aus Content entfernt bevor Regex laeuft (`content.replace(logPattern, '')`) | -- | Hoch |
| 2026-04-14 | cat-16-rule-7 | FP | Regel pruefte auf `lang="de"` statt auf Existenz des lang-Attributs. Englische Projekte wurden faelschlich geflagt. | Pruefung auf Existenz des Attributs geaendert, sprachunabhaeangig. Auch dynamisches `lang={locale}` erkannt. | -- | Hoch |

## Regeln mit bekannten FP-Problemen

Regeln die >10% False-Positive-Rate haben oder haeufig
gemeldet werden. Werden priorisiert gefixt.

| Regel-ID | Beschreibung | Geschaetzte FP-Rate | Status |
|----------|-------------|-------------------|--------|
| cat-3-rule-22 | stack-trace-response (security-scan) | gefixt 2026-04-14 | Behoben |
| cat-3-rule-22 | select-star-api scannte alle .ts-Dateien — 42 FPs aus actions/lib/scripts | gefixt 2026-04-20 | Behoben |
| cat-3-rule-19 | error-leak (agent-security) | gefixt 2026-04-14 | Behoben |
| cat-16-rule-7 | html-lang prueft auf "de" statt Existenz | gefixt 2026-04-14 | Behoben |
| P6 (alle Checker) | Silent-Failure-Audit 2026-04-21: 21 Checker gescannt — nur `final-category-checkers` + `agent-security` hatten Category-A-Issues (beide gefixt). 4 Checker Category-C (rootPath unguarded) — mitigiert durch Runner-try-catch. | 0% nach Fix | Geschlossen |
| P9 isListRoute | 2026-04-21: Zwei divergierende isListRoute-Implementierungen konsolidiert in `src/lib/audit/utils/route-utils.ts`. Canonical = agent-committee-checker Version. checkUnlimitedQueries bekommt 4 zusätzliche Checks (weniger FPs). | <2% | Geschlossen |
| P1+P9 fileExists | 2026-04-21: `ctx.rootPath ? existsSync(join(ctx.rootPath, '...')) : false`-Pattern erschien 6× in gap-checkers.ts + final-category-checkers.ts. Root Cause: Repo-Map indexiert nur .ts/.tsx — Non-TS-Files wie .env.example/CHANGELOG.md/manifest.json für `ctx.filePaths` unsichtbar. Konsolidiert in `src/lib/audit/utils/file-utils.ts` (`fileExists` + `fileExistsInAnyOf`). | 0% | Geschlossen |

## Prozess

1. Finding faellt beim Dogfooding oder Beta-User-Feedback auf
2. Kategorisierung: Echtes Problem / False Positive / Bewusste Ausnahme
3. Bei False Positive: GitHub Issue erstellen (Template nutzen)
4. Checker-Fix implementieren
5. Fix gegen Test-Repos pruefen (keine neuen FPs erzeugen)
6. Eintrag in diesem Log ergaenzen
7. Bei Beta: "Finding falsch?"-Button-Feedback ebenfalls hier einpflegen
