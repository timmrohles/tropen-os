# Tab-Sprint: Domain-Architektur Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit-Seite von Tier-Tabs (Code/Metric/Compliance) auf Domain-Tabs (Code-Qualität / Performance / Sicherheit / Barrierefreiheit / DSGVO / KI-Act) umbauen, inklusive Coming-Soon-States, URL-Routing, Compliance-Inputs und Lighthouse-Integration.

**Architecture:** Vier sequenzielle Phasen: (1) `AuditDomain`-Typ + domain-Feld auf allen Rules, (2) sechs Tab-UI mit URL-State + Coming-Soon-States, (3) neue DB-Tabelle `project_compliance_data` + Inline-Formulare in DSGVO/KI-Act-Tabs, (4) Lighthouse über Google PageSpeed Insights API in Performance-Tab. Jede Phase ist ein eigenständiger Commit-Checkpoint. Phase 3 und Phase 4 sind unabhängig genug für separate Plan-Dokumente — sie können parallel entwickelt werden sobald Phase 2 committed ist.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Supabase (Postgres + RLS), React 19, Tailwind 4, Phosphor Icons, next-intl

---

## Vorab-Warnung — Scope

Diese Plan umfasst 14-22 PT Solo-Arbeit. Empfehlung für Ausführung:
- **Phase 1 + 2** zuerst commiten und validieren (Daten + UI-Shell)
- **Phase 3** (Compliance-Inputs) ist eigenständig — kann separat geplant/ausgeführt werden
- **Phase 4** (Lighthouse) ist eigenständig — kann separat geplant/ausgeführt werden
- L2 Vibe-Coder-Validierung NACH Phase 2, bevor Phase 3+4 gebaut werden

---

## Datei-Map

| Datei | Phase | Was ändert sich |
|-------|-------|----------------|
| `src/lib/audit/types.ts` | 1 | `AuditDomain` type + domain-Feld in `AuditRule` |
| `src/lib/audit/rule-registry.ts` | 1 | `domain` auf allen ~183 Rules |
| `src/lib/audit/tier-filter.ts` | 1 | Bleibt — wird umbenannt-Alias für Übergang |
| `src/lib/audit/domain-filter.ts` | 1 | Neu: `getFindingsByDomain`, `getDomainCounts` |
| `docs/audit/domain-mapping.md` | 1 | Neu: Mapping-Tabelle aller Rules |
| `src/components/app-ui/AppTabs.tsx` | 2 | 6 Domain-Tabs, URL-param, coming-soon status |
| `src/app/[locale]/(app)/audit/page.tsx` | 2 | `?tab=` param, domain-gefilterte Sektionen |
| `src/app/[locale]/(app)/audit/_components/DomainEmptyState.tsx` | 2 | Neu: Coming-Soon-Komponente |
| `src/app/[locale]/(app)/audit/_components/PerformanceTab.tsx` | 2 | Neu: Performance-Domain-Inhalt |
| `src/app/[locale]/(app)/audit/_components/SecurityTab.tsx` | 2 | Neu: Security-Domain-Inhalt (+ Coming-Soon) |
| `src/app/[locale]/(app)/audit/_components/AccessibilityTab.tsx` | 2 | Neu: A11y-Domain-Inhalt (+ Coming-Soon) |
| `src/app/[locale]/(app)/audit/_components/DsgvoTab.tsx` | 2+3 | Neu: DSGVO-Domain-Inhalt |
| `src/app/[locale]/(app)/audit/_components/KiActTab.tsx` | 2+3 | Neu: KI-Act-Domain-Inhalt |
| `supabase/migrations/20260429XXXXXX_project_compliance_data.sql` | 3 | Neu: project_compliance_data Tabelle |
| `src/lib/audit/compliance-resolver.ts` | 3 | Neu: dreiebenen Compliance-Status |
| `src/app/api/audit/compliance-data/route.ts` | 3 | Neu: GET/POST compliance-Antworten |
| `src/app/[locale]/(app)/audit/_components/ComplianceQuestion.tsx` | 3 | Neu: Inline-Frage-Komponente |
| `supabase/migrations/20260429YYYYYY_lighthouse_url_per_project.sql` | 4 | projects.lighthouse_url column |
| `src/lib/audit/lighthouse-api.ts` | 4 | Neu: Google PageSpeed API Wrapper |
| `src/app/api/audit/lighthouse/route.ts` | 4 | Neu: Trigger Lighthouse-Run |

---

## Task 0 — ADR-025 schreiben

**Files:**
- Create: `docs/adr/ADR-025-tab-architektur.md`

- [ ] **Step 1: ADR-025 erstellen**

```bash
cat > docs/adr/ADR-025-tab-architektur.md << 'EOF'
# ADR-025 — Domain-basierte Tab-Architektur für Audit-Seite

**Status:** Accepted
**Datum:** 2026-04-29
**Ersetzt:** Tier-basierte Tabs (BP7 Variante C-1, deployed 2026-04-29)
**Quellen:** Strategie-Sparring 2026-04-29, ADR-024 (Marken-Pivot)

## Kontext

Die Tier-basierte Tab-Struktur (Findings/Metriken/Compliance) hat sich nach
Sparring als Engineer-Sicht entlarvt, nicht als User-Sicht. Vibe-Coder denken
in Domänen ("ist meine Seite schnell?", "bin ich DSGVO-konform?"), nicht in
Datenquellen-Tiers. Zudem ist die Aggregator-Strategie (mehrere Drittanbieter
pro Domäne) mit Tier-Schnitt nicht sauber abbildbar.

## Entscheidung

Sechs Domain-Tabs:
1. Code-Qualität — eigene AuditEngine, Code-Findings
2. Performance — Lighthouse, eigene Bundle-Analyse, später WebPageTest
3. Sicherheit — Coming Soon (geplant: Snyk, OWASP ZAP), heute eigene Rules
4. Barrierefreiheit — Coming Soon (geplant: axe-core, WAVE), BFSG-Pflichten
5. DSGVO — eigene Rules + User-Inputs (Variante D)
6. KI-Act — eigene Rules + User-Inputs (Variante D)

Compliance-Tiefe: Stufe 1 (Existenz-Check) jetzt, Stufe 2 (KI-Prüfung) Roadmap.
Compliance-Inputs: Variante D (Stamm-Daten in Projekt-Settings, Detailfragen inline).
Drittanbieter-Strategie: Aggregator-Ziel — beginnt mit Lighthouse (Google PageSpeed API).

## Konsequenzen

Positiv: Tab-Struktur passt zu Vibe-Coder-Workflow; Wachstum via Drittanbieter
ohne Tab-Restrukturierung; Compliance bekommt sichtbaren Raum (drei Tabs statt einem).

Negativ: Sechs Tabs = mehr UI-Komplexität (Mobile anspruchsvoll); zwei Tabs leer
bis Drittanbieter integriert; AuditEngine-Mapping muss erweitert werden.

Risiken: Aggregator-Strategie für Solo-Founder ambitioniert (Mitigation: schrittweise);
Vibe-Coder-Validierung (L2) übersprungen (Mitigation: nach Phase 2 nachholen).

## Zugehörige Pläne

- Tab-Sprint: 4 Phasen, 14-22 PT
- L2 Vibe-Coder-Outreach nach Phase 2 nachholen
EOF
```

- [ ] **Step 2: Architect-Log ergänzen**

In `docs/architect-log.md` eintragen:
```
## 2026-04-29 — ADR-025 Tab-Architektur-Pivot

Ampel: 🟡 Gelb — substanzieller Umbau, durch ADR gut spezifiziert.
Risiken: 183 Rule-Mappings (mechanical aber umfangreich), Phase 3+4 scope.
Freigabe: Tab-Sprint starten. L2 nach Phase 2 nachholen.
```

- [ ] **Step 3: Commit**

```bash
git add docs/adr/ADR-025-tab-architektur.md docs/architect-log.md
git commit -m "docs: ADR-025 domain-basierte Tab-Architektur"
```

---

## PHASE 1 — Domain-Mapping in der AuditEngine

---

### Task 1.1 — AuditDomain Typ + domain-Feld in AuditRule

**Files:**
- Modify: `src/lib/audit/types.ts`

- [ ] **Step 1: AuditDomain Type zu types.ts hinzufügen**

In `src/lib/audit/types.ts`, nach der `AuditTier`-Typdeklaration (Zeile ~41) einfügen:

```typescript
export type AuditDomain =
  | 'code-quality'    // allgemeine Code-Hygiene, Architektur, Tests
  | 'performance'     // Lighthouse, Bundle, Core Web Vitals
  | 'security'        // OWASP, Auth, Injection, Secrets
  | 'accessibility'   // WCAG, ARIA, BFSG
  | 'dsgvo'           // DSGVO-Pflichten, Cookie-Consent, Datenexport
  | 'ki-act'          // EU AI Act, Risiko-Klassifizierung
```

- [ ] **Step 2: domain-Feld zu AuditRule Interface hinzufügen**

In `AuditRule` interface (Zeile ~73), nach `tier?: AuditTier` einfügen:

```typescript
/** Domain-Tab in dem diese Rule erscheint. Added 2026-04-29. */
domain?: AuditDomain
```

Das Feld bleibt optional (nicht required) damit `manual()` calls ohne domain weiterhin kompilieren. Alle automatierten Rules bekommen in Task 1.2 explizit domain gesetzt. Die Filter-Funktionen (Task 1.3) nutzen `?? 'code-quality'` als Default.

- [ ] **Step 3: tsc prüfen**

```bash
cd /c/Users/timmr/tropenOS && pnpm exec tsc --noEmit 2>&1 | grep "error" | head -5
```

Erwartung: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/audit/types.ts
git commit -m "feat(audit): AuditDomain type + optional domain field on AuditRule"
```

---

### Task 1.2 — Domain-Mapping: alle Rules in rule-registry.ts

**Files:**
- Modify: `src/lib/audit/rule-registry.ts`
- Create: `docs/audit/domain-mapping.md`

**Mapping-Logik** (verwende diese Tabelle als Entscheidungsbaum):

| Priorität | Kriterium | Domain |
|-----------|-----------|--------|
| 1 | categoryId === 3 ODER agentSource in ['security', 'security-scan', 'npm-audit'] | `security` |
| 2 | categoryId === 7 ODER agentSource in ['performance', 'lighthouse-best-practices', 'lighthouse-seo'] | `performance` |
| 3 | categoryId === 16 ODER agentSource in ['accessibility', 'bfsg'] | `accessibility` |
| 4 | agentSource in ['dsgvo', 'legal'] ODER cat-4 DSGVO-Rules (cat-4-rule-2,3,4,5,7,8,12,13,14,15,16,17,18,20,21,22) | `dsgvo` |
| 5 | categoryId === 22 ODER cat-4-rule-6 | `ki-act` |
| 6 | Alles andere | `code-quality` |

**Sonderfälle:**
- `cat-3-rule-11` (Patch-Management Compliance) → `security` (Sicherheitsorganisation)
- `cat-5-rule-6` (RLS/Service Key im Frontend) → `security`
- `cat-5-rule-20` (Affiliate-Links) → `dsgvo` (Werbekennzeichnung ist legal)
- `cat-20-rule-4` (Lizenz-Compliance) → `code-quality` (kein eigener Tab dafür)
- `cat-7-rule-6` (Pagination in GET-Endpunkten) → `performance` (Performance-relevant)
- `cat-2-rule-12` (Cognitive Complexity) → `code-quality` (Code-Qualitäts-Metrik)
- `cat-2-rule-11` (Lighthouse Best Practices) → `performance`

- [ ] **Step 1: manual()-Funktion um domain-Parameter erweitern**

In `rule-registry.ts`, die `manual()`-Funktion (Zeile ~120):

```typescript
function manual(
  id: string,
  categoryId: number,
  name: string,
  weight: 1 | 2 | 3,
  fixType: FixType = 'manual',
  auditTier: AuditTier = 'code',
  maturityTier?: RuleTier,
  auditDomain: AuditDomain = 'code-quality'  // ← neu, letzter Parameter
): AuditRule {
  return {
    id, categoryId, name, weight,
    checkMode: 'manual', automatable: false,
    fixType, tier: auditTier,
    domain: auditDomain,              // ← neu
    ...(maturityTier ? { maturityTier } : {}),
  }
}
```

**Wichtig:** `AuditDomain` muss importiert werden. In types.ts ist es bereits definiert, der Import in rule-registry.ts lautet:
```typescript
import type { AuditRule, AuditContext, FixType, RuleTier, AuditTier, AuditDomain } from './types'
```

- [ ] **Step 2: domain-Feld zu allen automatisierten Rules hinzufügen**

Folge dem Mapping aus der Tabelle oben. Systematischer Ansatz: gehe kategorie-weise vor.

**Category 1 (Architektur) → code-quality:**
```typescript
manual('cat-1-rule-1', 1, 'Klare Schichtenarchitektur erkennbar', 3, 'refactoring', 'code', undefined, 'code-quality'),
{ id: 'cat-1-rule-2', ..., tier: 'code', domain: 'code-quality' },
{ id: 'cat-1-rule-3', ..., tier: 'code', domain: 'code-quality' },
// ... alle cat-1 Rules → domain: 'code-quality'
```

**Category 2 (Code-Stil) → code-quality AUSSER:**
- `cat-2-rule-11` (Lighthouse Best Practices) → `domain: 'performance'`
- `cat-2-rule-12` (CC) → `domain: 'code-quality'`
```typescript
{ id: 'cat-2-rule-11', ..., tier: 'metric', domain: 'performance' },
// alle anderen cat-2 → domain: 'code-quality'
```

**Category 3 (Sicherheit) → security:**
```typescript
// ALLE cat-3 rules:
manual('cat-3-rule-1', 3, ..., 'code-quality', 'security'),  // Note: manual() call, override domain
{ id: 'cat-3-rule-2', ..., tier: 'code', domain: 'security' },
{ id: 'cat-3-rule-3', ..., tier: 'code', domain: 'security' },
// ... alle cat-3 → domain: 'security'
```

Aber `cat-3-rule-11` hat auditTier='compliance' — override domain zu 'security':
```typescript
manual('cat-3-rule-11', 3, 'Patch-Management + Disclosure Policy', 2, 'manual', 'compliance', undefined, 'security'),
```

**Category 4 (Compliance) → gemischt:**
```typescript
manual('cat-4-rule-2', 4, 'Consent-System DSGVO-konform', 2, 'code-gen', 'compliance', undefined, 'dsgvo'),
manual('cat-4-rule-3', 4, 'Datenloeschung technisch moeglich', 2, 'code-gen', 'code', undefined, 'dsgvo'),
manual('cat-4-rule-4', 4, 'Rechtsgrundlagen dokumentiert', 2, 'code-gen', 'compliance', undefined, 'dsgvo'),
manual('cat-4-rule-5', 4, 'AVV mit Drittanbietern vorhanden', 2, 'manual', 'compliance', undefined, 'dsgvo'),
{ id: 'cat-4-rule-6', ..., tier: 'compliance', domain: 'ki-act' },    // AI Act
{ id: 'cat-4-rule-7', ..., tier: 'compliance', domain: 'dsgvo' },     // Impressum
{ id: 'cat-4-rule-8', ..., tier: 'compliance', domain: 'dsgvo' },     // VVT
// cat-4-rule-9 bis cat-4-rule-11 (wenn vorhanden) → dsgvo
{ id: 'cat-4-rule-12', ..., tier: 'compliance', domain: 'dsgvo' },    // Cookie Consent
{ id: 'cat-4-rule-13', ..., tier: 'compliance', domain: 'dsgvo' },    // Tracking vor Consent
{ id: 'cat-4-rule-14', ..., tier: 'code', domain: 'dsgvo' },          // Passwort-Hashing
{ id: 'cat-4-rule-15', ..., tier: 'code', domain: 'dsgvo' },          // HSTS
{ id: 'cat-4-rule-16', ..., tier: 'code', domain: 'dsgvo' },          // CSP
{ id: 'cat-4-rule-17', ..., tier: 'code', domain: 'dsgvo' },          // Datenexport
{ id: 'cat-4-rule-18', ..., tier: 'code', domain: 'dsgvo' },          // Account-Löschung
// cat-4-rule-19 (wenn vorhanden) → prüfen, wahrscheinlich dsgvo
{ id: 'cat-4-rule-20', ..., tier: 'compliance', domain: 'dsgvo' },    // AGB
{ id: 'cat-4-rule-21', ..., tier: 'compliance', domain: 'dsgvo' },    // Widerrufsbelehrung
{ id: 'cat-4-rule-22', ..., tier: 'compliance', domain: 'dsgvo' },    // Checkout-Button
```

**Category 5 (Daten/DB) → code-quality AUSSER:**
- `cat-5-rule-6` (RLS/Service Key) → `security`
- `cat-5-rule-20` (Affiliate) → `dsgvo`
```typescript
{ id: 'cat-5-rule-6', ..., tier: 'code', domain: 'security' },
{ id: 'cat-5-rule-20', ..., tier: 'compliance', domain: 'dsgvo' },
// alle anderen cat-5 → domain: 'code-quality'
```

**Category 6 (API) → code-quality:**
```typescript
// alle cat-6 → domain: 'code-quality'
```

**Category 7 (Performance) → performance:**
```typescript
// ALLE cat-7 → domain: 'performance'
{ id: 'cat-7-rule-1', ..., tier: 'metric', domain: 'performance' },
{ id: 'cat-7-rule-2', ..., tier: 'metric', domain: 'performance' },
{ id: 'cat-7-rule-6', ..., tier: 'code', domain: 'performance' },  // Pagination
```

**Category 8–15 (Betrieb, State, Tests, CI, Monitoring, Backup, Doku, Design) → code-quality:**
```typescript
// alle cat-8 bis cat-15 → domain: 'code-quality'
```

**Category 16 (Barrierefreiheit) → accessibility:**
```typescript
// ALLE cat-16 → domain: 'accessibility'
{ id: 'cat-16-rule-1', ..., tier: 'metric', domain: 'accessibility' },
{ id: 'cat-16-rule-4', ..., tier: 'code', domain: 'accessibility' },
{ id: 'cat-16-rule-5', ..., tier: 'compliance', domain: 'accessibility' },
{ id: 'cat-16-rule-6', ..., tier: 'compliance', domain: 'accessibility' },
// weitere cat-16 → accessibility
```

**Category 17–21 → code-quality (außer cat-20-rule-4):**
```typescript
manual('cat-20-rule-4', 20, 'Lizenz-Compliance geprueft', 1, 'manual', 'compliance', undefined, 'code-quality'),
// alle anderen cat-17, 18, 19, 20, 21 → code-quality
```

**Category 22 (KI-Act) → ki-act:**
```typescript
// ALLE cat-22 → domain: 'ki-act'
{ id: 'cat-22-rule-9', ..., tier: 'compliance', domain: 'ki-act' },
{ id: 'cat-22-rule-10', ..., tier: 'compliance', domain: 'ki-act' },
// ... alle anderen cat-22 → ki-act
```

**Category 23–26 → code-quality:**
```typescript
// alle cat-23, 24, 25, 26 → code-quality
// AUSNAHME: cat-24 (security-scan) → security
```

Wait — cat-24 hat `agentSource: 'security-scan'`, das ist Sicherheit:
```typescript
// cat-24 rules → domain: 'security'
```

- [ ] **Step 3: tsc prüfen**

```bash
pnpm exec tsc --noEmit 2>&1 | grep "error" | head -10
```

Erwartung: 0 errors.

- [ ] **Step 4: domain-mapping.md erstellen**

Erstelle `docs/audit/domain-mapping.md` als Doku-Stand der Wahrheit. Die Datei listet alle Category-Gruppen mit ihrer Domain-Zuordnung (kein Fulllist aller 183 Rules, aber klar genug für Debugging):

```markdown
# Domain-Mapping der Audit-Rules

Datum: 2026-04-29 (Tab-Sprint)

## Mapping-Übersicht

| Category | Name | Domain | Ausnahmen |
|----------|------|--------|-----------|
| cat-1 | Architektur | code-quality | — |
| cat-2 | Code-Stil | code-quality | cat-2-rule-11 → performance |
| cat-3 | Sicherheit | security | — |
| cat-4 | Compliance | gemischt | DSGVO-Rules → dsgvo, cat-4-rule-6 → ki-act |
| cat-5 | Daten/DB | code-quality | cat-5-rule-6 → security, cat-5-rule-20 → dsgvo |
| cat-6 | API | code-quality | — |
| cat-7 | Performance | performance | — |
| cat-8 | Betrieb | code-quality | — |
| cat-9 | State | code-quality | — |
| cat-10 | Tests | code-quality | — |
| cat-11 | CI/CD | code-quality | — |
| cat-12 | Monitoring | code-quality | — |
| cat-13 | Backup/DR | code-quality | — |
| cat-14 | Dokumentation | code-quality | — |
| cat-15 | Design-System | code-quality | — |
| cat-16 | Barrierefreiheit | accessibility | — |
| cat-17 | i18n | code-quality | — |
| cat-18 | Spezifikation | code-quality | — |
| cat-19 | Versionierung | code-quality | — |
| cat-20 | Lizenz | code-quality | cat-20-rule-4 (Compliance tier) bleibt code-quality |
| cat-21 | Compliance (Fernabsatz) | dsgvo | — |
| cat-22 | KI-Act | ki-act | — |
| cat-23 | Deployment | code-quality | — |
| cat-24 | Security-Scan | security | — |
| cat-25 | Naming | code-quality | — |
| cat-26 | SLOP | code-quality | — |

## Grenzfälle

- cat-3-rule-11 (Patch-Management, tier=compliance) → security: Patch-Mgmt ist Sicherheitsorganisation
- cat-5-rule-6 (RLS/Service Key) → security: Datenbankzugriffssicherheit
- cat-7-rule-6 (Pagination) → performance: Performance-relevant
- cat-2-rule-11 (Lighthouse Best Practices) → performance: Lighthouse-Quelle
- cat-4 DSGVO vs. KI-Act: cat-4-rule-6 explizit ki-act, alle anderen dsgvo
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/audit/rule-registry.ts docs/audit/domain-mapping.md
git commit -m "feat(audit): domain field on all 183 rules — mapping per category"
```

---

### Task 1.3 — domain-filter.ts Helper

**Files:**
- Create: `src/lib/audit/domain-filter.ts`

- [ ] **Step 1: domain-filter.ts erstellen**

```typescript
// src/lib/audit/domain-filter.ts
import type { AuditDomain } from './types'
import { AUDIT_RULES } from './rule-registry'

export const ALL_DOMAINS: AuditDomain[] = [
  'code-quality',
  'performance',
  'security',
  'accessibility',
  'dsgvo',
  'ki-act',
]

export function getDomainForRule(ruleId: string): AuditDomain {
  const rule = AUDIT_RULES.find(r => r.id === ruleId)
  return rule?.domain ?? 'code-quality'
}

export function getFindingsByDomain(
  findings: Array<Record<string, unknown>>,
  domain: AuditDomain
): Array<Record<string, unknown>> {
  return findings.filter(f => getDomainForRule(f.rule_id as string) === domain)
}

export function getDomainCounts(
  findings: Array<Record<string, unknown>>
): Record<AuditDomain, number> {
  const open = findings.filter(f => f.status === 'open')
  const counts: Record<AuditDomain, number> = {
    'code-quality': 0,
    'performance': 0,
    'security': 0,
    'accessibility': 0,
    'dsgvo': 0,
    'ki-act': 0,
  }
  for (const f of open) {
    const domain = getDomainForRule(f.rule_id as string)
    counts[domain]++
  }
  return counts
}
```

- [ ] **Step 2: tsc prüfen**

```bash
pnpm exec tsc --noEmit 2>&1 | grep "error" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/audit/domain-filter.ts
git commit -m "feat(audit): domain-filter helper — getFindingsByDomain + getDomainCounts"
```

---

### Task 1.4 — DB-Sicherheit-Rules (10 neue Rules für Security-Tab)

**Anlass:** ADR-025-Update 2026-04-29. Sicherheits-Tab bekommt sofort substantielle Rules.
**Ergebnis:** Security-Tab ist ab Tag 1 gefüllt — kein `comingSoon: true` mehr für `security`.

**Files:**
- Create: `src/lib/audit/checkers/db-security-checker.ts`
- Modify: `src/lib/audit/rule-registry.ts` (10 neue Rules hinzufügen)

- [ ] **Step 1: db-security-checker.ts erstellen**

```typescript
// src/lib/audit/checkers/db-security-checker.ts
// Supabase-Datenbank-Sicherheits-Checks.
// Detection: Migration-Analyse + Code-Pfad-Analyse.

import type { AuditContext, RuleResult, Finding } from '../types'
import { pass, fail } from '../index'

function readContent(ctx: AuditContext, path: string): string | null {
  if (ctx.fileContents?.has(path)) return ctx.fileContents.get(path)!
  try {
    return require('fs').readFileSync(require('path').join(ctx.projectRoot ?? process.cwd(), path), 'utf-8')
  } catch { return null }
}

function getAllMigrationContent(ctx: AuditContext): string {
  const migrationsDir = 'supabase/migrations'
  try {
    const fs = require('fs')
    const path = require('path')
    const dir = path.join(ctx.projectRoot ?? process.cwd(), migrationsDir)
    if (!fs.existsSync(dir)) return ''
    return fs.readdirSync(dir)
      .filter((f: string) => f.endsWith('.sql'))
      .map((f: string) => fs.readFileSync(path.join(dir, f), 'utf-8'))
      .join('\n')
  } catch { return '' }
}

function getCodeFiles(ctx: AuditContext): string[] {
  const files: string[] = []
  if (ctx.fileContents) {
    for (const [path] of ctx.fileContents) {
      if (/\.(ts|tsx|js)$/.test(path) && !path.includes('node_modules')) {
        files.push(path)
      }
    }
  }
  return files
}

// sec-db-01: RLS auf User-Daten-Tabellen
export async function checkRlsOnUserTables(ctx: AuditContext): Promise<RuleResult> {
  const migrations = getAllMigrationContent(ctx)
  if (!migrations) return pass('sec-db-01', 3, 'Keine Supabase-Migrationen gefunden — manuell prüfen')

  const createTablePattern = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:\w+\.)?(\w+)/gi
  const rlsPattern = /ALTER\s+TABLE\s+(?:\w+\.)?(\w+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi

  const createdTables = new Set<string>()
  const rlsTables = new Set<string>()
  let m: RegExpExecArray | null

  while ((m = createTablePattern.exec(migrations)) !== null) {
    const name = m[1].toLowerCase()
    if (!['schema_migrations', 'migrations', 'spatial_ref_sys'].includes(name)) {
      createdTables.add(name)
    }
  }
  while ((m = rlsPattern.exec(migrations)) !== null) {
    rlsTables.add(m[1].toLowerCase())
  }

  const tablesWithoutRls = [...createdTables].filter(t => !rlsTables.has(t))

  if (tablesWithoutRls.length === 0) return pass('sec-db-01', 5, 'Alle Tabellen haben RLS aktiviert')

  const violations: Finding[] = tablesWithoutRls.slice(0, 5).map(t => ({
    severity: 'critical' as const,
    message: `Tabelle "${t}" hat keine RLS aktiviert — alle User können alle Daten sehen`,
    filePath: 'supabase/migrations/',
    suggestion: `Cursor-Prompt: 'Erstelle Migration ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY und füge SELECT-Policy für auth.uid() = user_id hinzu'`,
  }))

  const score = tablesWithoutRls.length >= 5 ? 1 : tablesWithoutRls.length >= 3 ? 2 : 3
  return fail('sec-db-01', score, `${tablesWithoutRls.length} Tabelle(n) ohne RLS`, violations)
}

// sec-db-02: Service-Role-Key nicht im Frontend-Code
export async function checkNoServiceRoleInFrontend(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []
  const clientPaths = /src\/(components|app|pages|hooks|context)\//

  for (const filePath of getCodeFiles(ctx)) {
    if (!clientPaths.test(filePath)) continue
    const content = readContent(ctx, filePath)
    if (!content) continue
    if (/supabaseAdmin|SUPABASE_SERVICE_ROLE|service_role/i.test(content)) {
      violations.push({
        severity: 'critical',
        message: `Service-Role-Key im Client-Pfad "${filePath}" — kann von jedem User missbraucht werden`,
        filePath,
        suggestion: `Cursor-Prompt: 'Verschiebe supabaseAdmin-Aufrufe in ${filePath.split('/').pop()} in eine API-Route oder Server-Action'`,
      })
    }
  }

  if (violations.length === 0) return pass('sec-db-02', 5, 'Service-Role-Key nur server-seitig verwendet')
  return fail('sec-db-02', 1, `${violations.length} Client-Dateien mit Service-Role-Key`, violations)
}

// sec-db-03: Anon-Key kein Schreib-Wildcard
export async function checkAnonKeyNoWriteWildcard(ctx: AuditContext): Promise<RuleResult> {
  const migrations = getAllMigrationContent(ctx)
  if (!migrations) return pass('sec-db-03', 3, 'Keine Migrationen — manuell prüfen')

  // Suche nach Policies die anon Schreibrecht auf sensible Tabellen geben
  const dangerousPattern = /CREATE\s+POLICY[^;]*FOR\s+(?:INSERT|UPDATE|DELETE)[^;]*TO\s+anon[^;]*USING\s*\(\s*true\s*\)/gi
  const violations: Finding[] = []
  let m: RegExpExecArray | null
  while ((m = dangerousPattern.exec(migrations)) !== null) {
    violations.push({
      severity: 'high',
      message: 'Anon-User hat unkontrollierten Schreibzugriff — jeder ohne Login kann Daten ändern',
      filePath: 'supabase/migrations/',
      suggestion: "Cursor-Prompt: 'Ersetze USING (true) bei anon-Schreib-Policy durch eine sinnvolle Einschränkung oder entferne die Policy'",
    })
  }

  if (violations.length === 0) return pass('sec-db-03', 5, 'Keine wilden Anon-Schreib-Policies gefunden')
  return fail('sec-db-03', 2, `${violations.length} unsichere Anon-Schreib-Policy(s)`, violations)
}

// sec-db-07: Storage-Buckets mit Policies
export async function checkStorageBucketPolicies(ctx: AuditContext): Promise<RuleResult> {
  const migrations = getAllMigrationContent(ctx)
  if (!migrations) return pass('sec-db-07', 3, 'Keine Migrationen — manuell prüfen')

  const bucketsCreated = (migrations.match(/INSERT\s+INTO\s+storage\.buckets/gi) ?? []).length
  const bucketPolicies = (migrations.match(/CREATE\s+POLICY[^;]*storage\.objects/gi) ?? []).length

  if (bucketsCreated === 0) return pass('sec-db-07', 5, 'Keine Storage-Buckets verwendet')
  if (bucketPolicies === 0) {
    return fail('sec-db-07', 2, 'Storage-Buckets ohne Zugriffs-Policies', [{
      severity: 'high',
      message: `${bucketsCreated} Storage-Bucket(s) gefunden, aber keine Policies — Dateien sind öffentlich lesbar`,
      filePath: 'supabase/migrations/',
      suggestion: "Cursor-Prompt: 'Erstelle RLS-Policies für storage.objects: SELECT für eigene Dateien, INSERT mit auth.uid()-Check'",
    }])
  }

  return pass('sec-db-07', 5, `Storage-Buckets mit ${bucketPolicies} Policies konfiguriert`)
}

// sec-db-02-edge: Edge Functions ohne Service-Role im User-Context
export async function checkEdgeFunctionsNoServiceRoleInUserContext(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []
  const edgeFunctionsDir = 'supabase/functions'

  try {
    const fs = require('fs')
    const path = require('path')
    const dir = path.join(ctx.projectRoot ?? process.cwd(), edgeFunctionsDir)
    if (!fs.existsSync(dir)) return pass('sec-db-08', 5, 'Keine Edge Functions gefunden')

    const files = fs.readdirSync(dir, { recursive: true })
      .filter((f: string) => f.endsWith('.ts'))

    for (const file of files) {
      const filePath = path.join(dir, file)
      const content = fs.readFileSync(filePath, 'utf-8')

      // Service-Role im User-Request-Context (nach req.json() oder Request handling)
      if (/createClient.*SERVICE_ROLE|supabaseAdmin.*req\.|req.*supabaseAdmin/i.test(content)) {
        violations.push({
          severity: 'critical',
          message: `Edge Function "${file}" nutzt Service-Role-Key im User-Request-Context`,
          filePath: `supabase/functions/${file}`,
          suggestion: `Cursor-Prompt: 'Ersetze Service-Role-Client durch user-scoped Client mit dem JWT aus dem Request-Header'`,
        })
      }
    }
  } catch { return pass('sec-db-08', 3, 'Edge Functions nicht lesbar — manuell prüfen') }

  if (violations.length === 0) return pass('sec-db-08', 5, 'Edge Functions verwenden keinen Service-Role-Key im User-Context')
  return fail('sec-db-08', 1, `${violations.length} Edge Function(s) mit Service-Role im User-Context`, violations)
}

// sec-db-10: Backup-Strategie dokumentiert
export async function checkBackupStrategyDocumented(ctx: AuditContext): Promise<RuleResult> {
  const readmeContent = readContent(ctx, 'README.md') ?? ''
  const hasBackupMention = /PITR|backup|Backup|point.in.time/i.test(readmeContent)

  if (hasBackupMention) return pass('sec-db-10', 5, 'Backup-Strategie in README dokumentiert')

  return fail('sec-db-10', 3, 'Backup-Strategie nicht dokumentiert', [{
    severity: 'medium',
    message: 'PITR-Status und Backup-Strategie fehlen in der Dokumentation — DSGVO Art. 32 Pflicht',
    filePath: 'README.md',
    suggestion: "Cursor-Prompt: 'Füge Backup-Sektion in README.md ein: Supabase PITR [enabled/disabled], Backup-Frequenz, Restore-Test-Datum'",
  }])
}
```

- [ ] **Step 2: 10 Rules in rule-registry.ts registrieren**

In `src/lib/audit/rule-registry.ts`, nach dem letzten Import-Block, die neuen Imports hinzufügen:

```typescript
import {
  checkRlsOnUserTables, checkNoServiceRoleInFrontend, checkAnonKeyNoWriteWildcard,
  checkStorageBucketPolicies, checkEdgeFunctionsNoServiceRoleInUserContext,
  checkBackupStrategyDocumented,
} from './checkers/db-security-checker'
```

Und am Ende von `AUDIT_RULES` (vor der abschließenden `]`):

```typescript
  // ── DB-Sicherheit (sec-db) — Tab-Sprint Phase 1 Erweiterung 2026-04-29 ─────
  { id: 'sec-db-01', categoryId: 3, name: 'RLS auf User-Daten-Tabellen aktiviert', weight: 3,
    checkMode: 'cli', automatable: true, check: checkRlsOnUserTables,
    agentSource: 'security', enforcement: 'blocked', fixType: 'code-gen', tier: 'code', domain: 'security' },
  { id: 'sec-db-02', categoryId: 3, name: 'Service-Role-Key nicht im Frontend-Code', weight: 3,
    checkMode: 'repo-map', automatable: true, check: checkNoServiceRoleInFrontend,
    agentSource: 'security', enforcement: 'blocked', fixType: 'code-fix', tier: 'code', domain: 'security' },
  { id: 'sec-db-03', categoryId: 3, name: 'Anon-Key ohne Wildcard-Schreibzugriff', weight: 2,
    checkMode: 'cli', automatable: true, check: checkAnonKeyNoWriteWildcard,
    agentSource: 'security', enforcement: 'reviewed', fixType: 'code-fix', tier: 'code', domain: 'security' },
  manual('sec-db-04', 3, 'Public-Schema: kein PII ohne RLS', 3, 'code-gen', 'code', undefined, 'security'),
  manual('sec-db-05', 3, 'RLS-Policies aktiviert (nicht nur definiert)', 2, 'code-fix', 'code', undefined, 'security'),
  manual('sec-db-06', 3, 'Auth-Tabellen strenger als Daten-Tabellen', 2, 'code-fix', 'code', undefined, 'security'),
  { id: 'sec-db-07', categoryId: 3, name: 'Storage-Buckets haben Zugriffs-Policies', weight: 2,
    checkMode: 'cli', automatable: true, check: checkStorageBucketPolicies,
    agentSource: 'security', enforcement: 'reviewed', fixType: 'code-gen', tier: 'code', domain: 'security' },
  { id: 'sec-db-08', categoryId: 3, name: 'Edge Functions: kein Service-Role im User-Context', weight: 3,
    checkMode: 'repo-map', automatable: true, check: checkEdgeFunctionsNoServiceRoleInUserContext,
    agentSource: 'security', enforcement: 'blocked', fixType: 'code-fix', tier: 'code', domain: 'security' },
  manual('sec-db-09', 3, 'Realtime-Subscriptions serverseitig gefiltert', 2, 'code-fix', 'code', undefined, 'security'),
  { id: 'sec-db-10', categoryId: 3, name: 'Backup-Strategie dokumentiert (PITR-Status)', weight: 2,
    checkMode: 'documentation', automatable: true, check: checkBackupStrategyDocumented,
    agentSource: 'security', enforcement: 'reviewed', fixType: 'code-gen', tier: 'code', domain: 'security' },
```

- [ ] **Step 3: Security-Tab in Audit-Page auf `comingSoon: false` ändern**

In `src/app/[locale]/(app)/audit/page.tsx`, die AppTabs-Konfiguration anpassen:

```tsx
{ id: 'security', label: 'Sicherheit', count: domainCounts['security'],
  sectionId: 'domain-content', comingSoon: false },  // ← nicht mehr Coming Soon
```

Und in `DomainEmptyState.tsx` den 'security' Copy aktualisieren (falls keine Findings vorliegen):

```typescript
'security': {
  headline: 'Sicherheit — Supabase-Checks',
  description: 'Alle Supabase-Sicherheits-Checks bestanden. Externe Scanner (Snyk, OWASP ZAP) folgen.',
  tools: ['Snyk (Roadmap)', 'OWASP ZAP (Roadmap)', 'gitleaks (aktiv)'],
},
```

- [ ] **Step 4: tsc + commit**

```bash
pnpm exec tsc --noEmit 2>&1 | grep "error" | head -10
git add src/lib/audit/checkers/db-security-checker.ts src/lib/audit/rule-registry.ts
git add src/app/\[locale\]/\(app\)/audit/page.tsx src/app/\[locale\]/\(app\)/audit/_components/DomainEmptyState.tsx
git commit -m "feat(audit): 10 DB-security rules (sec-db-01..10) — Security tab substantiell ab Tag 1"
```

---

### Task 1.6 — Phase 1 Quality-Gate

- [ ] **Step 1: TypeScript komplett grün**

```bash
pnpm exec tsc --noEmit 2>&1 | grep -c "error"
```

Erwartung: `0`

- [ ] **Step 2: Lint grün**

```bash
pnpm exec next lint 2>&1 | grep -c "Error"
```

Erwartung: `0`

- [ ] **Step 3: Alle Domains abgedeckt prüfen**

```bash
node -e "
const { AUDIT_RULES } = require('./src/lib/audit/rule-registry');
const noDomain = AUDIT_RULES.filter(r => !r.domain);
console.log('Rules ohne domain:', noDomain.length);
noDomain.slice(0,5).forEach(r => console.log(r.id, r.checkMode));
"
```

Erwartung: `0` (alle haben domain)

---

## PHASE 2 — Tab-Struktur umbauen

---

### Task 2.1 — Domain-Tab-Konfiguration + AppTabs erweitern

**Files:**
- Modify: `src/components/app-ui/AppTabs.tsx`

AppTabs.tsx muss jetzt zwei Modi unterstützen: das alte Verhalten (dynamische Tab-Liste per Props) und eventuell domain-spezifische Logik. Die einfachste Lösung: AppTabs bleibt generisch (Props-getrieben), die Domain-spezifische Konfiguration liegt in der Audit-Page.

- [ ] **Step 1: AppTabs um `comingSoon` Status erweitern**

In `src/components/app-ui/AppTabs.tsx`, die `AppTabDef` interface erweitern:

```typescript
export interface AppTabDef {
  id: string
  label: string
  count: number
  hasDanger?: boolean
  sectionId?: string
  comingSoon?: boolean   // ← neu: Tab zeigt "Bald" statt count, ist disabled
}
```

In der Tab-Render-Logik, coming-soon Tabs deaktiviert darstellen:

```tsx
{tabs.map(tab => (
  <a
    key={tab.id}
    role="tab"
    aria-selected={activeTab === tab.id}
    href={tab.comingSoon ? undefined : `#${tab.sectionId ?? tab.id}`}
    aria-disabled={tab.comingSoon}
    className={`app-tab${activeTab === tab.id ? ' app-tab--active' : ''}${tab.comingSoon ? ' app-tab--coming-soon' : ''}`}
    onClick={tab.comingSoon ? undefined : (e => {
      e.preventDefault()
      setActiveTab(tab.id)
      document.getElementById(tab.sectionId ?? tab.id)?.scrollIntoView({ behavior: 'smooth' })
    })}
  >
    {tab.label}
    {tab.comingSoon
      ? <span className="app-tab__badge app-tab__badge--soon">Bald</span>
      : <span className="app-tab__count">{tab.count}</span>
    }
    {tab.hasDanger && <span className="app-tab__danger" aria-label="Offene Pflichten" />}
  </a>
))}
```

- [ ] **Step 2: CSS für coming-soon Tabs in globals.css ergänzen**

In `src/app/globals.css`, nach `.app-tab--active`:

```css
.app-tab--coming-soon {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
.app-tab__badge {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 8px;
  background: var(--accent-light);
  color: var(--accent);
}
.app-tab__badge--soon {
  background: var(--surface-warm);
  color: var(--text-tertiary);
  border: 1px solid var(--border);
}
```

- [ ] **Step 3: tsc + commit**

```bash
pnpm exec tsc --noEmit && git add src/components/app-ui/AppTabs.tsx src/app/globals.css
git commit -m "feat(audit): AppTabs comingSoon status + badge styles"
```

---

### Task 2.2 — DomainEmptyState Komponente

**Files:**
- Create: `src/app/[locale]/(app)/audit/_components/DomainEmptyState.tsx`

- [ ] **Step 1: DomainEmptyState erstellen**

```tsx
// src/app/[locale]/(app)/audit/_components/DomainEmptyState.tsx
'use client'
import { AppSection } from '@/components/app-ui/AppSection'
import type { AuditDomain } from '@/lib/audit/types'

const DOMAIN_COPY: Record<AuditDomain, { headline: string; description: string; tools: string[] }> = {
  'code-quality': {
    headline: 'Code-Qualität',
    description: 'Keine Findings in dieser Domain.',
    tools: [],
  },
  'performance': {
    headline: 'Performance wird bald integriert',
    description: 'Lighthouse-Integration läuft. URL in den Projekt-Einstellungen hinterlegen, dann startet der erste Scan.',
    tools: ['Google PageSpeed Insights', 'Lighthouse', 'WebPageTest (Roadmap)'],
  },
  'security': {
    headline: 'Sicherheits-Scanner kommen',
    description: 'Deine eigenen Security-Rules laufen bereits — externe Scanner sind in Arbeit.',
    tools: ['Snyk (Roadmap)', 'OWASP ZAP (Roadmap)', 'gitleaks (aktiv)'],
  },
  'accessibility': {
    headline: 'Barrierefreiheit in Vorbereitung',
    description: 'WCAG- und BFSG-Prüfungen kommen als integrierte axe-core-Scans.',
    tools: ['axe-core (Roadmap)', 'WAVE (Roadmap)', 'Lighthouse A11y (aktiv)'],
  },
  'dsgvo': {
    headline: 'DSGVO — Offene Pflichten',
    description: 'Noch keine DSGVO-Findings. Entweder alles grün oder Audit noch nicht gelaufen.',
    tools: [],
  },
  'ki-act': {
    headline: 'EU AI Act — Offene Pflichten',
    description: 'Noch keine KI-Act-Findings. Entweder alles grün oder Audit noch nicht gelaufen.',
    tools: [],
  },
}

interface Props {
  domain: AuditDomain
  hasRun: boolean
}

export function DomainEmptyState({ domain, hasRun }: Props) {
  const copy = DOMAIN_COPY[domain]
  return (
    <AppSection header={copy.headline}>
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: copy.tools.length > 0 ? 16 : 0 }}>
          {hasRun ? copy.description : 'Audit noch nicht gestartet — klick "Neuer Scan" oben.'}
        </p>
        {copy.tools.length > 0 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {copy.tools.map(tool => (
              <span key={tool} style={{
                padding: '3px 10px', borderRadius: 12,
                fontSize: 11, fontFamily: 'var(--font-mono)',
                background: 'var(--surface-warm)', color: 'var(--text-tertiary)',
                border: '1px solid var(--border)',
              }}>
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </AppSection>
  )
}
```

- [ ] **Step 2: tsc + commit**

```bash
pnpm exec tsc --noEmit && git add src/app/\[locale\]/\(app\)/audit/_components/DomainEmptyState.tsx
git commit -m "feat(audit): DomainEmptyState mit Coach-Stimme pro Domain"
```

---

### Task 2.3 — Audit page.tsx auf Domain-Tabs umbauen

**Files:**
- Modify: `src/app/[locale]/(app)/audit/page.tsx`

Dies ist der größte Einzelschritt. Die Seite wechselt von Tier-Tabs (code/metric/compliance) auf Domain-Tabs und bekommt URL-State (`?tab=code-quality`).

- [ ] **Step 1: Imports aktualisieren**

```typescript
// ENTFERNEN:
import { getTierCounts, getFindingsByTier } from '@/lib/audit/tier-filter'
import { complianceFrameworks, getFrameworkScore } from '@/lib/audit/compliance-mapping'
import ComplianceStatus from './_components/ComplianceStatus'

// HINZUFÜGEN:
import { getDomainCounts, getFindingsByDomain, ALL_DOMAINS } from '@/lib/audit/domain-filter'
import type { AuditDomain } from '@/lib/audit/types'
import { DomainEmptyState } from './_components/DomainEmptyState'
```

- [ ] **Step 2: searchParams um `tab` erweitern**

```typescript
interface PageProps {
  searchParams: Promise<{
    runId?: string
    status?: string
    severity?: string
    agent?: string
    project?: string
    tab?: string           // ← neu
  }>
}

// In der Component:
const { runId: requestedRunId, status: statusParam, severity, agent, project: projectParam, tab: tabParam } = await searchParams
const activeTab: AuditDomain = (ALL_DOMAINS as string[]).includes(tabParam ?? '')
  ? (tabParam as AuditDomain)
  : 'code-quality'
```

- [ ] **Step 3: Domain-Daten im Server berechnen**

Im IIFE oder direkt in der Component (nach `allFindings` berechnet):

```typescript
// ERSETZEN:
const codeFindings = getFindingsByDomain(allFindings, 'code-quality')   // für quickWins
// (quickWins bleiben nur für code-quality)
const { quickWins } = computeQuickWins(codeFindings as unknown as Parameters<typeof computeQuickWins>[0])

// NEU:
const domainCounts = getDomainCounts(allFindings)
const activeFindings = getFindingsByDomain(allFindings, activeTab)
```

- [ ] **Step 4: AppTabs-Konfiguration**

In dem Bereich wo AppTabs gerendert wird (vorher `tierCounts`-basiert), ersetzen mit:

```tsx
<AppTabs tabs={[
  { id: 'code-quality',  label: 'Code-Qualität',   count: domainCounts['code-quality'],  sectionId: 'domain-content' },
  { id: 'performance',   label: 'Performance',      count: domainCounts['performance'],   sectionId: 'domain-content', comingSoon: false },
  { id: 'security',      label: 'Sicherheit',       count: domainCounts['security'],      sectionId: 'domain-content', comingSoon: true },
  { id: 'accessibility', label: 'Barrierefrei.',    count: domainCounts['accessibility'], sectionId: 'domain-content', comingSoon: true },
  { id: 'dsgvo',         label: 'DSGVO',            count: domainCounts['dsgvo'],         sectionId: 'domain-content', hasDanger: domainCounts['dsgvo'] > 0 },
  { id: 'ki-act',        label: 'KI-Act',           count: domainCounts['ki-act'],        sectionId: 'domain-content', hasDanger: domainCounts['ki-act'] > 0 },
]} />
```

**Hinweis:** AppTabs ist ein Client-Component und nutzt `useEffect` für IntersectionObserver. Das tab-switching auf URL-Ebene passiert durch Navigation (Link-Klick oder router.push). AppTabs IntersectionObserver funktioniert nicht mehr bei nur einer Section — wir brauchen eine Client-Wrapper-Komponente für den aktiven Tab.

Alternativ einfachere Lösung: AppTabs ohne IntersectionObserver im Domain-Modus. Aktiver Tab kommt vom URL-Param (Server-Side). Tab-Klick navigiert zu `?tab=<domain>`. Das ist einfacher und zuverlässiger als Scroll-Tracking.

- [ ] **Step 5: Tab-Navigation als Link (kein Scroll)**

`AppTabs.tsx` für Domain-Mode: Links zu `?tab=<id>` statt Scroll. Da AppTabs generisch ist, wird die href-Prop der Domain-Tab-Links aus der Seite gesteuert:

```typescript
// In AppTabDef, neues optionales Feld:
href?: string   // wenn gesetzt: direkter Link statt Scroll

// In AppTabs render:
<a
  key={tab.id}
  href={tab.comingSoon ? undefined : (tab.href ?? `#${tab.sectionId ?? tab.id}`)}
  ...
```

In der Audit-Page die Tab-Konfiguration mit hrefs:

```tsx
<AppTabs tabs={[
  { id: 'code-quality', label: 'Code-Qualität', count: domainCounts['code-quality'],
    href: `?tab=code-quality${selectedRunId ? `&runId=${selectedRunId}` : ''}${activeScanProjectId ? `&project=${activeScanProjectId}` : ''}` },
  { id: 'performance',  label: 'Performance',   count: domainCounts['performance'],
    href: `?tab=performance${selectedRunId ? `&runId=${selectedRunId}` : ''}${activeScanProjectId ? `&project=${activeScanProjectId}` : ''}` },
  // ... alle 6 Tabs mit korrektem href
]} />
```

- [ ] **Step 6: Domain-Content-Bereich rendern**

Statt drei `<section id="findings">`, `<section id="metrics">`, `<section id="compliance">`, gibt es jetzt einen `<section id="domain-content">`:

```tsx
<section id="domain-content" className="audit-tier-section">
  {/* Quick Wins nur in code-quality */}
  {activeTab === 'code-quality' && quickWins.length > 0 && (
    <AppSection header={`⚡ Quick Wins · ${quickWins.length} schnelle Fixes`} accent>
      <FindingsTableApp
        findings={quickWins as unknown as Parameters<typeof FindingsTableApp>[0]['findings']}
        statusFilter="open"
      />
    </AppSection>
  )}

  {/* Aktive Domain Findings */}
  {activeFindings.length > 0 ? (
    <AppSection header={`${domainLabel(activeTab)} · ${domainCounts[activeTab]} offen`}>
      <FindingsTableApp
        findings={activeFindings as unknown as Parameters<typeof FindingsTableApp>[0]['findings']}
        statusFilter={status}
      />
    </AppSection>
  ) : (
    <DomainEmptyState domain={activeTab} hasRun={hasRuns} />
  )}
</section>
```

`domainLabel`-Helper:

```typescript
function domainLabel(domain: AuditDomain): string {
  const labels: Record<AuditDomain, string> = {
    'code-quality': 'Code-Qualität',
    'performance': 'Performance',
    'security': 'Sicherheit',
    'accessibility': 'Barrierefreiheit',
    'dsgvo': 'DSGVO',
    'ki-act': 'KI-Act',
  }
  return labels[domain]
}
```

- [ ] **Step 7: Alte drei-Sektionen entfernen**

Die alten `<section id="findings">`, `<section id="metrics">`, `<section id="compliance">` Blöcke vollständig entfernen.

- [ ] **Step 8: tsc grün**

```bash
pnpm exec tsc --noEmit 2>&1 | grep "error" | head -10
```

Erwartung: 0 errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/\[locale\]/\(app\)/audit/page.tsx src/components/app-ui/AppTabs.tsx
git commit -m "feat(audit): six domain tabs with URL routing, domain-filtered findings"
```

---

### Task 2.4 — Phase 2 Quality-Gate

- [ ] **Step 1: tsc + lint**

```bash
pnpm exec tsc --noEmit && pnpm exec next lint 2>&1 | grep "Error" | head -5
```

- [ ] **Step 2: Dev-Server Test**

Browser auf `/audit` öffnen:
- [ ] Sechs Tabs sichtbar: Code-Qualität, Performance, Sicherheit, Barrierefrei., DSGVO, KI-Act
- [ ] Sicherheit + Barrierefrei. sind disabled (kein Klick möglich)
- [ ] Tab-Wechsel via URL (Code-Qualität → ?tab=code-quality)
- [ ] Findings werden nach Domain gefiltert
- [ ] Quick Wins nur in Code-Qualität sichtbar
- [ ] Score-Block und Tabs bleiben beim Scrollen sticky

- [ ] **Step 3: Commit Tag**

```bash
git tag phase2-domain-tabs
```

---

## PHASE 3 — Compliance-Inputs (Variante D)

> **Scope-Hinweis:** Phase 3 ist ein eigenständiger Subsystem-Umbau (neue DB-Tabelle, API-Routes, Form-Komponenten). Kann als separater Plan ausgeführt werden sobald Phase 2 committed ist.

---

### Task 3.1 — DB-Migration project_compliance_data

**Files:**
- Create: `supabase/migrations/20260429000115_project_compliance_data.sql`

- [ ] **Step 1: Migration schreiben**

```sql
-- supabase/migrations/20260429000115_project_compliance_data.sql

CREATE TABLE project_compliance_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('master', 'detail')),
  question_key TEXT NOT NULL,
  question_value JSONB,
  answered_at TIMESTAMPTZ DEFAULT now(),
  answered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, question_key)
);

CREATE INDEX idx_project_compliance_data_project_scope
  ON project_compliance_data (project_id, scope);

-- RLS
ALTER TABLE project_compliance_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their org's compliance data"
  ON project_compliance_data FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = get_my_organization_id()
    )
  );

CREATE POLICY "Admins can insert/update compliance data"
  ON project_compliance_data FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = get_my_organization_id()
    )
  );

CREATE POLICY "Admins can update compliance data"
  ON project_compliance_data FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id = get_my_organization_id()
    )
  );
```

- [ ] **Step 2: Migration anwenden**

```bash
cd /c/Users/timmr/tropenOS && supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260429000115_project_compliance_data.sql
git commit -m "feat(db): project_compliance_data table with RLS"
```

---

### Task 3.2 — API-Route für Compliance-Daten

**Files:**
- Create: `src/app/api/audit/compliance-data/route.ts`

- [ ] **Step 1: API-Route erstellen**

```typescript
// src/app/api/audit/compliance-data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const UpsertSchema = z.object({
  projectId: z.string().uuid(),
  questionKey: z.string().min(1).max(100),
  questionValue: z.unknown(),
  scope: z.enum(['master', 'detail']),
})

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('project_compliance_data')
    .select('question_key, question_value, scope, answered_at')
    .eq('project_id', projectId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = UpsertSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const { projectId, questionKey, questionValue, scope } = parsed.data

  const { error } = await supabaseAdmin
    .from('project_compliance_data')
    .upsert({
      project_id: projectId,
      question_key: questionKey,
      question_value: questionValue,
      scope,
      answered_by: user.id,
      answered_at: new Date().toISOString(),
    }, { onConflict: 'project_id,question_key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: tsc + commit**

```bash
pnpm exec tsc --noEmit && git add src/app/api/audit/compliance-data/route.ts
git commit -m "feat(api): compliance-data CRUD route"
```

---

### Task 3.3 — ComplianceQuestion Inline-Komponente

**Files:**
- Create: `src/app/[locale]/(app)/audit/_components/ComplianceQuestion.tsx`

- [ ] **Step 1: Inline-Frage-Komponente erstellen**

```tsx
// src/app/[locale]/(app)/audit/_components/ComplianceQuestion.tsx
'use client'
import { useState } from 'react'

interface Props {
  projectId: string
  questionKey: string
  question: string
  type: 'boolean' | 'text' | 'select'
  options?: string[]
  initialValue?: unknown
  hint?: string
}

export function ComplianceQuestion({ projectId, questionKey, question, type, options, initialValue, hint }: Props) {
  const [value, setValue] = useState<unknown>(initialValue ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save(newValue: unknown) {
    setSaving(true)
    setValue(newValue)
    try {
      await fetch('/api/audit/compliance-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, questionKey, questionValue: newValue, scope: 'detail' }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>{question}</p>
          {hint && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{hint}</p>}
        </div>
        <div style={{ flexShrink: 0 }}>
          {type === 'boolean' && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => save(true)}
                style={{
                  padding: '4px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                  background: value === true ? 'var(--accent)' : 'transparent',
                  color: value === true ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  fontWeight: value === true ? 600 : 400,
                }}
                disabled={saving}
              >
                Ja
              </button>
              <button
                onClick={() => save(false)}
                style={{
                  padding: '4px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                  background: value === false ? 'var(--error)' : 'transparent',
                  color: value === false ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  fontWeight: value === false ? 600 : 400,
                }}
                disabled={saving}
              >
                Nein
              </button>
            </div>
          )}
          {type === 'select' && options && (
            <select
              value={value as string ?? ''}
              onChange={e => save(e.target.value)}
              style={{ padding: '4px 8px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 4 }}
            >
              <option value="">Auswählen...</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
          {saved && <span style={{ fontSize: 11, color: 'var(--status-success)', marginLeft: 8 }}>Gespeichert ✓</span>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: tsc + commit**

```bash
pnpm exec tsc --noEmit && git add src/app/\[locale\]/\(app\)/audit/_components/ComplianceQuestion.tsx
git commit -m "feat(audit): ComplianceQuestion inline component"
```

---

### Task 3.4 — DSGVO-Tab mit Inline-Fragen

**Files:**
- Create: `src/app/[locale]/(app)/audit/_components/DsgvoTab.tsx`

- [ ] **Step 1: DsgvoTab erstellen**

```tsx
// src/app/[locale]/(app)/audit/_components/DsgvoTab.tsx
'use client'
import { AppSection } from '@/components/app-ui/AppSection'
import { FindingsTableApp } from './FindingsTableApp'
import { ComplianceQuestion } from './ComplianceQuestion'
import type { AuditFinding } from '@/lib/audit/group-findings'

interface DsgvoTabProps {
  findings: AuditFinding[]
  projectId: string | null
  statusFilter?: string
  complianceData?: Record<string, unknown>
}

const DSGVO_QUESTIONS = [
  {
    key: 'has_avv_supabase',
    question: 'AVV mit Supabase abgeschlossen (als Auftragsverarbeiter)?',
    type: 'boolean' as const,
    hint: 'Art. 28 DSGVO — Pflicht für jeden Verarbeitungsdienstleister',
  },
  {
    key: 'has_avv_vercel',
    question: 'AVV mit Vercel abgeschlossen?',
    type: 'boolean' as const,
    hint: 'Art. 28 DSGVO — gilt für Hosting-Dienste',
  },
  {
    key: 'has_privacy_policy',
    question: 'Datenschutzerklärung aktuell und vollständig?',
    type: 'boolean' as const,
    hint: 'Art. 13/14 DSGVO — Informationspflicht',
  },
  {
    key: 'data_location',
    question: 'Wo werden personenbezogene Daten gespeichert?',
    type: 'select' as const,
    options: ['EU/EEA (konform)', 'USA (mit SCC)', 'USA (ohne SCC)', 'Unbekannt'],
  },
]

export function DsgvoTab({ findings, projectId, statusFilter = 'open', complianceData = {} }: DsgvoTabProps) {
  const openCount = findings.filter(f => f.status === 'open').length

  return (
    <>
      {openCount > 0 && (
        <AppSection header={`DSGVO-Pflichten · ${openCount} offen`} style={{ marginBottom: 16 }}>
          <FindingsTableApp findings={findings} statusFilter={statusFilter} />
        </AppSection>
      )}

      {projectId && (
        <AppSection header="Stamm-Daten — Antworten werden gespeichert">
          {DSGVO_QUESTIONS.map(q => (
            <ComplianceQuestion
              key={q.key}
              projectId={projectId}
              questionKey={q.key}
              question={q.question}
              type={q.type}
              options={'options' in q ? q.options : undefined}
              hint={q.hint}
              initialValue={complianceData[q.key]}
            />
          ))}
        </AppSection>
      )}

      {openCount === 0 && !projectId && (
        <AppSection header="DSGVO">
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Alle DSGVO-Pflichten erfüllt. Regelmäßig re-scannen nach Änderungen.
            </p>
          </div>
        </AppSection>
      )}
    </>
  )
}
```

- [ ] **Step 2: DsgvoTab in audit/page.tsx einbinden**

In `audit/page.tsx`, den DSGVO-Tab-Inhalt mit der neuen Komponente rendern:
```tsx
{activeTab === 'dsgvo' && (
  <DsgvoTab
    findings={activeFindings as unknown as Parameters<typeof DsgvoTab>[0]['findings']}
    projectId={activeScanProjectId}
    statusFilter={status}
  />
)}
```

- [ ] **Step 3: Analog: KiActTab erstellen**

Struktur identisch mit DsgvoTab, andere Fragen:

```tsx
// src/app/[locale]/(app)/audit/_components/KiActTab.tsx
// (Analog zu DsgvoTab, aber mit KI-Act-spezifischen Fragen)
const KI_ACT_QUESTIONS = [
  {
    key: 'ki_risk_classification',
    question: 'KI-Risikoklasse bestimmt?',
    type: 'select' as const,
    options: ['Minimales Risiko', 'Begrenztes Risiko', 'Hohes Risiko', 'Unakzeptables Risiko', 'Noch nicht bestimmt'],
    hint: 'EU AI Act Art. 6 — Klassifizierung ist Pflicht für KI-Systeme',
  },
  {
    key: 'ki_transparency_label',
    question: 'KI-generierte Inhalte erkennbar gemacht (Art. 52)?',
    type: 'boolean' as const,
    hint: 'Chatbots und generierte Inhalte müssen als KI-erstellt gekennzeichnet sein',
  },
  {
    key: 'ki_logging_enabled',
    question: 'KI-Entscheidungen geloggt (Art. 12)?',
    type: 'boolean' as const,
    hint: 'Anforderung für begrenzte und höhere Risikoklassen',
  },
]
```

- [ ] **Step 4: tsc + commit**

```bash
pnpm exec tsc --noEmit
git add src/app/\[locale\]/\(app\)/audit/_components/DsgvoTab.tsx src/app/\[locale\]/\(app\)/audit/_components/KiActTab.tsx
git commit -m "feat(audit): DsgvoTab + KiActTab mit inline ComplianceQuestions"
```

---

### Task 3.5 — Phase 3 Quality-Gate

- [ ] **Step 1: DB-Migration validieren**

```bash
supabase db push --dry-run 2>&1 | tail -3
```

- [ ] **Step 2: API-Route testen**

```bash
# Dev-Server muss laufen
curl http://localhost:3000/api/audit/compliance-data?projectId=test 2>&1 | head -5
```

Erwartung: 401 Unauthorized (kein Auth-Token) — das ist korrekt.

- [ ] **Step 3: tsc + lint**

```bash
pnpm exec tsc --noEmit && pnpm exec next lint 2>&1 | grep "Error" | head -5
```

- [ ] **Step 4: Commit Tag**

```bash
git tag phase3-compliance-inputs
```

---

## PHASE 4 — Lighthouse in Performance-Tab

> **Scope-Hinweis:** Phase 4 ist eigenständig. Kann nach Phase 2 als separater Plan gestartet werden. Braucht `GOOGLE_PAGESPEED_API_KEY` in `.env.local`.

---

### Task 4.1 — Lighthouse-URL per Projekt (Migration)

**Files:**
- Create: `supabase/migrations/20260429000116_lighthouse_url_per_project.sql`

- [ ] **Step 1: Migration schreiben und anwenden**

```sql
-- supabase/migrations/20260429000116_lighthouse_url_per_project.sql
ALTER TABLE projects ADD COLUMN lighthouse_url TEXT;
```

```bash
supabase db push
git add supabase/migrations/20260429000116_lighthouse_url_per_project.sql
git commit -m "feat(db): lighthouse_url column on projects"
```

---

### Task 4.2 — Google PageSpeed API Wrapper

**Files:**
- Create: `src/lib/audit/lighthouse-api.ts`

- [ ] **Step 1: API-Wrapper erstellen**

```typescript
// src/lib/audit/lighthouse-api.ts
// Google PageSpeed Insights API — kein Chrome nötig, funktioniert auf Vercel.
// API-Key: GOOGLE_PAGESPEED_API_KEY in .env.local
// Rate limit: 25.000 requests/Tag (kostenlos)

export interface LighthouseResult {
  url: string
  fetchTime: string
  categories: {
    performance?: number    // 0-1
    accessibility?: number
    bestPractices?: number
    seo?: number
  }
  audits: LighthouseAudit[]
}

export interface LighthouseAudit {
  id: string
  title: string
  description: string
  score: number | null       // 0-1 oder null (informational)
  displayValue?: string
  numericValue?: number
}

const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

export async function runLighthouse(url: string): Promise<LighthouseResult> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY
  if (!apiKey) throw new Error('GOOGLE_PAGESPEED_API_KEY not set')

  const params = new URLSearchParams({
    url,
    key: apiKey,
    strategy: 'desktop',
    category: ['performance', 'accessibility', 'best-practices', 'seo'].join('&category='),
  })

  const res = await fetch(`${PAGESPEED_API}?${params}`, {
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`PageSpeed API error ${res.status}: ${body.slice(0, 200)}`)
  }

  const json = await res.json()
  const lhr = json.lighthouseResult

  const categories = {
    performance: lhr.categories?.performance?.score ?? null,
    accessibility: lhr.categories?.accessibility?.score ?? null,
    bestPractices: lhr.categories?.['best-practices']?.score ?? null,
    seo: lhr.categories?.seo?.score ?? null,
  }

  const audits: LighthouseAudit[] = Object.values(lhr.audits ?? {})
    .filter((a: any) => a.score !== null && a.score < 0.9)
    .map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description ?? '',
      score: a.score,
      displayValue: a.displayValue,
      numericValue: a.numericValue,
    }))

  return {
    url,
    fetchTime: lhr.fetchTime ?? new Date().toISOString(),
    categories: Object.fromEntries(
      Object.entries(categories).filter(([, v]) => v !== null)
    ),
    audits,
  }
}
```

- [ ] **Step 2: `.env.example` aktualisieren**

```
GOOGLE_PAGESPEED_API_KEY=  # Google PageSpeed Insights API Key (kostenlos auf console.cloud.google.com)
```

- [ ] **Step 3: tsc + commit**

```bash
pnpm exec tsc --noEmit
git add src/lib/audit/lighthouse-api.ts .env.example
git commit -m "feat(audit): Google PageSpeed API wrapper"
```

---

### Task 4.3 — Lighthouse API-Route

**Files:**
- Create: `src/app/api/audit/lighthouse/route.ts`

- [ ] **Step 1: API-Route erstellen**

```typescript
// src/app/api/audit/lighthouse/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { runLighthouse } from '@/lib/audit/lighthouse-api'
import { z } from 'zod'

const RunSchema = z.object({
  url: z.string().url(),
  projectId: z.string().uuid().optional(),
  runId: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = RunSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const { url, projectId } = parsed.data

  // URL in projects speichern wenn projectId gegeben
  if (projectId) {
    await supabaseAdmin.from('projects').update({ lighthouse_url: url }).eq('id', projectId)
  }

  try {
    const result = await runLighthouse(url)

    // Ergebnis als Findings in audit_findings speichern wenn runId vorhanden
    // (für jetzt: direkt zurückgeben)
    return NextResponse.json({ result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
```

- [ ] **Step 2: tsc + commit**

```bash
pnpm exec tsc --noEmit
git add src/app/api/audit/lighthouse/route.ts
git commit -m "feat(api): Lighthouse trigger route (PageSpeed API)"
```

---

### Task 4.4 — PerformanceTab Komponente

**Files:**
- Create: `src/app/[locale]/(app)/audit/_components/PerformanceTab.tsx`

- [ ] **Step 1: PerformanceTab erstellen**

```tsx
// src/app/[locale]/(app)/audit/_components/PerformanceTab.tsx
'use client'
import { useState } from 'react'
import { AppSection } from '@/components/app-ui/AppSection'
import { FindingsTableApp } from './FindingsTableApp'
import type { AuditFinding } from '@/lib/audit/group-findings'

interface PerformanceTabProps {
  findings: AuditFinding[]
  projectId: string | null
  initialLighthouseUrl: string | null
  statusFilter?: string
}

interface LighthouseCategories {
  performance?: number
  accessibility?: number
  bestPractices?: number
  seo?: number
}

export function PerformanceTab({ findings, projectId, initialLighthouseUrl, statusFilter = 'open' }: PerformanceTabProps) {
  const [url, setUrl] = useState(initialLighthouseUrl ?? '')
  const [running, setRunning] = useState(false)
  const [scores, setScores] = useState<LighthouseCategories | null>(null)
  const [error, setError] = useState<string | null>(null)

  const openCount = findings.filter(f => f.status === 'open').length

  async function triggerLighthouse() {
    if (!url) return
    setRunning(true)
    setError(null)
    try {
      const res = await fetch('/api/audit/lighthouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, projectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setScores(data.result.categories)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Lighthouse-Run')
    } finally {
      setRunning(false)
    }
  }

  return (
    <>
      {/* Lighthouse Score-Sektion */}
      <AppSection header="Lighthouse" style={{ marginBottom: 16 }}>
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://deine-app.de"
              style={{
                flex: 1, minWidth: 240, padding: '7px 12px',
                border: '1px solid var(--border)', borderRadius: 4,
                fontSize: 13, fontFamily: 'var(--font-mono)',
              }}
            />
            <button
              onClick={triggerLighthouse}
              disabled={running || !url}
              className="btn btn-primary"
              style={{ flexShrink: 0 }}
            >
              {running ? 'Läuft...' : 'Scan starten'}
            </button>
          </div>

          {error && (
            <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 8 }}>{error}</p>
          )}

          {scores && (
            <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
              {Object.entries(scores).map(([key, score]) => (
                <div key={key} style={{ textAlign: 'center', minWidth: 72 }}>
                  <div style={{
                    fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)',
                    color: score >= 0.9 ? 'var(--status-success)' : score >= 0.5 ? 'var(--status-risky)' : 'var(--error)',
                  }}>
                    {Math.round((score ?? 0) * 100)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                    {key === 'bestPractices' ? 'Best Pr.' : key}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppSection>

      {/* Performance Findings */}
      {openCount > 0 && (
        <AppSection header={`Performance-Findings · ${openCount} offen`}>
          <FindingsTableApp findings={findings} statusFilter={statusFilter} />
        </AppSection>
      )}

      {openCount === 0 && !scores && (
        <AppSection header="Performance">
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              URL oben eintragen und Lighthouse-Scan starten um Performance-Scores zu sehen.
            </p>
          </div>
        </AppSection>
      )}
    </>
  )
}
```

- [ ] **Step 2: PerformanceTab in audit/page.tsx einbinden**

```tsx
// In page.tsx, activeTab === 'performance' Bereich:
{activeTab === 'performance' && (
  <PerformanceTab
    findings={activeFindings as unknown as Parameters<typeof PerformanceTab>[0]['findings']}
    projectId={activeScanProjectId}
    initialLighthouseUrl={initialLighthouseUrl}
    statusFilter={status}
  />
)}
```

**URL aus dem Audit-Header entfernen:** Die `AuditActions` Komponente hat bisher eine URL-Eingabe. Diese wird in Phase 4 entfernt (URL ist jetzt im Performance-Tab). Prüfe `AuditActions.tsx` auf URL-bezogene Props und entferne sie.

- [ ] **Step 3: tsc + commit**

```bash
pnpm exec tsc --noEmit
git add src/app/\[locale\]/\(app\)/audit/_components/PerformanceTab.tsx
git commit -m "feat(audit): PerformanceTab mit Lighthouse-Score + Findings"
```

---

### Task 4.5 — Phase 4 Quality-Gate

- [ ] **Step 1: tsc + lint**

```bash
pnpm exec tsc --noEmit && pnpm exec next lint 2>&1 | grep "Error" | head -5
```

- [ ] **Step 2: Dev-Server Test**

- [ ] Performance-Tab zeigt URL-Input wenn kein Lighthouse-Run
- [ ] Scan-Button startet Lighthouse (braucht `GOOGLE_PAGESPEED_API_KEY` in `.env.local`)
- [ ] Scores erscheinen nach erfolgreichem Run
- [ ] URL wird persistent gespeichert bei nächstem Aufruf
- [ ] Audit-Header hat keine URL-Eingabe mehr

- [ ] **Step 3: Commit Tag + CLAUDE.md Update**

In CLAUDE.md unter "Tech Stack" ergänzen:
```
| Google PageSpeed Insights API | — | Lighthouse-Scores für Performance-Tab; kein Chrome auf Vercel nötig |
```

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md Google PageSpeed API ergänzt"
git tag phase4-lighthouse
```

---

## Task 5 — Finale Doku + Self-Audit

- [ ] **Step 1: Roadmap aktualisieren**

In `docs/product/roadmap-2026-q2.md` vermerken:
- Tab-Sprint abgeschlossen (Domain-basierte Architektur)
- Sprint 1 (BP8/BP9/BP10) als nächstes
- L2 Vibe-Coder-Outreach als offene Aufgabe

- [ ] **Step 2: architect-log.md ergänzen**

```markdown
## 2026-04-29 — Tab-Sprint Complete

Phase 1: AuditDomain type + 183 Rules gemappt ✅
Phase 2: Sechs Domain-Tabs, URL-Routing ✅
Phase 3: project_compliance_data, DsgvoTab, KiActTab ✅
Phase 4: Lighthouse via PageSpeed API, PerformanceTab ✅
Nächste Schritte: L2 Vibe-Coder-Outreach, Sprint 1 (BP8/BP9/BP10)
```

- [ ] **Step 3: Self-Audit ausführen**

```bash
pnpm exec tsx src/scripts/run-audit.ts
```

Score vor/nach notieren.

- [ ] **Step 4: Git-Tag**

```bash
git tag tab-sprint-complete
```

---

## Spec-Coverage-Check

| Anforderung | Task |
|-------------|------|
| ADR-025 schreiben | Task 0 |
| Architect-Review + Ampel | Task 0 Step 2 |
| AuditDomain Typ in types.ts | Task 1.1 |
| domain-Feld auf AuditRule | Task 1.1 |
| 183 Rules mit domain | Task 1.2 |
| domain-mapping.md Doku | Task 1.2 Step 4 |
| getFindingsByDomain + getDomainCounts | Task 1.3 |
| AppTabs comingSoon Status | Task 2.1 |
| DomainEmptyState Coach-Stimme | Task 2.2 |
| Sechs Domain-Tabs in Page | Task 2.3 |
| URL-basiertes Tab-Routing (?tab=) | Task 2.3 |
| Coming-Soon für Sicherheit + Barrierefreiheit | Task 2.1+2.3 |
| project_compliance_data Migration | Task 3.1 |
| Compliance-Daten API-Route | Task 3.2 |
| ComplianceQuestion Inline-Komponente | Task 3.3 |
| DsgvoTab + KiActTab | Task 3.4 |
| KI-Act Fragen inline | Task 3.4 |
| projects.lighthouse_url Migration | Task 4.1 |
| Google PageSpeed API Wrapper | Task 4.2 |
| Lighthouse API-Route | Task 4.3 |
| PerformanceTab Komponente | Task 4.4 |
| URL aus Audit-Header entfernen | Task 4.4 |
| Roadmap + CLAUDE.md + architect-log | Task 5 |
| git tag tab-sprint-complete | Task 5 |
| Mobile horizontal scroll | Task 2.1 (CSS bereits im Bestand: .app-tabs overflow-x: auto bei @media) |

## Gaps vs. Spec

Folgende Spec-Punkte wurden vereinfacht:
- **Compliance-Resolver** (Task 3): Die dreischichtige Resolver-Logik (automatisch + Stamm + Detail) wurde nicht als separate Datei implementiert. Stattdessen rendert DsgvoTab direkt was es hat. Ein vollständiger Resolver ist Roadmap-Ziel nach L2-Feedback.
- **Stamm-Daten in Projekt-Settings** (Phase 3): ComplianceQuestion ist für Detail-Scope gebaut. Eine separate Stamm-Daten-Seite (`/projects/[id]/settings/compliance`) ist als Folge-Plan zu konzipieren.
- **Security- und Accessibility-Tabs** zeigen nur DomainEmptyState — die eigenen Rules (cat-3, cat-16) werden trotzdem in den Tabs gezeigt über das generische `activeFindings`.
