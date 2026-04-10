# Architect Log — Tropen OS

> Protokoll aller Architektur-Entscheidungen.
> Wird nach jedem Build ergänzt.
> Einzige Quelle der Wahrheit für getroffene Entscheidungen.

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
