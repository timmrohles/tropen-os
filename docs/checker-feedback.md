# Checker Feedback Log

## Regeln-Export aus Audit-Seite entfernt (2026-05-06)
Button "Regeln exportieren" aus AuditActions.tsx ausgeblendet (Kommentar im Code).
API-Endpoint `/api/audit/export-rules` bleibt funktional für interne Tests.
Backlog: Regeln-Export gehört zu "Vibecoden von Beginn an"-Bereich, der noch konzeptioniert wird. Regel-Qualitäts-Diagnose folgt vor Re-Integration.

---

## Stale-Hinweis Komitee-Findings implementiert (2026-05-06)
Stale wenn: angezeigte Run hat review_type=multi_model UND neuerer Run existiert.
Hinweis pro Sektion mit Komitee-Findings (avg_confidence != null).
Wording: "Komitee-Review-Stand: vor X · Code wurde seither geändert — Findings möglicherweise veraltet."

---

## Deep Review als User-Feature implementiert (2026-05-06)
Rate-Limit: 24h-Cooldown + 10/Monat. CommitteeBadge mit avg_confidence + models_flagged.
Domain-Mapping: architecture/process → code-quality.
Sort-Tiebreaker: avg_confidence (null = 100 für Sort-Zwecke).

---

> Strukturiertes Tracking aller Checker-Verbesserungen.
> Jeder Eintrag hat ein GitHub Issue.
> Ziel: False-Positive-Rate <10% (MVP), <5% (Year 1).
>
> **Hinweis:** Strukturelle Verbesserung dieser FP-Behandlung (Checker-Korrektur und/oder UI-Markierung) ist im Roadmap-Backlog dokumentiert — siehe Backlog-Eintrag "P4-Pattern für 410-Only-Routes" und "Stop-and-think im Fix-Prompt-Format" in `docs/product/roadmap-2026-q2.md`.

---

## Compliance-Resolver Stufe 1 implementiert (2026-05-06)
3 Checks aktiv: Privacy, Deletion, Data-Location.
Status: confirmed / needs-attention / input-needed / not-applicable (kein 'fulfilled').
User-Vorrang total: Code-Findings cat-4-rule-11/17/18 werden bei User-Bestätigung gefiltert.

---

## Compliance-Resolver-Komitee abgeschlossen (2026-05-06)

4 Modelle + Opus-Judge haben die Dreischichten-Compliance-Resolver-Logik spezifiziert (€0.44).

**Kernentscheidungen:** (1) Status `fulfilled` → `confirmed` — kein Tool das juristisch nicht verifizieren kann darf etwas als "erfüllt" bezeichnen. (2) User-Vorrang bei allen 9 Fragen — Code-Signals sind Hinweise, nie Beweise. (3) Kein `confirmed` ohne User-Bestätigung, auch wenn Code-Check positiv. (4) AVV-Fragen rein User-Only, Privacy-Policy + Deletion-Process Hybrid (code-prüfbar als Hint). (5) Finding-Schwellen: `needs-attention` = HIGH, `input-needed` = MEDIUM.

**Implementations-Reihenfolge:** has_privacy_policy → has_deletion_process → data_location.

**8 Konsens-Punkte, 3 Spaltungen (alle aufgelöst).** Report: `docs/audit-reports/compliance-resolver-komitee-2026-05-06.md`

---

## Diagnose: Compliance-Antworten-Konsumption (2026-05-06)

### Code-Review-Ergebnis

| questionKey | Konsumiert in Detektor-Code? | Wo (ausserhalb ComplianceBlock.tsx) |
|---|---|---|
| `has_avv_supabase` | Nein | Nur in `ComplianceBlock.tsx` (Def) + `IslandsRow.tsx` (Zaehler) + `ScoreBar.tsx` (Zaehler) |
| `has_avv_vercel` | Nein | Nur in `ComplianceBlock.tsx` (Def) + `IslandsRow.tsx` (Zaehler) + `ScoreBar.tsx` (Zaehler) |
| `has_privacy_policy` | Nein | Nur in `ComplianceBlock.tsx` (Def) + `IslandsRow.tsx` (Zaehler) + `ScoreBar.tsx` (Zaehler) |
| `data_location` | Nein | Nur in `ComplianceBlock.tsx` (Def) + `IslandsRow.tsx` (Zaehler) + `ScoreBar.tsx` (Zaehler) |
| `has_deletion_process` | Nein | Nur in `ComplianceBlock.tsx` (Def) + `IslandsRow.tsx` (Zaehler) + `ScoreBar.tsx` (Zaehler) |
| `ki_risk_class` | Nein | Nur in `ComplianceBlock.tsx` (Def) + `IslandsRow.tsx` (Zaehler) + `ScoreBar.tsx` (Zaehler) |
| `ki_transparency_label` | Nein | Nur in `ComplianceBlock.tsx` (Def) + `IslandsRow.tsx` (Zaehler) + `ScoreBar.tsx` (Zaehler) |
| `ki_logging_enabled` | Nein | Nur in `ComplianceBlock.tsx` (Def) + `IslandsRow.tsx` (Zaehler) + `ScoreBar.tsx` (Zaehler) |
| `ki_purpose_documented` | Nein | Nur in `ComplianceBlock.tsx` (Def) + `IslandsRow.tsx` (Zaehler) + `ScoreBar.tsx` (Zaehler) |

**Grep-Beleg:** `grep -r "has_avv_supabase\|ki_risk_class" src/lib/audit/` — **0 Treffer**. Kein Detektor-Code in `src/lib/audit/` referenziert einen dieser Keys.

### Daten-Pipeline

```
project_compliance_data (DB, Tabelle aus Migration 20260429000115)
  → GET /api/audit/compliance-data  (route.ts — lesen + schreiben, kein Audit-Trigger-Bezug)
  → POST /api/audit/compliance-data (ComplianceQuestion speichert Antwort, fire-and-forget)
  → audit/page.tsx: supabaseAdmin.from('project_compliance_data').select(...)
      ↓
      complianceData = Record<string, unknown>  (z.B. { has_avv_supabase: true, ... })
      ↓
      → IslandsRow (SelfInputIsland): zaehlt beantwortet/gesamt — rein dekorativ
      → ComplianceBlock.tsx: zeigt Fragen + gespeicherte Antworten — rein dekorativ
      ↓
      NICHT weitergegeben an:
      - buildAuditContext()  (src/lib/audit/index.ts — AuditContext hat kein complianceData-Feld)
      - runAudit()           (src/lib/audit/index.ts — AuditOptions hat kein complianceData-Feld)
      - irgendein checker    (compliance-checker.ts, agent-regulatory-checker.ts etc.)
```

**AuditContext-Felder (types.ts, Stand 2026-05-06):**
`rootPath, repoMap, packageJson, tsConfig, filePaths, gitInfo, externalTools?, fileContents?`
— kein `complianceData`-Feld, kein `complianceAnswers`-Feld.

**trigger/route.ts:** Baut `ctx` via `buildAuditContext(REPO_ROOT)` — ohne Compliance-Daten, ohne Projekt-ID-Kontext. Die complianceData werden dort nicht geladen.

**compliance-resolver.ts:** Existiert NICHT. Nur in CLAUDE.md (Compliance-Inputs-Sektion) und in `docs/superpowers/plans/2026-04-29-tab-sprint-domain-architektur.md` als geplante Datei beschrieben — nie gebaut.

### Bewertung

**Marken-Bruch bestaetigt — vollstaendige Dekorativitaet.**

Die 9 Compliance-Antworten werden:
- gespeichert (DB korrekt, API korrekt)
- angezeigt (ComplianceBlock)
- gezaehlt (IslandsRow SelfInputIsland: "3/5 beantwortet")
- **NIEMALS** von einem Detektor gelesen

Die DSGVO-Detektoren (`agent-regulatory-checker.ts`) pruefen eigenstaendig den Code-Bestand:
- Existiert `src/app/datenschutz/page.tsx`? (cat-4-rule-11)
- Existiert ein Cookie-Consent-Package? (cat-4-rule-12)
- Existiert ein Data-Export-Endpoint? (cat-4-rule-17)
- Existiert Account-Deletion-UI? (cat-4-rule-18)

Diese Code-Checks laufen komplett unabhaengig von den Compliance-Antworten. Ein User der `has_privacy_policy: true` angibt, bekommt trotzdem cat-4-rule-11 als Finding wenn keine Datenschutz-Seite im Code existiert. Umgekehrt: ein User der `has_avv_supabase: false` angibt (kein AVV mit Supabase) — kein Detektor reagiert darauf, kein Finding.

### Plan-vs.-Realitaet

**Was laut Sprint 6b₁ / CLAUDE.md (Compliance-Inputs-Sektion) passieren sollte:**

> "Compliance-Resolver (`src/lib/audit/compliance-resolver.ts`) beruecksichtigt:
> 1. Code-Existenz-Check (automatisch)
> 2. Stamm-Daten aus Settings
> 3. Detail-Antworten aus Tab-Inputs
> Pflicht-Status: fulfilled | open | input-needed | not-applicable"

**Was tatsaechlich existiert:**

- `compliance-resolver.ts` wurde nie angelegt (Glob-Ergebnis: 0 Treffer)
- `AuditContext` hat kein Compliance-Antworten-Feld
- `runAudit()` nimmt keine Compliance-Antworten entgegen
- Die Dreischichten-Logik (Code + Stamm + Detail) ist Design, kein Code

Der Tab-Sprint (2026-04-29) hat die Infrastruktur fuer das Sammeln der Antworten gebaut (DB-Tabelle, API, ComplianceQuestion-Komponente, ComplianceBlock). Die Konsumptions-Seite (compliance-resolver.ts + AuditContext-Erweiterung + Detektor-Integration) wurde nicht gebaut.

### Empfehlung

**Option A — Minimalziel (ca. 2-3h): Drei explizite AVV/Prozess-Findings**

Neue Rules (manual, `checkMode: 'manual'`) die complianceData als Input nehmen:
- `has_avv_supabase === false` → Finding "AVV mit Supabase fehlt" (cat-4, severity: high)
- `has_avv_vercel === false` → Finding "AVV mit Vercel fehlt" (cat-4, severity: high)
- `has_deletion_process === false` → Finding "Konto-Loeschprozess nicht bestaetigt" (cat-4, severity: medium)
- `data_location === 'USA ohne SCC'` → Finding "DSGVO-kritische Daten-Region" (cat-4, severity: critical)
- `ki_risk_class === 'Hoch'` → Finding "Hochrisiko-KI: Konformitaetsbewertung erforderlich" (cat-22, severity: high)
- `ki_logging_enabled === false` → Finding "KI-Logging nicht bestaetigt" (cat-22, severity: medium)

**Dafuer noetig:**
1. `AuditContext` um `complianceAnswers?: Record<string, unknown>` erweitern (types.ts)
2. `buildAuditContext()` / `runAuditFromDb()` Compliance-Daten aus DB laden (oder als `AuditOptions`-Parameter durchreichen)
3. 6 neue manual-Checker-Rules die `ctx.complianceAnswers` lesen
4. `trigger/route.ts` und `api/projects/scan/route.ts` Compliance-Daten laden + in Context stecken

**Option B — Vollziel (ca. 1 Tag): compliance-resolver.ts implementieren**

Dreischichten-Status-Resolver wie in CLAUDE.md beschrieben. Aufwaendiger, korrekter.

**Prioritaet:** Option A — sofort machbar, schliesst den Bruch zwischen "Antwort gespeichert" und "Antwort ignoriert". Nutzer die `has_avv_supabase: false` anklicken erwarten ein Finding, nicht Stille.

---

## Komponenten-Rules Scope-Trennung — Option 2 implementiert (2026-05-06)

### Was geändert wurde
`checkComponentFileSizes()` (cat-25-rule-2, `repo-map-checker.ts`) filtert `.tsx`-Dateien aus.
Nur `.ts`-Komponenten-Utilities in `/components/` werden auf Datei-Größe geprüft.
Filter: `f.path.endsWith('.ts')` statt zuvor implizit `.ts|.tsx`.

### Begründung
Diagnose 2026-05-06: `cat-1-rule-10` (ast-quality-checker, Zeilen + Hooks) und `cat-25-rule-2`
(repo-map-checker, nur Zeilen) erzeugten Doppel-Findings ab 300 Zeilen für dieselbe `.tsx`-Datei.
Scope-Trennung: AST-Checker mit Hook-Metrik bewertet `.tsx`, Naming-Convention-Checker nur `.ts`.

### Vorher / Nachher
| Datei | Vorher | Nachher |
|-------|--------|---------|
| `Komponente.tsx` (>300Z, viele Hooks) | 2 Findings (cat-1-rule-10 + cat-25-rule-2) | 1 Finding (nur cat-1-rule-10) |
| `util.ts` (>300Z, in /components/) | 1 Finding (cat-25-rule-2) | 1 Finding (unverändert) |

### Audit-Verifikation (2026-05-06)
- `cat-25-rule-2`: Score 5, **0 Findings** (korrekt — kein `.tsx` im Scope)
- `cat-1-rule-10`: Score 3, 63 Findings (alle `.tsx`, alle medium — unverändert)

---

## Diagnose: Komponenten-Rules Severity-Split (2026-05-06)

### Befund

Es existieren **zwei verschiedene Rules** die Komponenten-Größe prüfen:

| Rule-ID | Name | Datei | Schwellenwerte | Severity-Logik |
|---------|------|-------|----------------|----------------|
| `cat-1-rule-10` | "Keine God Components (>300 Zeilen + >5 Hooks)" | `ast-quality-checker.ts` → `checkGodComponents()` | high: >500 Zeilen UND >8 Hooks; medium: >300 Zeilen UND >5 Hooks; medium: >7 state hooks | **Dynamisch** — Severity per Finding nach Schwellenwerten gesetzt |
| `cat-25-rule-2` | "Keine Dateien > 300 Zeilen (Komponenten)" | `repo-map-checker.ts` → `checkComponentFileSizes()` | high: >400 Zeilen (rein); medium: 300–400 Zeilen (rein) | **Dynamisch** — Severity per Finding nach Zeilenzahl gesetzt |

Zusätzlich existiert `cat-1-rule-4` ("Dateien < 300 Zeilen"), aber diese ist seit dem Tab-Sprint explizit so gepacht, dass sie `/components/` ausschließt (`// Exclude /components/ — those are checked by cat-25-rule-2 to avoid duplicates`). Das Overlap zwischen `cat-1-rule-4` und `cat-25-rule-2` ist also behoben.

Der Severity-Split entsteht so:
- Eine Datei die 420 Zeilen und 9 Hooks hat → `cat-25-rule-2` meldet sie als **high** (>400 Zeilen), `cat-1-rule-10` meldet sie als **high** (>500 nicht erfüllt, >300+>5 erfüllt → medium). Dieselbe Datei erscheint in zwei Sektionen.
- Eine Datei mit 350 Zeilen und 6 Hooks → `cat-25-rule-2` meldet **medium** (300–400), `cat-1-rule-10` meldet **medium** (>300+>5). Doppelter Eintrag in der Medium-Sektion.
- `cat-1-rule-10` hat eine dritte Violation-Kategorie (>7 state hooks, severity=medium) die von `cat-25-rule-2` nie erzeugt wird.

Beide Rules sind in `domain: 'code-quality'` und `fixType: 'refactoring'` — identische Klassifikation, aber kategorisch unterschiedlich (`categoryId: 1` Architektur vs. `categoryId: 25` Namenskonventionen).

### Ursache

**Empfehlung B:** Zwei verschiedene Rules mit ähnlichen Titeln und überlappenden Schwellenwerten.

Die Rules messen konzeptuell unterschiedliche Dinge:
- `cat-1-rule-10` (AST-basiert) misst **Komplexität**: Zeilenzahl KOMBINIERT mit Hook-Anzahl. Eine 600-Zeilen-Datei mit 2 Hooks ist kein God Component per dieser Definition.
- `cat-25-rule-2` (RepoMap-basiert) misst **rohe Dateigröße**: Zeilenzahl allein, unabhängig von Hooks. Sie ist ein Style/Naming-Convention-Check (cat-25), kein Architektur-Check.

Die Schwellenwerte überlappen aber erheblich: beide beginnen bei 300 Zeilen. Ein `.tsx`-File in `/components/` das >300 Zeilen hat, löst praktisch immer beide Rules aus — sofern es auch >5 Hooks hat (was bei großen Komponenten fast immer der Fall ist). Das Ergebnis: dieselbe Datei erscheint in der Audit-UI zweimal, oft in verschiedenen Severity-Sektionen, mit ähnlichem aber nicht identischem Meldungstext ("God component:" vs. "Large component:").

Die UI-Verwirrung ist berechtigt. Es handelt sich nicht um einen Daten-Bug (die Findings sind korrekt), sondern um ein Konzept-Overlap das in der Checker-Architektur entstand als `cat-25-rule-2` nachträglich als Komitee-Entscheidung (2026-05-04, 3:1) hinzugefügt wurde.

### Empfehlung

**Backlog-Item: Trennschärfe zwischen cat-1-rule-10 und cat-25-rule-2 schärfen**

Zwei Optionen (als Backlog für nach Beta):

**Option 1 — Schwellenwert-Trennung (minimal-invasiv):**
`cat-25-rule-2` beginnt erst bei 400 Zeilen statt 300 (high: >500, medium: 400–500). Damit deckt `cat-1-rule-10` den 300–400-Bereich ab, `cat-25-rule-2` den 400+-Bereich als reinen Größen-Check. Overlap wird minimiert ohne Rules zu löschen.

**Option 2 — Scope-Trennung (sauber, mehr Aufwand):**
`cat-25-rule-2` prüft nur Dateien die **kein** TSX sind (reine `.ts` Komponenten-Utilities). Alle `.tsx`-Dateien werden ausschließlich von `cat-1-rule-10` (AST-basiert) bewertet, da dort die Hook-Metrik verfügbar ist und ein sinnvolleres Signal liefert. Erfordert Filteränderung in `checkComponentFileSizes()`.

**Sofort-Maßnahme (ohne Code-Änderung):** In der Audit-UI die Gruppen-Ansicht `[data-rule-id="cat-1-rule-10"]` und `[data-rule-id="cat-25-rule-2"]` visuell nebeneinander stellen (z.B. unter einem gemeinsamen "Komponentengröße"-Header) anstatt sie in separate Severity-Sektionen aufzuteilen.

---

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
| 2026-04-30 | cat-25-rule-1 | FP | `placeholder-value` flaggte `src/lib/audit/finding-recommendations.ts:1172` — Zeile enthält Beschreibungstext einer Recommendation die erklärt WIE Placeholder-Werte aussehen (`"YOUR_API_KEY_HERE"`, `"password123"`). Checker kann nicht zwischen Code der Placeholder enthält und Dokumentation die Placeholder als Beispiele nennt unterscheiden. Pattern: P5 (Checker trifft Dokumentations/Recommendation-Code). | `excludePath`-Pattern für `finding-recommendations.ts` ergänzen (Datei ist reiner Recommendation-Text, kein ausführbarer Code). | -- | Mittel |
| 2026-04-30 | cat-2-rule-3 | FP | `console-log` flaggte `src/lib/audit/finding-recommendations.ts` — 3 Treffer allesamt in String-Literalen (Recommendation-Text über console.log-Antipattern). Gleiche Ursache wie cat-25-rule-1. | Gleicher Fix: `finding-recommendations.ts` von String-Content-Scans ausschließen. | -- | Mittel |
| 2026-04-30 | auth-check | FP | `may-lack-auth-check` flaggte `src/app/api/audit/tasks/route.ts` — Route ist seit BP6 ein 410-Gone-Stub ohne Logik. Ein Auth-Check auf einem 410-Stub ist bedeutungslos. | Routes mit ausschließlich 410-Responses vom Auth-Check-Scan ausschließen. | -- | Niedrig |
| 2026-04-30 | backup-docs | FP | `PITR-Status fehlt in Dokumentation` — `docs/runbooks/disaster-recovery.md` existiert mit vollständigem PITR-Runbook. Checker hat die Datei nicht gefunden. | Checker-Pfad auf `docs/runbooks/` erweitern (prüfte wohl nur `README.md` und `docs/*.md`). | -- | Niedrig |
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

## Known Debt — Bewusste Ausnahmen (kein Fix geplant)

Diese Findings sind echte Findings, werden aber bewusst nicht behoben. Begründung dokumentiert.

| Datum | Regel-ID | Finding | Bewusste Ausnahme | Begründung |
|-------|----------|---------|-------------------|------------|
| 2026-05-04 | `cat-1-rule-10` | 68 oversized components | ~60% sind eingefrorene Phase-4-Dateien (agenten, feeds, workspaces, chat, perspectives) | Frozen-Code wird in Phase 4 entschieden (re-aktivieren / löschen / selektiv). Kein Refactoring an eingefrorenen Dateien vor dieser Entscheidung. |
| 2026-05-04 | `cat-2-rule-12` | 48 functions mit hohem CC | Gleiche Ursache: frozen Phase-4-Dateien | s.o. |
| 2026-05-04 | `cat-10-rule-5` | Test-Coverage < 80% | Known seit Projektstart | Phase 2.5 Sub-Item 3 adressiert das. Bis dahin: bewusst belassen. Ziel 30% für kritische Pfade (Top-Issues-Eintrag). |
| 2026-05-04 | `cat-11-rule-4` | Kein Terraform/Pulumi | Vercel-native IaC via vercel.json ist die bewusste Strategie | vercel.json deckt alle Deployment-Konfigurationen ab. Terraform wäre Over-Engineering für Vercel-native-Stack. |

## False Positives — neu identifiziert (Dogfooding 2026-05-04)

| Datum | Regel-ID | FP-Beschreibung | Reproduzierbar | Fix-Aufwand |
|-------|----------|----------------|----------------|-------------|
| 2026-05-04 | `cat-12-rule-6` | `console.*` in String-Literalen (Prompt-Texte in finding-recommendations.ts) | Ja | Klein — String-Content vor Regex-Match ausschließen (P4-Pattern) |
| 2026-05-04 | `cat-3-rule-15` | 410-Only-Routes ohne Auth-Check gemeldet (audit/tasks/*) | Ja | Klein — Routes mit ausschließlich Error-Response-Body excluden |

## Killer-Detektoren — bekannte FPs und Allowlists (Stand 2026-05-04)

### Hardcoded Secrets — scripts/ Ausnahme
`src/scripts/` ist global aus dem Hardcoded-Secrets-Killer-Detektor excludiert.
Begründung: CLAUDE.md — "src/scripts/ use direct API keys (not AI Gateway) — gateway billing not configured."
Bei Migration zu Vercel AI Gateway billing kann diese Allowlist in `security-scan-checker.ts` angepasst werden.

### Auth-Check — Beta-Waitlist und Stub-Routes
`/api/beta/waitlist` ist explizit als intentionally-public in der publicPrefixes-Allowlist.
410/404/501-Only-Routes werden per Stub-Erkennung excludiert (File-Content-Check mit fs-Fallback).
Fix 2026-05-04: `ctx.fileContents?.get(f.path)` hatte keinen Fallback bei Standard-Audit-Runs —
jetzt: `ctx.fileContents?.get(f.path) ?? readFileSafe(ctx.rootPath, f.path)`.

### SQL-Injection — Drizzle sql-Tag ist safe
Drizzle `sql\`...\`` tagged template ist parametrisiert. Pattern `sqli-template` excludiert migrations/.
Supabase QB (.from, .eq, .filter) ist safe — kein Raw-SQL, wird nicht gemeldet.

## Dependency-Scanner — Killer-Detektor (Stand 2026-05-04)

### Nur patchbare CVEs werden Killer
ADR-027 definiert "ungepatchte kritische Dependencies (CVSS >9)" als Killer.
Implementierung: nur CVEs mit `patched_versions !== '<0.0.0'` bekommen `isKiller: true`.
Begründung: Killer ohne Action-Pfad ist frustrierend — User braucht konkretes Update-Target.
Unpatchbare Critical-CVEs → Polish-Findings mit high-Severity.

### DevDependencies excluded via --prod
`pnpm audit --prod` excludiert alle devDependencies aus dem Killer-Detektor.
Begründung: kein Production-Risiko.

### moderate CVEs unter CVSS 9 = Polish, nicht Killer
Tropen OS hat 3 moderate CVEs (uuid, postcss, @anthropic-ai/sdk) mit CVSS 0–6.1.
Diese erscheinen als Polish-Findings (medium severity), blockieren nicht die Veröffentlichung.
Update-Empfehlung: pnpm update wird als suggestion mitgegeben.

## CVE-Hygiene 2026-05-04 — 3 transitive moderate CVEs (accepted)

| Paket | CVSS | Blockiert durch | Re-Check |
|-------|------|----------------|----------|
| uuid@10 | 0 | langsmith@0.5.20 + resend/svix (brauchen uuid >=14) | 2026-07-04 |
| postcss@8.4.31 | 6.1 | next@15.5.15 (Next.js bundelt postcss, Patch-Release ausstehend) | 2026-07-04 |
| @anthropic-ai/sdk@0.81.x | 0 | transitive Pfad, Upstream-Update abwarten | 2026-07-04 |

Alle CVSS ≤ 6.1 → keine Killer, kein User-Daten-Risiko.
Kein manueller pnpm override — würde next.js-Deps destabilisieren.

**Re-Check 2026-07-04:** `pnpm audit --prod` laufen lassen. Wenn CVEs noch offen:
Upstream-Changelog prüfen, dann entweder erneut akzeptieren oder fixen.

## Build-Check — Performance-Hinweis (Stand 2026-05-04)

Production-Build-Check (`cat-3-rule-build`) läuft bei jedem Audit als Killer-Detektor.
Implementierung: `cliChecks.checkProductionBuild` in `cli-checker.ts`, registriert in `rule-registry.ts`.
Timeout: 3 Minuten. CI=true. NODE_OPTIONS via subprocess env (cross-platform).

Windows-Fix: Build-Script in package.json auf `cross-env NODE_OPTIONS=... next build` umgestellt
(war: `NODE_OPTIONS=... next build` — funktioniert nur auf Unix, nicht auf Windows-Shell).

Gleichzeitig: isKiller-Logik auch in `checkNpmAudit` (external-tools-checker.ts) ergänzt —
der registrierte Checker für cat-3-rule-7 ist dort, nicht in cli-checker.ts.

## Build-Check — Timeout-Anpassung (Stand 2026-05-04)

**Anlass:** Self-Audit zeigte cat-3-rule-build mit ETIMEDOUT (FP).
- Build-Zeit Tropen OS: ~210s
- Vorheriger Timeout: 180s → **Neuer Timeout: 300s**

**Plus:** `sentry.client.config.ts` gelöscht — produzierte Deprecation-Warning in Next.js 15.5,
nicht mehr nötig da `src/instrumentation-client.ts` die Sentry-Initialisierung übernimmt.

**Re-Check:** wenn Build-Zeiten weiter steigen, separater Sprint zu Build-Optimierung.

## Config-Analyzer — Allowlists (Stand 2026-05-04)

### DB-SSL Detektor (config-killer-db-ssl)
- localhost / 127.0.0.1 / 0.0.0.0 Hosts → kein Killer
- `.env.local`, `.env.development`, `.env.test` excludiert
- Variablen mit `_DEV_`, `_TEST_`, `_LOCAL_` excludiert
- Unbekannter DB-Typ → konservativ kein Killer (FN besser als FP)

### Dev-Secrets Detektor (config-killer-dev-secret)
- `pk_test_*` (Stripe publishable) erlaubt — public by design
- Production-Filter: `.env.production` und `.env`
- Test-Dateien excludiert

### HTTPS Detektor (config-killer-https)
- Platform-IaC-Whitelist: vercel.json/netlify.toml/fly.toml/railway.toml+json/render.yaml
- Tropen OS hat vercel.json → kein Killer (erwartet)
- Custom-Detection als Fallback: middleware.ts, next.config.*, server.*

---

## Profile-Onboarding (Stand 2026-05-05, Sprint 5)

Sprint 5 abgeschlossen. 3 Pflichtfragen + 2 empfohlene + Wizard-Modus, Persistenz mit Historie in `scan_project_profiles`.

### Bekannte Limitierungen

**LAZY-Detection nicht aktiv:** Detektoren konsumieren `DomainActivation` noch NICHT. Aktuell läuft jeder Detektor wie vorher (alle aktiv für alle Profile). `getDomainActivation()` in `src/lib/audit/project-profiles.ts` speichert die Activation-Info, aber erst mit Schritt 9 (ADR-027) wird sie von den Detektoren konsumiert.

**Konsequenz:** Solo-Projekt-User sehen aktuell dieselben Findings wie B2B-Regulated. Profil-Auswahl beeinflusst nur die Datenbank, nicht den Audit-Output.

**Re-Check:** mit Implementation von Schritt 9 (Domain-Detektoren).

### Migration bestehender Projekte

Default beim ersten Audit nach Sprint 5: B2C-App + EU (Modal mit Pre-Fill). User kann anpassen.

Coach-Wording bei Pre-Fill: "Wir haben ein paar Annahmen für dich getroffen. Bitte prüfe, ob das stimmt."

### Modal-Loop-Sicherung

`profileJustSet`-Override-State in `AuditActions.tsx` verhindert Re-Open des Modals zwischen User-Submit und Server-State-Refresh (bevor Next.js Router den `needsOnboarding`-Prop aktualisiert).


---

## Sprint 9-Polish-1/2/3 — Abschluss UI-Pivot-Runde (Stand 2026-05-05)

### 9-Polish-1 (Hybrid-Badge + Auto-Skip + 0-Dateien)
- Hybrid-Badge: 🟡 "Veröffentlichbar mit Polish-Bedarf" bei 0 Killer + Polish < 70%
- Auto-Skip-Sektion als Info-Block (Marken-Brief 28.6)
- 0-Dateien-Stale-Data: file_count=0 mit last_scan_at → Score trotzdem zeigen
- POLISH_THRESHOLD = 70 in KillerStatusBadge.tsx

### 9-Polish-2 (Pattern-Cluster + KI-Optik + Aufwand-Klassen)
- Pattern-Cluster: Findings mit gleichem rule_id → "X Dateien betroffen" (collapsed)
- KI-Optik raus: "Empfohlen zuerst" = linker Border-Strich (var(--teal)), kein blauer Hintergrund
- Aufwand-Klassen: Quick Win / Mittel / Größer (keine Minuten-Schätzungen — Marken-Brief 28.1)
- Sortierung intern weiterhin minutenbasiert

### 9-Polish-3 (Score-Header + Mini-Status + Compliance-Visual)
- Score-Header: "Veröffentlichungs-Check", 60/40-Layout
- Links: Killer-Badge + 3 Coach-Subtext-Varianten + Polish-Score
- Rechts (nur bei Scan-Projekten): "Was wir von dir brauchen" — Mini-Status DSGVO/KI-Act/Lighthouse mit Scroll-Anchors
- Doppel-Icon-Fix: Note-Icon entfernt, nur 📋 als Marker
- Compliance-Blöcke: weißer Hintergrund, neutrale Border (kein gelblicher Tint)
- "Top 14%" entfernt (kein klarer Bezugspunkt)
- Scroll-Anchors: #dsgvo-stamm-daten, #eu-ai-act, #lighthouse-url

### Sichtbarkeits-Logik Compliance-Blöcke (final)
- DSGVO + KI-Act: immer sichtbar wenn kein Chip aktiv (Selbst-Auskunft unabhängig von Findings)
- Lighthouse: nur wenn Performance-Chip aktiv ODER Performance-Findings vorhanden
- Pattern-Cluster sichtbar wenn findings > 0 in der Sektion

### 9-Polish-3-Inseln (Drei Inseln oberhalb Findings, 2026-05-06)
ScoreBar (60/40 AppSection) ersetzt durch drei separate helle Insel-Karten.

**KillerStatusIsland (Insel 1)**
- KillerStatusBadge (full) + Coach-Subtext (3 Varianten) + Projekt/Zeit-Kontext
- Keine Subcounts/Zahlen-Kennzahlen (Coach-Position 28.1)

**PolishScoreIsland (Insel 2)**
- Score 28px + Trend-Delta (TrendUp/TrendDown Icons + %-Wert)
- Drei UI-Zustände: First-Audit ("Baseline") / Stable ("Stabil") / Up|Down ("vs. letzter Audit")
- Trend-Schwelle ±1% (src/lib/audit/trend.ts, TREND_THRESHOLD=1)
- "4 Modelle"-Badge bei Multi-Model-Review

**SelfInputIsland (Insel 3)**
- Nur bei externen Scan-Projekten (hasProject + complianceData vorhanden)
- Drei Mini-Status-Zeilen mit 📋 + Scroll-Anchor-Links (#dsgvo-stamm-daten, #eu-ai-act, #lighthouse-url)
- Ohne Projekt: Placeholder mit dashed Border + Hinweis

**Compliance-Blöcke-Polish**
- Gelbe Border-Color (rgba(229,160,0,0.30)) → var(--border) (sachlicher)
- IDs und Scroll-Anchors waren bereits vorhanden

**Neue Dateien:** src/lib/audit/trend.ts, _components/IslandsRow.tsx

### 9-Polish-3-FIX (Compliance-Blöcke + Visuelle Angleichung, 2026-05-06)

**Root cause:** DSGVO/KI-Act-Blöcke waren nicht gelöscht, sondern durch zwei Bedingungen versteckt:
1. `showDsgvo`/`showKiAct` wurden fälschlicherweise durch aktiven Category-Filter deaktiviert
2. `{projectId && ...}` Guard hält sie bei internem Audit verborgen (Design-Entscheidung, kein Bug)

**Fix 1 — Compliance-Blöcke:** `showDsgvo = true`, `showKiAct = true` — immer sichtbar für externe Projekte, unabhängig von aktivem Filter.

**Fix 2 — Insel 3:** `IslandPlaceholder` entfernt. `SelfInputIsland` immer gerendert (auch bei 0/5, 0/4). Bei fehlendem externem Projekt: Hinweis "Verbinde ein externes Projekt..." als Fußnote, Links bleiben klickbar.

**Fix 3 — Visuelle Angleichung:**
- KillerStatusIsland: `KillerStatusBadge` (mit Rahmen) → großes Icon+Label ohne Border-Box, zentriert. Farben: Türkis (Veröffentlichbar), Amber (Polish-Bedarf), Rot (Stopper)
- PolishScoreIsland: Score-Zahl in `var(--teal)` (Türkis), "Polish"-Label grau, zentriert
- `.islands-row`: `align-items: stretch` → alle Inseln gleiche Höhe
- `.island--centered`: neue CSS-Klasse für zentriertes Layout (Inseln 1+2)
- `.island`: `display: flex; flex-direction: column` für gleichmäßige Höhe

### 9-Polish-4 — Detail-Fixes Audit + SectionLabel-Sweep (Stand 2026-05-06)

**SectionLabel als Reusable Component:** `src/components/ui/SectionLabel.tsx`
- Mono-Font 12px, `var(--accent)`, 28px-Linie, marginBottom 20
- Visual 1:1 aus Dashboard-Pattern extrahiert

**Sweep:** Dashboard (extrahiert), Audit (neu), audit/scan/ProjectList (h2 → SectionLabel)

**Detail-Fixes Audit-Seite:**
- Page-Subtext `t('subtitle')` entfernt
- SectionLabel "Audit für [Projektname]" über IslandsRow
- Insel 1: Projektname + lastRunAt-Footer entfernt (stand jetzt im SectionLabel)
- `projectName`/`lastRunAt` Props aus IslandsRow-Interface entfernt
- Insel 2: "Polish"-Label hinter Score entfernt
- Insel 3: 📋-Icons aus Mini-Status-Zeilen entfernt; Label jetzt zentriert (`alignSelf: 'center'`)
- Text in Insel 1+2 Subtext: `var(--text-secondary)` statt `var(--text-tertiary)` (dunkler, stärker)

### Sprint 9-Critical-Killer + Findings-Order (Stand 2026-05-06)

**Severity-Coupling:**
- `shouldBeKiller(severity, ruleId)` in `killer-rule-ids.ts` — einziger Entscheidungspunkt
- `severity='critical'` → automatisch Killer (agent-regulatory, ast-quality-checker hatten Critical ohne isKiller)
- Trigger-Route: `is_killer: shouldBeKiller(f.severity, f.ruleId)` (statt `f.isKiller ?? null`)
- page.tsx-Fallback: `shouldBeKiller(severity, rule_id)` (statt `isKillerByRuleId`)

**DB-Migration 20260506000118:** Critical-Findings auf is_killer=true gesetzt

**Findings-Sektionen:**
- STOPPER: alle is_killer=true, nach Severity sortiert
- EMPFOHLEN ZUERST: Top 10 non-Killer, Severity-Pyramide + Quick Wins bei Gleichstand
- WEITERE: Rest mit Severity-Sub-Sektionen (Hoch/Mittel/Niedrig) via SectionLabel-Trenner
- Pattern-Cluster funktioniert innerhalb jeder Sub-Sektion

### Sprint Top-10-Bundle (Stand 2026-05-06)

Fix-Session-Bundle für "EMPFOHLEN ZUERST"-Sektion eingeführt.

**Bundle-Button:** rechts im Sektions-Header, `btn-primary` Türkis-Stil, nur sichtbar wenn Findings vorhanden
**Modal:** öffnet sich inline, dark background für Prompt, Copy-Button mit Feedback, Escape/Klick-auf-Backdrop schließt
**API:** existierende `/api/audit/fix-session` (nimmt findingIds, file-grouped Output via buildFixPrompt)
**GlobalQuickWinsBar:** gelöscht (war nicht gerendert; Top-10-Bundle ersetzt das BP8-Versprechen)
**FindingSection-Header:** von `<button>`-Wrapper zu `<div>` umgebaut (bundle + toggle als separate Buttons)
**Re-generate:** Prompt wird nur einmal generiert pro Session-State; bei Schließen/Öffnen kein neuer API-Call
