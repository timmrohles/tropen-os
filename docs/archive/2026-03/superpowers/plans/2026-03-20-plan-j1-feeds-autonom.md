# Plan J1 — Feeds autonom: Distributions-UI + Run-History + Notifications

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Feeds werden zu echten Produktions-Tools. User konfigurieren wohin Feed-Ergebnisse fließen (Projekt, Workspace, Notification), sehen die Run-History mit Kosten, und bekommen Notifications wenn wichtige Items reinkommen.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Supabase (supabaseAdmin), Zod, Phosphor Icons

---

## Codebase State (MUST READ before coding)

### Was bereits existiert — NICHT neu bauen

| Was | Wo | Zustand |
|-----|----|---------|
| `feed_runs` Tabelle | migration 046 | Vollständig mit RLS. APPEND ONLY. |
| `feed_notifications` Tabelle | migration 046 | Vollständig mit RLS. |
| `feed_distributions` Tabelle | migration 036 + 046 | Schema OK. `target_type IN ('project','workspace','notification')` |
| `feed_sources.status` + pause-Felder | migration 046 | `status`, `paused_at`, `paused_by`, `pause_reason` |
| `distributor.ts` | `src/lib/feeds/distributor.ts` | Workspace + Notification implementiert. **Project fehlt.** |
| `GET /api/feeds/[id]/runs` | route.ts | Gibt letzte N runs zurück |
| `POST /api/feeds/[id]/run` | route.ts | Manueller Trigger |
| `POST /api/feeds/[id]/pause` | route.ts | Setzt status='paused' |
| `POST /api/feeds/[id]/resume` | route.ts | Setzt status='active' |
| `GET /api/feeds/notifications` | route.ts | Ungelesene Notifications |
| `PATCH /api/feeds/notifications` | route.ts | Alle als gelesen markieren |
| `FeedRun`, `FeedDistribution` Types | `src/types/feeds.ts` | Vollständig |
| Run-History Anzeige | `SourcesView.tsx` L359-380 | Einfache Liste, ohne Details/Kosten |

### Was fehlt — muss gebaut werden

1. **`/api/feeds/[id]/distributions` CRUD** — GET list, POST create, DELETE — kein Route vorhanden
2. **Project-Distribution in `distributor.ts`** — `target_type='project'` landet im Nichts
3. **Distributions-UI in SourcesView** — User können nicht konfigurieren wohin Items gehen
4. **Run-History verbessern** — Kosten, Error-Details, items-Breakdown fehlen in UI
5. **Notification-Badge + Panel** im Feeds-Tab

### Nächste Migrations-Nummer

Letzte Migration: `20260319000059_memory_extraction_log.sql`
Nächste: `20260320000060`

### Bestehende Patterns (kopieren)

```typescript
// Auth in API routes
import { getAuthUser } from '@/lib/api/projects'
const user = await getAuthUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
// user.id, user.organization_id, user.role

// Validation
import { validateBody } from '@/lib/api/projects'
const body = await validateBody(req, mySchema)

// Logger
import { createLogger } from '@/lib/logger'
const log = createLogger('feeds:distributions')

// Alle Queries via supabaseAdmin
import { supabaseAdmin } from '@/lib/supabase-admin'
```

---

## File Structure

```
src/app/api/feeds/[id]/
  distributions/route.ts           — GET list + POST create
  distributions/[distId]/route.ts  — DELETE

src/lib/feeds/
  distributor.ts                   — MODIFY: project-Distribution hinzufügen

src/lib/validators/
  feeds.ts                         — MODIFY: createDistributionSchema hinzufügen

src/app/feeds/
  SourcesView.tsx                  — MODIFY: Distributions-Panel + Run-History-Details
  _components/
    RunHistoryPanel.tsx            — NEW: detaillierte Run-History-Karte
    DistributionsPanel.tsx         — NEW: Outputs konfigurieren
    NotificationBadge.tsx          — NEW: unread count + mini-dropdown
```

---

## Task 1: Distributions API

**Files:**
- Create: `src/app/api/feeds/[id]/distributions/route.ts`
- Create: `src/app/api/feeds/[id]/distributions/[distId]/route.ts`
- Modify: `src/lib/validators/feeds.ts`

### Step 1: Validator ergänzen

Öffne `src/lib/validators/feeds.ts` und füge am Ende hinzu:

```typescript
export const createDistributionSchema = z.object({
  target_type: z.enum(['project', 'workspace', 'notification']),
  target_id:   z.string().uuid(),
  auto_inject: z.boolean().default(true),
  min_score:   z.number().int().min(1).max(10).default(7),
})
```

- [ ] **Step 2: GET + POST route**

```typescript
// src/app/api/feeds/[id]/distributions/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'
import { validateBody } from '@/lib/api/projects'
import { createDistributionSchema } from '@/lib/validators/feeds'
import { createLogger } from '@/lib/logger'

export const runtime = 'nodejs'

const log = createLogger('feeds:distributions')

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Ownership-Check: source gehört zur Org des Users
  const { data: source } = await supabaseAdmin
    .from('feed_sources')
    .select('id, organization_id')
    .eq('id', id)
    .eq('organization_id', user.organization_id)
    .maybeSingle()

  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('feed_distributions')
    .select('*')
    .eq('source_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ distributions: data ?? [] })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await validateBody(req, createDistributionSchema)
  if (body instanceof NextResponse) return body

  // Ownership-Check
  const { data: source } = await supabaseAdmin
    .from('feed_sources')
    .select('id, organization_id')
    .eq('id', id)
    .eq('organization_id', user.organization_id)
    .maybeSingle()

  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Duplikat-Check
  const { data: existing } = await supabaseAdmin
    .from('feed_distributions')
    .select('id')
    .eq('source_id', id)
    .eq('target_type', body.target_type)
    .eq('target_id', body.target_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Distribution already exists' }, { status: 409 })
  }

  const { data, error } = await supabaseAdmin
    .from('feed_distributions')
    .insert({ source_id: id, ...body })
    .select()
    .single()

  if (error) {
    log.error('create distribution failed', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ distribution: data }, { status: 201 })
}
```

- [ ] **Step 3: DELETE route**

```typescript
// src/app/api/feeds/[id]/distributions/[distId]/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'

export const runtime = 'nodejs'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; distId: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, distId } = await params

  // Verify source belongs to org
  const { data: dist } = await supabaseAdmin
    .from('feed_distributions')
    .select('id, feed_sources!inner(organization_id)')
    .eq('id', distId)
    .eq('source_id', id)
    .maybeSingle()

  if (!dist) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const src = dist as Record<string, unknown>
  const feedSrc = src.feed_sources as Record<string, unknown>
  if (feedSrc.organization_id !== user.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('feed_distributions')
    .delete()
    .eq('id', distId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: TypeScript check**
```bash
cd "/c/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**
```bash
git add src/app/api/feeds/[id]/distributions/ src/lib/validators/feeds.ts
git commit -m "feat(feeds): distributions CRUD API"
```

---

## Task 2: Project-Distribution in distributor.ts

**File:** `src/lib/feeds/distributor.ts`

Das `project`-target_type wird aktuell ignoriert. Items sollen in `project_memory` der Ziel-Org landen.

- [ ] **Step 1: project-Branch hinzufügen**

Öffne `src/lib/feeds/distributor.ts`. Nach dem `notification`-Block, vor der schließenden `}` des for-loops, ergänze:

```typescript
} else if (d.target_type === 'project') {
  // Feed-Item als project_memory Eintrag speichern
  const content = [
    src.summary,
    ...(Array.isArray(src.key_facts)
      ? (src.key_facts as string[]).map((f) => `• ${f}`)
      : []),
    src.url ? `Quelle: ${src.url}` : '',
  ].filter(Boolean).join('\n')

  const { error } = await supabaseAdmin.from('project_memory').insert({
    project_id:      d.target_id as string,
    organization_id: src.organization_id as string,
    content,
    memory_type:     'feed_item',
    source_url:      src.url ?? null,
    metadata:        { feed_source_id: src.source_id, item_id: itemId, title: src.title },
  })
  if (error) log.error('[distributor] project inject failed', { error: error.message })
}
```

- [ ] **Step 2: TypeScript check**
```bash
cd "/c/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**
```bash
git add src/lib/feeds/distributor.ts
git commit -m "feat(feeds): implement project distribution target"
```

---

## Task 3: RunHistoryPanel Komponente

**File:** `src/app/feeds/_components/RunHistoryPanel.tsx` (neu anlegen)

Zeigt die letzten Runs einer Feed-Quelle mit Items-Breakdown, Kosten, Fehler-Details.

- [ ] **Step 1: Komponente erstellen**

```typescript
'use client'
// src/app/feeds/_components/RunHistoryPanel.tsx
import type { FeedRun } from '@/types/feeds'
import {
  CheckCircle, XCircle, Clock, ArrowClockwise,
  Warning,
} from '@phosphor-icons/react'

interface Props {
  runs: FeedRun[]
  loading: boolean
  onRefresh: () => void
}

function statusIcon(status: FeedRun['status']) {
  if (status === 'success') return <CheckCircle size={14} color="var(--accent)" weight="fill" />
  if (status === 'error')   return <XCircle size={14} color="var(--error, #e53e3e)" weight="fill" />
  if (status === 'partial') return <Warning size={14} color="var(--warning, #d97706)" weight="fill" />
  return <Clock size={14} color="var(--text-tertiary)" weight="fill" />
}

function formatDuration(ms: number | null) {
  if (!ms) return '–'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatCost(eur: number | null) {
  if (!eur) return null
  if (eur < 0.001) return '<0.001 €'
  return `${eur.toFixed(3)} €`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function RunHistoryPanel({ runs, loading, onRefresh }: Props) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Run-Historie
        </span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Aktualisieren"
        >
          <ArrowClockwise size={14} weight="bold" />
        </button>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Lade...</p>
      ) : runs.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Noch keine Runs.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {runs.map((run) => (
            <div
              key={run.id}
              className="card"
              style={{ padding: '10px 14px', fontSize: 13 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {statusIcon(run.status)}
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {formatTime(run.startedAt)}
                </span>
                <span style={{ color: 'var(--text-tertiary)', marginLeft: 'auto', fontSize: 12 }}>
                  {run.triggeredBy === 'manual' ? 'manuell' : run.triggeredBy}
                  {run.durationMs ? ` · ${formatDuration(run.durationMs)}` : ''}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)', fontSize: 12 }}>
                <span>Gefunden: <strong>{run.itemsFound}</strong></span>
                <span>Bewertet: <strong>{run.itemsScored}</strong></span>
                <span>Verteilt: <strong>{run.itemsDistributed}</strong></span>
                {run.costEur ? (
                  <span style={{ color: 'var(--text-tertiary)' }}>{formatCost(run.costEur)}</span>
                ) : null}
              </div>

              {run.errors && run.errors.length > 0 && (
                <div style={{ marginTop: 6, padding: '6px 8px', background: 'rgba(229,62,62,0.06)', borderRadius: 4 }}>
                  {run.errors.slice(0, 2).map((e, i) => (
                    <p key={i} style={{ fontSize: 12, color: 'var(--error, #e53e3e)', margin: 0 }}>
                      {e.step}: {e.message}
                    </p>
                  ))}
                  {run.errors.length > 2 && (
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
                      +{run.errors.length - 2} weitere Fehler
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: FeedRun type prüfen**

Sicherstellen dass `src/types/feeds.ts` folgende Felder hat (ggf. ergänzen):
- `costEur: number | null`
- `durationMs: number | null`
- `triggeredBy: 'cron' | 'manual' | 'webhook'`
- `errors: FeedRunError[] | null`

Wenn Felder fehlen: in `FeedRun` interface ergänzen + `mapFeedRun()` (falls vorhanden) updaten.

- [ ] **Step 3: TypeScript check**
```bash
cd "/c/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```

---

## Task 4: DistributionsPanel Komponente

**File:** `src/app/feeds/_components/DistributionsPanel.tsx` (neu anlegen)

User sehen aktuelle Outputs eines Feeds und können neue hinzufügen / löschen.

- [ ] **Step 1: Komponente erstellen**

```typescript
'use client'
// src/app/feeds/_components/DistributionsPanel.tsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash, FolderSimple, SquaresFour, Bell } from '@phosphor-icons/react'
import type { FeedDistribution } from '@/types/feeds'

interface Target {
  id: string
  name: string
}

interface Props {
  sourceId: string
  projects: Target[]
  workspaces: Target[]
}

const TARGET_TYPE_LABEL: Record<string, string> = {
  project:      'Projekt',
  workspace:    'Workspace',
  notification: 'Notification',
}

function targetIcon(type: string) {
  if (type === 'project')      return <FolderSimple size={14} weight="fill" color="var(--text-secondary)" />
  if (type === 'workspace')    return <SquaresFour size={14} weight="fill" color="var(--text-secondary)" />
  return <Bell size={14} weight="fill" color="var(--text-secondary)" />
}

export default function DistributionsPanel({ sourceId, projects, workspaces }: Props) {
  const [dists, setDists]         = useState<FeedDistribution[]>([])
  const [loading, setLoading]     = useState(true)
  const [adding, setAdding]       = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  // Form state
  const [targetType, setTargetType] = useState<'project' | 'workspace' | 'notification'>('project')
  const [targetId, setTargetId]     = useState('')
  const [minScore, setMinScore]     = useState(7)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/feeds/${sourceId}/distributions`)
      const json = await res.json()
      setDists(json.distributions ?? [])
    } finally {
      setLoading(false)
    }
  }, [sourceId])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!targetId && targetType !== 'notification') return
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        target_type: targetType,
        target_id:   targetType === 'notification' ? '00000000-0000-0000-0000-000000000000' : targetId,
        min_score:   minScore,
      }
      const res = await fetch(`/api/feeds/${sourceId}/distributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Fehler beim Speichern')
        return
      }
      await load()
      setAdding(false)
      setTargetId('')
      setMinScore(7)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(distId: string) {
    await fetch(`/api/feeds/${sourceId}/distributions/${distId}`, { method: 'DELETE' })
    setDists((prev) => prev.filter((d) => d.id !== distId))
  }

  const targetOptions = targetType === 'project' ? projects : targetType === 'workspace' ? workspaces : []

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Outputs
        </span>
        {!adding && (
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>
            <Plus size={14} weight="bold" /> Hinzufügen
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Lade...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {dists.length === 0 && !adding && (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              Keine Outputs konfiguriert. Items werden nur im Newscenter angezeigt.
            </p>
          )}

          {dists.map((d) => {
            const targets = d.targetType === 'project' ? projects : d.targetType === 'workspace' ? workspaces : []
            const target = targets.find((t) => t.id === d.targetId)
            return (
              <div key={d.id} className="card" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                {targetIcon(d.targetType)}
                <span style={{ color: 'var(--text-primary)' }}>
                  {TARGET_TYPE_LABEL[d.targetType]}
                  {target ? `: ${target.name}` : d.targetType !== 'notification' ? ` (ID: ${d.targetId.slice(0, 8)}…)` : ''}
                </span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>ab Score {d.minScore}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => handleDelete(d.id)}
                  aria-label="Output entfernen"
                >
                  <Trash size={14} weight="bold" />
                </button>
              </div>
            )
          })}

          {adding && (
            <div className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['project', 'workspace', 'notification'] as const).map((t) => (
                  <button
                    key={t}
                    className={`chip${targetType === t ? ' chip--active' : ''}`}
                    onClick={() => { setTargetType(t); setTargetId('') }}
                  >
                    {TARGET_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>

              {targetType !== 'notification' && (
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  style={{ fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                >
                  <option value="">– {TARGET_TYPE_LABEL[targetType]} wählen –</option>
                  {targetOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Min. Score:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  style={{ width: 56, fontSize: 13, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>(1–10)</span>
              </div>

              {error && <p style={{ fontSize: 12, color: 'var(--error, #e53e3e)', margin: 0 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleAdd}
                  disabled={saving || (targetType !== 'notification' && !targetId)}
                >
                  {saving ? 'Speichern…' : 'Hinzufügen'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setError('') }}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**
```bash
cd "/c/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
```

---

## Task 5: SourcesView — Panels integrieren

**File:** `src/app/feeds/SourcesView.tsx`

Die bestehende Source-Karte wird um zwei aufklappbare Panels erweitert: Run-History und Outputs.

- [ ] **Step 1: Imports + State ergänzen**

Öffne `SourcesView.tsx`. Ergänze Imports:
```typescript
import RunHistoryPanel from './_components/RunHistoryPanel'
import DistributionsPanel from './_components/DistributionsPanel'
```

Ergänze State im Komponenten-Body (nach `runHistory`):
```typescript
const [expandedPanel, setExpandedPanel] = useState<Record<string, 'runs' | 'outputs' | null>>({})
const [projects, setProjects]           = useState<{ id: string; name: string }[]>([])
const [workspaces, setWorkspaces]       = useState<{ id: string; name: string }[]>([])
```

- [ ] **Step 2: Projekte + Workspaces laden**

In `useEffect` beim Laden (oder eigener `useEffect`), lade einmalig die verfügbaren Ziele:
```typescript
useEffect(() => {
  Promise.all([
    fetch('/api/projects').then(r => r.json()),
    fetch('/api/workspaces').then(r => r.json()),
  ]).then(([pJson, wJson]) => {
    setProjects((pJson.projects ?? []).map((p: Record<string, unknown>) => ({ id: p.id, name: p.name })))
    setWorkspaces((wJson.workspaces ?? []).map((w: Record<string, unknown>) => ({ id: w.id, name: w.name })))
  })
}, [])
```

- [ ] **Step 3: Panel-Toggle-Buttons in Source-Karte**

In der Source-Karte (unter Pause/Resume/Run-Buttons), füge zwei Toggle-Buttons hinzu:

```tsx
{/* Panel-Toggles */}
<div style={{ display: 'flex', gap: 6, marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
  <button
    className={`chip${expandedPanel[source.id] === 'runs' ? ' chip--active' : ''}`}
    onClick={() => setExpandedPanel(p => ({ ...p, [source.id]: p[source.id] === 'runs' ? null : 'runs' }))}
  >
    Run-Historie
  </button>
  <button
    className={`chip${expandedPanel[source.id] === 'outputs' ? ' chip--active' : ''}`}
    onClick={() => setExpandedPanel(p => ({ ...p, [source.id]: p[source.id] === 'outputs' ? null : 'outputs' }))}
  >
    Outputs
  </button>
</div>

{/* Panels */}
{expandedPanel[source.id] === 'runs' && (
  <RunHistoryPanel
    runs={runHistory}
    loading={fetchingId === source.id}
    onRefresh={() => fetchRuns(source.id)}
  />
)}
{expandedPanel[source.id] === 'outputs' && (
  <DistributionsPanel
    sourceId={source.id}
    projects={projects}
    workspaces={workspaces}
  />
)}
```

Ersetze die bisherige einfache Run-History-Liste (L359–380) mit dem `RunHistoryPanel`.

- [ ] **Step 4: TypeScript + Design-Lint**
```bash
cd "/c/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
node scripts/ci/lint-design-system.mjs 2>&1 | grep -i "error" | head -10
```

- [ ] **Step 5: Commit**
```bash
git add src/app/feeds/
git commit -m "feat(feeds): RunHistoryPanel + DistributionsPanel in SourcesView"
```

---

## Task 6: Notification-Badge in Feeds-Tab

**File:** `src/app/feeds/_components/NotificationBadge.tsx` (neu)
**File:** `src/app/feeds/page.tsx` (modify)

Ungelesene Feed-Notifications als Badge + Mini-Dropdown im Feeds-Tab.

- [ ] **Step 1: NotificationBadge Komponente**

```typescript
'use client'
// src/app/feeds/_components/NotificationBadge.tsx
import { useState, useEffect, useCallback } from 'react'
import { Bell, X } from '@phosphor-icons/react'

interface FeedNotification {
  id: string
  title: string
  body: string | null
  type: string
  isRead: boolean
  createdAt: string
}

export default function NotificationBadge() {
  const [notifications, setNotifications] = useState<FeedNotification[]>([])
  const [open, setOpen]                   = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/feeds/notifications?unread=true&limit=10')
    const json = await res.json()
    setNotifications(json.notifications ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  const unreadCount = notifications.filter(n => !n.isRead).length

  async function markAllRead() {
    await fetch('/api/feeds/notifications', { method: 'PATCH' })
    setNotifications([])
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen(o => !o)}
        aria-label={`${unreadCount} ungelesene Notifications`}
        style={{ position: 'relative' }}
      >
        <Bell size={16} weight={unreadCount > 0 ? 'fill' : 'bold'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--accent)', border: '1.5px solid var(--bg-base)',
          }} />
        )}
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', right: 0, top: 36, zIndex: 50,
            width: 320, maxHeight: 400, overflowY: 'auto',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '8px 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px 10px' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Benachrichtigungen
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {unreadCount > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={markAllRead} style={{ fontSize: 11 }}>
                    Alle gelesen
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Schließen">
                  <X size={14} weight="bold" />
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '8px 14px' }}>
                Keine neuen Benachrichtigungen.
              </p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} style={{ padding: '8px 14px', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '0 0 2px' }}>{n.title}</p>
                  {n.body && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{n.body}</p>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                    {new Date(n.createdAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: In feeds/page.tsx einbinden**

Import ergänzen:
```typescript
import NotificationBadge from './_components/NotificationBadge'
```

In der Header-Area (neben View-Chips) einbinden:
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  {/* bestehende Chips */}
  <NotificationBadge />
</div>
```

- [ ] **Step 3: TypeScript + Design-Lint**
```bash
cd "/c/Users/timmr/tropenOS" && npx tsc --noEmit 2>&1 | head -20
node scripts/ci/lint-design-system.mjs 2>&1 | grep -i "error" | head -10
```

- [ ] **Step 4: Commit**
```bash
git add src/app/feeds/
git commit -m "feat(feeds): notification badge with unread count + mini-dropdown"
```

---

## Task 7: CLAUDE.md + Architect Log

- [ ] **Step 1: CLAUDE.md aktualisieren**

In der Migrations-Tabelle ergänzen (falls neue Migration nötig war):
```
| 20260320000060_xxx.sql | ... |
```

Unter "Feeds" (oder als neuer Abschnitt nach den Feed-Runs-Infos in CLAUDE.md):
```markdown
### Feeds — Distributions + Run-History (Plan J1 — Stand 2026-03-20)

| Datei | Inhalt |
|-------|--------|
| `src/app/api/feeds/[id]/distributions/route.ts` | GET list + POST create |
| `src/app/api/feeds/[id]/distributions/[distId]/route.ts` | DELETE |
| `src/lib/feeds/distributor.ts` | project target_type jetzt implementiert |
| `src/app/feeds/_components/RunHistoryPanel.tsx` | Run-Details mit Kosten + Fehler |
| `src/app/feeds/_components/DistributionsPanel.tsx` | Outputs konfigurieren (project/workspace/notification) |
| `src/app/feeds/_components/NotificationBadge.tsx` | Ungelesene Notifications mit Badge |

**Distributions-Regeln:**
- Nur owner/admin darf Distributions anlegen/löschen
- target_type 'notification': target_id ist Dummy-UUID (alle Org-Member werden notifiziert)
- target_type 'project': Items landen in project_memory (memory_type='feed_item')
- target_type 'workspace': Items landen in knowledge_entries (entry_type='feed')
- min_score (1–10) filtert: Items unter dem Score werden nicht weitergeleitet
```

- [ ] **Step 2: Architect Log Eintrag**

```markdown
## 2026-03-20 — Plan J1: Feeds autonom (Distributions + Run-History)

**Was gebaut wurde:**
- Distributions CRUD API (/api/feeds/[id]/distributions)
- Project-Distribution in distributor.ts (items → project_memory)
- RunHistoryPanel: Kosten, Fehler-Details, Items-Breakdown
- DistributionsPanel: Outputs konfigurieren direkt in SourcesView
- NotificationBadge: unread count + mini-dropdown

**Was es bedeutet:**
Feeds sind jetzt echte Produktions-Tools. Items können automatisch in Projekte,
Workspaces und als Notifications weitergeleitet werden. Die Run-History zeigt
ob Feeds korrekt laufen und was sie kosten.

**Nächste Schritte:**
Plan J2a: agent_skills-System + skill-resolver für autonome Agenten.
```

- [ ] **Step 3: Final checks + Commit**
```bash
cd "/c/Users/timmr/tropenOS" && npx tsc --noEmit && node scripts/ci/lint-design-system.mjs 2>&1 | tail -5
git add CLAUDE.md docs/architect-log.md
git commit -m "docs: update CLAUDE.md + architect-log for Plan J1"
```

---

## Offene Punkte (nicht in J1 — für später)

| Punkt | Warum nicht jetzt |
|-------|-------------------|
| Budget-Check vor Cron-Run | Braucht Budget-System (Plan J3) |
| `/feeds/[id]` Detail-Page | Separater Plan F2 — SourcesView reicht vorerst |
| Notification-Read per item | PATCH /api/feeds/notifications/:id — kleines Feature, bei Bedarf |
| `feed_distributions` UI für min_score editieren | POST+DELETE reicht, kein PATCH nötig |
| E-Mail-Notifications | Resend-Integration — Plan nach J2 |
