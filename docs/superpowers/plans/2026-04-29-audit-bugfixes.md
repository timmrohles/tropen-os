# Audit Bug-Fix Round Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vier Bugs im Audit-Dashboard beheben: Tier-Filter, Sticky-Tabs, Coach-Stimme-Migration und UI-Streichungen.

**Architecture:** Alle Bugs betreffen entweder `src/app/[locale]/(app)/audit/page.tsx` (Server Component), `src/app/[locale]/(app)/audit/_components/FindingsTableApp.tsx` (Client Component) oder Checker-Dateien in `src/lib/audit/checkers/`. Keine DB-Migrationen nötig. Keine neuen Abhängigkeiten.

**Tech Stack:** Next.js 15 App Router (Server Components), React 19, TypeScript strict

---

## Datei-Map

| Datei | Was ändert sich |
|-------|----------------|
| `src/app/[locale]/(app)/audit/page.tsx` | Bug 1: codeFindings + Header-Counts; Bug 2: ScoreBar sticky; Bug 4: TOP%-Entfernung |
| `src/app/[locale]/(app)/audit/_components/FindingsTableApp.tsx` | Bug 4: ×count Tooltip |
| `src/lib/audit/checkers/ast-quality-checker.ts` | Bug 3: CC-Messages auf Deutsch |
| `src/lib/audit/checkers/external-tools-checker.ts` | Bug 3: Initial JS Message auf Deutsch |
| `src/lib/audit/checkers/final-category-checkers.ts` | Bug 3: PITR-Message auf Deutsch |
| `src/lib/audit/checkers/state-deps-obs-checkers.ts` | Bug 3: Prop-Forwarding-Message auf Deutsch |

---

## Task 1: Bug 1 — Tier-Filter korrekt verdrahten

**Symptom:** Die Findings-Sektion zeigt 192 Findings (alle Tiers), Metriken-Sektion zeigt 71 (alle Statuses). Tab-Badges (141/51) und Sektion-Header-Zahlen widersprechen sich.

**Root cause:**
- `computeQuickWins(allFindings)` + FindingsTableApp in Findings-Sektion bekommt `allFindings` statt code-tier-only
- Findings-Header zählt `allFindings.filter(open).length` (= 192), nicht `tierCounts.code` (= 141)
- Metriken-Header verwendet `metricFindings.length` (alle Statuses), nicht `tierCounts.metric`

**Files:** `src/app/[locale]/(app)/audit/page.tsx`

- [ ] **Step 1: `codeFindings` außerhalb des IIFE berechnen**

  In `src/app/[locale]/(app)/audit/page.tsx`, nach Zeile 160 (wo `computeQuickWins` aufgerufen wird), folgende Änderungen vornehmen:

  ```tsx
  // ALT (Zeile ~160-161):
  const { quickWins } = computeQuickWins(allFindings as unknown as Parameters<typeof computeQuickWins>[0])
  const percentileRank = runDetail ? getPercentileRank(runDetail.percentage as number) : null

  // NEU:
  const codeFindings = getFindingsByTier(allFindings, 'code')
  const { quickWins } = computeQuickWins(codeFindings as unknown as Parameters<typeof computeQuickWins>[0])
  const percentileRank = runDetail ? getPercentileRank(runDetail.percentage as number) : null
  ```

  `getFindingsByTier` ist bereits importiert (Zeile 19 der page.tsx Imports).

- [ ] **Step 2: Findings-Sektion — Header-Count und Daten korrigieren**

  Im IIFE-Return (Zeile ~259–268 der aktuellen Datei), die `<AppSection>` für Findings ändern:

  ```tsx
  // ALT:
  <AppSection
    header={`Findings · ${allFindings.filter(f => f.status === 'open').length} offen`}
    headerRight={percentileRank !== null ? `Top ${percentileRank}%` : undefined}
  >
    <FindingsTableApp
      findings={allFindings as unknown as Parameters<typeof FindingsTableApp>[0]['findings']}
      statusFilter={status}
    />
  </AppSection>

  // NEU:
  <AppSection
    header={`Findings · ${tierCounts.code} offen`}
  >
    <FindingsTableApp
      findings={codeFindings as unknown as Parameters<typeof FindingsTableApp>[0]['findings']}
      statusFilter={status}
    />
  </AppSection>
  ```

  Hinweise:
  - `headerRight` fällt weg (Bug 4 erledigt damit gleich mit)
  - `tierCounts.code` zählt nur offene code-tier Findings — gleicher Wert wie Tab-Badge
  - `codeFindings` enthält alle Statuses des code-Tiers; `FindingsTableApp` filtert intern nach `statusFilter`

- [ ] **Step 3: Metriken-Sektion — Header-Count korrigieren**

  Im IIFE-Return (Zeile ~311):

  ```tsx
  // ALT:
  <AppSection header={`Metriken · ${metricFindings.length} offen`}>

  // NEU:
  <AppSection header={`Metriken · ${tierCounts.metric} offen`}>
  ```

  `metricFindings` (kommt aus `getFindingsByTier(allFindings, 'metric')` im IIFE) wird weiterhin an `FindingsTableApp` übergeben — das ist korrekt. Nur der Header-Count ändert sich.

- [ ] **Step 4: TypeScript-Check**

  ```bash
  cd /c/Users/timmr/tropenOS && pnpm exec tsc --noEmit 2>&1 | grep -i "error" | head -20
  ```

  Erwartung: Keine neuen Fehler.

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/\[locale\]/\(app\)/audit/page.tsx
  git commit -m "fix(audit): tier-filter — codeFindings, header counts match tab badges"
  ```

---

## Task 2: Bug 2 — Sticky-Tab-Bar korrekt pinnen

**Symptom:** Tab-Bar bleibt nicht oben gepinnt. Beim Scrollen erscheint visuell eine zweite Leiste.

**Root cause:** `AppTabs` hat `position: sticky; top: var(--score-header-height)` — das funktioniert nur wenn `#audit-score-hero` (der ScoreBar-Wrapper) AUCH sticky ist mit `top: 0`. Derzeit scrollt der ScoreBar-Wrapper weg, aber die Tabs pinnen mit dem alten Offset und wirken losgelöst vom Content.

**Fix:** `#audit-score-hero` zu einem sticky-Element machen (`top: 0; z-index: 21` — ein Level höher als Tabs).

**Files:** `src/app/[locale]/(app)/audit/page.tsx`

- [ ] **Step 1: ScoreBar-Wrapper sticky machen**

  Im IIFE-Return, Zeile ~222:

  ```tsx
  // ALT:
  <div id="audit-score-hero">
    <ScoreBar

  // NEU:
  <div id="audit-score-hero" style={{ position: 'sticky', top: 0, zIndex: 21, background: 'var(--bg-base)' }}>
    <ScoreBar
  ```

  `background: var(--bg-base)` verhindert, dass Content durch den sticky Header hindurchscheint.
  `zIndex: 21` liegt über dem AppTabs-Z-Index (20).

  Die `AppTabs.tsx` bleibt unverändert — sie hat bereits:
  ```css
  position: sticky; top: var(--score-header-height, 0); z-index: 20;
  ```

  Der ResizeObserver in `AppTabs.tsx` misst `#audit-score-hero` und setzt `--score-header-height`. Das funktioniert korrekt, weil er `getBoundingClientRect().height` des sticky-positionierten Elements liest (Höhe bleibt gleich, nur Position ändert sich durch sticky).

- [ ] **Step 2: Unused Imports entfernen**

  `AuditTabs` und `AuditTierTabs` sind in der page.tsx importiert aber nie gerendert. Entfernen:

  ```tsx
  // Diese zwei Zeilen löschen:
  import AuditTabs from './_components/AuditTabs'
  import AuditTierTabs from './_components/AuditTierTabs'
  ```

- [ ] **Step 3: TypeScript-Check**

  ```bash
  pnpm exec tsc --noEmit 2>&1 | grep "error" | head -20
  ```

  Erwartung: Keine Fehler.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/\[locale\]/\(app\)/audit/page.tsx
  git commit -m "fix(audit): sticky tab bar — score hero pinned at top:0, tabs follow"
  ```

---

## Task 3: Bug 3 — Coach-Stimme (4 Checker-Dateien)

**Formel:** [Beobachtung — was ist los] + [Konsequenz — warum wichtig] + [Vorschlag — wie weiter]
**Anker-Frage:** "Wie würde ein Senior-Engineer das im PR-Review schreiben?"

Englische Fachbegriffe bleiben (CC, JS, KB, PITR, Cognitive Complexity) — nur Satzführung auf Deutsch.

### Sub-Task 3a: CC-Messages (`ast-quality-checker.ts`)

**File:** `src/lib/audit/checkers/ast-quality-checker.ts` — Zeile ~62–64

- [ ] **Step 1: High + Medium CC-Messages übersetzen**

  ```ts
  // ALT (Zeile ~62):
  violations.push({
    severity: 'high',
    message: `Function "${fn.name}" has CC=${fn.cognitiveComplexity} — very hard to maintain`,
    filePath: file.path,
    line: fn.startLine,
    suggestion: `Cursor-Prompt: 'Refactor ${fn.name} in ${file.path.split('/').pop()} — extract helper functions to reduce complexity below ${medThreshold}'`
  })
  // ALT (Zeile ~64):
  violations.push({
    severity: 'medium',
    message: `Function "${fn.name}" has CC=${fn.cognitiveComplexity} — consider simplifying`,
    filePath: file.path,
    line: fn.startLine,
    suggestion: `Cursor-Prompt: 'Simplify ${fn.name} in ${file.path.split('/').pop()} — reduce nesting and extract conditions'`
  })

  // NEU:
  violations.push({
    severity: 'high',
    message: `${fn.name} hat CC=${fn.cognitiveComplexity} — zu komplex zum Lesen und Warten`,
    filePath: file.path,
    line: fn.startLine,
    suggestion: `Cursor-Prompt: 'Refactor ${fn.name} in ${file.path.split('/').pop()} — extract helper functions to reduce complexity below ${medThreshold}'`
  })
  violations.push({
    severity: 'medium',
    message: `${fn.name} hat CC=${fn.cognitiveComplexity} — vereinfachen lohnt sich`,
    filePath: file.path,
    line: fn.startLine,
    suggestion: `Cursor-Prompt: 'Simplify ${fn.name} in ${file.path.split('/').pop()} — reduce nesting and extract conditions'`
  })
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/lib/audit/checkers/ast-quality-checker.ts
  git commit -m "fix(checker): CC messages auf Coach-Stimme Deutsch"
  ```

### Sub-Task 3b: Initial JS Message (`external-tools-checker.ts`)

**File:** `src/lib/audit/checkers/external-tools-checker.ts` — Zeile ~305–308

- [ ] **Step 1: Bundle-Size-Message übersetzen**

  ```ts
  // ALT (Zeile ~305):
  { severity: totalKb >= 1024 ? 'high' : 'medium',
    message: `Initial client JS: ${totalKb} KB (target: < 400 KB)`,
    suggestion: 'Use dynamic imports and tree-shaking to reduce bundle size',
    agentSource: 'performance' as AgentSource }

  // NEU:
  { severity: totalKb >= 1024 ? 'high' : 'medium',
    message: `Initial JS ${totalKb} KB — Ziel <400 KB. Tree-Shaking und Dynamic Imports helfen`,
    suggestion: 'Cursor-Prompt: \'Analyze bundle with ANALYZE=true pnpm build, find largest chunks, add dynamic imports\'',
    agentSource: 'performance' as AgentSource }
  ```

  Zeile ~308 (reason-String):
  ```ts
  // ALT:
  reason: `Initial client JS: ${totalKb} KB (framework + main + polyfills + webpack)`
  // NEU:
  reason: `Initial JS ${totalKb} KB (framework + main + polyfills + webpack)`
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/lib/audit/checkers/external-tools-checker.ts
  git commit -m "fix(checker): Initial JS bundle message auf Coach-Stimme Deutsch"
  ```

### Sub-Task 3c: PITR-Message (`final-category-checkers.ts`)

**File:** `src/lib/audit/checkers/final-category-checkers.ts` — Zeile ~61–62

- [ ] **Step 1: PITR-Message übersetzen**

  Exakte Zeilen mit `grep -n "PITR" src/lib/audit/checkers/final-category-checkers.ts` verifizieren, dann:

  ```ts
  // ALT (message):
  'Supabase detected — Point-in-Time-Recovery (PITR) is only active on Pro plan. Check: Dashboard → Database → Backups'
  // ALT (suggestion):
  "Add to README: 'Backup: Supabase [free/pro] — PITR [enabled/disabled]'"

  // NEU (message):
  'Supabase PITR nur im Pro-Plan aktiv — regelmäßige Backups fehlen ohne Upgrade'
  // NEU (suggestion):
  "Cursor-Prompt: 'Add README note: Backup-Status — Supabase [free/pro], PITR [enabled/disabled]'"
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/lib/audit/checkers/final-category-checkers.ts
  git commit -m "fix(checker): PITR message auf Coach-Stimme Deutsch"
  ```

### Sub-Task 3d: Prop-Forwarding-Message (`state-deps-obs-checkers.ts`)

**File:** `src/lib/audit/checkers/state-deps-obs-checkers.ts` — Zeile ~142–147

- [ ] **Step 1: Prop-Forwarding-Message übersetzen**

  Kontext: `what` enthält entweder einen vorgefertigten String oder wird dynamisch zusammengebaut. Die Variable `componentName` und `what` sind schon vorbereitet. Zeile ~142–147:

  ```ts
  // ALT:
  message: `${componentName} ${what} — consider React Context or Zustand`,
  // ...
  suggestion: `Cursor-Prompt: 'Refactor ${componentName} in ${file.path.split('/').pop()} to use React Context instead of drilling props to children'`,

  // NEU:
  message: `${componentName} reicht Props durch ohne sie zu nutzen — React Context oder Zustand würden das vereinfachen`,
  // ...
  suggestion: `Cursor-Prompt: 'Refactor ${componentName} in ${file.path.split('/').pop()} — move shared state to React Context or Zustand store'`,
  ```

  Die Variable `what` (die die genaue Prop-Liste enthält, z.B. "forwards 13 props unchanged (selectMode, hoveredId...)") soll im `message`-String erhalten bleiben als zusätzliche Info. Prüfe den vollen Kontext der Zeilen ~138–150 und passe `message` so an dass die Prop-Namen noch sichtbar sind:

  ```ts
  message: `${componentName} leitet ${what} durch — React Context oder Zustand vereinfachen das`,
  ```

  Dabei bleibt `what` der existierende formatierte String mit den Prop-Namen.

- [ ] **Step 2: Commit**

  ```bash
  git add src/lib/audit/checkers/state-deps-obs-checkers.ts
  git commit -m "fix(checker): Prop-Forwarding message auf Coach-Stimme Deutsch"
  ```

---

## Task 4: Bug 4 — UI-Streichungen

### Sub-Task 4a: TOP%-Badge entfernen (bereits in Task 1 erledigt)

In Task 1 Step 2 wurde `headerRight={percentileRank !== null ? ...}` aus der Findings-AppSection entfernt. Kein weiterer Handlungsbedarf.

### Sub-Task 4b: ×count-Zähler mit Tooltip erklären

**File:** `src/app/[locale]/(app)/audit/_components/FindingsTableApp.tsx`

Der `×49`-Zähler verwirrt (User weiß nicht was das zählt). Fix: `title`-Attribut als Tooltip hinzufügen.

- [ ] **Step 1: Tooltip zu ×count hinzufügen**

  Zeile ~143–147 in `FindingsTableApp.tsx`:

  ```tsx
  // ALT:
  {group.findings.length > 1 && (
    <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
      ×{group.findings.length}
    </span>
  )}

  // NEU:
  {group.findings.length > 1 && (
    <span
      title={`${group.findings.length} Vorkommen in der Codebase`}
      style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', cursor: 'help' }}
    >
      ×{group.findings.length}
    </span>
  )}
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/app/\[locale\]/\(app\)/audit/_components/FindingsTableApp.tsx
  git commit -m "fix(audit-ui): ×count Tooltip 'X Vorkommen in der Codebase'"
  ```

---

## Task 5: Finale Verifikation

- [ ] **Step 1: TypeScript**

  ```bash
  pnpm exec tsc --noEmit 2>&1 | grep "error" | head -30
  ```

  Erwartung: 0 Errors.

- [ ] **Step 2: ESLint**

  ```bash
  pnpm exec next lint 2>&1 | grep -E "Error|Warning" | head -20
  ```

  Erwartung: Keine neuen Errors.

- [ ] **Step 3: Dev-Server neu starten und manuell prüfen**

  Dev-Server läuft bereits auf localhost:3000. Browser-Test auf `/audit`:

  **Bug 1 Checks:**
  - [ ] Tab-Badge "Findings" == Sektion-Header "Findings · X offen" (gleiche Zahl)
  - [ ] Tab-Badge "Metriken" == Sektion-Header "Metriken · X offen" (gleiche Zahl)
  - [ ] CC-Findings (ChatMessage, ProjectSidebar) erscheinen NUR in Metriken-Tab, nicht in Findings
  - [ ] "Initial client JS"-Finding erscheint NUR in Metriken-Tab

  **Bug 2 Checks:**
  - [ ] Beim Scrollen bleiben Score-Block UND Tab-Bar sichtbar (beide sticky)
  - [ ] Kein "zweiter Tab-Bar" mitten in den Findings sichtbar

  **Bug 3 Checks:**
  - [ ] Finding-Titel "X hat CC=Y — zu komplex zum Lesen" (Deutsch, Coach-Stimme)
  - [ ] Finding-Titel "Initial JS X KB — Ziel <400 KB." (Deutsch)
  - [ ] Finding "Supabase PITR nur im Pro-Plan aktiv" (Deutsch)

  **Bug 4 Checks:**
  - [ ] Kein "TOP X%" rechts in der Findings-AppSection
  - [ ] ×count hat Tooltip "X Vorkommen in der Codebase" beim Hover

---

## Hand-Over an Timm

```
Bug-Fix-Runde ✅
- Bug 1: Tier-Filter — behoben (codeFindings, tierCounts für Header)
- Bug 2: Sticky-Tabs — behoben (#audit-score-hero sticky top:0 z-index:21)
- Bug 3: Coach-Stimme — 4 Checker-Dateien migriert (CC, Bundle, PITR, Props)
- Bug 4: Streichungen — TOP% entfernt, ×count mit Tooltip

Self-Audit-Ergebnis:
- Keine DB-Migrationen nötig
- Keine neuen Dependencies
- 5 Commits, alle klar abgegrenzt
- Kein Breaking Change
```

---

## Spec-Coverage-Check

| Anforderung | Task |
|-------------|------|
| Findings-Sektion zeigt nur code-tier | Task 1 Step 2 |
| Metriken-Sektion zeigt nur metric-tier | Task 1 Step 3 |
| Tab-Badge == Sektion-Header-Zahl | Task 1 Steps 2+3 |
| QuickWins nur aus code-tier | Task 1 Step 1 |
| Sticky-Tab pinnt unter Score-Block | Task 2 Step 1 |
| Kein zweiter Tab-Bar | Task 2 Steps 1+2 |
| CC-Messages auf Deutsch | Task 3a |
| Initial JS Message auf Deutsch | Task 3b |
| PITR Message auf Deutsch | Task 3c |
| Prop-Forwarding auf Deutsch | Task 3d |
| TOP% entfernt | Task 1 Step 2 |
| ×count erklärt | Task 4b |
| tsc + lint grün | Task 5 |
