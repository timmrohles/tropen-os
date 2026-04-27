# Architect Log — Tropen OS

> Protokoll aller Architektur-Entscheidungen.
> Wird nach jedem Build ergänzt.
> Einzige Quelle der Wahrheit für getroffene Entscheidungen.

---

### 2026-04-27 — phase-2-vision.md + feature-bestand.md angelegt (Timms Aufgaben)
**Ampel:** 🟢
**Prompt:** Tag 4.5 Abschluss
**Entscheidung:** `docs/phase-2-vision.md` (5 Pfeiler KMU-Substanz) + `docs/product/feature-bestand.md` (39 Features mit Status-Markern) von Timm erstellt und ins Projekt eingebracht. CLAUDE.md-Referenz auf phase-2-vision.md aktualisiert. Tag-4.5-Phase ist damit vollständig abgeschlossen.
**Offene Punkte:** L1 (SQL-Queries usage_logs), L2 (Vibe-Coder-Outreach) — Timms Aufgaben.

---

### 2026-04-27 — Fix-Engine deaktiviert (BP4)
**Ampel:** 🟢
**Prompt:** BP4 (Tag 4.5)
**Entscheidung:** Fix-Engine via NEXT_PUBLIC_FIX_ENGINE_ENABLED=false deaktiviert. Code bleibt im Repo. Fix-Prompt-Export bleibt aktiv und unberührt. 8 Stellen in src/ geschützt: useDeepFix.ts (Früh-Return in trigger()), DeepFixButton.tsx (null-Return), 4 API-Routes (/apply, /generate, /consensus, /batch-generate) geben 410 Gone. .env.example dokumentiert. pnpm tsc --noEmit grün.
**Anpassungen gegenüber ursprünglichem Plan:** keine
**Offene Punkte nach dem Build:** Sprint-4-Entscheidung — transformieren in Veredler oder entfernen
**Neue Lernmuster:** Feature-Flag-Pattern als reversible Stilllegung statt destruktiver Code-Entfernung.

---

### 2026-04-27 — A17 Tier-Feld in rule-registry.ts (BP3)
**Ampel:** 🟢
**Prompt:** BP3 (Tag 4.5)
**Entscheidung:** `AuditTier = 'code' | 'metric' | 'compliance'` in types.ts ergänzt. Bestehendes `tier?: RuleTier` (maturity) zu `maturityTier?: RuleTier` umbenannt. Neues `tier?: AuditTier` zu AuditRule hinzugefügt (optional, da 183+ Rules vorhanden). 176 inline Rules + 7 explizite manual()-Aufrufe mit korrektem Tier klassifiziert. Restliche manual()-Aufrufe defaulten auf 'code'. pnpm tsc --noEmit grün.
**Anpassungen gegenüber ursprünglichem Plan:** (1) Feld-Name-Konflikt: bestehendes `tier?: RuleTier` → `maturityTier?: RuleTier`, neues `tier?: AuditTier` statt Neuname. (2) Datei hat 183+ Rules, nicht ~70 wie in Instruction angenommen — Verteilung proportional korrekt. (3) Feld optional statt required, weil manual()-Default ausreicht und Pflicht erzwingen alle 183 Signaturen ändern würde.
**Offene Punkte nach dem Build:** Sprint 1 UI-Umbau: separate Ansichten per tier nutzen.
**Neue Lernmuster:** Naming conflicts bei bestehenden Feldern: immer erst prüfen ob name bereits vergeben, dann umbenennen statt überschreiben.

---

### 2026-04-27 — CLAUDE.md aktualisiert nach Tag-4-Synthese (BP2)
**Ampel:** 🟢
**Prompt:** BP2 (Tag 4.5)
**Entscheidung:** Drei-Rollen-Aufteilung als neue Sektion vor "Wie dieses Dokument funktioniert" eingefügt. Strategische ADRs 020–023 im Tech Stack ergänzt. Veredler-Substanz-Notiz nach AI-Modelle hinzugefügt. Library-System als TRANSFORMATION umetikettiert mit explizitem Status-Marker. Feature-Dokumentation-Verweis auf feature-bestand.md aktualisiert. Neue Code-Regel: Roadmap-Konformität vor jedem Feature prüfen. Referenzdokumentation um synthese-Dateien + ADR-023 erweitert.
**Anpassungen gegenüber ursprünglichem Plan:** Kein separater "Library-System (Capability + Outcome + Role + Skill)"-Abschnitt existierte in CLAUDE.md — neuer Abschnitt direkt nach Feature-Dokumentation eingefügt.
**Offene Punkte nach dem Build:** feature-bestand.md (Umbenennung + Status-Marker) ist Timms Aufgabe; phase-2-vision.md ist Timms Aufgabe
**Neue Lernmuster:** CLAUDE.md-Updates folgen dem Governance-Block strikt — kein Entfernen, nur Ergänzen.

---

### 2026-04-27 — ARCHITECT.md aktualisiert nach Tag-4-Synthese
**Ampel:** 🟢
**Prompt:** BP1 (Tag 4.5)
**Entscheidung:** ADR-020/021/022/023 als Pflicht-Lektüre (Items 10–13) verankert. Bestehende Nummern 10–22 auf 14–26 verschoben. Faustregel entsprechend aktualisiert + neue Zeile "Strategie-relevant?". Drei-Rollen-Aufteilung als neue Sektion zwischen Architektur-Übersicht und Governance-Entscheidungen eingefügt. Bekannte Fallstricke um "Drei-Visionen-Drift" ergänzt. Bauplan-Sektion auf Sprint-Sequenz aus Anhang A umgestellt. Tag-4-Inventur in ✅ Abgeschlossen aufgenommen. docs/synthese/ mit allen 4 Anhang-Dateien angelegt.
**Anpassungen gegenüber ursprünglichem Plan:** Faustregel-Nummern 21–22 auf 25–26 korrigiert (konsistent mit Renummerierung). Offene Architektur-Fragen: bestehende Einträge (Geteilte Chats, Agenten) behalten, neue Einträge vorangestellt.
**Offene Punkte nach dem Build:** A19 Prompt-Reihenfolge, Multi-Modell-Review-Entscheidung
**Neue Lernmuster:** Strategie-Updates an ARCHITECT.md sind klein und additiv möglich, ohne bestehende Struktur zu brechen.

---

## 2026-04-22 — 5 Strukturelle Checker-Probleme behoben (Dogfooding-Insights)

**Ampel:** 🟢
**Prompt:** Dogfooding-Session: 187 Refactoring-Findings triagiert → 5 strukturelle Checker-Probleme identifiziert und behoben

**Kontext:**
Während der Triage von 187 Findings aus Audit-Run `104fca64-786a-40d4-8fe3-3fee90c382d5` wurden 5 systematische Probleme erkannt, die zu False Positives oder Rauschen führten.

**Insight 1 — Frozen Feature Classification (P17)**
- **Problem:** ~40+ Findings aus eingefrornenen Routen (`/agenten`, `/feeds`, etc.) erschienen in der "Offen"-Ansicht
- **Fix:** `AuditOptions.frozenPaths?: string[]` + `Finding.frozen?: boolean`; `runAudit()` markiert Findings aus diesen Pfaden; Trigger-Route persistiert sie als `status='dismissed', not_relevant_reason='frozen-path'`
- **CLI:** `--frozen-paths agenten,feeds,workspaces,chat,projects,artifacts`
- **Dateien:** `types.ts`, `index.ts`, `trigger/route.ts`, `deduplicator.ts`, `run-audit.ts`

**Insight 2 — Bundle Size Checker Kalibrierung (P15)**
- **Problem:** `checkBundleSizes()` summierte ALLE `.next/static/chunks/*.js` → 17 MB → immer Score 1 (false)
- **Fix:** Filtert auf Initial-Load-Chunks: `framework-*.js`, `main-*.js`, `polyfills-*.js`, `webpack-*.js`
- **Datei:** `external-tools-checker.ts` → `checkBundleSizes()`

**Insight 3 — Prop Drilling Checker (P14)**
- **Problem:** `checkPropDrilling()` flaggte Komponenten mit >10 Props als "Prop Drilling" — unabhängig davon ob Props tatsächlich weitergereicht werden
- **Fix:** Identity-Forwarding-Detektion: `propName={propName}` Pattern (≥3 Matches) + `{...props}/{...rest}` Spread-Detektion
- **Datei:** `state-deps-obs-checkers.ts` → `checkPropDrilling()`
- **Limitation:** Regex matcht gegen ganzen File-Content, nicht nur die Komponenten-Body — bekannte Einschränkung, kein Regressionsrisiko

**Insight 4 — Multi-Counting UI Deduplication (Approach B)**
- **Problem:** Eine Datei die von 4 Regeln gleichzeitig geflagt wird (z.B. FixPreview.tsx: Dateigröße + CC + God Component + Länge) erscheint als 4 unabhängige Karten ohne sichtbare Verbindung
- **Fix:** `alsoAffectedByRules?: Array<{ruleId, label}>` in `FindingGroup`; `groupFindings()` berechnet Cross-Referenzen nach dem Aufbau der Groups; `RecommendationCard` zeigt "betrifft auch: CC, Dateigröße" Pill-Badges
- **Dateien:** `group-findings.ts` (Interface + Algorithmus), `RecommendationCard.tsx` (Display)

**Insight 5 — Naming Convention Whitelist (P16)**
- **Problem:** `_DESIGN_REFERENCE.tsx` wurde als PascalCase-Verletzung geflagt (Underscore-Prefix)
- **Fix:** `/^_[A-Z]/`-Guard in `checkNamingConventions()` — `_ALLCAPS.tsx`-Dateien werden übersprungen
- **Datei:** `repo-map-checker.ts` → `checkNamingConventions()`

**Neue Patterns:** P14 (Threshold-Heuristik ohne Semantik), P15 (Kumulative Metrik misst das Falsche), P16 (Konventions-Ausnahmen fehlen), P17 (Feature-blinde Auditierung) → `docs/checker-design-patterns.md`

**Erwartete Auswirkung:** Nächster Audit-Run mit `--frozen-paths` → deutlich weniger Noise in der "Offen"-Ansicht. Prop-Drilling und Bundle-Size-Findings werden selektiver und präziser.

---

## 2026-04-22 — FOUT beseitigt (Font-Loading-Flicker)

**Ampel:** 🟢
**Prompt:** FOUT beim Scrollen — Überschriften und Bold-Text zeigen kurz System-Fallback

**Diagnose:**
- Inter war mit Gewichten `['300', '400', '500', '600']` konfiguriert — **700 fehlte**, obwohl `font-weight: 700` ~70× in globals.css vorkommt. Browser synthetisierte Bold künstlich (leicht anders als echter Bold-Font).
- Alle drei Fonts (`Inter`, `Plus_Jakarta_Sans`, `JetBrains_Mono`) nutzten `display: 'swap'` → System-Fallback wird zuerst gezeigt, dann ausgetauscht → sichtbarer Wechsel beim Scrollen in langen Listen.
- Kein `font-synthesis: none` → Browser durfte Bold/Italic simulieren.

**Fix in `src/app/layout.tsx`:**
- Inter Gewicht `'700'` ergänzt
- Alle drei Fonts auf `display: 'optional'` umgestellt (kein sichtbarer Swap; bei sehr langsamer Verbindung bleibt Fallback dauerhaft — akzeptabel)
- `preload: true` explizit gesetzt (war implizit aktiv, jetzt explizit dokumentiert)

**Fix in `src/app/globals.css`:**
- `font-synthesis: none` auf `html` und `body` — verhindert künstliche Bold/Italic-Simulation während Font lädt

**Entscheidung `display: optional` statt `swap`:** Kein FOUT möglich, weil der Browser bei `optional` den Font nur nutzt wenn er aus dem Cache kommt. Beim ersten Load bleibt der System-Font stabil sichtbar. Ab dem zweiten Load (Font im Cache) erscheint der Custom-Font sofort ohne Wechsel. Für eine Production-App mit wiederkehrenden Nutzern ist das die beste Strategie.

---

## 2026-04-22 — Deep Fix Button (Consensus Fix Engine UI)

**Ampel:** 🟢
**Prompt:** Integrate existing Consensus Fix Engine backend into audit UI (superpowers:writing-plans)

**Entscheidung:** Lazy-caching strategy für Deep Fix: GET on first click (cache hit → sofort), 404 → POST (generation). Verhindert 50+ GET-Requests beim ersten Render von FindingsTable. `runId` wird von FindingsTable → RecommendationCard als optionaler Prop durchgereicht — AuditFinding hat kein run_id-Feld. `DeepFixButton` rendert unter der Actions-Flex-Row (nicht darin), damit ConsensusFixResult als Block-Element sauber expandiert.

**Anpassungen:**
- GET route scoped per `organization_id` (Tenant-Isolation)
- POST response fehlte `drafts`-Feld → `ConsensusFixResult` crashte auf `.filter()`. Fix: `drafts: consensus.drafts` und `riskReasons` explizit in POST-Response aufgenommen.
- `localStorage` in `useState`-Lazy-Initializer in `FindingsTable` verursachte Hydration-Mismatch → `useState(false)` + `useEffect` für client-seitiges Lesen.

**Offene Punkte:**
- Diff-Viewer: POST response enthält `diffs` — aktuell nicht angezeigt (future: inline diff mit Syntax-Highlighting)
- Budget-Check vor POST wäre ideal (analog zu anderen LLM-Routes)

**Neues Lernmuster:** Bei feature-gated UI-Buttons auf API-Features immer lazy-check pattern verwenden (GET → 404 → POST) statt on-mount-prefetch — verhindert Request-Storms bei Listen-Views.

---

## 2026-04-22 — Secret-Detection-Checker kalibriert + Komitee-Beobachtung dokumentiert

**Ampel:** 🟢
**Prompt:** False Positive: hardcoded-secret auf src/scripts/agent-gen-defs.ts

### Kalibrierung: scripts/agent-gen aus hardcoded-secret ausgeschlossen

`hardcoded-secret` Pattern in `security-scan-checker.ts` (cat-3-rule-21) bekam `[\\/]scripts[\\/]agent-gen` als zusätzliche `excludePattern`-Exclusion.

**Datei-Charakter:** `src/scripts/agent-gen-defs.ts` enthält keine Credentials. Sie definiert drei große Template-String-Literale (`RULES_*`), die als System-Prompt-Bausteine für den LLM-Agent-Generierungsprozess (`generate-agents.ts`) dienen. Diese Prompts instruieren die LLMs bei der Code-Analyse welche Security-Regeln zu prüfen sind — deshalb tauchen Wörter wie "Secret", "Key", "Token", "Password" als Regel-Vokabular auf, nicht als Credential-Zuweisungen.

**Pattern-Kontext:** Das `hardcoded-secret`-Regex erfordert `keyword\s*[:=]\s*['"][8+ chars]['"]` — also eine tatsächliche Zuweisung mit quoted Value. Natürliche Sprache in Prompts hat diese Struktur selten. Trotzdem: prophylaktische Exclusion verhindert zukünftige Matches wenn Prompt-Text zufällig dieser Struktur ähnelt (z.B. Beispiel-Code in Prompt-Instruktionen). Pattern-Klasse: P5 (Checker trifft Dokumentations-Code).

### Komitee-Beobachtung: Common-Mode-Failure bei LLM-Konsens

**Beobachtung:** Das Finding wurde vom Multi-Model Komitee (4 Reviewer: Sonnet 4.6, GPT-5.4, Gemini 2.5 Pro, DeepSeek + Opus-Judge) als gültig eingeschätzt. Kein Modell hat widersprochen.

**Interpretation:** Dies ist ein Common-Mode-Failure. Alle vier Modelle haben im Training gelernt: "Datei enthält Security-Vokabular → potentielles Credential-Risiko". Bei einer Datei die über Security schreibt (nicht Security verletzt), führt diese Heuristik systematisch zum gleichen False Positive. Die Modelle sind nicht unabhängig genug in dieser spezifischen Fehlerkategorie.

**Implikation für die Komitee-Hypothese:** "Konsens aus vier Modellen macht bessere Findings" gilt für viele Klassen. Es gilt NICHT wenn alle Modelle dieselbe Heuristik-Schwäche gelernt haben — dann multipliziert der Komitee-Konsens das Problem, statt es zu korrigieren. Deterministische Exclusion-Rules (wie der hier gemachte Fix) sind in dieser Klasse zuverlässiger als LLM-Konsens.

**Referenz:** Backlog-Eintrag "Auswertung Komitee-Findings" — dieser Befund gehört in die dortige Analyse.

### Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/lib/audit/checkers/security-scan-checker.ts` | `hardcoded-secret.excludePattern` um `[\\/]scripts[\\/]agent-gen` erweitert + erklärender Kommentar |
| `docs/checker-feedback.md` | FP-Eintrag cat-3-rule-21 ergänzt (Komitee-Kontext, Pattern P5+P13) |
| `docs/checker-design-patterns.md` | P13 "Security-Checker: Pattern-Matching statt Keyword-Matching" neu angelegt |

---

## 2026-04-22 — Deep Fix Button: Consensus Fix Engine als UI-Feature exposed

**Ampel:** 🟢
**Prompt:** Deep Fix Button — macht Consensus Fix Engine für Nutzer zugänglich

### Architektur-Entscheidung: Lazy-Cache-Pattern für teure LLM-Operationen

Der Konsens-Fix kostet ~€0.50 und dauert ~60 Sekunden. Statt einem reinen POST-Button-Ansatz wählen wir ein GET-first-Muster:

1. Klick → GET `/api/audit/fix/consensus?findingId=...` (Cache-Lookup in DB)
2. HTTP 200 → sofort anzeigen (Cache-Hit)
3. HTTP 404 → POST (Generierung, ~60s)

Dieses Pattern verhindert Doppelgenerierungen und macht den Button nach erstem Klick sofort reagierend.

### State-Machine im Hook

`useDeepFix` implementiert explizit `idle | checking | generating | ready | error` — kein boolean `isLoading`. Vorteil: UI kann zwischen "Prüft Cache" und "Generiert (60s)" unterscheiden.

### Tenant-Isolation

Jede `audit_fixes`-Query filtert auf `organization_id` (threading über Auth-Guard im GET-Handler). Keine Org-übergreifende Fix-Sichtbarkeit möglich.

### Wo der Button sitzt

`DeepFixButton` rendert am Ende der aufgeklappten `RecommendationCard` — nach den Aktions-Buttons (Fix-Prompt / Erledigt / Nicht relevant), aber vor dem "Nicht relevant"-Block. Karte muss aufgeklappt sein (Klick auf Header).

Sichtbarkeits-Bedingung: `runId && !(group.fixType === 'manual' && recommendation?.manualSteps)` — identisch mit Fix-Prompt-Button.

### runId-Threading

`AuditFinding` hat kein `run_id`-Feld. `runId` wird von `FindingsTable` (existierendes Prop) über `RecommendationCard` (neues optionales Prop) bis zu `DeepFixButton` gethreaded.

### Hydration-Bugfix

`isVercelEnv={!!process.env.VERCEL}` in `audit/page.tsx` erzeugte einen Hydration-Mismatch: Non-`NEXT_PUBLIC`-Env-Vars werden vom Next.js-Bundler client-seitig auf `undefined` gesetzt. Fix: `NEXT_PUBLIC_VERCEL_ENV` — von Vercel auf beiden Seiten injiziert, lokal immer `undefined`.

### Neue Dateien

| Datei | Inhalt |
|-------|--------|
| `src/hooks/useDeepFix.ts` | State-Machine-Hook (idle/checking/generating/ready/error) |
| `src/app/[locale]/(app)/audit/_components/ConsensusFixResult.tsx` | Ergebnis-Karte (Drafts, Risk, Judge, Explanation) |
| `src/app/[locale]/(app)/audit/_components/DeepFixButton.tsx` | Button-Komponente mit Lazy-Cache-Logik |
| `test/audit/useDeepFix.unit.test.ts` | 5 Unit-Tests (Cache-Hit, 404→POST, Error, Toggle) |

### Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/app/api/audit/fix/consensus/route.ts` | GET-Handler ergänzt (Cache-Lookup mit Tenant-Isolation) |
| `src/app/[locale]/(app)/audit/_components/FindingsTable.tsx` | `runId={runId}` an RecommendationCard übergeben |
| `src/app/[locale]/(app)/audit/_components/RecommendationCard.tsx` | `runId?: string` Prop + DeepFixButton eingebunden |
| `src/app/[locale]/(app)/audit/page.tsx` | `NEXT_PUBLIC_VERCEL_ENV` statt `VERCEL` für hydration-sichere isVercelEnv-Prop |
| `package.json` | `balanced-match: >=4.0.4` pnpm-Override (webpack ENOENT-Fix) |

**Offene Punkte:**
- Consensus Fix Engine Status in `docs/features/status.md` von C → A aktualisieren (UI jetzt vorhanden)

---

## 2026-04-22 — Windows ENOENT-Fix: platformCommand-Utility + alle Aufrufstellen migriert

**Ampel:** 🟢
**Prompt:** ENOENT bei execFileSync('pnpm', ...) auf Windows systematisch beheben

### Diagnose

Alle vier externen Tool-Calls in `external-tools-checker.ts` (depcruise, Lighthouse, ESLint, pnpm audit) plus `resolvePnpmBin()` in `cli-checker.ts` warfen `ENOENT` auf Windows. Ursache: `execFileSync`/`spawnSync` verwenden intern `CreateProcessW` ohne PATHEXT-Auflösung. Node CLI-Tools sind auf Windows als `pnpm.cmd` installiert — `'pnpm'` ist unbekannt.

**Strategische Konsequenz:** Alle Audit-Läufe auf Windows-Entwicklungsmaschinen seit Einführung des `external-tools-checker.ts` lieferten inkomplette Ergebnisse für alle vier externen Tool-Kategorien (Architektur, Lighthouse, Code-Style, Security). Die Scores waren strukturell zu optimistisch (null-Results statt echter Messungen).

### Lösung

Neue Utility `src/lib/audit/utils/platform-utils.ts` mit zwei Funktionen:

| Funktion | Zweck |
|----------|-------|
| `platformCommand(name)` | `'pnpm'` → `'pnpm.cmd'` auf win32, sonst unverändert |
| `resolveNodeCli(name, rootPath)` | Vollständige Auflösung: local .bin → global Windows-Pfade → platformCommand() |

Unit-Tests: `platform-utils.unit.test.ts` — 4 Tests (win32, linux, darwin, default).

### Migrierte Aufrufstellen

| Datei | Aufruf vorher | Nach der Migration |
|-------|--------------|-------------------|
| `external-tools-checker.ts` | `run('pnpm', ['exec', 'depcruise', ...])` | `run(platformCommand('pnpm'), ...)` |
| `external-tools-checker.ts` | `run('pnpm', ['exec', 'lighthouse', ...])` | `run(platformCommand('pnpm'), ...)` |
| `external-tools-checker.ts` | `run('pnpm', ['exec', 'eslint', ...])` | `run(platformCommand('pnpm'), ...)` |
| `external-tools-checker.ts` | `run('pnpm', ['audit', '--json'])` | `run(platformCommand('pnpm'), ...)` |
| `cli-checker.ts` | `resolvePnpmBin(ctx.rootPath)` (inline) | `resolveNodeCli('pnpm', ctx.rootPath)` |

`git` und `gitleaks` sind native Binaries — PATHEXT-Problem tritt dort nicht auf, kein Fix nötig.

### Dokumentation

Neues Pattern P12 "Cross-Platform Command Execution (Windows ENOENT)" in `docs/checker-design-patterns.md` dokumentiert, inkl. Checklisten-Punkt.

**Geänderte Dateien:** `src/lib/audit/utils/platform-utils.ts` (neu), `src/lib/audit/utils/platform-utils.unit.test.ts` (neu), `src/lib/audit/checkers/external-tools-checker.ts`, `src/lib/audit/checkers/cli-checker.ts`, `docs/checker-design-patterns.md`

**Nachtrag — zweiter Fix (gleiche Session):** `shell: true` wirft DEP0190-Deprecation-Warning in Node.js v22 wenn args-Array übergeben wird. Endlösung: explizit `['cmd.exe', ['/c', cmd, ...args]]`. Nebenbugs: `balanced-match: >=4.0.4` Override bricht ESLint-Abhängigkeitskette (ESLint-Crash "balanced is not a function") → `^1.0.0`. `checkUnitTestCoverage` verwendete Unix-`cat` → `readFileSync`. **Ergebnis: erster echter Audit mit vollem Tool-Stack: 94.7%** (147 auto-Regeln; Performance 80% mit Lighthouse statt 68% bundle-only).

---

## 2026-04-22 — Audit-System: 3 Bugs behoben (withTools, Rule-ID-Mismatch, GitHub Actions)

**Ampel:** 🟢
**Prompt:** Punkt 1 (GitHub Actions), Punkt 2 (withTools), Punkt 3 (false attribution)

### Punkt 1 — GitHub Actions: pnpm/action-setup@v6 → @v5

Alle 5 CI-Workflows hatten `pnpm/action-setup@v6`, das nicht existiert (latest: v5.0.0). Vor der Änderung via GitHub API verifiziert (`gh api repos/pnpm/action-setup/releases/latest`). Alle anderen Actions (checkout@v6, setup-node@v6, upload-artifact@v7, github-script@v9) waren korrekt. `lighthouse.yml` zusätzlich um `workflow_dispatch` ergänzt.

**Geänderte Dateien:** `.github/workflows/lighthouse.yml`, `ci.yml`, `bias-eval.yml`, `design-lint.yml`, `pr-check.yml`

---

### Punkt 2 — withTools-Konsistenz zwischen CLI und API

**Problem:** `trigger/route.ts` ignorierte `body.withTools` bei der skipModes-Berechnung: `external-tool`-Checker liefen immer (auch wenn `withTools: false`). Außerdem war der Log-Eintrag hardcodiert auf `{ withTools: true }`.

**Fix:** CLI-Logik gespiegelt:
```typescript
if (!body.withTools) skipModes.push('external-tool')
const externalTools = body.withTools ? { ... } : undefined
log.info('Audit options', { withTools: body.withTools, skipModes })
```

**Geänderte Datei:** `src/app/api/audit/trigger/route.ts`

---

### Punkt 3 — False Attribution durch Rule-ID-Mismatch in ast-quality-checker.ts

**Root Cause:** Zwei Checker-Funktionen in `ast-quality-checker.ts` hardcodierten falsche Rule-IDs (P11-Pattern — neu in checker-design-patterns.md dokumentiert):

| Funktion | Hardcodiert | Registry-Eintrag | Richtig |
|----------|-------------|------------------|---------|
| `checkErrorHandling` | `cat-2-rule-10` (Strict Equality!) | `cat-2-rule-16` | `cat-2-rule-16` |
| `checkErrorBoundary` | `cat-2-rule-11` (Lighthouse Best Practices!) | `cat-2-rule-17` | `cat-2-rule-17` |

**Konsequenzen:**
- Error-Handling-Befunde wurden als Strict-Equality-Befunde gespeichert (falsche `agentSource: 'code-style'` statt `'error-handling'`)
- Error-Boundary-Befunde wurden als Lighthouse-Befunde gespeichert (`agentSource: 'lighthouse-best-practices'` statt `'error-handling'`)
- Regeln `cat-2-rule-16` und `cat-2-rule-17` zeigten immer score=5 (fälschlich "alles gut")

**Fix:** Hardcodierte IDs in `pass()`/`fail()`-Aufrufen korrigiert. Neues Pattern P11 in `docs/checker-design-patterns.md` dokumentiert inkl. Checklisten-Punkt.

**Geänderte Dateien:** `src/lib/audit/checkers/ast-quality-checker.ts`, `docs/checker-design-patterns.md`

---

## 2026-04-22 — Feature-Inventar angelegt

**Ampel:** 🟢
**Prompt:** Feature-Inventar aufbauen — docs/features/status.md

**Entscheidung:**
Reine Dokumentationsaufgabe. Neues Verzeichnis `docs/features/` und Datei `status.md` angelegt.

Auslöser: Drei Features (Komitee-Review, Consensus Fix Engine, Lighthouse) deren Status nicht ohne frische Analyse klar war. Strukturelles Problem: Features werden gebaut, Bau-Aktivität landet in architect-log.md, aber der aktuelle Zustand ist nirgends konsolidiert abrufbar.

**Inhalt des Inventars:**
25 Features eingetragen mit Status A/B/C/D, Schichten-Check (DB/Backend/UI/Nutzung), Abhängigkeiten und Offenen Punkten.

| Status | Anzahl Features |
|--------|----------------|
| A — Produktiv genutzt | 13 |
| B — Fertig, ungenutzt | 8 |
| C — Teilweise implementiert | 4 |
| D — Nur Stub | 0 |

**Wichtigste Findings:**
- Consensus Fix Engine (C): UI-Trigger fehlt noch — Backend + DB fertig
- Lighthouse System A (C): Nur lokal funktional, Cloud-Strategie offen
- Lighthouse System B (C): QA-Panel-Bugs unverified
- Manual Finding Card (C): Rendering-Logik da, aber keine finding-recommendations mit manualSteps befüllt
- Beta-Pilot (B): Infra fertig, Einladungen können starten (Score 95.2% > Schwelle 85%)
- Feeds + Agenten + Perspectives (B): Vollständig gebaut, aber seit Produkt-Pivot (2026-04-10) eingefroren

**Pflege-Pflicht:**
Dieses Inventar muss nach jedem Feature-Build oder Status-Änderung aktualisiert werden.
Vor jeder V1-Roadmap-Entscheidung ist docs/features/status.md zu konsultieren.

**Anpassungen:** CLAUDE.md → Referenzdokumentation: Verweis auf docs/features/status.md ergänzt.

**Offene Punkte:** keine

---

## Format

Jeder Eintrag folgt diesem Schema:

```markdown
### [Datum] — [Feature-Name]
**Ampel:** 🟢 / 🟡 / 🔴
**Prompt:** [Build-Prompt Bezeichnung]
**Entscheidung:** [Was und warum]
**Anpassungen:** [keine | Liste]
**Offene Punkte:** [keine | Liste]
**Neue Lernmuster:** [keine | Was gelernt]
```

---

## 2026-04-21 — checker-design-patterns.md: P1.1 Sub-Ausprägung ergänzt

**Ampel:** 🟢
**Prompt:** Pattern P1 um Sub-Ausprägung P1.1 (Repo-Map-Index vs. Dateisystem) erweitern

**Entscheidung:**
Reine Dokumentationsänderung — kein Code.

Pattern P1 ("Heuristik statt direkter Prüfung") war abstrakt formuliert und deckte das Repo-Map-Index-Problem konzeptuell ab, aber nicht als explizite Sub-Ausprägung. Das `.env.example`/`CHANGELOG`/`manifest.json`-Muster trat in 6 Checkern auf und wurde in Prompt 1 zur `file-utils.ts`-Utility konsolidiert — das verdient eine eigene Referenzstelle.

**Änderungen an docs/checker-design-patterns.md:**
- P1: Sub-Ausprägung P1.1 mit Symptom, Ursprung, Lösung, Code-Beispiel, Faustregel und 7 Praxis-Belegen als Tabelle
- P9: Zweiter Praxis-Beleg (`file-utils.ts`, 6 Stellen) ergänzt
- Prinzipien: Regel 7 ("Existenz-Prüfung ist nicht dasselbe wie Content-Analyse") hinzugefügt
- Checkliste: 14. Punkt für Non-TS-Datei-Existenz-Prüfung ergänzt

**Offene Punkte:** keine

---

## 2026-04-21 — fileExists Utility: Zweite Shared-Utility in src/lib/audit/utils/

**Ampel:** 🟢
**Prompt:** fileExists-Utility extrahieren (analog route-utils.ts)

**Entscheidung:**
Neue Datei `src/lib/audit/utils/file-utils.ts` mit `fileExists()` und `fileExistsInAnyOf()` angelegt.

**Root Cause:** Das Repo-Map indexiert nur `.ts/.tsx`-Dateien. Non-TS-Dateien (`.env.example`, `CHANGELOG.md`, `manifest.json`, `sw.js`) sind für `ctx.filePaths.some()` unsichtbar. Das `ctx.rootPath ? existsSync(join(ctx.rootPath, '...')) : false`-Pattern hatte sich in 6 Stellen über 2 Checker-Dateien verbreitet — jede Instanz identisch, aber keine geteilte Logik.

**Scope:**
| Checker | Funktion | Ersetzt durch |
|---------|----------|--------------|
| `gap-checkers.ts` | `checkEnvExample` | `fileExists(ctx.rootPath, '.env.example')` |
| `final-category-checkers.ts` | `checkChangelog` | `fileExists(ctx.rootPath, 'CHANGELOG.md')` |
| `final-category-checkers.ts` | `checkBackupDocs` | `fileExistsInAnyOf(ctx.rootPath, [...])` |
| `final-category-checkers.ts` | `checkWebManifest` | `fileExistsInAnyOf(ctx.rootPath, [...])` |
| `final-category-checkers.ts` | `checkOfflineFallback` | `fileExistsInAnyOf(ctx.rootPath, [...])` |
| `final-category-checkers.ts` | `checkDeploymentDocs` | `fileExistsInAnyOf(ctx.rootPath, [...])` |

Beide Checker-Dateien importieren `existsSync` nicht mehr direkt — nur noch über die Utility.

**Tests:** `file-utils.unit.test.ts` — 8 Tests (4 fileExists + 4 fileExistsInAnyOf), alle grün. Vitest ESM-Mock via `vi.mock('fs')` + Namespace-Import in der Utility.

**Score-Auswirkung:** Keine — reine Konsolidierung, kein Logik-Change.

**Neue Lernmuster:**
- Vitest ESM-Mocking: `vi.spyOn(fs, 'existsSync')` funktioniert nicht bei Named-Imports in ESM. Lösung: Utility nutzt `import * as fs from 'fs'` → `fs.existsSync()`, dann greift `vi.mock('fs', factory)` korrekt.
- P9-Trigger erfüllt: Sobald 4+ identische Patterns in ≥2 Dateien → Utility extrahieren, nicht weiterkopieren.

**Offene Punkte:** keine

---

## 2026-04-21 — Checker Design Patterns Dokument

**Ampel:** 🟢
**Prompt:** Checker-Design-Patterns-Dokument anlegen

**Entscheidung:**
Neues Referenz-Dokument `docs/checker-design-patterns.md` angelegt. Konsolidiert 10 strukturelle Fehlertypen (P1–P10) die in den Dogfooding-Sessions 2026-04-14 bis 2026-04-21 empirisch identifiziert wurden.

Zwei Kategorien von Quellen:
- **Bekannte Patterns (P1–P5):** Bereits in checker-feedback.md und architect-log.md verstreut dokumentiert — jetzt als architektonische Referenz konsolidiert.
- **Neue Patterns aus heutiger Session (P6–P10):** Silent Read-Failure, Import-Graph-Dependency, Too-broad String Matching, Shared Logic Without Utility, Incomplete Pattern Lists — entstanden durch Dogfooding mit eigenem Score-Delta als Feedback.

Warum kein einfacher Eintrag in checker-feedback.md: checker-feedback.md ist ein Fehler-Log (Was ist wann kaputtgegangen?). checker-design-patterns.md ist eine Design-Referenz (Wie schreibt man einen Checker richtig?). Unterschiedliche Zielgruppe, unterschiedliche Nutzungsfrequenz.

**Anpassungen gegenüber ursprünglichem Plan:** keine — alle 10 Patterns dokumentiert, alle mit Praxis-Beleg belegt.

**Offene Punkte:**
- P9 (Shared Logic Without Utility): `isListRoute()` existiert noch in drei Checkern redundant. Extraktion nach `src/lib/audit/checkers/utils.ts` ist der nächste Schritt wenn ein vierter Checker die Logik braucht.

**Neue Lernmuster:**
- Score-Delta als Test-Signal: Wenn ein Checker-Fix die Score einer Kategorie von 85% auf 55% senkt (statt ansteigen lässt), ist das kein Regression — das ist die erste korrekte Messung. Silent Read-Failures produzieren künstlich hohe Scores.
- Selbst-Scanning als Qualitätstest: Jeder neue Checker sollte zuerst auf dem eigenen Code ausgeführt werden. Wenn der Checker sich selbst flaggt, ist das ein P5-Signal (falscher Datei-Typ).

---

## 2026-04-21 — Dogfooding Fix #7: 7 Checker-Fixes + Score 82.3% → 86.9%

**Ampel:** 🟢
**Prompt:** Dogfooding-Session: tropenOS-eigene Findings systematisch durcharbeiten

**Score-Delta:** 82.3% → 86.9% (+4.6pp) über die Session

**Fixes:**
| Checker | Pattern | Fix |
|---------|---------|-----|
| `final-category-checkers.ts` `readContent()` | P6 (Silent Read-Failure) | `readFileSync`-Disk-Fallback ergänzt |
| `agent-security-checker.ts` `checkRateLimiting()` | P7 (Import-Graph) | Content-basierte Erkennung via `readFileSafe(proxy.ts)` |
| `security-scan-checker.ts` `math-random-*` | P5 (Falscher Datei-Typ) | `excludePattern: /\/lib\/audit\//` ergänzt |
| `category-gap-checkers.ts` `checkLLMTokenLimits()` | P3 (Zu grobe Regex) | `\(` nach Funktionsnamen erzwungen |
| `final-category-checkers.ts` `checkAPITimeouts()` | P8 (Too-broad String) | `openai\|anthropic` → `from ['"]openai['"]` etc. |
| `agent-committee-checker.ts` `isListRoute()` | P9/P10 | Dynamic-Parent-Segment-Check + Cron-Exclude + org_id-Scope-Filter |
| `compliance-checker.ts` `checkAiTransparency()` | P10 (Incomplete Patterns) | `/responsible-ai/` + Toro-Avatar-Detection ergänzt |

**Infrastruktur-Fixes:**
- 9 LLM-Routes: `export const maxDuration = 60` ergänzt (reale Finding)
- `superadmin/agents/route.ts`: `.limit(500)` ergänzt
- 5 Library-Catalog-Routes: `.limit(200)` ergänzt
- `final-category-checkers.ts` `checkUnlimitedQueries()`: `isListRoute()`-Filter + GET-only + `.eq('org_id')`-Scope-Filter

**Neue Docs:**
- `docs/PRD.md` — Product Requirements Document
- `CHANGELOG.md` — Changelog im keepachangelog.com Format
- `docs/checker-design-patterns.md` — dieses Dokument

**Offene Punkte:**
- State Management 63.3% bleibt schwach — echte Architekturschuld (56 useEffect/fetch, 11 prop drilling). Kein Quick-Fix.
- DSGVO Cookie-Consent bleibt einziges CRITICAL Finding.

---

## 2026-04-20 — Dogfooding Fix #6: select-star-api Checker eingeschränkt

**Ampel:** 🟢
**Prompt:** Fix cat-3-rule-22 select-star Checker (42 False Positives)

**Entscheidungen:**
- **Root Cause:** `select-star-api` Pattern in `DATA_EXPOSURE_PATTERNS` hatte `fileGlob: ['.ts', '.js']` ohne Pfad-Einschränkung. Scannte `src/actions/`, `src/lib/`, `scripts/`, `supabase/functions/` — alles Dateien, die `.select('*')` legitim nutzen, aber keine direkten HTTP-Response-Quellen sind.
- **Fix:** Neues `includePattern?: RegExp` Feld im `SecurityPattern` Interface. Wenn gesetzt, muss der Dateipfad dieses Pattern matchen — positive Allowlist statt negativer Excludes. Geprüft in `scanPatterns()` nach `excludePattern`.
- **Pattern für select-star-api:** `/(?:^|\/)(?:app\/api\/|pages\/api\/).*\.[jt]sx?$/` — trifft Next.js App Router (`app/api/**/route.ts`, mit oder ohne `src/`-Prefix) und Pages Router (`pages/api/**`). Lässt Server Actions, lib, scripts und Edge Functions explizit aus.
- **Warum kein Inhalt-Check auf HTTP-Handler-Exports:** Der Pfad `app/api/**/route.ts` ist Next.js-Konvention — Nicht-Handler-Code landet dort nicht. Content-Check würde Komplexität ohne echten Mehrwert addieren.
- **Scope:** `includePattern` ist universell in `SecurityPattern` — andere Patterns können es nutzen wenn nötig. Backward-compat: `undefined` = Verhalten unverändert.

**Anpassungen:** keine

**Offene Punkte:**
- `runSecurityScanFromFiles` (externe Projekte) nutzt denselben `scanPatterns()` Call — `includePattern` wirkt auch dort. Benchmark-Repos (Lovable/Bolt/Cursor, alle Next.js) profitieren direkt.
- Weitere M2-FP-Fixes geplant: cat-12-rule-6, cat-25-rule-1, cat-8-rule-5, cat-7-rule-6

**Neue Lernmuster:**
- Bei Security-Patterns die von "gefährlich in API-Kontext" sprechen: immer `includePattern` setzen wenn der Check nur für HTTP-Handler sinnvoll ist. Ohne Einschränkung entstehen massenweise FPs in gut strukturierten Codebases die Business-Logik korrekt in `src/lib/` halten.

---

## 2026-04-13 — Findings-Liste vereinheitlichen: Ein Pattern für alles

**Ampel:** 🟢
**Prompt:** Top Findings auf Gruppen-Ebene + Findings-Liste vereinheitlichen

**Entscheidungen:**
- **Shared grouping logic:** Private `groupFindings`/`FindingGroup`/`extractBaseMessage`/`getHighestSeverity` aus `FindingsTable.tsx` extrahiert nach `src/lib/audit/group-findings.ts`. Einzige Quelle der Wahrheit für beide Komponenten. `AuditFinding`-Interface ist Schnittmenge beider Finding-Typen (top5 + DB).
- **Top5FindingsCards auf Gruppen-Ebene:** War: 5 individuelle Findings (Duplikate wenn gleiche Regel). Neu: 5 eindeutige Gruppen nach `rule_id`, sortiert nach Impact-Score (Severity → uniqueFileCount). Dismiss schreibt PATCH auf alle Findings der Gruppe.
- **FindingsTable: Nur noch RecommendationCard-Pattern:** Tabelle (SEV/AGENT/REGEL/MELDUNG/DATEI/STATUS-Spalten), UPPERCASE-Group-Header, Fix-Generierung, Bulk-Select/Export, Status-Dropdowns entfernt. Jede Gruppe (auch Gruppen mit 1 Finding in flat mode) wird via `RecommendationCard` gerendert.
- **`singleFindingAsGroup()`:** Flat-Mode wickelt einzelne Findings als `FindingGroup` mit count=1 — gleicher Component-Pfad, kein Sonder-Rendering.
- **`data-rule-id` auf Wrapper-Div:** Ermöglicht `scrollToGroup()` in Top5FindingsCards via `document.querySelector('[data-rule-id="..."]')`.
- **API-Stack-Traces migriert:** Alle Route-Handler die `err.message`/`String(err)` in Response-Bodies leakten wurden auf zentrales `apiError()` aus `src/lib/api-error.ts` umgestellt. SSE-Route (`perspectives/query`) nutzt hardkodierte deutsche Strings statt `String(err)` in SSE-Payloads.

**Anpassungen:** keine

**Offene Punkte:** keine

**Neue Lernmuster:**
- Wenn zwei Komponenten die gleiche Gruppenlogik brauchen: sofort extrahieren, nie duplizieren. Die private Version in FindingsTable hatte leicht unterschiedliches Verhalten (einzelne Findings wurden nicht als Gruppe zurückgegeben) — die neue shared Version ist konsequenter.
- SSE-Routes können nicht `NextResponse` aus catch zurückgeben — Error-Strings müssen direkt in den SSE-Payload-Objekten auf generische Strings gesetzt werden; Details gehen nur in `logger.error()`.

---

## 2026-04-13 — Prompt-Export UX Overhaul: i18n + FixPromptDrawer + Permanent Actions

**Ampel:** 🟢
**Prompt:** Prompt-Export UX Overhaul — Sichtbarkeit, Konsistenz, Mobile

**Entscheidungen:**
- **FixPromptDrawer als Portal:** Drawer nutzt `createPortal(content, document.body)` — liegt immer auf oberster z-Ebene, kein Clipping durch Scroll-Container. Animation via bestehende `slideInRight` Keyframe-Definition in globals.css.
- **Permanent sichtbare Actions in Top5FindingsCards:** Hover-only Pattern entfernt. Task + Fix-Prompt Buttons immer sichtbar — keine opacity/pointer-events Toggle mehr. Entspricht WCAG 1.3.1 (keine hover-only Funktionalität).
- **Tool-Preference bleibt localStorage:** Einheitliche Persistence über alle Drawer/Copy-Instanzen via `STORAGE_KEY = 'audit-prompt-tool-preference'`.
- **FixPromptDrawer akzeptiert beide Modi:** `mode: 'single'` (einzelnes Finding) und `mode: 'group'` (Recommendation-Card). RecommendationCard trägt den Drawer jetzt selbst — kein Lifting in FindingsTable nötig.
- **i18n vollständig:** 31 neue Strings unter `audit.*` in de.json + en.json. Alle audit UI-Komponenten nutzen `useTranslations('audit')`.

**Was gebaut wurde:**
- `messages/de.json` + `messages/en.json` — 31 neue audit-Strings (topFindings, task, prompt, fixPrompt, viewFixPrompt, grouped, flat, allAgents, strategy, firstStep, etc.)
- `src/app/[locale]/(app)/audit/_components/FixPromptDrawer.tsx` — Drawer (right) + Escape + Backdrop, Tool-Chips, pre-formatted Prompt, Copy-Button; mobile-ready (min(520px, 100vw))
- `src/app/[locale]/(app)/audit/_components/Top5FindingsCards.tsx` — hover-only entfernt, FixPromptDrawer integriert, `useTranslations`, `ClipboardText`-Icon
- `src/app/[locale]/(app)/audit/_components/RecommendationCard.tsx` — "Fix-Prompt anzeigen" Button (ClipboardText), FixPromptDrawer, `useTranslations`, alle hardcoded strings durch t()
- `src/app/[locale]/(app)/audit/_components/PromptCopyButton.tsx` — `useTranslations` für 'Kopiert'/'Prompt'
- `src/app/[locale]/(app)/audit/_components/FindingsTable.tsx` — `useTranslations` für 'Alle Agents', 'Grouped', 'Flat', 'Alle ignorieren'

**Tests:** tsc --noEmit grün
**Offene Punkte:** keine

---

## 2026-04-13 — Prompt-Export + Schema Drift Check + Runtime Gap Badge

**Ampel:** 🟢
**Prompt:** Build-Prompt: Prompt-Export per Finding + Schema Drift Check + Runtime Gap Badge

**Entscheidungen:**
- **Prompt-Export ist regelbasiert (kein LLM):** Template-Engine in `src/lib/audit/prompt-export/` baut strukturierte Prompts aus `FindingRecommendation` + Finding-Feldern. Deterministisch, sofort, kostenlos.
- **3 Tool-Varianten:** Cursor (`@file` Referenzen), Claude Code (CLAUDE.md + Read-Tool Hinweise), Generic (self-contained). Letzte Auswahl in localStorage gespeichert.
- **Schema Drift Check immer score: 5:** Das Finding ist ein Transparenz-Hinweis, keine Fehlfunktion. Kein Score-Penalty — verhindert dass Nutzer bestraft werden für etwas das sie nicht ändern können.
- **Provider-Erkennung vor SQL-Generierung:** 8 Provider erkannt (Supabase, Neon, Prisma, Drizzle, Firebase, PlanetScale, MongoDB, Postgres). Firebase und PlanetScale bekommen textuelle Dashboard-Anleitung statt SQL.
- **Runtime Gap Badge dezent, nicht alarmierend:** `Code-Only Mode ⓘ` neben dem Score — Tooltip erklärt, Link zum Schema Drift Finding. Kein roter Alert.
- **⚠ nur bei Kategorien 3 + 5:** Live-Check-Hinweis nur bei Sicherheit und Datenbank, nicht bei allen 25 Kategorien.

**Was gebaut wurde:**
- `src/lib/audit/prompt-export/types.ts` — PromptFinding, ToolTarget, GeneratedPrompt, RepoContextSnippet
- `src/lib/audit/prompt-export/template-engine.ts` — `buildFixPrompt()`, `buildGroupFixPrompt()`, 5 Sections (Problem/Wo/Warum/Fix/Validierung)
- `src/lib/audit/prompt-export/repo-context.ts` — `extractRepoContext()` — Symbols + Deps aus RepoMap, max 2000 Token
- `src/lib/audit/prompt-export/index.ts` — Re-Exports
- `src/lib/audit/prompt-export/__tests__/template-engine.unit.test.ts` — 13 Tests
- `src/app/[locale]/(app)/audit/_components/PromptCopyButton.tsx` — Copy + Dropdown für Tool-Auswahl + localStorage
- `src/app/[locale]/(app)/audit/_components/Top5FindingsCards.tsx` — naive `buildCopyPrompt` ersetzt durch `PromptCopyButton`
- `src/lib/audit/schema-drift-check.ts` — `detectDbProvider()` + `checkSchemaDrift()` + SQL-Queries pro Provider
- `src/lib/audit/rule-registry.ts` — Regel `cat-5-schema-drift` (weight 1, score always 5, info finding)
- `src/lib/audit/finding-recommendations.ts` — Eintrag `schema-drift`
- `src/app/[locale]/(app)/audit/_components/ScoreHero.tsx` — `RuntimeGapBadge` Komponente + `codeOnlyMode` Prop
- `src/app/[locale]/(app)/audit/_components/CategoryBreakdown.tsx` — `showLiveCheckHint` Prop weitergegeben
- `src/app/[locale]/(app)/audit/_components/CategoryRowItem.tsx` — ⚠ Badge für Kategorien 3 + 5
- `src/lib/audit/__tests__/schema-drift-check.unit.test.ts` — 15 Tests

**Tests:** 360/360 grün (war 332 vor diesem Build)
**Offene Punkte:** ScoreHero und CategoryBreakdown brauchen `codeOnlyMode`/`showLiveCheckHint` Props vom Audit-Page (Server-Komponent) — diese Props haben Default-Werte, sodass bestehende Nutzung nicht bricht.

---

## 2026-04-09 — Sprint 6b: Projekt-Onboarding — Auto-Detect + Interview

**Ampel:** 🟢
**Prompt:** Build-Prompt: Projekt-Onboarding — Auto-Detect + Interview

**Entscheidungen:**
- **Auto-Detect Client-seitig:** `detectStack()` läuft im Browser direkt nach dem Datei-Lesen — kein Server-Roundtrip nötig, weil die Dateien bereits im Speicher sind
- **4 Fragen, kein Freitext:** Audience, Public/Live, Compliance — alle als Chips; nur die URL ist ein Textfeld. Minimiert Abbrüche.
- **N/A-Kategorien Client-seitig abgeleitet:** `useMemo` über `detectedStack.hasI18n/hasPwa` → keine LLM-Inferenz, keine extra API
- **Profil in `scan_projects` persistiert:** JSONB für `detectedStack` + eigene Spalten für strukturierte Felder (is_public, audience, compliance_requirements, not_applicable_categories)
- **Naming Conflict gelöst:** DB-Userrow in route.ts von `profile` → `orgProfile` umbenannt, da `profile` jetzt den Request-Body belegt

**Was gebaut wurde:**
- `src/lib/file-access/stack-detector.ts` — Framework, DB, Auth, Styling, Testing, Deployment, Flags (i18n, PWA, publicApi, CI, Docker)
- `src/app/audit/scan/_components/ProjectProfileStep.tsx` — Chip-basiertes Interview + Auto-Detect-Anzeige + N/A-Kategorien
- `src/app/audit/scan/_components/ConnectProjectCard.tsx` — 3-Schritt-Flow: reading → profile → scanning; `useRef` für files + projectName
- `src/app/api/projects/scan/route.ts` — `profileSchema` Zod-Validierung + Upsert mit Profil-Feldern
- `supabase/migrations/20260409000106_project_profile.sql` — 7 neue Spalten auf `scan_projects`

**Offene Punkte:** keine

---

## 2026-04-09 — Sprint 7: SECURITY_SCAN_AGENT — Angriffsflächen-Scanner

**Ampel:** 🟢
**Prompt:** Security Scan Agent mit 30+ Attack-Vector-Patterns

**Was gebaut wurde:**

**`docs/agents/SECURITY_SCAN_AGENT.md`** — Agent-Dokument mit 9 Regeln (R1–R9):
- R1: SQL/NoSQL/Command/Path/SSRF/XSS Injection → BLOCKER
- R2: Hardcoded Secrets → BLOCKER
- R3: eval()/new Function() → BLOCKER
- R4: Path Traversal → BLOCKER
- R5: SSRF → BLOCKER
- R6: localStorage für Auth-Tokens → CRITICAL
- R7: Schwache Krypto (MD5/Math.random) → CRITICAL
- R8: LLM Output in eval/innerHTML → CRITICAL
- R9: Mass Assignment → WARNING

**`src/lib/audit/checkers/security-scan-checker.ts`** — 34 Patterns in 8 Check-Funktionen:
- `checkInjectionPatterns` (9 Patterns): SQLi, NoSQL, Cmd, PathTraversal, SSRF, OpenRedirect, ReDoS, XSS, TemplateInjection
- `checkAuthPatterns` (6 Patterns): HardcodedSecrets, localStorage-Token, Math.random-Token, Password-in-URL, JWT-alg-none, Weak-JWT-Secret
- `checkDataExposurePatterns` (5 Patterns): SELECT*, Sensitive-Headers, Stack-Trace-Response, Debug-Endpoint, PII-in-Log
- `checkClientSidePatterns` (5 Patterns): eval, Prototype-Pollution, postMessage-no-Origin, innerHTML, localStorage-Sensitive
- `checkCryptoPatterns` (4 Patterns): MD5/SHA-1, Hardcoded-IV, Math.random, HTTP-not-HTTPS
- `checkBusinessLogicPatterns` (3 Patterns): Mass-Assignment, IDOR, Missing-Auth-Guard hint
- `checkAiSecurityPatterns` (4 Patterns): PromptInjection-System, LLM-Output-eval, No-Token-Limit, System-Prompt-API
- `checkSupplyChainPatterns` (4 Patterns): Unpinned-Dep, Git-URL-Dep, Postinstall-Script, Typosquatting
- `runSecurityScanFromFiles(files: ProjectFile[])` — no-disk version für externe Projekte

**Integration:**
- `src/lib/audit/types.ts` — `'security-scan'` zu `AgentSource` hinzugefügt
- `src/lib/audit/rule-registry.ts` — 8 neue Regeln: cat-3-rule-20 bis cat-3-rule-25, cat-22-rule-8, cat-24-rule-6
- `src/lib/agents/agent-catalog.ts` — `SPRINT7_AGENTS` Array mit security-scan Agent
- `src/app/audit/_components/CategoryBreakdown.tsx` — AGENT_PILL: `'security-scan': { label: 'SecScan', color: '#dc2626' }`
- `src/app/audit/_components/FindingsTable.tsx` — AGENT_BADGE: `'security-scan': { bg: '#fef2f2', color: '#dc2626' }`

**Kategorien-Verteilung der neuen Regeln:**
- Category 3 (Sicherheit, weight 3): 6 neue Regeln (cat-3-rule-20 bis -25)
- Category 22 (AI Integration, weight 2): 1 neue Regel (cat-22-rule-8)
- Category 24 (Supply Chain, weight 2): 1 neue Regel (cat-24-rule-6)

**Entscheidungen:**
- Patterns pro Kategorie gruppiert (1 RuleResult pro Angriffskategorie) statt 34 einzelne Regeln → übersichtlicheres Score-Board, weniger Noise bei häufigen False Positives
- `excludePattern` auf alle Patterns → Test-Dateien erzeugen keine False Positives
- `runSecurityScanFromFiles` als pure Funktion (kein fs-Zugriff) → kompatibel mit Sprint 6 Extern-Scan
- score 1 wenn critical-Finding, 3 bei wenigen non-critical, 2 bei vielen → graduelle Abstufung

**Offene Punkte:** Erste Audit-Run durchführen um reale False-Positive-Rate zu messen; IDOR-Pattern (cat-3-rule-25) ist ein Hint-Check (immer `missing-auth-in-route` für jede Route), nicht ein echter IDOR-Detektor — evtl. verfeinern

---

## 2026-04-09 — Sprint 7 Items 1–5: Komitee-Review-Implementierung (Fix-Engine + Scoring)

**Ampel:** 🟢
**Prompt:** 4 Komitee-Reviews — Items 1–5 SOFORT

**Was gebaut wurde:**

**Item 1 — False Positive Fixes (`agent-security-checker.ts`)**
- `isMultiTenantProject(ctx)`: liest `supabase/migrations/` nach `org_id|tenant_id|organization_id` — RLS-Check nur bei Multi-Tenant-Projekten
- `hasPublicEndpoints(ctx)`: prüft OpenAPI-Dateien, `nginx.conf`, `/api/public/` Routen — Rate-Limiting-Check nur bei öffentlichen Endpunkten
- Ergebnis: `checkRlsCoverage` und `checkRateLimiting` geben bei n/a Findings `pass(5)` statt False Positive

**Item 2 — Not-Applicable Categories (`score-calculator.ts`)**
- `NOT_APPLICABLE_CATEGORY_IDS: ReadonlySet<number> = new Set([17, 21])` — i18n + PWA
- `calculateOverallScore`: N/A-Kategorien werden aus Zähler UND Nenner ausgeschlossen

**Item 3 — Killer Criteria (`score-calculator.ts`)**
- `KILLER_CRITERIA`: Security (cat 3, min 60%), Testing (cat 10, min 50%), Backup/DR (cat 13, min 40%)
- `statusRank()` Hilfsfunktion; Veto: wenn eine Killer-Kategorie unter Schwellwert → Status cap auf 'risky'
- Sichert dass schwache Sicherheit nie als 'stable' oder 'production-grade' gilt

**Item 4 — Context-Builder erweitern (`context-builder.ts` + `types.ts`)**
- Projektkontext wird IMMER geladen (nicht nur bei fehlendem `filePath`)
- CLAUDE.md (80 Zeilen), `next.config.*`, `package.json`, `tsconfig.json` — alle als Projektkontext
- `affectedFilesContent`: bis zu 8 betroffene Dateien (je 80 Zeilen), Primary File übersprungen
- `FixContext.affectedFilesContent: string | null` zu types.ts hinzugefügt

**Item 5 — Generator Prompt Hardening (`generator.ts`)**
- `ctx.affectedFilesContent` im Prompt eingebunden (nach Affected Files Liste)
- 3 neue CRITICAL-Regeln: (a) nur installierte Packages aus package.json, (b) keine erfundenen Pfade/Module, (c) bei unzureichendem Kontext → `diffs=[], confidence="low"`
- Bestehende Stil-Regel präzisiert: "same indentation, quote style, and import patterns"

**Offene Punkte:** keine

**Neue Lernmuster:**
- Supabase upsert `onConflict` braucht echten PostgreSQL UNIQUE CONSTRAINT (nicht nur Preference)
- `Object.assign(nullVariable ?? {}, data)` ist silent fail — Variable muss explizit reassigned werden

---

## 2026-04-09 — Sprint 6: File System Access API / Externe Projekte scannen

**Ampel:** 🟢
**Prompt:** Build-Prompt Sprint 6 — File System Access API / Externe Projekte scannen
**Entscheidung:**
- Externe Projekte werden vollständig client-seitig via `window.showDirectoryPicker()` gelesen — kein Upload, kein Server-Side Storage, keine CLI
- `generateRepoMapFromFiles` überspringt `analyzeReferences` (liest Disk via `readFileSync`) und arbeitet rein auf in-memory Daten mit leeren `dependencies: []`
- `buildAuditContextFromFiles` baut `AuditContext` aus in-memory Files: rootPath='', gitInfo={hasGitDir:false}
- Disk-abhängige Check-Modes (`cli`, `file-system`, `external-tool`, `documentation`) werden für externe Scans übersprungen — nur `repo-map` und `agent-committee` Checks laufen
- `scan_projects` Tabelle (neue Migration 20260409000103) mit Upsert auf `organization_id,name` — Projekte werden bei Re-Scan aktualisiert
- `audit_runs.scan_project_id` FK verbindet Runs mit externen Projekten
- `/audit?project=<id>` selektiert Runs eines externen Projekts; ohne param = interne Runs (Tropen OS)
- `ConnectProjectCard` ist lazy-import für `directory-reader.ts` (browser-only, kein SSR)

**Anpassungen:**
- Route: `/audit/scan` statt `/projects` (Konflikt mit bestehender interner Projekte-Seite)
- `RepoFile.language` um `'other'` erweitert (nötig für Nicht-Code-Dateien in externen Scans)
- `handle.entries()` via `(handle as any).entries()` — File System Access API nicht in TS-Lib

**Offene Punkte:** keine

**Neue Lernmuster:**
- File System Access API typisiert TypeScript nicht vollständig — `(handle as any)` notwendig
- Turbopack liefert veraltete Client-Bundles nach Code-Änderungen — bei Hydration-Mismatch immer erst `pnpm dev` restart

---

## 2026-04-22 — GitHub Actions pnpm/action-setup@v6 → @v5 (alle Workflows)

**Ampel:** 🟢
**Was gebaut wurde:**
- `pnpm/action-setup@v6` → `@v5` in allen 5 Workflows: `ci.yml`, `lighthouse.yml`, `bias-eval.yml`, `design-lint.yml`, `pr-check.yml`
- `lighthouse.yml`: `workflow_dispatch` hinzugefügt — Workflow jetzt manuell auslösbar

**Versions-Analyse (GitHub API, 2026-04-22):**
- `actions/checkout@v6` → latest `v6.0.2` ✅
- `actions/setup-node@v6` → latest `v6.4.0` ✅
- `actions/upload-artifact@v7` → latest `v7.0.1` ✅
- `actions/github-script@v9` → latest `v9.0.0` ✅
- `pnpm/action-setup@v6` → latest `v5.0.0` ❌ — v6 existiert nicht, war Blocker für alle CI-Runs

**Offen:** Verifikation nach Push — `workflow_dispatch` triggern, Record in `qa_lighthouse_runs` erwarten.

---

## 2026-04-22 — Lighthouse-Integration repariert (System A + System B)

**Ampel:** 🟢
**Was gebaut wurde:**

### System A — Audit-URL-Input (lokal)
- `lighthouse@^13` als devDependency installiert (`pnpm add -D lighthouse`) — war die einzige fehlende Voraussetzung für lokale Runs
- `AuditActions.tsx`: neues Prop `isVercelEnv` — URL-Input auf Vercel ausgegraut (`opacity: 0.45`, `cursor: not-allowed`, `disabled`, Tooltip mit CLI-Befehl als Hinweis)
- `audit/page.tsx`: `isVercelEnv={!!process.env.VERCEL}` an AuditActions übergeben (Server-Component → Prop, da Client-Component keinen Env-Zugriff hat)
- `audit/page.tsx`: `hasLighthouseData`-Badge verdrahtet — dezenter grüner Chip "Mit Lighthouse-Analyse" neben den fixType-Stats, sichtbar wenn der aktuelle Run Lighthouse-Findings enthält

### System B — CI QA-Panel
- `scripts/ci/save-lighthouse-results.mjs` repariert:
  - Bug 1: `url`-Feld ergänzt — aus `lhr.finalUrl ?? lhr.requestedUrl`, Fallback auf `VERCEL_PRODUCTION_URL`/`NEXT_PUBLIC_SITE_URL`
  - Bug 2: `created_at` (falscher Spaltenname) entfernt — `run_at` hat `DEFAULT NOW()`
  - Error-Handling: `exit(1)` statt `exit(0)` bei DB-Fehler — CI-Workflow wird rot sichtbar

**Entscheidungen:**
- IS_VERCEL-Guard in `trigger/route.ts` bleibt unverändert — serverless hat keinen Chrome-Zugang, das ist korrekt
- Lighthouse-Checker-Logik in `external-tools-checker.ts` bleibt unverändert — sie funktioniert
- Keine neue Migration für `qa_lighthouse_runs` — bestehende Struktur ist korrekt
- 4 Fehl-Attributierungs-Records in `audit_findings` (agent_source='lighthouse-best-practices', tatsächlich Error-Boundary-Findings) werden nicht bereinigt — beim nächsten regulären Scan überschrieben

**Bekanntes Follow-up (kein akuter Handlungsbedarf):**
- Fallback `f.agentSource ?? rule?.agentSource ?? 'core'` in `trigger/route.ts` kann fehlerhafte Attributionen erzeugen wenn ein Checker kein eigenes `agentSource` setzt und die Regel-Registry einen misleadenden Source-Wert hat — beim nächsten Checker-Review prüfen

**Offen (außerhalb dieses Scopes):**
- Cloud-Lighthouse für User-Projekte auf Vercel (Browserless/Playwright-Service) — gehört in Scan-Architektur-Entscheidung

---

## 2026-04-09 — Sprint 5c: External Tools Integration (depcruise, lighthouse, bundle, eslint-detailed)

**Ampel:** 🟢
**Was gebaut wurde:**
- `src/lib/audit/types.ts` — `'external-tool'` zu CheckMode, `ExternalToolsOptions` Interface, `AuditContext.externalTools` + `AuditOptions.externalTools`
- `src/lib/audit/checkers/external-tools-checker.ts` — NEW: `checkDepCruiserCycles`, `checkLighthousePerf`, `checkLighthouseA11y`, `checkBundleSizes`, `checkEslintDetailed`
- `src/lib/audit/checkers/cli-checker.ts` — `checkNoSecretsInRepo` auf per-Finding-Output (file + line + description); `checkDependencyVulnerabilities` auf per-Advisory-Output (CVE-ID, package name, URL)
- `src/lib/audit/rule-registry.ts` — cat-1-rule-3 (depcruise), cat-7-rule-1 (Lighthouse Perf), cat-7-rule-2 (Bundle), cat-16-rule-1 (Lighthouse A11y) auf external-tool umgestellt; cat-2-rule-9 (ESLint detailliert) NEU
- `src/lib/audit/index.ts` — `enhancedCtx` mit `externalTools` aus options
- `src/scripts/run-audit.ts` — `--with-tools`, `--lighthouse-url <url>`, `--deep-secrets` Flags

**Entscheidungen:**
- `external-tool` ist ein eigener CheckMode — wird ohne `--with-tools` immer übersprungen (default: schnell)
- Tool nicht verfügbar → `score: null, automated: false` — NIE Score 0, kein Crash des Audits
- Lighthouse-Ergebnisse gecacht per AuditContext (WeakMap) — Perf + A11y teilen einen Report-Run
- cat-7-rule-1 war `manual()` → jetzt `external-tool` mit Lighthouse; ohne URL weiter null (wie manual)
- depcruise ersetzt Repo-Map-Heuristik für zirkuläre Deps (genauer, findet auch indirekte Zyklen)
- ESLint-Violations: agentSource-Mapping per Plugin-Prefix (jsx-a11y → accessibility, boundaries → architecture, sonarjs → code-style)
- pnpm audit: pro Advisory ein Finding mit CVE-ID + Package-Name statt nur aggregierte Zahlen
- gitleaks: per-Finding-Output mit filePath + line + Description; graceful skip wenn nicht installiert

**Score-Impact (ohne --with-tools):**
- Architektur: 71.7% → 78% (depcruise ran, 0 cycles gefunden — besser als Repo-Map-Heuristik)
- Performance: 80% → 60% (cat-7-rule-1 + cat-7-rule-2 nun null ohne --with-tools, korrekt)
- Accessibility: 26.7% (unverändert — cat-16-rule-1 nun null ohne Lighthouse, war manual vorher)
- Gesamtscore: 71.3% stabil (keine Regression)

**Offene Punkte:** Mit `--with-tools --lighthouse-url <url>` echte Scores messen wenn Server läuft

---

## 2026-04-09 — Sprint 5b: Agenten-Normalisierung, Komitee-Checker, Superadmin-Seite

**Ampel:** 🟢
**Was gebaut wurde:**
- `docs/agents/` — alle 18 Komitee-Agenten auf Template-Standard normalisiert (Meta-Block, Hard Boundaries / Structural Heuristics / Governance, Exception-Format, GUIDE-Blocks) — Regelinhalt unverändert
- `src/lib/audit/checkers/agent-committee-checker.ts` — 30 neue automatisierte Check-Funktionen für die 18 Komitee-Agenten
- `src/lib/audit/rule-registry.ts` — ~30 neue AuditRule-Einträge (cat-2, cat-4, cat-5, cat-6, cat-7, cat-8, cat-10, cat-11, cat-12, cat-13, cat-14, cat-15, cat-16, cat-19, cat-20, cat-21, cat-22, cat-24)
- `src/lib/agents/agent-catalog.ts` — alle 18 Komitee-Agenten auf `status: 'active'`, reale `ruleCount`-Werte (7–9), `lastNormalized: '2026-04-09'`
- `src/lib/audit/types.ts` — `AgentSource` um 18 neue Werte erweitert
- `src/app/superadmin/agents/` — neue Superadmin-Seite "Agent Rule Packs": Tabelle (sortierbar), Detail-Drawer (rechts, 520px, Markdown-Preview), Search + Filter-Chips
- `src/app/api/superadmin/agents/route.ts` — API: AGENT_CATALOG + findingsCount + lastCheckAt aus `audit_findings`
- `src/app/superadmin/SuperadminNav.tsx` — "Agent Rule Packs" Link ergänzt
- `CategoryBreakdown.tsx` + `FindingsTable.tsx` — AGENT_PILL / AGENT_BADGE auf alle 22 AgentSource-Werte erweitert (TypeScript-Exhaustiveness-Fix)

**Entscheidungen:**
- Normalisierung als reine Struktur-Transformation: Regelinhalt ist Ergebnis des 4-Modell-Komitees — kein Überschreiben
- `agent-committee-checker.ts` als eigene Datei (nicht in bestehende Checker integrieren) → klare Agenten-Zuordnung, einfaches Tracking
- Detail-Drawer liest Markdown-Datei über API (kein statischer Import) → Superadmin sieht immer aktuellen Stand
- `findingsCount` aus `audit_findings` aggregiert by `agent_source` → kein separates Tracking-Schema nötig
- 90-Tage-Outdated-Logik in `AgentHealthBadge.tsx` als lokale Status-Ableitung (kein DB-Feld)

**Neue Checks (30 gesamt):** cat-2-rule-7/8, cat-4-rule-7/8/9/10, cat-5-rule-7/8, cat-6-rule-6/7, cat-7-rule-6, cat-8-rule-5, cat-10-rule-6, cat-11-rule-6, cat-12-rule-9, cat-13-rule-7, cat-14-rule-5/6, cat-15-rule-5/6, cat-16-rule-4, cat-19-rule-4, cat-20-rule-5, cat-21-rule-4, cat-22-rule-6/7, cat-24-rule-5
**Offene Punkte:** Re-Audit messen; 3 Background-Agenten normalisierten docs/agents/ parallel (Batches à 6 Dateien)

---

## 2026-04-08 — Sprint 4a: Agenten-Integration in Audit Engine

**Ampel:** 🟢
**Was gebaut wurde:**
- `docs/agents/` — drei Multi-Model-Consensus-Dokumente (Architecture v3, Security v2.1, Observability v3) als Rule Packs integriert
- `src/lib/audit/types.ts` — neue Typen `AgentSource` + `EnforcementLevel`; `AuditRule` + `Finding` erweitert
- `src/lib/audit/checkers/agent-architecture-checker.ts` — 3 neue Checks: checkDependencyModel (R1), checkForbiddenFolderNames (R2), checkUnexpectedNamespaces (R7)
- `src/lib/audit/checkers/agent-security-checker.ts` — 6 neue Checks: checkAuthGuardConsistency (R3), checkRlsCoverage (R4), checkRateLimiting (R6), checkCorsConfig (R7), checkErrorLeakage (R8), checkLlmInputSeparation (R9)
- `src/lib/audit/checkers/agent-observability-checker.ts` — 4 neue Checks: checkConsoleLogs (R1), checkTraceIds (R4), checkPiiInLogs (R8), checkIncidentDocs (R7)
- `rule-registry.ts` — 13 neue automatisierte Regeln; `agentSource` + `agentRuleId` + `enforcement` auf 9 bestehenden Regeln
- `trigger/route.ts` — Findings-Insertion liest `agentSource` aus Rule-Registry-Lookup für Backward-Compat
- `FindingsTable.tsx` — Agent-Badge (Sec/Arch/Obs/Core) pro Finding + Agent-Filter-Chips
- `CategoryBreakdown.tsx` — Agent-Pill neben Kategorie-Name für Kategorien mit zugeordnetem Agent
- Migration `20260408000096_audit_agent_source.sql` — `agent_source`, `agent_rule_id`, `enforcement` auf `audit_findings`

**Entscheidungen:**
- `agentSource` ist optional in AuditRule/Finding (default = 'core') → keine Breaking Changes, kein Riesenpatch auf alle 80+ bestehenden Regeln
- Trigger-Route loopt über AUDIT_RULES um agentSource zu finden → sauber, keine Duplizierung
- Keine neue Spalte für Agent in FindingsTable — stattdessen kompaktes Badge (Arch/Sec/Obs/Core) zwischen Sev und Regel
- CategoryBreakdown: nur 8 Kategorien bekommen Agent-Pill; Rest bleibt Core (kein Pill)
- Security R4 (RLS) parst Migrations-SQL direkt → verlässlich, keine Runtime-Abhängigkeit
- Observability R1 (console.log) liest Dateien direkt → präziser als Repo-Map-Heuristik

**Neue Checks (13 gesamt):** cat-1-rule-6/7/8, cat-3-rule-15/16/17/18/19, cat-12-rule-6/7/8, cat-13-rule-6, cat-22-rule-5
**Offene Punkte:** Score nach Re-Audit messen; neue Checks können Score senken (korrekt — Gaps werden sichtbar)

---

## 2026-04-08 — Sprint 3: Audit Dashboard

**Ampel:** 🟢
**Was gebaut wurde:**
- Migration `20260408000095_audit_tables.sql` — `audit_runs` (APPEND ONLY), `audit_category_scores` (APPEND ONLY), `audit_findings` (status updatable); RLS via `get_my_organization_id()`
- `POST /api/audit/trigger` — startet Audit-Engine serverseitig (maxDuration=60s), persistiert Run + Kategorie-Scores + Findings in DB; requireOrgAdmin
- `GET /api/audit/runs` — Liste aller Runs für Org (limit 50, DESC)
- `GET /api/audit/runs/[id]` — einzelner Run mit categories + findings + previousRun-Delta
- `PATCH /api/audit/findings/[id]` — Finding-Status aktualisieren (open/acknowledged/fixed/dismissed)
- `src/app/audit/page.tsx` — Server Component; liest `?runId=` searchParam; requireOrgAdmin; fetcht Daten direkt via supabaseAdmin
- `_components/ScoreHero.tsx` — Score-Kreis, Status-Badge, Delta, Fortschrittsbalken mit 50/70/85%-Markierungen
- `_components/CategoryBreakdown.tsx` — 25 Kategorien sortiert nach Score aufsteigend; Gewicht-3-Badge; klickbar
- `_components/ScoreTrend.tsx` — Tremor AreaChart; leerer Zustand < 2 Runs
- `_components/FindingsTable.tsx` — Filter Chips (Severity + Status); semantische Tabelle; Expand/Collapse Suggestion; Inline-Status-Update via PATCH
- `_components/RunHistory.tsx` — Link-Navigation via `?runId=`; Delta-Icons (TrendUp/Down)
- `_components/AuditActions.tsx` — Trigger-Button mit Loading-State; router.refresh() nach Erfolg
- `globals.css` — neue CSS-Variablen `--status-{production,stable,risky,prototype}[-bg]`

**Entscheidungen:**
1. **Synchroner Audit-Trigger (Option A):** `POST /api/audit/trigger` läuft synchron mit `maxDuration=60`. Background-Jobs (Option B) kommen mit Vercel Queues in einem späteren Sprint.
2. **URL-searchParam für Run-Selektion:** `/audit?runId=xxx` statt Client-State → Server Component re-rendert mit korrekten Daten; `router.refresh()` nach neuem Trigger.
3. **Tremor AreaChart für Score-Trend:** ADR-005 (App-UI = Tremor). `minValue=0/maxValue=100` für konsistente Y-Achse.
4. **RLS-Anpassung:** Build-Prompt referenziert `memberships`-Tabelle, die nicht existiert. Stattdessen `get_my_organization_id()` Funktion aus `002_rls.sql`.
5. **Status-Mapping:** `AuditReport.status` hat Hyphen (`production-grade`); DB CHECK braucht Underscore (`production_grade`). Mapping via `.replace(/-/g, '_')` im Trigger.

**Offene Punkte:**
- Sidebar-Link `/audit` noch nicht ergänzt (Scope-Begrenzung Sprint 3)
- Background-Job für langen Audit-Trigger (Vercel Queues, Sprint 4)
- Vergleichs-View zweier Runs (Side-by-Side, Sprint 4)
- PDF/Markdown-Export (Sprint 4)

**Neue Lernmuster:**
- `sonarjs/no-duplicate-string` schlägt false positives bei wiederholten CSS-Variablen-Strings in inline styles an — kein Fix nötig (Warnings, keine Errors)
- Vercel Functions PostToolUse-Hook meldet "no observability instrumentation" auch wenn `createLogger` vorhanden — false positive, ignorieren

---

## 2026-03-30 — Plan M: Modell-Vergleich-Tabs

**Ampel:** 🟢
**Was gebaut wurde:**
- `ModelComparePopover.tsx` — Popover über Scales-Icon, lädt Modelle von `/api/models/available`, Checkboxen 2–4, "Vergleichen →" disabled bei < 2 oder leerem Input
- `ChatInput.tsx` — Scales-Icon (18px bold) nach PromptBuilder-Icon, `compareOpen` State, Popover-Wrapper mit `position: relative`, `onModelCompare` Prop
- `ChatArea.tsx` — `handleModelCompare()` analog zu `handleParallelConfirm`: erstellt N Konversationen, öffnet N Tabs, Tab 1 streamt via `onSendDirectToNewConv` mit `overrideClientPrefs: {selected_model_id}`, Tabs 2+ fire-and-forget mit `client_prefs: {selected_model_id}` im Body
- `workspace-chat.ts` — `sendDirectToNewConv` + `doSendWithConvId` mit optionalem `overrideClientPrefs` Param (merged über chatPrefsRef)
- `workspace-types.ts` — Typ für `sendDirectToNewConv` aktualisiert
- `/api/conversations/create/route.ts` — `selected_model_id` als optionales Feld im Zod-Schema (akzeptiert, nicht gespeichert)
- `globals.css` — `.model-compare-popover`, `.mcp-*` Klassen
- `WorkspaceLayout.tsx` — Pre-existing Bug gefixt: `conv.title ?? 'Neuer Chat'` (war `string | null`)

**Neue Lernmuster:**
- `overrideClientPrefs` Muster: Wenn mehrere Tabs mit unterschiedlichen client_prefs geöffnet werden, `chatPrefsRef.current` nicht mutieren — stattdessen override als Parameter durchreichen und in `doSendWithConvId` mergen
- `ModelComparePopover` Positionierung: `position: absolute; bottom: calc(100% + 8px); right: 0` innerhalb `position: relative` Wrapper am Trigger-Button

---

## 2026-03-29 — Session-Abschluss: Scroll-Fix, SessionPanel-Fixes, Chips, TopBar Race Condition

**Ampel:** 🟢
**Was gebaut wurde:**

### Fix 1 — Horizontaler Scroll (global behoben)
- `html { overflow-x: hidden }` + `body { overflow-x: hidden }` in `globals.css`
- `.pbi-wrapper { min-width: 0; overflow: hidden }` + `.pbi-expansion { min-width: 0; overflow: hidden }` in `globals.css`
- `overflow: 'hidden'` auf fixed-wrapper in `src/app/chat/layout.tsx` und `src/app/chat/[id]/layout.tsx`

### Fix 2 — SessionPanel Toggle-Umbenennung
- "Geteilter Bildschirm" → "Artefakt rechts anzeigen"
- Hint "Chat links · Artefakt rechts" → "Artefakte öffnen im Seitenpanel"
- `src/components/workspace/SessionPanel.tsx`

### Fix 3 — Links-Toggle abhängig von Live-Suche
- `updatePref` auto-disabled `link_previews` wenn `web_search_enabled` auf `false` gesetzt wird (in gleichem `savePrefs`-Call)
- Toggle visuell deaktiviert: `opacity: 0.4, pointerEvents: 'none'`, `aria-disabled`, `disabled` auf `<input>`
- `src/components/workspace/SessionPanel.tsx`

### Fix 4 — TopBar Race Condition (Tabs/Chat-Name fehlten)
- Root Cause: `WorkspaceLayout`'s `useEffect(() => getElementById('topbar-tabs-slot'), [])` feuerte im selben Effects-Batch wie TopBar's `setMounted(true)`, BEVOR TopBar re-renderte
- Fix: Slot-Divs `#topbar-tabs-slot` + `#topbar-chat-slot` in `!mounted`-Branch von TopBar ergänzt → existieren ab erstem Render
- `src/components/layout/TopBar.tsx`

**Neue Lernmuster:**
- React Effects laufen top-down im Baum. `setState` in einem Effect scheduled ein Re-Render das noch nicht committed ist wenn sibling-Effects in der gleichen Batch feuern. → DOM-Elemente die über `getElementById` gefunden werden müssen, MÜSSEN in BEIDEN Render-Branches vorhanden sein (mounted + !mounted)
- `overflow-x: hidden` muss auf `html` UND `body` gesetzt werden — nur eines reicht nicht

---

## 2026-03-29 — Chips in Toro-Bubble integriert

**Ampel:** 🟢
**Was gebaut wurde:**

### Teil 1 — Externer Chips-Block entfernt
- `ChatMessage.tsx`: Render-Block `isLastMessage && chips.length > 0` (`.suggestion-pills` außerhalb Bubble) entfernt
- `.suggestion-pills` bleibt für XML-`<suggestions>` weiterhin erhalten

### Teil 2 — Chips-Section innerhalb `.cmsg-bubble--assistant`
- Neue CSS-Klassen: `.cmsg-chips`, `.cmsg-chips-label`, `.cmsg-chip-link`
- Position: nach `pending`-Cursor, vor `MessageActions`, nur wenn `!msg.pending && isLastMessage && chips.length > 0`
- Dezenter Link-Style: kein Border, kein Background, Pfeil als `→` Textzeichen
- Trenner: `border-top: 1px solid var(--border)` mit `margin-top: 12px; padding-top: 10px`

**Geänderte Dateien:** `src/components/workspace/ChatMessage.tsx`, `src/app/globals.css`

**Neue Lernmuster:**
- Chips (`ChipItem[]` Props) ≠ XML-Suggestions (`<suggestions>` Tag im Content) — beide leben in ChatMessage.tsx aber separater Render-Pfad und separate CSS-Klassen

---

## 2026-03-28 — ChatMessage Layout-Reparatur + Defensive Fixes

**Ampel:** 🟢
**Was gebaut wurde:**

### Fix 1 — User-Bubble Layout (Hauptproblem behoben)
- `.cmsg-user-col` + `.cmsg-user-row` + `.cmsg-user-row > .cmsg-bubble-wrap` CSS entfernt
- JSX zurück auf originale flache Struktur: `.cmsg.cmsg--user > [.cmsg-bubble-wrap + .cmsg-avatar-user]`
- `.cmsg-user-group` als plain-block hover-wrapper eingeführt (kein Layout-Override)
- `.pbi-wrapper` als direktes Kind von `.cmsg-user-group` (nach `.cmsg.cmsg--user`)
- Hover-Trigger: `.cmsg-user-group:hover .pbi-pencil-btn` (war: `.cmsg--user:hover`)
- `padding-right: 44px` auf `.pbi-wrapper` richtet PB-Content unter dem Bubble aus (nicht unter Avatar)

### Fix 2 — Dedup-Guard in workspace-chat.ts
- `ctx.setMessages` beim Append prüft via Set ob `userMsg.id` oder `pendingMsg.id` bereits existiert
- Defensiv gegen Race-Conditions (Race praktisch unmöglich wegen sendingRef, aber guard korrekt)

### Fix 3 — Pending-ID durch DB-ID ersetzen
- Nach "done" in `doSend()` und `doSendWithConvId()`: nicht-blockierender Supabase-SELECT
- `messages WHERE conversation_id=X AND role=assistant ORDER BY created_at DESC LIMIT 1`
- Edge Function insertet message VOR done-Event → kein Race
- Wichtig für Message Actions (Bookmarks, Flagging) die `msg.id` als DB-Key brauchen

### Fix 4 — Stable React Keys in ChatArea.tsx
- `key={msg.id ?? i}` → `key={msg.id ?? \`pending-${i}\`}` — verhindert Key-Clashes zwischen numerischen und UUID-String-Keys

**Geänderte Dateien:** `src/app/globals.css`, `src/components/workspace/ChatMessage.tsx`, `src/lib/workspace-chat.ts`, `src/components/workspace/ChatArea.tsx`

**Neue Lernmuster:**
- `max-width: N%` auf flex-column gibt Kindern keine "definite width" für Prozent-Auflösung → immer mit `width: fit-content` oder struktureller Neuausrichtung lösen
- Sibling-Elemente in einem Fragment brauchen einen gemeinsamen DOM-Wrapper für CSS `:hover` — `display: contents` unreliabel; plain block-div zuverlässig
- Supabase PromiseLike hat kein `.catch()` — `void promise.then(...)` statt `.then(...).catch(...)`

---

## 2026-03-27 — MessageActions Design-System-Cleanup

**Ampel:** 🟢
**Was gebaut wurde:**

### msg-actions-cleanup: Kontextmenü auf Design-System-Klassen umgestellt
- `src/components/workspace/MessageActions.tsx`: Alle `.msg-actions-item` → `.dropdown-item`, `.msg-actions-section-label` → `.card-section-label`, `.msg-actions-divider` → `.dropdown-divider`, `.msg-actions-item--active/--danger` → `.dropdown-item--active/--danger`
- `src/app/globals.css`: Entfernt: `.msg-actions-section-label`, `.msg-actions-divider`, `.msg-actions-item` + alle Varianten; behalten: `.msg-actions-arrow`, `.msg-actions-avatar`, alles andere
- Avatar-Modifier `.msg-actions-avatar` übersteuert `.dropdown-item`'s `align-items: center` korrekt via `!important`

**Entscheidung:** Bubble-grows-down Pattern bleibt, aber Items nutzen nun native Design-System-Klassen statt Custom-CSS. Kein `<div className="dropdown">` Wrapper notwendig da die Bubble selbst den Container bildet.

**Offene Punkte:** keine

---

## 2026-03-23 — Superadmin Perspectives, Charts, Bugfixes

**Ampel:** 🟢
**Was gebaut wurde:**

### sa-persp-01: Superadmin Perspectives-Verwaltung
- `src/app/superadmin/perspectives/page.tsx` (neu): CRUD für `scope='system'` Avatare — Filter-Chips, Card-Grid, Edit-Form
- `src/app/api/superadmin/perspectives/route.ts` + `[id]/route.ts` (neu): GET/POST/PATCH/DELETE mit `requireSuperadmin()`-Guard
- `src/app/superadmin/SuperadminNav.tsx`: Link "Perspectives" eingefügt

### chart-presentations: Präsentations-System
- `src/lib/workspace-context.ts`: `buildPresentationContext()` — lädt Workspace + Cards + project_memory via department_id
- `src/lib/context-builder.ts`: Re-Export von `buildPresentationContext`
- `src/app/api/chat/stream/route.ts`: `mode='presentation'` → nutzt `buildPresentationContext` statt `buildWorkspaceContext`

### chart-tremor: Tremor Theme Migration
- `tailwind.config.js`: Tremor brand-Farben auf Tropen-Grün (#2D7A50) aktualisiert
- `src/app/dashboard/CostChart.tsx`: `colors={['emerald']}` → `colors={['green']}`
- `src/components/admin/qa/RoutingPanel.tsx`: `color="emerald"` → `color="green"` auf BarList
- `src/components/workspace/SessionPanel.tsx`: Tremor AreaChart für per-message Kosten (ab 2 Datenpunkten)

### chart-echarts: ECharts Artifact-Renderer
- `src/lib/chat/parse-artifacts.ts`: ArtifactType `'chart'` hinzugefügt
- `src/components/workspace/ArtifactRenderer.tsx`: `buildChartIframeHtml()` (ECharts 5 CDN), Chart-Render-Branch mit 350px iframe

### Edge Function Deployment
- `supabase/functions/ai-chat/index.ts`: Gesprächsregeln, Präsentations-Artifacts, Chart-Artifacts, Attachment-Support deployed
- War seit Commit `1938211` nicht deployed — alle lokalen Änderungen jetzt live

### Gesprächsverhalten-Update
- Regel 2 in `buildSystemPrompt()`: "Erst fragen, dann bauen" — bei vagen Erstellungs-Anfragen zuerst eine Klärungsfrage, dann bauen

### Bugfixes (Hydration + Artifact)
- `src/components/workspace/ChatInput.tsx`: `hasSpeech` via `useEffect`/`useState` statt direktem `getSpeechRecognition()` im Render — behebt Hydration-Mismatch (SSR kennt kein `window`)
- `src/components/home/RecentlyUsed.tsx`: `suppressHydrationWarning` auf Zeit-Buttons (`Date.now()` in Render-Pfad)
- `src/components/AppFooter.tsx`: `suppressHydrationWarning` auf Jahr-Span (`new Date().getFullYear()`)
- `src/app/api/artifacts/transform/route.ts`: sucrase-Transform um `'typescript'` erweitert — Toro darf TypeScript-Syntax in React-Artifacts verwenden

**Anpassungen:** keine strukturellen Änderungen

**Offene Punkte:**
- `public/academy-presentation.html` (Test-Datei) kann nach Tests gelöscht werden
- Supabase CLI Update auf v2.78.1 empfohlen

**Neue Lernmuster:**
- `'use client'`-Komponenten mit `window`/`Date.now()` im Render-Pfad → immer `useEffect`+`useState(false)` oder `suppressHydrationWarning`
- sucrase für React-Artifacts braucht `['jsx', 'typescript']` wenn Toro TypeScript-Syntax generieren kann

---

## 2026-03-20 — Hotfix: Toro Gesprächsverhalten

**Ampel:** 🟢
**Was gebaut wurde:**
- `supabase/functions/ai-chat/index.ts`: Gesprächsregeln an den Anfang von `buildSystemPrompt()` eingefügt — vor dem AI-Guide-Name. Regeln: Eine Frage auf einmal, direkt starten, kein Formular-Stil, kurze erste Antwort, Markdown nur wenn sinnvoll.
- Edge Function deployed: `supabase functions deploy ai-chat` ✅

**Nicht geändert:**
- Chips-Mechanismus: `/api/chat/generate-chips` + `QuickChips` funktionieren bereits korrekt
- Markdown-Rendering: `ReactMarkdown` + `remarkGfm` bereits in `ChatMessage.tsx` aktiv

**Offene Punkte:** keine

---

## 2026-03-20 — Workspace Umbau (Rahmen-Visualisierung)

**Ampel:** 🟡
**Was gebaut wurde:**
- Migration `20260320000064`: `workspaces.project_id` UUID FK; `cards.source` CHECK ('manual'/'chat_artifact'), `cards.source_conversation_id` UUID FK
- `src/app/api/artifacts/save/route.ts`: Erweiterter Artifact-Save — speichert Artefakt + erstellt automatisch eine Workspace-Card (source='chat_artifact', status='ready') wenn die Konversation `intention='focused'` und `current_project_id` gesetzt ist, und ein Workspace mit dieser `project_id` existiert
- `src/components/workspace/ArtifactRenderer.tsx`: Endpunkt auf `/api/artifacts/save` umgestellt
- `src/lib/workspace-types.ts`: `Conversation.drift_detected` hinzugefügt
- `src/hooks/useWorkspaceState.ts`: `drift_detected` in Supabase-Select ergänzt
- `src/lib/workspace-actions.ts`: Optimistisches Conversation-Objekt um `drift_detected: null` ergänzt
- `src/app/workspaces/page.tsx`: `project_id` in Query; done-count (status='ready') für project-verknüpfte Workspaces
- `src/components/workspaces/WorkspacesList.tsx`: Progress-Bar wenn `project_id` gesetzt und `cardCount > 0`
- `src/app/workspaces/[id]/page.tsx`: `CanvasCard` um `source` + `source_conversation_id` erweitert; Select aktualisiert
- `src/components/workspaces/CardTile.tsx`: "Aus Chat" Badge bei `source === 'chat_artifact'`
- `src/components/workspace/ChatContextStrip.tsx`: Neu — zeigt Projekt-Fokus-Strip über Chat; inkl. Drift-Warning-Icon
- `src/components/workspace/ChatArea.tsx`: ChatContextStrip integriert (wenn `intention=focused` und `current_project_id` gesetzt)
- `src/app/globals.css`: `.chat-context-strip` CSS-Klassen hinzugefügt

**Anpassungen gegenüber Build-Prompt:**
- `cards.status` Konflikt: Build-Prompt schlug neue Status-Werte vor (draft/review/done), aber die Spalte existiert bereits mit (draft/ready/stale/processing/error). `ADD COLUMN IF NOT EXISTS` wäre No-Op. Lösung: `status='ready'` als "done"-Proxy für Progress-Berechnung verwendet — keine neuen Status-Werte nötig.
- `intentions-system-konzept.md` nicht gefunden — wurde ohne externe Referenz implementiert.

**Offene Punkte:**
- Supabase Edge Function `ai-chat` muss noch `intention` + `current_project_id` in den System-Prompt injizieren
- Edge Function muss `<artifact>`-Format-Anweisung im System-Prompt erhalten

**Neue Lernmuster:** Wenn ein Build-Prompt eine neue DB-Spalte vorschlägt die bereits existiert, nie blind überschreiben — immer vorhandene Constraints prüfen und Proxy-Lösung suchen.

---

## 2026-03-20 — Artifact-Renderer (Inline Artifacts im Chat)

**Ampel:** 🟢
**Was gebaut wurde:**
- Migration `20260320000063`: `artifacts.type` CHECK um 'react', 'data', 'image', 'other' erweitert (aligned DB mit Validator)
- `src/lib/chat/parse-artifacts.ts`: Reiner Parser — extrahiert `<artifact>` Blöcke aus Nachrichteninhalt via Regex; gibt `ContentSegment[]` (TextSegment | ArtifactSegment) zurück
- `src/components/workspace/ArtifactRenderer.tsx`: Renderer mit Syntax-Highlighting (Standard) + optionaler iframe-Vorschau für `react`-Type; "Speichern"-Button → POST /api/artifacts; sandbox="allow-scripts" ohne allow-same-origin
- `src/lib/validators/artifacts.ts`: Enum aligned mit DB CHECK
- `ArtifactsDrawer.tsx`: 'react' + weitere Typen zur Union + Atom-Icon ergänzt
- `ChatMessage.tsx`: `renderAssistantContent` in `renderLines()` + artifact-aware Wrapper umstrukturiert; `parseArtifacts()` wird nur aufgerufen wenn `<artifact>` im Content enthalten

**Architektur-Entscheidungen:**
- iframe `srcdoc` + sandbox="allow-scripts": KI-Code läuft isoliert, kein Zugriff auf App-State/Cookies; React + Babel werden lazy via CDN geladen (nur bei "Vorschau öffnen")
- Lazy Preview-Trigger (User klickt "Vorschau"): Vermeidet ~5MB Babel-Download bei jedem Chat-Reload
- Bestehende `/api/artifacts` POST-Route wiederverwendet — kein neuer Endpoint nötig
- `renderLines()` als extrahierter Helper: ermöglicht Wiederverwendung für Text-Segmente innerhalb artifact-aware Rendering
- Pre-existing Discrepancy (validator vs. DB CHECK) — in dieser Migration behoben

**Edge Function (TODO):** `ai-chat` muss System-Prompt-Snippet für `<artifact>` Format erhalten (außerhalb Next.js codebase)

**TypeScript:** 0 Errors.

---

## 2026-03-20 — Intentions-System Chat-Start (Weichenstellung)

**Was gebaut wurde:**
- Migration `20260320000062`: `conversations` um `intention`, `current_project_id`, `drift_detected`, `focus_since_message` erweitert; `focus_log` Tabelle (APPEND ONLY) mit RLS angelegt
- `IntentionGate.tsx`: Zwei klickbare Karten ("Gezielt" / "Offen") — ersetzt EmptyState wenn `activeConvId === null`
- `FocusedFlow.tsx`: 3-Phasen UI — Projekt-Picker → Start-Modus-Wahl → ChatInput bereit; "Kurz strukturieren" befüllt Input mit Struktur-Prompt
- `workspace-types.ts`: `Conversation` um `intention` + `current_project_id` erweitert; `WorkspaceState` um `pendingIntention` + `pendingCurrentProjectId`
- `workspace-actions.ts`: `newConversation()` liest `pendingIntention` / `pendingCurrentProjectId` aus Context und schreibt sie in den DB-Insert; reset nach Erfolg
- `useWorkspaceState.ts`: Pending-State + `convActions`-Übergabe + Select-Felder erweitert
- `ChatArea.tsx`: IntentionGate/FocusedFlow/EmptyState basierend auf `intentionChoice` (lokaler State, reset bei `activeConvId → null`)

**Architektur-Entscheidungen:**
- `IntentionGate` ersetzt `EmptyState` als erste Ansicht; `EmptyState` bleibt als "Offen"-Pfad erhalten
- `pendingIntention` + `pendingCurrentProjectId` in State (kein API-Call) — werden erst bei `newConversation()` in DB geschrieben
- "Kurz strukturieren" = pre-filled Prompt statt eigener API-Route (einfacher, nutzt denselben LLM-Flow)
- `focus_log` ist APPEND ONLY — Intention-Wechsel werden protokolliert aber nie überschrieben
- System-Prompt-Injection in `ai-chat` Edge Function: Edge Function liest `intention` + `current_project_id` aus DB via `conversation_id` — keine Client-seitigen Änderungen nötig (TODO: Edge Function updaten)

**TypeScript:** 0 Errors. Design-Lint: 0 Errors, 38 Warnings.

---

## 2026-03-20 — Chat-Input Cleanup (nach Plan L)

**Was entfernt wurde:**
- `ChatInput.tsx`: Rollen-Dropdown, Capability/Modus-Dropdown, Outcome-Dropdown, Workspace-Button + Workspace-Erstellen-Formular — reduziert auf Input + Send-Button
- `useWorkspaceState.ts` / `workspace-types.ts` / `workspace-actions.ts` / `workspace-chat.ts`: `activeRoleId`, `activeCapabilityId`, `activeOutcomeId` vollständig entfernt
- `PromptBuilderModal.tsx` + `/api/chat/prompt-builder/` — entfernt
- `promptBuilderOpen`/`setPromptBuilderOpen` State — entfernt

**Architektur-Entscheidungen:**
- `role_id` und `workflow_plan` werden nicht mehr an die Edge Function `ai-chat` übergeben — Roles/Capabilities sind implizit via `detectRole()` / `detectCapability()` (noch nicht implementiert, aber das ist die Richtung)
- `agent_id` wird bei neuen Conversations immer `null` — kein manuelles Setzen mehr möglich
- Der `'Prompt verfeinern'` Chip sendet jetzt `'Hilf mir, meinen nächsten Prompt zu formulieren.'` als normalen User-Prompt — Inline-Gespräch statt Modal
- Sentinel `__PROMPT_BUILDER__` vollständig entfernt

**TypeScript:** 0 Errors. Design-Lint: 0 Errors, 38 Warnings.

---

## 2026-03-20 — Plan L: Chat-Interaktions-System

**Was gebaut wurde:**
- `src/lib/model-selector.ts`: 3 neue Task-Types (`project_intro`, `chips`, `prompt_builder`) → alle auf Haiku
- `src/app/api/chat/project-intro/route.ts`: POST-Endpoint — lädt Projekt-Kontext + letzte 6 Messages, generiert kontextuellen Einstieg (max. 512 Tokens), gibt `{ message }` zurück (kein DB-Write)
- `src/app/api/chat/generate-chips/route.ts`: Fire-and-forget POST nach Stream-Ende — generiert 3-4 Aktions-Chips aus letzter Antwort, gibt `{ chips: ChipItem[] }` zurück
- `src/app/api/chat/prompt-builder/route.ts`: Multi-Turn Prompt-Verfeinerung (max. 2 Klärungsfragen), gibt `{ type: 'question'|'final', ... }` zurück
- Migration `20260320000061`: `prompt_builder` zu `conversation_type` CHECK Constraint hinzugefügt
- `src/lib/workspace-types.ts`: `ChipItem` Interface + State-Erweiterung
- `src/components/workspace/QuickChips.tsx`: Text-only Chips nach jeder Toro-Antwort
- `src/components/workspace/PromptBuilderModal.tsx`: Modal-Dialog mit 3-Phasen UI (not started → Q&A → final prompt)

**Architektur-Abweichungen vom ursprünglichen Build-Prompt:**
- Build-Prompts beschrieben Chips als `<chips>` XML-Block im Streaming-Response → **implementiert als separater fire-and-forget POST** nach Stream-Ende (robuster, kein XML-Parsing im Stream)
- Build-Prompts beschrieben Prompt-Builder inline im Chat → **implementiert als Modal-Dialog** (pragmatischer, weniger State-Komplexität)
- Build-Prompts beschrieben Projekt-Einstieg mit DB-Write → **implementiert ohne DB-Write** (nur return + lokaler State, schlanker)

Diese Abweichungen sind bewusste Architektur-Entscheidungen, keine Fehler. Build-Prompts in `docs/superpowers/plans/` sind Planungsdokumente — die finale Implementierung steht im Code und in CLAUDE.md.

**Sicherheits-Fix im Nachgang:**
`project-intro/route.ts` initial ohne org-ownership Check deployed → Fix-Commit `926ae10` ergänzte `.eq('organization_id', me.organization_id)` + try/catch um alle Supabase-Calls.

**Tests:** 11 Unit-Tests grün (3 Testdateien). TypeScript: 0 Fehler. Design-Lint: 0 Errors.

**Nächste Schritte:**
Manueller Smoke-Test der drei Features (Dev-Server erforderlich). Danach Branch mergen.

---

## 2026-03-20 — Plan J1: Feeds autonom (Distributions + Run-History)

**Was gebaut wurde:**
- Distributions CRUD API (`/api/feeds/[id]/distributions`)
- Project-Distribution in `distributor.ts` (Items → project_memory)
- RunHistoryPanel: Kosten, Fehler-Details, Items-Breakdown
- DistributionsPanel: Outputs konfigurieren direkt in SourcesView
- NotificationBadge: unread count + Mini-Dropdown im Feeds-Header
- Migration 20260320000060: project_memory um organization_id, memory_type, source_url, metadata erweitert

**Was es bedeutet:**
Feeds sind jetzt echte Produktions-Tools. Items können automatisch in Projekte,
Workspaces und als Notifications weitergeleitet werden. Die Run-History zeigt
ob Feeds korrekt laufen und was sie kosten.

**Nächste Schritte:**
Plan D: Chat & Context Integration vollständig abschließen.

---

## 2026-03-19 — Code & Architektur Review (Audit v2.1)

**Score:** 53.6% — 🟠 Risky (vorher 45.5% Prototype, +8.1 Punkte)

**Wichtigste Verbesserungen seit 2026-03-15:**
- Sicherheit +1: Security-Headers (HSTS, CSP, X-Frame-Options) + globales Rate Limiting (4 Stufen) + Webhook-HMAC + Sentry verifiziert aktiv
- CI/CD +1: Design-Lint, Dependency-Check, E2E-Tests, Security Audit in Pipeline
- Testing +1: 22 Testdateien (vorher 10), 3 E2E-Tests, CI-integriert
- PWA +3: manifest.json + Service Worker + Offline-Fallback
- /health Endpoint: vollständig (DB-Ping, Latenz, Version, HTTP 200/503)
- Library-System: Roles/Skills/Capabilities/Outcomes strukturiert implementiert

**Kritische Findings (sofort beheben):**
- SSRF: Feed-Fetcher (`url.ts`, `rss.ts`, `api.ts`) ohne Private-IP-Blockierung
- PII in Log: `onboarding/complete/route.ts` Zeile 140 loggt E-Mail-Adresse
- Email-Webhook ohne Signaturvalidierung: `/api/feeds/inbound/email/route.ts`
- Debug-Route in Produktion ohne Auth-Guard: `/api/debug/feeds/route.ts`
- CSP veraltet: `api.dify.ai` noch drin (Dify abgelöst)

**Strukturelle Defizite (unverändert seit letztem Audit):**
- Backup & DR: Score 1 — kein DR-Runbook, kein Restore-Test, PITR unverifiziert
- Supply Chain: Score 1 — kein SBOM

**Neue Dokumente angelegt:**
- `docs/audit-report-2026-03-19.md` — vollständiger Audit-Report
- `docs/tech-debt.md` — priorisierte Tech-Debt-Liste
- `docs/adr/001-supabase-als-auth-und-db.md`
- `docs/adr/002-conversations-fuer-workspace-chats.md`
- `docs/adr/003-library-system-rolle-capability-skill.md`

---

## 2026-03-19 — Library-System Fundament (Prompt 01)

**Was gebaut wurde:**
- 4 Migrations (052–056): extend capabilities/outcomes/skills, new roles/library_versions tables, cards extension, seed data
- 7 Rollen geseedet: 5 system (Generalist default, Stratege, Analyst, Kommunikator, Projektmanager) + 2 package marketing
- 5 package_agents → roles migriert (Campaign Planner, Brand Voice Writer, Social Adapter, Newsletter Spezialist, Copy Texter)
- 3 neue system-Skills + 3 package-Skills Marketing
- library-resolver.ts: resolveWorkflow(), detectRole(), detectSkill(), buildSystemPrompt()
- 20+ API routes unter /api/library/*
- Chat Input: "Agent" → "Rolle", lädt aus /api/library/roles

**Warum:**
Library-System ist das Fundament für Chat, Workspace, Agenten und Feeds.
Rollen geben Toro Fachexpertise. Skills geben Toro Schritt-für-Schritt-Anweisungen.
Capabilities + Outcomes regeln Modell-Routing und Output-Format.

**Architektur-Entscheide:**
- library-resolver.ts ist SEPARATE von capability-resolver.ts (backward compat)
- model_catalog hat UUID PK (nicht TEXT wie in Spec — bestehende FK beibehalten)
- capabilities.requires_package: neues TEXT-Feld package_slug (UUID FK bleibt erhalten)
- package_agents Tabelle bleibt erhalten (nur Kopie als roles, keine Löschung)
- Fix-Migration 054 nötig: roles_insert RLS policy verhinderte scope='public' für Org-Admins

---

### 2026-03-17 — Architect Review D2 + J2 (noch kein Build)

**Ampel:** 🟡 (D2) · 🔴 (J2)
**Prompt:** Agenten-Spec + Plan D (neue Version) — kritisch prüfen, nicht bauen
**Entscheidung:** Review durchgeführt, Build noch nicht gestartet. Wartet auf Timms Entscheidungen.

**Befunde D2 (Workspace Chat Context):**
- workspace_messages existiert bereits (Migration 035) — braucht ALTER nicht CREATE
- loadProjectContext() existiert bereits in project-context.ts
- Plan heißt ab jetzt "Plan D2" (Plan D ✅ bereits fertig)
- 5 Anpassungen im Build-Prompt nötig vor dem Build

**Befunde J2 (Agenten-System + Skills):**
- agents-Tabelle existiert (Migration 025) — minimales Schema, braucht ALTER
- skills-Tabelle existiert nicht
- Überschneidung Skills vs. Capabilities noch ungeklärt
- Plan-Nummern-Konflikt ARCHITECT.md vs. phase2-plans.md
- Scope zu groß → Pflicht-Aufteilung in J2a / J2b / J2c

**Offene Punkte:**
- Vollständige Entscheidungs-Tabelle: docs/superpowers/plans/2026-03-17-architect-review-d2-j2.md
- D1: Zeitdimension in D2 oder Plan K?
- J1: Skills vs. Capabilities (Option A/B/C)
- J2: Plan-Nummern synchronisieren
- J3: Cron-Runner (Supabase pg_cron empfohlen)
- J4: Marketing-Agents scope='package' nach ALTER
- J5: Toro-Vorschlag opt-in DEFAULT false bestätigt?

**Neue Lernmuster:**
- "Prüfe ob workspace_messages existiert" — ja, seit Migration 035
- Plan D hatte einen unfertigen Teil (Workspace-Context) — beim nächsten Spec-Review sofort checken

---

### 2026-03-17 — Capability + Outcome System (Plan 1)

**Ampel:** 🟢
**Prompt:** Plan 1 — Capability + Outcome System

**Entscheidung:**
Capabilities + Outcomes als zentraler Routing-Layer für alle LLM-Calls.
Capability Resolver in Node.js (`capability-resolver.ts`) — nicht in Deno Edge Functions.
Guided Workflows als strukturierte Entscheidungsbäume ohne LLM-Call bei der Erkennung.

**Anpassungen:**
- Guided Workflows auf max. 3 Verschachtelungsebenen begrenzt
- Immer eine `is_custom: true` Option als Escape
- `guided_enabled = false` überschreibt alles ohne Ausnahme

**Offene Punkte:** keine

**Neue Lernmuster:**
- Deno/Node.js Runtime-Grenze: Node.js-only Code kann nicht in Supabase Edge Functions importiert werden

---

### 2026-03-17 — Chat & Context Integration (Plan D)

**Ampel:** 🟢
**Prompt:** Plan D — Chat & Context Integration

**Entscheidung:**
Zwei Chat-Systeme bleiben parallel: ai-chat Edge Function (Projekte) und Next.js /api/chat/stream (Workspaces).
`workflow_plan` wird client-seitig pre-resolved (Deno kennt keinen Node.js Resolver).
Memory-Warnung bei >85% context_window.
`chat/stream` Auth-Fix: userId immer via `getAuthUser()` — nie aus Request-Body.

**Anpassungen:**
- Spaltenname in project_memory ist `type` (nicht `memory_type`) — Migration 030 geprüft

**Offene Punkte:** keine

**Neue Lernmuster:**
- Security: User-ID niemals aus dem Request-Body nehmen
- Zod v4: `z.record(z.unknown())` → muss `z.record(z.string(), z.unknown())` sein

---

### 2026-03-17 — Transformations-Engine (Plan E)

**Ampel:** 🟢
**Prompt:** Plan E — Transformations-Engine

**Entscheidung:**
DB-Tabellen (`transformations`, `transformation_links`) existieren bereits aus Migration 032.
Dreistufiger Flow: analyze (kein DB-Write) → create pending → execute.
`target_type`: nur `workspace` und `feed` implementiert (kein `agent` vorerst — Agenten-System noch nicht spezifiziert).
Analyse mit claude-haiku (Token-sparend), gibt max. 2 Suggestions zurück.

**Anpassungen:**
- `agent` als target_type aus Validator ausgeschlossen (Zod: `z.enum(['workspace', 'feed'])`)

**Offene Punkte:**
- Agent-Transformation wenn Agenten-System Phase 2 spezifiziert ist

**Neue Lernmuster:** keine

---

### 2026-03-17 — UI Projekte + Workspaces (Plan F)

**Ampel:** 🟢
**Prompt:** Plan F — UI (Projekte + Workspaces + Feeds-Settings)

**Entscheidung:**
Projects page: Memory-Count aus List-Endpoint (project_memory(count) in SELECT) — kein Extra-Request pro Karte.
Memory-Tab: lazy geladen beim ersten Klick.
Workspaces page: Server Component + separater WorkspacesList Client Component.
`workspace_participants` für User-Scoping (kein direkter department_id-Filter).

**Anpassungen:**
- Feeds-Settings Pipeline-Config verschoben (SourcesView hat bereits min_score pro Source)

**Offene Punkte:**
- Feeds Pipeline globale Settings (org-weite min_score Defaults) — für Plan I

**Neue Lernmuster:** keine

---

### 2026-03-17 — Dify-Ablösung (jungle-order)

**Ampel:** 🟢
**Prompt:** Dify komplett ablösen

**Entscheidung:**
Dify wird vollständig entfernt. `jungle-order` Edge Function ruft jetzt Anthropic direkt via fetch auf (`claude-haiku-4-5-20251001`).
Kein SDK-Import nötig — gleicher Ansatz wie `ai-chat` (direktes fetch zur Anthropic API).

**Anpassungen:** keine — Drop-in-Ersatz, gleiche Prompts, gleiche JSON-Extraktion

**Offene Punkte:**
- `DIFY_API_KEY` + `DIFY_API_URL` aus Supabase Edge Function Secrets entfernen (manuell im Dashboard)

**Neue Lernmuster:** keine

---

### 2026-03-24 — Web Search + Rich Link Previews

**Ampel:** 🟢
**Prompt:** Feature — Web Search + Rich Link Previews

**Entscheidung:**
Web Search via Anthropic `web_search_20260209` Server-Tool (kein externer Dienst, kein API-Key).
Toggle in SessionPanel → `user_preferences.web_search_enabled` (Migration 067).
Edge Function: `callAnthropic()` + `tools/beta-Header` wenn aktiviert; `streamAnthropic()` erkennt `server_tool_use`-Blöcke → emittiert `{ type: "searching" }` → sammelt `web_search_result`-Quellen → übergibt als `sources[]` im `done`-Event.
Client: `isSearching`-State durch den gesamten Props-Stack (`useWorkspaceState` → `workspace-chat.ts` → `WorkspaceLayout` → `ChatArea`).
SourcesBar: YouTube-Thumbnails (img.youtube.com/vi/{id}/mqdefault.jpg), Artikel-Cards mit Google Favicon API, horizontales Scrolling.

**Anpassungen:**
- `src/lib/workspace-types.ts`: SearchSource, sources auf ChatMessage, isSearching/setIsSearching auf WorkspaceState
- `src/components/workspace/SourcesBar.tsx` (neu)
- `src/app/globals.css`: SourcesBar-CSS + carea-searching-Indicator + @keyframes searching-pulse
- `supabase/migrations/20260324000067_user_prefs_web_search.sql`

**Offene Punkte:** keine

**Neue Lernmuster:**
- Anthropic Server-Tool (`web_search_20260209`) ist komplett server-seitig — kein Client-Code für Search-Execution, nur SSE-Events parsen

---

### 2026-03-24 — Fix Markdown Rendering

**Ampel:** 🟢
**Prompt:** Fix — Markdown Rendering im Chat

**Entscheidung:**
Root-Cause: `@tailwind base` (Preflight) setzt alle Browser-Defaults zurück — `strong` verliert `font-weight: bold`, `ul/ol` verlieren `list-style`, Überschriften verlieren Größen.
`ReactMarkdown` + `remarkGfm` war bereits korrekt eingebaut (`ChatMessage.tsx`, `renderLines()`-Funktion, `makeMdComponents`-Factory). Kein Komponenten-Umbau nötig — nur CSS.
Fix: ~90 Zeilen CSS in `globals.css`, scoped auf `.cmsg-bubble--assistant .cmsg-content`.

**Anpassungen:**
- `src/app/globals.css` — Markdown-Styles für p, strong, h1–h4, ul/ol, a, blockquote, hr, table

**Offene Punkte:** keine

**Neue Lernmuster:**
- Tailwind Preflight löscht alle Browser-Defaults — Markdown-Rendering braucht explizite CSS-Restaurierung, auch wenn ReactMarkdown korrekt verwendet wird

---

### 2026-03-27 — Chat-Bubble Toolbar + Menü-Restrukturierung

**Ampel:** 🟢
**Prompt:** Teil 1–3 — Icon-Toolbar erweitern, Dropdown kürzen, Avatar-Submenü bereinigen

**Entscheidung:**
Feedback-Icons (👍👎🔖) und Aktions-Icons (Copy/Kürzen/E-Mail/Übersetzen/Vorlesen/Regenerate) jetzt direkt in der Bar — nicht mehr im Dropdown. Separator via `.msg-actions-bar-sep`. Dropdown auf Perspektiven + In-Tab-öffnen + In-Workspaces-posten + Fehlerhaft-melden reduziert. Avatar-Submenü zeigt Phosphor-Icon (Emoji→Phosphor-Lookup, Fallback UserCircle) + Name — kein context_default mehr.

**Anpassungen:**
- Emoji-Icon-Lookup: `type AvatarIconType = PhosphorIconType` (nicht `React.ComponentType`) — Phosphor nutzt `IconWeight` union, nicht `string`
- `context_default`-Werte ('none', 'last_10') wurden als Beschreibungstext gerendert (truthy-Bug) — komplett entfernt
- `ITEM_ICON` auf 16px korrigiert

**Offene Punkte:** keine

**Neue Lernmuster:**
- Phosphor `Icon`-Typ hat `weight: IconWeight` (union), nicht `string` → Record-Typ muss `PhosphorIconType` sein
- Felder mit truthy-Werten wie 'none' oder 'last_10' nie als Bedingung für optionale Renders verwenden

---

### 2026-03-27 — Prompt-Builder Bottom Sheet + Chip-Integration

**Ampel:** 🟢
**Prompt:** Prompt-Builder — Bottom Sheet + Chip-Integration

**Entscheidung:**
Quick-Chip "Prompt verfeinern" (PencilSimple, accent-light) unter der letzten Assistenten-Antwort — nur wenn `isLastAssistantMessage && !isStreaming`. Öffnet `PromptBuilderSheet` (Bottom Sheet, 60vh/92vh Mobile).
Sheet: load-Phase (generate-questions API) → question-Phase (text/chips_single/chips_multi) → build-Phase → preview-Phase (editierbare Textarea + Absenden/Zurück).
Absenden: PATCH `/api/conversations/[id]` `{ conversation_type: 'prompt_builder' }` (fire-and-forget), dann `onSendDirect(builtPrompt)`.
Beide API-Routes nutzen `modelFor('prompt_builder')` → `claude-haiku-4-5-20251001`.

**Anpassungen:**
- Quick-Chip nur unter isLastAssistantMessage (nicht unter allen Antworten) — kein visueller Noise
- Keine PerspectivesBottomSheet vorhanden — eigene Implementierung nach BookmarksDrawer/SearchDrawer-Muster

**Offene Punkte:** keine

**Neue Lernmuster:**
- `modelFor('prompt_builder')` war bereits in model-selector.ts vorbereitet (gute Vorarbeit in Migration 061)
- IIFE in JSX (`{promptBuilderOpen && (() => { ... })()}`) für bedingte Mounts mit Variablenlogik

---

### 2026-03-30 — Parallel Tabs Feature

**Ampel:** 🟢
**Prompt:** Parallel Tabs — detect N intent, confirm bubble, create N conversations, open N tabs

**Entscheidung:**
4 Teile gebaut:

1. `src/lib/chat/detect-parallel-intent.ts` — Pure keyword detection (kein LLM). Erkennt "3 Varianten", "4 Ansätze", etc. in Nachrichten. Extrahiert count (2–5), Labels (aus Kolon-Listen oder Quotes, sonst generisch) und Topic. Folgt complexity-detector.ts-Muster exakt.

2. `src/app/api/conversations/create/route.ts` — Neuer Endpoint POST /api/conversations/create: Erstellt Konversation mit Titel + optionaler user-Nachricht (seed_message). Wird für alle N Tabs via Promise.all aufgerufen.

3. `src/hooks/useChatTabs.ts` — Neue Funktion `openNewTabWithConversation(convId, title)` — erstellt Tab der bereits eine convId hat (statt null). Verhindert den null→update-Zyklus der normalen openNewTab.

4. `ChatArea.tsx` — Intercept in handleChatSubmit: @-mention check → parallel intent check → normal send. Bei Erkennung: `parallelConfirm`-State gesetzt, confirmation bubble gerendert (Lightbulb-Icon, accent-light Background). "Ja"-Handler erstellt N Conversations via Promise.all + ruft onOpenParallelTabs auf. "Nein"-Handler sendet original via onSendDirect.

WorkspaceLayout.tsx bekommt `handleOpenParallelTabs(items)` → öffnet N Tabs via openNewTabWithConversation + switchTab zum ersten.

**Anpassungen:**
- Parallel check nur wenn `onOpenParallelTabs && canOpenNewTab && activeConvId` — kein Trigger ohne offene Konversation oder wenn Tab-Limit erreicht
- Conversation create API: workspace_id optional, fällt auf org's ersten Workspace zurück (gleiche Logik wie new-from-message)

**Offene Punkte:**
- Labels-Extraktion ist heuristisch — funktioniert gut für "Varianten: A, B, C" und Quotes, aber nicht für implizite Listen wie "erstmal das erste dann das zweite dann das dritte"

**Neue Lernmuster:**
- `openNewTabWithConversation` löst Race Condition: Bei sequentiellem openNewTab+setActiveConvId würde React die State-Updates batchen und nur den letzten sehen. Mit convId direkt im Tab-Objekt entfällt das Problem.
- Parallel-Tabs Confirmation UI: als ephemeral local state in ChatArea (nicht in useWorkspaceState) — sauber isoliert, kein Prop-Drilling zu allen Eltern

---

### 2026-03-24 — Hotfix System-Prompt: Toro fragt zuerst (SPARK-Regeln)

**Ampel:** 🟢
**Prompt:** Hotfix — System-Prompt: Toro fragt zuerst

**Entscheidung:**
Zwei System-Prompt-Ebenen angepasst:
1. Edge Function (`buildSystemPrompt` in `supabase/functions/ai-chat/index.ts`): Regeln 2+3 erweitert mit konkreten FRAGT-ZUERST- vs. STARTET-DIREKT-Beispielen + expliziten Direkt-Start-Triggern.
2. API-Route (`src/lib/workspace-context.ts`): Alle drei Builder-Funktionen (`buildWorkspaceContext`, `buildCardContext`, `buildPresentationContext`) bekommen eine kompakte "Erst fragen, dann bauen"-Regelblock angehängt.

**Anpassungen:** keine weiteren

**Offene Punkte:** keine

**Neue Lernmuster:**
- Tropen OS hat zwei voneinander unabhängige Chat-Systeme mit separaten System-Prompts: Edge Function (Workspace-Chat) + workspace-context.ts (Canvas/Card-Chat) — beide müssen bei Verhaltensänderungen synchron gepflegt werden

---

## 2026-04-07 — ADR-019: TypeScript Compiler API statt web-tree-sitter

**Feature:** Repo Map Generator (Sprint 1 — Pivot "Quality OS für Vibe-Coded Apps")

**Entscheidung:** TypeScript Compiler API (`typescript@^5`, bereits installiert) statt `web-tree-sitter` (WASM-basiert, neue Dependency).

**Kontext:** Build-Prompt delegierte die WASM-Handling-Entscheidung an Claude Code: "pragmatischste Lösung wählen die in Vercel deployed".
- web-tree-sitter benötigt `.wasm` Dateien die kompiliert oder aus externen Quellen bezogen werden müssen
- TypeScript Compiler API: bereits installiert (`typescript@^5.9`), kanonischer TS-Parser, keine Zusatz-Dependencies
- Beide Ansätze liefern identische Ergebnisse für TypeScript + JavaScript

**Konsequenz:** Sprint 1 nutzt TS Compiler API für TS/JS. Für künftige Sprachen (Python, Go, Rust in Sprint 2+) wird web-tree-sitter eingeführt wenn es tatsächlich gebraucht wird. Kein YAGNI-Verstoß.

**Neue Dateien:**
- `src/lib/repo-map/` — 8 Module + formatters/ + fixtures/
- `src/scripts/generate-repo-map.ts` — CLI Dogfooding Script
- `src/app/api/repo-map/generate/route.ts` — API Route
- `docs/repo-map/` — generierte Map-Outputs

**Dogfooding:** Generator läuft erfolgreich auf Tropen OS selbst.
- 586 Dateien gescannt, 2301 Symbole gefunden
- Wichtigste Symbole: supabaseAdmin (188 refs), createLogger (146 refs), getAuthUser (72 refs)
- 4017 / 4096 Tokens genutzt
- Ergebnis in `docs/repo-map/`

---

### 2026-04-08 — Sprint 4a — Agenten-Integration in Audit Engine

**Ampel:** 🟢
**Prompt:** Sprint 4a — Drei Agenten-Regelwerke → Rule Registry + Dashboard-Attribution
**Entscheidung:** 13 neue automatisierte Checks aus 3 Agenten-Regelwerken (Architecture v3, Security v2.1, Observability v3) in Rule Registry integriert. AgentSource + EnforcementLevel als optionale Felder (backward-compat). Trigger-Route schlägt agentSource zur Laufzeit im AUDIT_RULES-Array nach — kein Durchreichen durch die gesamte Finding-Chain nötig.
**Anpassungen:**
- `agentSource` optional in AuditRule + Finding (nicht required, Default 'core' bei DB-Insert)
- CategoryBreakdown: nur 8 Kategorien mit expliziten Agent-Pills (Rest implizit 'core')
- FindingsTable: neue "Agent"-Spalte + Agent-Filter-Chips; colSpan 5→6 im Detail-Row
- Migration 000096: agent_source/agent_rule_id/enforcement auf audit_findings
**Offene Punkte:** keine
**Neue Lernmuster:** Rule-Lookup-Pattern — agentSource über Rule-Registry nachschlagen statt durch den Aufruf-Stack durchzureichen ist sauberer und verhindert Duplizierung.

---

### 2026-04-08 — Sprint 4b — Multi-Model Review Pipeline

**Ampel:** 🟢
**Prompt:** Sprint 4b — 4 Modelle reviewen parallel → Opus Judge destilliert → Konsens-Findings
**Entscheidung:** Vercel AI Gateway statt 4 separater API-Keys. Plain `"provider/model"` Strings routen automatisch über das Gateway — kein `createOpenAI()` / `createGoogleGenerativeAI()` Boilerplate. Auth via `AI_GATEWAY_API_KEY` oder `VERCEL_OIDC_TOKEN` (auto-refresh auf Vercel). Graceful degradation: Provider ohne Credentials werden übersprungen, Quorum ≥2 nötig.
**Anpassungen:**
- AI Gateway statt direkter Provider-SDKs (`@ai-sdk/openai`, `@ai-sdk/google` installiert aber nur als Typenreferenz)
- Modelle: Claude Sonnet 4.6 / GPT-5.4 / Gemini 2.5 Pro / DeepSeek Chat (4 Reviewer) + Claude Opus 4.6 (Judge)
- Fingerprinting: ruleRef + severity + erste 60 Chars der Message → Konsens-Gruppierung
- FindingsTable bei 300 Zeilen (exakt an Warngrenze) — keine Violation
- Migration 000097: review_type/models_used/judge_model/review_cost_eur/quorum_met auf audit_runs; consensus_level/models_flagged/avg_confidence auf audit_findings
**Offene Punkte:** AI Gateway muss im Vercel Dashboard aktiviert werden (Settings → AI Gateway)
**Neue Lernmuster:** AI Gateway plain-string routing — kein `gateway()` Wrapper nötig wenn keine custom providerOptions gebraucht werden. OIDC bevorzugen über statischen API-Key (auto-rotation).

---

### 2026-04-08 — Sprint 5 — 18 Agenten via Multi-Model-Komitee

**Ampel:** 🟢
**Prompt:** Sprint 5 — 18 Agent Rule Documents durch das eigene Multi-Model-Review-System generieren
**Entscheidung:** Agenten nicht manuell schreiben, sondern das eigene System nutzen: 4 Modelle erstellen jeden Agenten unabhängig, Opus Judge destilliert den Konsens. Tropen OS baut sein Regelwerk mit sich selbst.
**Anpassungen:**
- Direkte Provider-Calls statt Vercel AI Gateway: Gateway erfordert Billing-Setup das im Projekt nicht konfiguriert ist (GatewayInternalServerError). Gleiche Entscheidung wie judge.ts (Sprint 4b).
- Generierungsreihenfolge nach Abhängigkeiten: Runde 1 (keine Deps) → Runde 2 (ref. R1) → Runde 3 (ref. R1+R2)
- Format-Template im System-Prompt: kondensierte Version von ARCHITECTURE_AGENT_v3.md — nicht verbatim (würde Kontext-Fenster sprengen), stattdessen Schlüsselstruktur
- Script-Architektur aufgeteilt: `generate-agents.ts` (Runner) + `agent-gen-defs.ts` (Definitionen) um 500-Zeilen-Limit einzuhalten
- Validation nach jedem Agenten: 11 Checks (Sections, Regeln-Anzahl, Severity, Why, Bad→Good, etc.) mit bis zu 2 Retries
- Alle 18 Agenten in einem Durchlauf erfolgreich generiert, alle valid — 0 Retries nötig
- 4/4 Provider (Claude, GPT-4o, Gemini, Grok 4) für jeden Agenten verfügbar
**Ergebnis:** 21 Agent Rule Packs in `docs/agents/` (3 manuell + 18 Komitee)
**Neue Dateien:**
- `src/scripts/generate-agents.ts` + `src/scripts/agent-gen-defs.ts`
- `src/lib/agents/agent-catalog.ts` (AgentDefinition + AGENT_CATALOG für alle 21 Agenten)
- `docs/agents/` — 18 neue .md Dateien
**Offene Punkte:** Katalog-Status für 18 Agenten noch auf 'draft' (ruleCount=0) — wird in Sprint 5b durch Rule-Registry-Integration aktualisiert
**Neue Lernmuster:** Script-Splitting bei 500-Zeilen-Grenze ist sauberer als Kommentar-Override. Format-Template im System-Prompt statt Datei-Inject — spart Tokens und die Modelle kennen das Format aus dem Kontext.

### 2026-04-13 — Repo Map Stufe 1 — Quick Wins

**Ampel:** 🟢
**Prompt:** Repo Map Generator — Stufe 1: Quick Wins (additives Ranking, Re-Export-Tracking, AST-Cache)
**Kontext:** Committee Review (4 Modelle + Opus Judge) identifizierte 3 Quick Wins die zusammen ~30-40% besseres Ranking liefern sollen. Diese Änderungen sind der Context-Builder-Grundstein für Ansatz B (Prompt-Export) aus dem Fix-Engine-Review.
**Entscheidungen:**
- Additive statt multiplikative Formel: fileRank*0.4 + exportBonus*0.3 + kindBonus*0.2 + log1p(refCount)*0.1 + entryBonus*0.2. Min-Max-Normalisierung statt Division durch Maximum. Begründung: multiplikative Formel klumpt Scores nahe 0 — unlöslich für LLM-Kontext-Ranking.
- Re-Export-Tracking: single-hop Propagierung via AST-basiertem ExportDeclaration-Parser. TypeScript Language Service (findAllReferences) bewusst nicht gebaut — das ist Stufe 2. Begründung: 90% der Barrel-Files sind single-hop, höherer ROI bei deutlich geringerem Aufwand.
- AST-Cache: module-level LruMap<hash, CachedSymbol[]> (Default 500 Einträge). Mutable fields (referenceCount, rankScore) werden beim Lesen auf 0 zurückgesetzt. Begründung: Cache muss scan-isoliert sein — jeder Scan bekommt frische Symbols-Kopien.
**Anpassungen:** Keine — alle 3 Änderungen wie geplant implementiert.
**Ergebnis:** 54 Tests grün, tsc --noEmit sauber.
**Neue Dateien:**
- `src/lib/repo-map/ast-cache.ts` — LruMap + hashContent/getCached/setCached
- `src/lib/repo-map/ast-cache.unit.test.ts`
- `src/lib/repo-map/fixtures/barrel.ts`, `barrel-wildcard.ts`, `barrel-consumer.ts`, `barrel-wildcard-consumer.ts`
**Geänderte Dateien:**
- `src/lib/repo-map/graph-ranker.ts` — additives Ranking + Min-Max
- `src/lib/repo-map/reference-analyzer.ts` — Re-Export-Erkennung + Propagierung
- `src/lib/repo-map/index.ts` — AST-Cache-Integration
**Offene Punkte (Stufe 2):** TypeScript Language Service API (findAllReferences), In-Memory Browser Cross-File-Analysis, Knapsack Token-Budget, Benchmark-Suite.

### 2026-04-13 — Findings-Liste: Pattern B entfernt
**Ampel:** 🟢
**Entscheidung:** DeepReviewFindings.tsx komplett entfernt. Alle Findings (inkl. Deep Review mit models_flagged/consensus_level) werden jetzt einheitlich über FindingsTable → RecommendationCard gerendert.
**Problem:** Zwei verschiedene Darstellungsformen für Findings — Pattern A (kompakte Einzeiler mit Chevron, expandierbar, via RecommendationCard) und Pattern B (Tabellen-Layout mit Status-Dropdown, Fix-Button, vertikal gestapelte Buttons, via DeepReviewFindings).
**Lösung:**
- `page.tsx`: Deep/Static-Split entfernt. Keine `isDeepReviewFinding()` Funktion mehr. Alle Findings gehen an `FindingsTable`.
- `DeepReviewFindings.tsx`: Datei gelöscht (war einziger Pattern-B-Renderer).
- `RecommendationCard.tsx`: Agent-Badge als inline Chip hinzugefügt (z.B. "DSGVO", "Sec", "BFSG", "AI") — ersetzt die alte AGENT-Spalte.
**Geänderte Dateien:** `page.tsx`, `RecommendationCard.tsx`
**Gelöschte Dateien:** `DeepReviewFindings.tsx`
**Neue Lernmuster:** Wenn ein Feature "vereinheitlicht" wird, nicht nur die Gruppen-Header ändern sondern auch den Rendering-Pfad für Einzel-Findings prüfen.

### 2026-04-14 — Finding-Kategorisierung: fixType-System
**Ampel:** 🟢
**Entscheidung:** Jedes Audit-Finding bekommt einen fixType der bestimmt wie es behoben werden kann.
**4 Typen:**
- `code-fix` (62): KI kann direkt fixen — bestehenden Code ändern
- `code-gen` (52): KI muss neue Dateien/Komponenten erstellen
- `refactoring` (9): Schrittweise, riskant — mit Warnung im Prompt
- `manual` (43): Menschliche Aktion nötig — Checkliste statt Prompt
**Umsetzung:**
- `FixType` Type in `src/lib/audit/types.ts`
- `fixType` Feld in `AuditRule` + `Finding` Interfaces
- Alle 188 Regeln in `rule-registry.ts` kategorisiert (0 ohne fixType)
- `PromptFinding` um `fixType` erweitert
- `template-engine.ts`: `manual` → Checkliste, `refactoring` → Warnhinweis, `code-fix`/`code-gen` → Standard-Prompt
- `getFixType(ruleId)` Helper für Runtime-Auflösung
**Geänderte Dateien:** `types.ts`, `rule-registry.ts`, `prompt-export/types.ts`, `prompt-export/template-engine.ts`
**Keine DB-Änderung:** fixType wird zur Laufzeit aus der Rule-Registry aufgelöst.

### 2026-04-14 — Audit-Seite: fixType-Navigation
**Ampel:** 🟢
**Entscheidung:** fixType als primäre Filter-Navigation auf der Audit-Seite. User sieht sofort: "Das kann meine KI fixen" vs. "Das muss ich selbst machen".
**Umsetzung:**
- fixType-Tabs (Chip-Leiste) oberhalb der Severity-Filter: Alle, Code-Fixes, Generieren, Refactoring, Manuelle Aufgaben
- fixType-Badge pro Finding (farbcodiert: grün=code-fix, hellgrün=code-gen, neutral=refactoring, grau=manual)
- Manuelle Findings zeigen "Anleitung" statt "Fix-Prompt" (BookOpen-Icon)
- Statistik-Zeile unter ScoreHero: "X Code-Fixes · Y zu generieren · Z Refactoring · W manuelle Aufgaben"
- `FindingGroup` um `fixType` erweitert (aus Rule-Registry aufgelöst)
- Filter-Kombination: fixType × severity × status × agent (AND-Logik)
- Severity-Zahlen aktualisieren sich je nach aktivem fixType-Tab
- i18n: alle Strings EN + DE
**Geänderte Dateien:** `FindingsTable.tsx`, `RecommendationCard.tsx`, `group-findings.ts`, `page.tsx`, `messages/en.json`, `messages/de.json`
**Dateien > 300 Zeilen:** FindingsTable (415), RecommendationCard (363) — Refactoring-Kandidaten für Split

### 2026-04-14 — Dogfooding-Feedback-System eingerichtet
**Ampel:** 🟢
**Entscheidung:** GitHub Issues + Markdown-Log fuer Checker-Qualitaets-Tracking. Entscheidung aus Committee Review (einstimmig, 4 Modelle + Opus-Judge, €0.33).
**Umsetzung:**
- GitHub Issue Templates: `false-positive.yml` + `checker-improvement.yml` in `.github/ISSUE_TEMPLATE/`
- 6 GitHub Labels erstellt (checker-quality, false-positive, improvement, security, performance, compliance)
- `docs/checker-feedback.md` — Feedback-Log mit 2 bestehenden FP-Eintraegen (cat-3-rule-22, cat-3-rule-19)
- `docs/checker-test-repos.md` — Benchmark-Repos (5 Slots, noch auszufuellen)
- Prozess in CLAUDE.md dokumentiert
**Nicht gebaut (bewusst):** DB-Tabelle, "Finding falsch?"-Button, automatisierte FP-Rate — kommt erst ab 10 Beta-Usern
**Neue Lernmuster:** Checker-Fixes immer gegen Benchmark-Repos testen bevor mergen. FP-Rate pro Regel tracken.

### 2026-04-14 — Kontextuelles Hilfe-System auf Audit-Seite
**Ampel:** 🟢
**Entscheidung:** Keine separate Docs/FAQ-Seite. Stattdessen kontextuelle Erklaerungen direkt im UI.
**Umsetzung:**
- Onboarding-Banner: Beim ersten Scan — Score-Kontext, 3 Schritte, dismissable (localStorage `audit-onboarding-dismissed`)
- Score-Popover: Info-Icon neben Score zeigt 4 Stufen mit Farben + Gewichtungs-Erklaerung
- fixType-Erklaerung: Dismissable Hint-Box erklaert die 4 Fix-Typen (localStorage `audit-fixtypes-dismissed`)
- Manuell-Tab Hinweis: Kontext-Text wenn "Manuelle Aufgaben" Filter aktiv
- Leerer Zustand: Ermutigende Nachricht statt "0 Ergebnisse" 
- Drawer-Hint: Permanenter Hinweis im Fix-Prompt-Drawer ("Kopiere in dein Coding-Tool")
- Feedback-Link: "Finding nicht korrekt?" mailto-Link in jedem expandierten Finding
**Ton:** Ermutigend, Vibe-Coder-Sprache ("Deine KI kann das loesen" statt "Automatisierbar")
**localStorage-Keys:** `audit-onboarding-dismissed`, `audit-fixtypes-dismissed`
**Geaenderte Dateien:** ScoreHero.tsx, FindingsTable.tsx, RecommendationCard.tsx, FixPromptDrawer.tsx, messages/en.json, messages/de.json

### 2026-04-14 — Checker-Fix: cat-16-rule-7 html lang-Attribut
**Ampel:** 🟢
**Entscheidung:** False Positive gefixt. Regel pruefte auf `lang="de"` statt auf Existenz des lang-Attributs. Englische Projekte wurden faelschlich geflagt.
**Fix:** Regex akzeptiert jetzt jeden 2-5-Buchstaben lang-Code UND dynamisches `lang={locale}`. Message und Suggestion enthalten keine Referenz auf "de" mehr.
**Entdeckt:** Dogfooding gegen next.js-canary Template.
**Geaenderte Dateien:** `agent-regulatory-checker.ts`, `docs/checker-feedback.md`

### 2026-04-14 — Automated Checker Testbench MVP
**Ampel:** 🟢
**Entscheidung:** Automatisierte Testbench die oeffentliche GitHub-Repos scannt. Committee Review (einstimmig): Tarball-API + In-Memory-Scan. Kein git-clone, keine GitHub Actions.
**Architektur:**
- `src/lib/benchmark/tarball-extractor.ts` — GitHub Tarball → In-Memory FileMap (tar-stream)
- `src/lib/benchmark/repo-discovery.ts` — GitHub Search API mit Filtern (topic, language, pushed)
- `src/lib/benchmark/runner.ts` — Orchestrator: discover → download → scan → persist
- `src/lib/benchmark/stats.ts` — Aggregierte Statistiken (Score-Verteilung, Top-Findings, fixType)
- `src/scripts/benchmark.ts` — CLI-Einstiegspunkt
**Flow:** `discoverRepos()` → fuer jedes Repo: `extractRepoFromGitHub()` → `buildAuditContextFromFiles()` → `runAudit()` → Supabase persist (is_benchmark=true)
**DB:** Migration 109: `audit_runs.is_benchmark` + `audit_runs.source_repo_url`
**Neue Dateien:** 5 in `src/lib/benchmark/`, 1 CLI-Script
**Alle Dateien < 200 Zeilen**

### 2026-04-14 — Compliance-Profil + Domaenen-System
**Ampel:** 🟢
**Entscheidung:** 6 Compliance-Domaenen mit Profil-basierter Relevanz-Filterung. Committee Review (einstimmig auf 4/6 Fragen). MVP: Top 3 (Impressum, DSGVO, E-Commerce) + Affiliate + AI Act Transparency.
**Umsetzung:**
- `src/lib/audit/compliance-domains.ts` — 6 Domaenen-Registry mit `isRelevant(profile)` Funktionen
- `src/lib/audit/checkers/compliance-checker.ts` — 6 neue Regeln: AGB, Widerruf, Button-Text, Affiliate-URLs, AI-Transparenz, AI-Content-Labeling
- `AuditOptions.excludeRuleIds` — Profil-basiertes Regel-Skipping in `runAudit()`
- `CompliancePanel.tsx` — Domaenen-Uebersicht mit Ampel (103 Zeilen)
- `ProfileOnboarding.tsx` — 3-Schritt-Chip-Formular (138 Zeilen)
- 26 i18n-Keys (EN + DE)
**Neue Regeln:** cat-4-rule-20 (AGB), cat-4-rule-21 (Widerruf), cat-4-rule-22 (Button-Text), cat-5-rule-20 (Affiliate), cat-22-rule-14 (AI Transparency), cat-22-rule-15 (AI Content Labeling)
**Profil-Schema:** `{ app_type, user_location, features[] }` in `scan_projects.profile` JSONB
**Nicht gebaut:** EU-Erweiterung, App-Store-Regeln, E-Commerce-Flow-Checks, Disclaimer-UI

### 2026-04-14 — Noise-Bereinigung + AST Code-Quality Checker (Stufe 2)
**Ampel:** 🟢
**Problem:** Benchmark zeigte 62% Noise-Findings, Score-StdDev 0.82. PascalCase allein bis 147 FP/Repo.
**Teil A — Noise-Bereinigung:**
- A1: shadcn/ui PascalCase-Whitelist (`components/ui/` + kebab-case Hooks)
- A2: Erlaubte Verzeichnisse von 12 auf 27 erweitert
- A3: Typosquatting-Severity von `low` auf `info`
**Teil B — Tier-System:**
- `RuleTier` Type: starter | production | enterprise
- 6 Regeln → enterprise, 3 → production
- `runAudit()` filtert nach User-Tier (Default: starter)
**Teil C — AST Code-Quality Checks (8 neue Regeln):**
- `ast-analyzer.ts` (269 Zeilen): Zentraler Parser mit SHA-256-Cache (LRU 800)
- `ast-quality-checker.ts` (268 Zeilen): 8 Checks
- B1: Cognitive Complexity (CC > 15/25/40)
- B2: God Components (>300 Zeilen + >5 Hooks)
- B3: Error Handling (leere catch, fehlende try-catch in API)
- B4: Hardcoded Secrets (Stripe, OpenAI, AWS, GitHub etc.)
- B5: Circular Imports (DFS-Zykluserkennung)
- B6: any-Type-Usage (>3/10 pro Datei)
- B7: N+1 Queries (DB-Call in Schleife)
- B8: Missing Error Boundary (error.tsx)
**Neue Regeln:** cat-2-rule-10/11/12/13, cat-1-rule-10/11, cat-3-rule-30, cat-5-rule-15
**Gesamte Regelanzahl:** ~204 (von 188)

### 2026-04-15 — UX-Schicht: Quick Wins + Priorisierung + Score-Kontext
**Ampel:** 🟢
**Entscheidung:** Komitee-Review (4 Modelle, MEHRHEIT): UX sofort starten, Quick-Wins-Button als Aha-Moment.
**Umsetzung:**
- `quick-wins.ts`: Algorithmus der Top 5 Quick Wins berechnet (Severity × Suggestion × fixType, max 1/Kategorie)
- `score-percentile.ts`: Hardcoded v7-Benchmark-Percentile (49 Repos)
- `self-assessment.ts`: 5 Ja/Nein-Fragen fuer manuelle Checks (Backups, Monitoring, Rate Limiting, RTO/RPO, Legal)
- `QuickWinsCard.tsx`: Prominente Card ueber Findings-Liste mit Copy-to-Clipboard Cursor-Prompts + Score-Gain-Badge
- `FindingsGroupTabs.tsx`: Chip-Tabs "Heute fixbar / Diese Woche / Irgendwann"
- Score-Kontext "Top X% aller gescannten Projekte" in ScoreHero-Bereich
- i18n: 8 neue Keys (EN + DE)
**Komitee-Entscheidungen (committee-results-2026-04-15.md):**
- Frage 1 (Plattform): B — generisch, Plattform nur anzeigen
- Frage 2 (Score): C — einheitlich + Kontext-UI
- Frage 3 (UX): A — sofort starten
- Frage 4 (Manual): C — Self-Assessment (5 Fragen)

---

### 2026-04-17 — Sprint 11 — Komitee-Entscheidungen + SLOP_DETECTION_AGENT + SPEC_AGENT + Benchmark v8

**Ampel:** 🟢
**Prompt:** Komitee-Entscheidungen 2026-04-17 umsetzen + zwei neue Agenten bauen + Benchmark v8 laufen lassen

**Entscheidungen:**

**Gewichts-Kalibrierung (Komitee-Konsens):**
- `cat-2` (Error Handling) ×1→×2, `cat-8` (Backup/DR) ×2→×1, `cat-19` (Git Governance) ×2→×3, `cat-12` (Observability) ×2→×3
- Typ-Constraint `1|2|3` verhindert ×0.5 für cat-15/17 — bleiben auf Minimum ×1
- Quick-Win-Trio Bonus: cat-2/12/19 bekommen +2 im quickWinScore-Algorithmus

**FP-Fixes (3 Regeln):**
- `cat-19-rule-3/4` (i18n): severity 'low'→'info', score 0→3 — DE-only Projekte nicht bestrafen
- `cat-6-rule-1` (API Versioning): Skip wenn alle `/api/`-Pfade intern (`/api/internal/`, `/api/admin/`, `/api/health/`, `/api/webhooks/`) — verhindert False Positives bei internen APIs
- `cat-7-rule-1` (Performance): Admin-Seiten (`/admin/`, `/dashboard/`, `/settings/`) aus Lazy-Load-Check ausgenommen — Admin-UIs brauchen kein Code-Splitting

**SLOP_DETECTION_AGENT (cat-26, 5 Regeln):**
- Neue Kategorie: KI-Code-Hygiene (weight 1)
- R1: Placeholder-Kommentare (cat-26-rule-1, weight 2)
- R2: AI-Tool-Fingerprints (.bolt/prompt, weight 1)
- R3: Überkommentierung >40% Ratio (weight 1)
- R4: Placeholder-Credentials (weight 3, höchstes Gewicht)
- R5: Gemischte Kommentar-Sprache (weight 1)
- Conference-backed: AIE 2026 + innoQ/GenAI Summit + AI Coding Summit + VibeX 2026

**SPEC_AGENT (cat-18-rule-9..12, 4 Regeln):**
- R1: AI-Kontext-Datei vorhanden + >200 Zeichen (weight 2, ×2)
- R2: PRD/Requirements-Dokument vorhanden (weight 1, Skip <20 files)
- R3: README-Implementation-Drift (threshold ≥2 Packages, weight 1)
- R4: .cursorrules enthält Stack-Keywords (weight 1)
- Conference-backed: Patrick Debois AIE 2026 ("Context Is the New Code")

**Benchmark v8 Ergebnisse (2026-04-17, 49 Repos):**
- Overall: 80.0% Avg (+0.3pp vs v7) — score stabil trotz 9 neuer Regeln
- SPEC: 100% Hit-Rate (49/49 Repos) — weit über erwarteten 40-60%
- SLOP: 41% Hit-Rate (20/49 Repos) — unter erwarteten 60-80%; cat-26-rule-2/5 feuern nicht auf EN-Repos
- FP-Fixes confirmed: cat-6-rule-1 = 0 Repos, cat-7-rule-1 = 0 Repos

**Beta-Pilot-Entscheidung: GO**
- SPEC universell relevant (PRD + AI-Kontext fehlt in 92-98% aller Repos)
- SLOP braucht Kalibrierung in Sprint 13 (Pattern-Lockerung für cat-26-rule-1)

**Anpassungen:**
- `CategoryBreakdown.tsx`: AGENT_PILL Record war exhaustiv über AgentSource — 'slop' + 'spec' nachgetragen (TypeScript-Error)
- `spec-checker.ts`: `readRootFile()` + `hasRootFile()` Helpers für dual-mode (In-Memory + Disk)
- Benchmark-Script nutzt fixe Datei — v8 separat via `analyze-v8.ts` gespeichert

**Offene Punkte:**
- Sprint 13: cat-26-rule-1 Muster lockern (Lovable-spezifische Patterns hinzufügen)
- Sprint 13: cat-26-rule-2 Pass-Bedingung wenn kein `.bolt/`-Verzeichnis
- Sprint 13: cat-18-rule-9 Gewicht ×2→×3 (Hit-Rate 92% rechtfertigt Erhöhung)
- Sprint 13: R3-Threshold ggf. auf ≥3 erhöhen wenn FP-Feedback kommt

---

### 2026-04-17 — Beta-Pilot-Vorbereitung — Landing + Invite + Feedback

**Ampel:** 🟢
**Prompt:** Beta-Pilot-Vorbereitung — Landing + Invite + Feedback (Sprint 11)

**Entscheidungen:**

- **`/beta` öffentlich, außerhalb `(app)`:** Seite liegt unter `[locale]/beta/` (kein AppShell, kein Auth-Guard). Nur `NextIntlClientProvider`-Wrapper aus `[locale]/layout.tsx`. Gleicher Aufbau wie `impressum`, `login`.
- **`/welcome` außerhalb `(app)`:** Kein Sidebar-Layout erwünscht für Onboarding. Server Component prüft Auth + `beta_onboarding_done` — wenn done → redirect `/audit/scan`. `WelcomeClient.tsx` als separater Client-Component.
- **`/api/beta/onboarding-complete` upsert:** `user_preferences` nutzt `onConflict: 'user_id'` — auch wenn kein Prefs-Row existiert. Fail-open im Client.
- **Feedback-Button-Sichtbarkeit:** Sichtbar wenn `user_preferences.beta_onboarding_done = true` (nicht `is_beta_user`). Simpler — kommt automatisch aus dem Onboarding-Flow. Timm kann `is_beta_user = true` manuell setzen für direkte Aktivierung ohne Welcome-Flow.
- **Superadmin beta_feedback scan_count:** Scan-Count nicht direkt mit User-Relation auflösbar ohne aufwändigen JOIN (audit_runs → organization → users). Placeholder im Code eingebaut, aber korrekte Umsetzung requires entweder denormalisiertes Feld oder View. Als Tech-Debt markiert.
- **Typecheck sauber:** Alle 5 neuen Dateien typchecken ohne Fehler.

**Anpassungen:**
- Score-Ranges in WelcomeClient korrigiert (war 50-70%/70-85%, ist 60-79%/80-89% — passt zum tatsächlichen Scoring-System)
- Stable-Farbe in WelcomeClient: war `#E5A000` (amber), geändert zu `var(--accent)` (grün — CLAUDE.md-Standard)
- Benchmark-Wert in WelcomeClient auf "78–84%" korrigiert (v8-Daten statt Build-Prompt-Schätzung "75–82%")

**Offene Punkte:**
- Superadmin: scan_count per Beta-User noch nicht korrekt implementiert — braucht View oder denormalisiertes Feld
- Login-Redirect nach Onboarding: Login geht aktuell zu `/chat`. Beta-User landen nur auf `/welcome` wenn Timm ihnen die URL schickt. Ggf. Login-Redirect-Logik anpassen wenn > 10 Beta-User.
- `is_beta_user`-Flag: Timm setzt manuell via Supabase Dashboard (`UPDATE user_preferences SET is_beta_user = true WHERE user_id = '...'`)

**Neue Lernmuster:**
- Exhaustive `Record<AgentSource, ...>` in TSX: TypeScript erzwingt Updates bei jedem AgentSource-Union-Extend — gut als Compile-Zeit-Check, aber jede neue AgentSource braucht Eintrag in CategoryBreakdown.tsx
- SPEC-Regeln: Score-Checks wie "has .cursorrules" treten in fast 100% der öffentlichen Repos an — expected rate von 40-60% war zu konservativ; KI-Kontext-Files sind in Open Source noch extrem selten

---

### 2026-04-17 — SLOP + SPEC Agenten, Benchmark v8, Beta-Pilot-Infrastruktur

**Ampel:** 🟢
**Prompts:** Komitee-Entscheidungen umsetzen + SLOP_DETECTION_AGENT + SPEC_AGENT + Benchmark v8 + Beta-Pilot-Vorbereitung + /ultrareview-Vergleich

**Entscheidungen:**
- 5 neue Agenten priorisiert durch Komitee (SLOP → SPEC → EVAL → MCP → CRA)
- Gewichts-Änderungen: cat-19/12 ×3, cat-2/10 ×2
- FP-Fixes in CONTENT/API/PERFORMANCE
- Beta-Pilot mit 10 Usern vorbereitet — aber User-Einladung verschoben bis Dogfooding-Sprint durch (Entscheidung: erst eigenen Score auf 85%+)
- /ultrareview-Benchmark: komplementär, keine Integration, Blog-Post-Evidenz

**Offene Punkte:**
- Self-Scan-Ergebnis steht aus
- Domain-Entscheidung steht aus (GuideVibe vs. VibeMate)
- Sprint 13 Komitee wartet auf Beta-Feedback + eigene FP-Erfahrungen

**Neue Lernmuster:**
- Empirische Benchmarks > theoretische Diskussionen (/ultrareview-Vergleich hat die Positionierung in 1 Stunde geklärt)
- Dogfooding vor User-Tests — eigener Score muss Production Grade sein

---

### 2026-04-21 — Silent-Failure-Audit P6: Vollständiger Checker-Scan

**Ampel:** 🟢
**Prompts:** Systematischer P6-Scan aller 21 Checker-Dateien + Kategorisierung A/B/C/D + Dokumentation

**Ergebnis:** Keine neuen Category-A-Issues (false-clean score=5) gefunden. Die 2 bereits fixierten Checker aus der vorherigen Session waren die einzigen Fälle.

**Kategorisierung (alle 21 Checker):**

| Kategorie | Dateien | Aktion |
|-----------|---------|--------|
| A (false-clean) | `final-category-checkers.ts`, `agent-security-checker.ts` | ✅ bereits gefixt (vorherige Session) |
| B (false-fail) | — | keine gefunden |
| C (crash-risk, mitigiert) | `documentation-checker.ts`, `agent-architecture-checker.ts`, `agent-committee-checker.ts`, `agent-regulatory-checker.ts` | rootPath unguarded → runner catch → score: null (korrekt) |
| D (korrekt) | 15 weitere Checker | — |

**Befund zu Category C:** Runner in `src/lib/audit/index.ts:104-112` wraps jeden Checker-Aufruf in try-catch → gibt `score: null` zurück. D.h. rootPath-unguarded Checker produzieren keine falschen Scores. Kein Fix nötig (wäre Refactoring, kein P6-Fix).

**Score:** 86.9% stabil (Δ 0.0)

**Neue Lernmuster:**
- Runner-Level try-catch ist ein wichtiges Sicherheitsnetz — macht Category-C zu einem stilistischen, nicht fachlichen Problem
- Vollständiger Scan bestätigt: `final-category-checkers.ts` readContent-Fix war die einzige systemische P6-Lücke

---

### 2026-04-21 — isListRoute Shared Utility Extraktion (P9)

**Ampel:** 🟡
**Prompt:** List-Route-Detection als Shared Utility extrahieren

**Architektur-Entscheidung:**
- `isListRoute()` existierte in 2 Checkern mit divergierenden Implementierungen
- `agent-committee-checker.ts` hatte die raffinierte Version (26 NON_LIST_SEGMENTS, dynamic-parent, cron, hyphen checks)
- `final-category-checkers.ts` hatte die simplere Version (19 NON_LIST_SEGMENTS, ohne die 4 Guards)
- Canonical = raffinierte Version; minimal behaviour change für `checkUnlimitedQueries` (weniger FPs)
- Neues Utility-Verzeichnis: `src/lib/audit/utils/` — kanonischer Ort für geteilte Checker-Logik

**Entscheidungen:**
- `.eq()`-Check bleibt AUSSERHALB der Utility — gehört zur Content-Inspektion des Callers
- Utility-Datei + Unit-Test im selben Verzeichnis (`route-utils.ts` + `route-utils.unit.test.ts`)
- P9 in `checker-design-patterns.md` aktualisiert: Referenz auf `route-utils.ts` als erste realisierte Extraktion

**Neue Dateien:** `src/lib/audit/utils/route-utils.ts`, `src/lib/audit/utils/route-utils.unit.test.ts`
**Geänderte Dateien:** `agent-committee-checker.ts`, `final-category-checkers.ts`, `category-gap-checkers.ts` (pre-existing existsSync import fix)

**Score:** 86.9% stabil (Δ 0.0)
**Tests:** 22 Unit-Tests, alle grün

**Neue Lernmuster:**
- Divergierende Implementierungen derselben Logik sind ein Risiko-Indikator — auch bei nur 2 Vorkommen (nicht erst ab 3)
- `src/lib/audit/utils/` ist etabliert als Utility-Verzeichnis; nächster Kandidat: `isApiRoute()`, `isClientComponent()`

---

### 2026-04-21 — Framework-Kontext-Guard für checkFetchInEffect (P4.1)

**Ampel:** 🟢
**Prompt:** fetch-in-useEffect-Checker um Next.js App Router-Kontext erweitern

**Architektur-Entscheidung:**
- Bestehender Checker hatte `isNextJs`-Erkennung, nutzte sie aber nur für Suggestion-Text, nicht für Finding-Entscheidung
- 56 Findings waren false positives: Server Components (useEffect unmöglich), Client Components mit Auth/Realtime-Bedarf, API Route Handlers
- Neues Pattern P4.1 etabliert: Framework-blinde Kalibrierung als Spezialisierung von P4

**Guards (in Priorität):**
1. Next.js App Router-Datei + API Route → skip (Route Handler hat kein useEffect)
2. Next.js App Router-Datei + kein `'use client'` → skip (Server Component, useEffect läuft nicht)
3. Next.js App Router-Datei + `'use client'` + CLIENT_STATE_INDICATORS → skip (useAuth, WebSocket, supabase.channel, EventSource, useSession, etc.)
4. Alle anderen Dateien → Finding bleibt

**Score-Auswirkung:**
- Vor Fix: 56+ Findings → score 1 (schlechtester Wert)
- Nach Fix: erwartete echte Findings 5–15 → score 2 (realistisch)
- State-Management-Kategorie-Score steigt auf realistische Werte

**Geänderte Dateien:**
- `src/lib/audit/checkers/state-deps-obs-checkers.ts` — checkFetchInEffect mit Framework-Guard
- `src/lib/audit/__tests__/state-deps-obs-checkers.unit.test.ts` — neue Testdatei, 15 Tests
- `docs/checker-design-patterns.md` — P4.1 als neues Pattern dokumentiert
- `docs/checker-feedback.md` — Eintrag für cat-9-rule-5 FP-Fix

**Tests:** 15 Unit-Tests, alle grün

**Neue Lernmuster:**
- Framework-Awareness reicht nicht — Datei-Pfad-Kontext und Runtime-Kontext müssen separat geprüft werden
- `CLIENT_STATE_INDICATORS` als benannte Konstante exportiert — kann von anderen Checkern genutzt werden (isClientComponent-Utility wäre nächster Schritt)
- Prop-Drilling (cat-9-rule-6): 11 Findings NICHT angefasst — echte Probleme, kein False-Positive-Verdacht

---

### 2026-04-21 — ManualFinding-Layout (Option B — neue Felder)

**Ampel:** 🟢
**Prompt:** Eigenständiges Layout für Finding-Typ "Manuell" — nummerierte Schritte statt Prompt-Monospace

**Architektur-Entscheidung:**
- Option A (semantische Umdeutung bestehender Felder) abgelehnt: `firstStep` + `strategy` haben für Prompt-Findings eine klare Bedeutung die nicht überschrieben werden sollte
- Option B (neue Felder): `manualSteps: string[]`, `verification: string`, `codeSnippets: ManualCodeSnippet[]` zu `FindingRecommendation` hinzugefügt — optional, vollständig backwards-kompatibel
- Kein DB-Schema-Change — alle neuen Felder sind statische Daten in `finding-recommendations.ts`

**Typ-Weiche in RecommendationCard:**
- `group.fixType === 'manual' && recommendation.manualSteps` → ManualStepsList-Layout
- Alle anderen → bestehendes Prompt-firstStep-Layout (unverändert)
- Für manuelle Findings mit Steps: kein FixPromptDrawer-Button (der rendert Monospace — falsche Semantik)

**Content-Migration:**
- `schema-drift`: `manualSteps` (5 Schritte) + `verification` gefüllt
- `cat-13-rule-7` (PITR Restore-Test): neue Recommendation mit `manualSteps` (6 Schritte) + `verification` — bisher kein Eintrag vorhanden

**Geänderte Dateien:**
- `src/lib/audit/finding-recommendations.ts` — Interface + ManualCodeSnippet-Typ + 2 Recommendations
- `src/app/[locale]/(app)/audit/_components/RecommendationCard.tsx` — Typ-Weiche + ManualSteps-Layout

**Tests:** 145 Unit-Tests, alle grün. TypeScript sauber.
