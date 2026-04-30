# BP8: Quick-Wins-Box global + Fix-Session-Bundle

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quick-Wins-Box über allen 7 Domain-Tabs platzieren, zieht die 5 wichtigsten Findings domainübergreifend aus allen offenen Findings; ein "Fix-Session starten"-Button generiert einen datei-sortierten Bulk-Cursor-Prompt.

**Architecture:** Server Component (audit/page.tsx) berechnet GlobalQuickWins server-seitig und übergibt als Props an `GlobalQuickWinsBar` (Client Component). "Fix-Session starten" macht POST zu `/api/audit/fix-session`, die `buildFixPrompt` pro Finding aufruft und alle Prompts nach Datei sortiert bündelt. Modal + Copy im Client.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Supabase (supabaseAdmin), `@/lib/audit/prompt-export` (buildFixPrompt), `@/lib/audit/domain-filter` (getDomainForRule), Phosphor Icons

---

## Inventur-Ergebnis (vor Build-Start)

**Phase 1.1 — quick-wins.ts:**
- `computeQuickWins(findings)` → `QuickWinsResult` mit `quickWins: QuickWinFinding[]` (Top 5), groups (today/thisWeek/someday)
- Dedup: max 1 pro `categoryId` — BP8 braucht max 1 pro `ruleId`
- Fehlende Felder in `QuickWinFinding`: `domain`, `effortMinutes`, `title` (enriched)
- Wird aufgerufen in `audit/page.tsx` Zeile 128–129 nur mit `codeFindings` (code-quality)

**Phase 1.2 — Bug-Ursache:**
- **Ursache B** — `computeQuickWins` wird mit `getFindingsByDomain(allFindings, 'code-quality')` aufgerufen, nicht mit `allFindings`. Die Box zeigt nur Code-Qualität-Findings. Wenn dort keine Quick-Win-Treffer, wird die Box gar nicht gerendert (Condition `quickWins.length > 0`).

**Phase 1.3 — Datenmodell-Gap:**
- `effortMinutes` fehlt → Heuristik: code-gen=10, code-fix=15, refactoring=45, manual=60
- `domain` fehlt → via `getDomainForRule(ruleId)` aus domain-filter.ts
- `title` fehlt → `_recTitle` ist bereits server-seitig in `allFindings` enriched (page.tsx Zeile 99–112), muss nur durch `toGlobalQuickWin` weitergegeben werden

---

## File Map

| Datei | Aktion | Verantwortung |
|-------|--------|---------------|
| `src/lib/audit/quick-wins.ts` | Modify | `GlobalQuickWinFinding` Typ + `getGlobalQuickWins()` Funktion |
| `src/app/[locale]/(app)/audit/_components/GlobalQuickWinsBar.tsx` | Create | Client-Komponente: Accordion + Summary-Text + Modal |
| `src/app/api/audit/fix-session/route.ts` | Create | POST-Route: nimmt Finding-IDs, gibt gebündelten Prompt zurück |
| `src/app/[locale]/(app)/audit/page.tsx` | Modify | Globale Wins berechnen, Bar einbauen, alte Box entfernen |
| `docs/product/roadmap-2026-q2.md` | Modify | BP12 als durch BP8 erledigt markieren |

---

## Task 1 — quick-wins.ts erweitern

**Files:**
- Modify: `src/lib/audit/quick-wins.ts`

- [ ] **Step 1.1: `GlobalQuickWinFinding` Interface und Heuristik hinzufügen**

Füge nach `QuickWinsResult` ein (Zeile 27 nach der schließenden `}` von `QuickWinsResult`):

```typescript
export interface GlobalQuickWinFinding {
  id: string
  ruleId: string
  severity: string
  message: string
  title: string           // aus _recTitle oder message als Fallback
  suggestion: string | null
  filePath: string | null
  line: number | null
  categoryId: number
  fixType: FixType
  domain: AuditDomain
  estimatedScoreGain: number
  effortMinutes: number
}

function effortMinutesForFixType(fixType: FixType): number {
  switch (fixType) {
    case 'code-gen':    return 10
    case 'code-fix':    return 15
    case 'refactoring': return 45
    case 'manual':      return 60
  }
}
```

Ergänze den Import oben in der Datei:

```typescript
import type { FixType } from './types'
import type { AuditDomain } from './types'
import { getDomainForRule } from './domain-filter'
```

(Ersetze die bestehende `import type { FixType } from './types'` Zeile.)

- [ ] **Step 1.2: `toGlobalQuickWin` Hilfsfunktion hinzufügen**

Füge nach `toQuickWin` ein:

```typescript
function toGlobalQuickWin(
  f: Record<string, unknown>,
  fixType: FixType,
  domain: AuditDomain,
): GlobalQuickWinFinding {
  return {
    id: f.id as string,
    ruleId: f.rule_id as string,
    severity: f.severity as string,
    message: f.message as string,
    title: (f._recTitle as string | undefined) ?? (f.message as string),
    suggestion: f.suggestion as string | null,
    filePath: f.file_path as string | null,
    line: f.line as number | null,
    categoryId: f.category_id as number,
    fixType,
    domain,
    estimatedScoreGain: estimateScoreGain(f.severity as string),
    effortMinutes: effortMinutesForFixType(fixType),
  }
}
```

- [ ] **Step 1.3: `getGlobalQuickWins` Funktion hinzufügen**

Füge am Ende der Datei hinzu (nach `computeQuickWins`):

```typescript
/**
 * Returns the top quick-win findings across ALL domains.
 * Dedupes by ruleId (max 1 per rule), not categoryId.
 * Expects allFindings already enriched server-side with fix_type and _recTitle.
 */
export function getGlobalQuickWins(
  allFindings: Array<Record<string, unknown>>,
  limit = 5,
): GlobalQuickWinFinding[] {
  const open = allFindings.filter((f) => f.status === 'open')

  const enriched = open.map((f) => {
    const fixType: FixType = (f.fix_type as FixType) ?? 'manual'
    const domain = getDomainForRule(f.rule_id as string)
    return {
      raw: f,
      fixType,
      domain,
      score: quickWinScore({
        severity: f.severity as string,
        suggestion: f.suggestion as string | null,
        fixType,
        categoryId: f.category_id as number,
      }),
    }
  })

  enriched.sort((a, b) => b.score - a.score)

  const seenRuleIds = new Set<string>()
  const wins: GlobalQuickWinFinding[] = []

  for (const item of enriched) {
    if (wins.length >= limit) break
    const ruleId = item.raw.rule_id as string
    if (seenRuleIds.has(ruleId)) continue
    seenRuleIds.add(ruleId)
    wins.push(toGlobalQuickWin(item.raw, item.fixType, item.domain))
  }

  return wins
}
```

- [ ] **Step 1.4: TypeScript prüfen**

```bash
cd C:/Users/timmr/tropenOS && npx tsc --noEmit 2>&1 | head -30
```

Erwartetes Ergebnis: keine neuen Fehler in `quick-wins.ts`.

- [ ] **Step 1.5: Commit**

```bash
git add src/lib/audit/quick-wins.ts
git commit -m "feat(audit): add getGlobalQuickWins across all 7 domains (BP8)"
```

---

## Task 2 — API Route `/api/audit/fix-session`

**Files:**
- Create: `src/app/api/audit/fix-session/route.ts`

- [ ] **Step 2.1: Route-Datei erstellen**

```typescript
// src/app/api/audit/fix-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildFixPrompt } from '@/lib/audit/prompt-export'
import type { PromptFinding } from '@/lib/audit/prompt-export/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { findingIds?: string[] } | null
  if (!body?.findingIds?.length) {
    return NextResponse.json({ error: 'findingIds required' }, { status: 400 })
  }

  const { data: dbFindings, error } = await supabaseAdmin
    .from('audit_findings')
    .select('id, rule_id, message, severity, file_path, agent_source, fix_type, suggestion, affected_files, fix_hint')
    .in('id', body.findingIds)

  if (error || !dbFindings) {
    return NextResponse.json({ error: 'Failed to fetch findings' }, { status: 500 })
  }

  // Group by filePath
  const byFile = new Map<string, typeof dbFindings>()
  for (const f of dbFindings) {
    const key = f.file_path ?? '__no_file__'
    if (!byFile.has(key)) byFile.set(key, [])
    byFile.get(key)!.push(f)
  }

  // Sort files: most findings first; no-file group last
  const sortedEntries = [...byFile.entries()].sort((a, b) => {
    if (a[0] === '__no_file__') return 1
    if (b[0] === '__no_file__') return -1
    return b[1].length - a[1].length
  })

  // Severity order for within-file sorting
  const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

  const sections: string[] = []
  let fileIndex = 0
  let totalFiles = sortedEntries.filter(([k]) => k !== '__no_file__').length

  for (const [filePath, findings] of sortedEntries) {
    const isNoFile = filePath === '__no_file__'

    // Sort within file by severity
    findings.sort((a, b) => (SEV_ORDER[a.severity] ?? 5) - (SEV_ORDER[b.severity] ?? 5))

    const fileHeader = isNoFile
      ? `## Datei ${fileIndex + 1}/${totalFiles + (isNoFile ? 1 : 0)}: — (kein Datei-Bezug, globaler Fix)`
      : `## Datei ${fileIndex + 1}/${totalFiles}: ${filePath}`

    fileIndex++

    const findingBlocks = findings.map((f, idx) => {
      const pf: PromptFinding = {
        ruleId: String(f.rule_id ?? '').split('::')[0],
        severity: String(f.severity ?? 'medium'),
        message: String(f.message ?? ''),
        filePath: f.file_path ?? null,
        agentSource: f.agent_source ?? null,
        fixType: (f.fix_type as PromptFinding['fixType']) ?? null,
        affectedFiles: Array.isArray(f.affected_files) ? f.affected_files as string[] : [],
        fixHint: f.fix_hint ?? null,
        suggestion: f.suggestion ?? null,
      }
      const generated = buildFixPrompt(pf, 'generic')
      return `### Finding ${fileIndex - 1}.${idx + 1} — ${generated.title}\n\n${generated.content}`
    })

    sections.push(`${fileHeader}\n\n${findingBlocks.join('\n\n---\n\n')}`)
  }

  const totalFindings = dbFindings.length
  const totalMinutes = dbFindings.reduce((sum, f) => {
    const ft = f.fix_type as string | null
    const effort = ft === 'code-gen' ? 10 : ft === 'code-fix' ? 15 : ft === 'refactoring' ? 45 : 60
    return sum + effort
  }, 0)
  const roundedMinutes = Math.round(totalMinutes / 5) * 5

  const header = `# Fix-Session — ${totalFindings} Findings aus ${totalFiles} ${totalFiles === 1 ? 'Datei' : 'Dateien'}

Bearbeite die folgenden ${totalFindings} Findings in dieser Reihenfolge.
Geschätzte Zeit: ~${roundedMinutes} Minuten.

Die Findings sind nach Datei sortiert — bearbeite jede Datei komplett bevor du zur nächsten wechselst.

---`

  const prompt = `${header}\n\n${sections.join('\n\n---\n\n')}`

  return NextResponse.json({
    prompt,
    fileCount: totalFiles,
    estimatedMinutes: roundedMinutes,
  })
}
```

- [ ] **Step 2.2: TypeScript prüfen**

```bash
cd C:/Users/timmr/tropenOS && npx tsc --noEmit 2>&1 | head -30
```

Erwartetes Ergebnis: keine Fehler in der neuen Route.

- [ ] **Step 2.3: Commit**

```bash
git add src/app/api/audit/fix-session/route.ts
git commit -m "feat(audit): POST /api/audit/fix-session — file-sorted bulk fix prompt (BP8)"
```

---

## Task 3 — `GlobalQuickWinsBar` Komponente

**Files:**
- Create: `src/app/[locale]/(app)/audit/_components/GlobalQuickWinsBar.tsx`

- [ ] **Step 3.1: Komponente erstellen**

```typescript
'use client'

import React, { useState } from 'react'
import { Lightning, CaretDown, CaretUp, Copy, Check, X } from '@phosphor-icons/react'
import type { GlobalQuickWinFinding } from '@/lib/audit/quick-wins'
import type { AuditDomain } from '@/lib/audit/types'

interface GlobalQuickWinsBarProps {
  wins: GlobalQuickWinFinding[]
  /** For tab navigation links */
  runId?: string | null
  projectId?: string | null
}

const DOMAIN_LABEL: Record<AuditDomain, string> = {
  'code-quality': 'Code',
  'performance':  'Perf',
  'security':     'Sec',
  'accessibility':'A11y',
  'dsgvo':        'DSGVO',
  'ki-act':       'KI-Act',
  'documentation':'Doku',
}

const SEV_DOT: Record<string, string> = {
  critical: 'severity-dot--critical',
  high:     'severity-dot--high',
  medium:   'severity-dot--medium',
  low:      'severity-dot--low',
  info:     'severity-dot--info',
}

function tabHref(domain: AuditDomain, runId?: string | null, projectId?: string | null): string {
  const params = new URLSearchParams()
  params.set('tab', domain)
  if (runId) params.set('runId', runId)
  if (projectId) params.set('project', projectId)
  return `/audit?${params.toString()}`
}

// ── Fix-Session Modal ──────────────────────────────────────────────────────

interface ModalProps {
  prompt: string
  fileCount: number
  estimatedMinutes: number
  onClose: () => void
}

function FixSessionModal({ prompt, fileCount, estimatedMinutes, onClose }: ModalProps) {
  const [copied, setCopied] = useState(false)

  function copy() {
    void navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(26,23,20,0.45)', backdropFilter: 'blur(2px)',
        }}
        aria-hidden="true"
      />
      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Fix-Session bereit"
        style={{
          position: 'fixed', inset: 0, zIndex: 201,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 16px',
        }}
      >
        <div style={{
          background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border)',
          borderRadius: 8, width: '100%', maxWidth: 680,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(26,23,20,0.16)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                Fix-Session bereit
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {fileCount} {fileCount === 1 ? 'Datei' : 'Dateien'} · ~{estimatedMinutes} Min
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Schließen"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)' }}
            >
              <X size={18} weight="bold" aria-hidden="true" />
            </button>
          </div>

          {/* Prompt preview */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
            <pre style={{
              margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11,
              lineHeight: 1.7, color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {prompt}
            </pre>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderTop: '1px solid var(--border)',
            background: 'var(--surface-warm)',
          }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)', maxWidth: 360 }}>
              Füge den Prompt in Cursor oder Claude Code ein. Findings sind nach Datei sortiert.
            </p>
            <button
              onClick={copy}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
            >
              {copied
                ? <><Check size={14} weight="bold" aria-hidden="true" /> Kopiert</>
                : <><Copy size={14} weight="bold" aria-hidden="true" /> Prompt kopieren</>}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function GlobalQuickWinsBar({ wins, runId, projectId }: GlobalQuickWinsBarProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<{ prompt: string; fileCount: number; estimatedMinutes: number } | null>(null)

  const totalMinutes = Math.round(wins.reduce((s, w) => s + w.effortMinutes, 0) / 5) * 5
  const totalGain = wins.reduce((s, w) => s + w.estimatedScoreGain, 0)
  const uniqueDomains = new Set(wins.map(w => w.domain)).size

  async function startSession() {
    if (!wins.length) return
    setLoading(true)
    try {
      const res = await fetch('/api/audit/fix-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingIds: wins.map(w => w.id) }),
      })
      const data = await res.json() as { prompt?: string; fileCount?: number; estimatedMinutes?: number }
      if (data.prompt) {
        setModal({ prompt: data.prompt, fileCount: data.fileCount ?? 0, estimatedMinutes: data.estimatedMinutes ?? 0 })
      }
    } catch {
      // silent fail — user can retry
    } finally {
      setLoading(false)
    }
  }

  if (!wins.length) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', marginBottom: 16,
        background: 'var(--surface-warm)', border: '1px solid var(--border)',
        borderRadius: 4,
      }}>
        <Lightning size={14} color="var(--text-tertiary)" weight="fill" aria-hidden="true" />
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          QUICK WINS · Keine offenen Quick-Wins. Solide Arbeit.
        </span>
      </div>
    )
  }

  return (
    <>
      {/* Bar */}
      <div style={{
        marginBottom: 16,
        background: 'var(--active-bg)',
        border: '1px solid rgba(168,184,82,0.25)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', flexWrap: 'wrap',
        }}>
          {/* Label */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'var(--secondary)', flexShrink: 0,
          }}>
            <Lightning size={12} weight="fill" aria-hidden="true" />
            Quick Wins · {wins.length} schnelle Fixes
          </span>

          {/* Summary */}
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', flex: 1, minWidth: 160 }}>
            {wins.length} {wins.length === 1 ? 'Finding' : 'Findings'} aus {uniqueDomains} {uniqueDomains === 1 ? 'Domain' : 'Domains'}.
            {' '}~{totalMinutes} Min Bearbeitungszeit.
            {' '}Score +{totalGain.toFixed(1)} Punkte.
          </span>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => void startSession()}
              disabled={loading}
              className="btn btn-primary"
              style={{ fontSize: 12, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Lightning size={12} weight="fill" aria-hidden="true" />
              {loading ? 'Wird generiert…' : 'Fix-Session starten'}
            </button>
            <button
              onClick={() => setOpen(v => !v)}
              style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, color: 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-mono)',
              }}
              aria-expanded={open}
            >
              {open
                ? <><CaretUp size={11} weight="bold" aria-hidden="true" /> Details verbergen</>
                : <><CaretDown size={11} weight="bold" aria-hidden="true" /> Details anzeigen</>}
            </button>
          </div>
        </div>

        {/* Accordion details */}
        {open && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {wins.map((w) => (
              <a
                key={w.id}
                href={tabHref(w.domain, runId, projectId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 16px', textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                }}
              >
                <span
                  className={`severity-dot ${SEV_DOT[w.severity] ?? 'severity-dot--info'}`}
                  role="img"
                  aria-label={`Schweregrad: ${w.severity}`}
                />
                <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {w.title}
                </span>
                <span style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)',
                  color: 'var(--secondary)', flexShrink: 0,
                  background: 'rgba(168,184,82,0.12)', padding: '1px 6px', borderRadius: 3,
                }}>
                  {DOMAIN_LABEL[w.domain]}
                </span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--secondary)', flexShrink: 0, minWidth: 36, textAlign: 'right' }}>
                  +{w.estimatedScoreGain.toFixed(1)}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', flexShrink: 0, minWidth: 60, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'rtl' }}>
                  {w.filePath ?? '—'}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <FixSessionModal
          prompt={modal.prompt}
          fileCount={modal.fileCount}
          estimatedMinutes={modal.estimatedMinutes}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 3.2: TypeScript prüfen**

```bash
cd C:/Users/timmr/tropenOS && npx tsc --noEmit 2>&1 | head -30
```

Erwartetes Ergebnis: keine Fehler in der neuen Komponente.

- [ ] **Step 3.3: Commit**

```bash
git add src/app/[locale]/(app)/audit/_components/GlobalQuickWinsBar.tsx
git commit -m "feat(audit): GlobalQuickWinsBar — accordion + FixSessionModal (BP8)"
```

---

## Task 4 — audit/page.tsx verdrahten

**Files:**
- Modify: `src/app/[locale]/(app)/audit/page.tsx`

- [ ] **Step 4.1: Import tauschen und globale Wins berechnen**

Ersetze in `audit/page.tsx`:

```typescript
// ALT (Zeile ~16-17):
import { computeQuickWins } from '@/lib/audit/quick-wins'
// ALT (Zeile ~128-129):
const codeFindings = getFindingsByDomain(allFindings, 'code-quality')
const { quickWins } = computeQuickWins(codeFindings as unknown as Parameters<typeof computeQuickWins>[0])
```

Mit:

```typescript
// NEU — Import:
import { getGlobalQuickWins } from '@/lib/audit/quick-wins'
import GlobalQuickWinsBar from './_components/GlobalQuickWinsBar'

// NEU — Berechnung (nach allFindings enrichment, Zeile ~128):
const globalQuickWins = getGlobalQuickWins(allFindings)
```

- [ ] **Step 4.2: GlobalQuickWinsBar zwischen ScoreBar und AppTabs einbauen**

Suche den Block:
```tsx
{/* ── Sticky Domain-Tab-Bar (6 Domains, URL-Routing) ─────────── */}
<AppTabs
```

Füge **davor** ein:
```tsx
{/* ── Global Quick-Wins Bar ───────────────────────────────────── */}
<GlobalQuickWinsBar
  wins={globalQuickWins}
  runId={selectedRunId}
  projectId={activeScanProjectId}
/>
```

- [ ] **Step 4.3: Alte Quick-Wins-Box aus Code-Qualität-Tab entfernen**

Suche und entferne diesen Block (ca. Zeile 236–247):
```tsx
{/* Quick Wins only in code-quality tab */}
{activeTab === 'code-quality' && quickWins.length > 0 && (
  <AppSection
    header={`⚡ Quick Wins · ${quickWins.length} schnelle Fixes`}
    accent
    style={{ marginBottom: 16 }}
  >
    <FindingsTableApp
      findings={quickWins as unknown as Parameters<typeof FindingsTableApp>[0]['findings']}
      statusFilter="open"
    />
  </AppSection>
)}
```

- [ ] **Step 4.4: TypeScript prüfen**

```bash
cd C:/Users/timmr/tropenOS && npx tsc --noEmit 2>&1 | head -30
```

Erwartetes Ergebnis: keine Fehler.

- [ ] **Step 4.5: Lint prüfen**

```bash
cd C:/Users/timmr/tropenOS && pnpm exec eslint src/app/\[locale\]/\(app\)/audit/ --max-warnings 0 2>&1 | tail -10
```

- [ ] **Step 4.6: Commit**

```bash
git add src/app/[locale]/(app)/audit/page.tsx
git commit -m "feat(audit): wire GlobalQuickWinsBar into audit page, remove old per-tab box (BP8)"
```

---

## Task 5 — Cleanup + Docs

**Files:**
- Modify: `docs/product/roadmap-2026-q2.md`
- Modify: `CLAUDE.md` (Audit-Seite-Struktur, falls beschrieben)

- [ ] **Step 5.1: Roadmap updaten**

In `docs/product/roadmap-2026-q2.md` Zeile 452+456:

```markdown
# ALT:
- BP8 — Bulk-Download (Findings als Markdown-Export)
- BP12 — Fix-Prompt-Top-5-Optimierung

# NEU:
- BP8 — Quick-Wins-Box global + Fix-Session-Bundle ✅ 2026-04-30
- ~~BP12 — Fix-Prompt-Top-5-Optimierung~~ → durch BP8 erledigt 2026-04-30
```

- [ ] **Step 5.2: CLAUDE.md Audit-Seite-Struktur ergänzen**

In CLAUDE.md, im Abschnitt `Audit-Tab-Architektur — sechs Domain-Tabs`, ergänze nach dem Tab-Sprint-Infrastruktur-Block:

```markdown
**GlobalQuickWinsBar (BP8, 2026-04-30):**
- Position: zwischen ScoreBar und AppTabs (global, über allen 7 Tabs)
- Props: `wins: GlobalQuickWinFinding[]`, `runId`, `projectId`
- Logic: `getGlobalQuickWins(allFindings, 5)` in `src/lib/audit/quick-wins.ts`
- Dedup: max 1 Finding pro `ruleId` (nicht categoryId)
- Button "Fix-Session starten" → POST `/api/audit/fix-session` → Modal mit Bulk-Prompt
- Bulk-Prompt: file-sorted (most findings per file first), within file by severity
```

- [ ] **Step 5.3: Commit**

```bash
git add docs/product/roadmap-2026-q2.md CLAUDE.md
git commit -m "docs: mark BP8 done, BP12 superseded, update CLAUDE.md audit structure"
```

---

## Task 6 — Visueller Sweep (Pflicht)

- [ ] **Step 6.1: Server starten (falls nicht läuft)**

```bash
cd C:/Users/timmr/tropenOS && pnpm dev
```

- [ ] **Step 6.2: Audit-Seite öffnen und GlobalQuickWinsBar prüfen**

Gehe zu `http://localhost:3000/de/audit` (oder `localhost:3001`).

Prüfen:
- GlobalQuickWinsBar sichtbar zwischen Score-Hero und Tab-Leiste?
- Summary-Text korrekt ("N Findings aus X Domains. ~Y Min. Score +Z Punkte.")?
- Limette-Farbe auf Label + Score-Gain-Badges korrekt?
- Tab wechseln (Performance, Sicherheit, etc.) → Bar bleibt sichtbar?

- [ ] **Step 6.3: Details-Akkordeon testen**

Klick auf "Details anzeigen":
- Liste der 5 Findings mit Severity-Dot, Titel, Domain-Badge, Score?
- Klick auf Zeile navigiert zum richtigen Domain-Tab?
- "Details verbergen" klappt wieder zu?

- [ ] **Step 6.4: Fix-Session starten testen**

Klick auf "Fix-Session starten":
- Button zeigt "Wird generiert…" während Laden?
- Modal öffnet sich mit Prompt-Vorschau?
- Prompt-Header enthält "Fix-Session — N Findings aus X Dateien"?
- Findings im Prompt nach Datei gruppiert?
- "Prompt kopieren" kopiert in Zwischenablage, Button wechselt zu "Kopiert"?
- "×"-Button und Backdrop schließen Modal?

- [ ] **Step 6.5: Empty-State testen**

Falls kein Test-Projekt ohne Findings: temporär `getGlobalQuickWins` mit `limit=0` aufrufen oder leere Wins-Array hardcoden.

Prüfen: leere Bar zeigt "Keine offenen Quick-Wins. Solide Arbeit." in tertiary-Farbe?

- [ ] **Step 6.6: Finaler TypeScript + Lint**

```bash
cd C:/Users/timmr/tropenOS && npx tsc --noEmit && pnpm exec eslint src/ --max-warnings 0 2>&1 | tail -20
```

---

## Hand-Over-Format

```
BP8 — Quick-Wins-Box global + Fix-Session ✅

Phase 1 (Logik):
- quick-wins.ts erweitert um getGlobalQuickWins() ✅
- Bug-Ursache war: B (nur code-quality Domain) ✅ behoben
- Datenmodell: effortMinutes via Heuristik (code-gen=10, code-fix=15, refactoring=45, manual=60)
- Dedup: categoryId → ruleId ✅

Phase 2 (UI):
- GlobalQuickWinsBar: src/app/[locale]/(app)/audit/_components/GlobalQuickWinsBar.tsx ✅
- Position: zwischen ScoreBar und AppTabs ✅
- Coach-Stil-Text dynamisch generiert ✅
- Detail-Akkordeon optional zuklappbar ✅

Phase 3 (Bundle):
- API-Route /api/audit/fix-session ✅
- Datei-Sortierung im Prompt ✅
- Modal mit Copy-Button ✅

Phase 4 (Cleanup):
- Alte Box entfernt: code-quality-Tab ✅
- BP12 in Roadmap ~~durchgestrichen~~ ✅
- CLAUDE.md ergänzt: ja ✅

Visueller Sweep:
- Desktop ✅ / ⚠️ [Anmerkungen]
- Empty-State ✅ / ⚠️
- Fix-Session Modal ✅ / ⚠️

Build: tsc grün, lint grün.
Offene Rückfragen: [Liste falls vorhanden]
```
