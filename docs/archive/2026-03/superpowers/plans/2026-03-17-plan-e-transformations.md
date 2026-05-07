# Transformations-Engine (Plan E) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** KI-analysiert Projekte/Workspaces und schlägt Transformationen vor (→ Workspace / Feed) — immer Preview → Bestätigung → Ausführung, nie destruktiv.

**Architecture:** Three-step flow: `analyze` (AI call, no DB write) → `create` (pending transformation record) → `execute` (build target entity + link). DB schema already exists (migration 032). Anthropic SDK direkt.

**Tech Stack:** Next.js App Router, Anthropic SDK (`claude-haiku-4-5-20251001`), supabaseAdmin, Zod v4, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/validators/transformations.ts` | Create | Zod schemas: AnalyzeSchema, CreateTransformationSchema, ExecuteSchema |
| `src/lib/validators/transformations.unit.test.ts` | Create | Validator unit tests |
| `src/app/api/transformations/analyze/route.ts` | Create | POST — AI-Analyse, kein DB-Write, gibt Suggestions zurück |
| `src/app/api/transformations/route.ts` | Create | GET (list) + POST (create pending) |
| `src/app/api/transformations/[id]/route.ts` | Create | GET (detail) + PATCH (execute) |

---

## Task 1: Zod Validators

**Files:**
- Create: `src/lib/validators/transformations.ts`
- Create: `src/lib/validators/transformations.unit.test.ts`

- [ ] **Step 1: Write the validators**

```typescript
// src/lib/validators/transformations.ts
import { z } from 'zod'

export const analyzeSchema = z.object({
  source_type: z.enum(['project', 'workspace']),
  source_id:   z.string().uuid(),
})

export const createTransformationSchema = z.object({
  source_type:   z.enum(['project', 'workspace']),
  source_id:     z.string().uuid(),
  target_type:   z.enum(['workspace', 'feed']),
  suggested_meta: z.record(z.unknown()).optional(),
})

export const executeTransformationSchema = z.object({
  action: z.literal('execute'),
})

export type AnalyzeInput            = z.infer<typeof analyzeSchema>
export type CreateTransformationInput = z.infer<typeof createTransformationSchema>
```

- [ ] **Step 2: Write validator tests**

```typescript
// src/lib/validators/transformations.unit.test.ts
import { describe, it, expect } from 'vitest'
import { analyzeSchema, createTransformationSchema, executeTransformationSchema } from './transformations'

const UUID = '550e8400-e29b-41d4-a716-446655440001'

describe('analyzeSchema', () => {
  it('accepts valid input', () => {
    const r = analyzeSchema.safeParse({ source_type: 'project', source_id: UUID })
    expect(r.success).toBe(true)
  })
  it('rejects invalid source_type', () => {
    const r = analyzeSchema.safeParse({ source_type: 'agent', source_id: UUID })
    expect(r.success).toBe(false)
  })
  it('rejects non-uuid source_id', () => {
    const r = analyzeSchema.safeParse({ source_type: 'project', source_id: 'not-a-uuid' })
    expect(r.success).toBe(false)
  })
})

describe('createTransformationSchema', () => {
  it('accepts workspace target', () => {
    const r = createTransformationSchema.safeParse({
      source_type: 'project', source_id: UUID, target_type: 'workspace',
    })
    expect(r.success).toBe(true)
  })
  it('accepts feed target', () => {
    const r = createTransformationSchema.safeParse({
      source_type: 'project', source_id: UUID, target_type: 'feed',
    })
    expect(r.success).toBe(true)
  })
  it('rejects agent target (not implemented)', () => {
    const r = createTransformationSchema.safeParse({
      source_type: 'project', source_id: UUID, target_type: 'agent',
    })
    expect(r.success).toBe(false)
  })
})

describe('executeTransformationSchema', () => {
  it('accepts execute action', () => {
    const r = executeTransformationSchema.safeParse({ action: 'execute' })
    expect(r.success).toBe(true)
  })
  it('rejects wrong action', () => {
    const r = executeTransformationSchema.safeParse({ action: 'delete' })
    expect(r.success).toBe(false)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec vitest run src/lib/validators/transformations.unit.test.ts
```
Expected: 6 tests pass

- [ ] **Step 4: Commit**

```bash
git add src/lib/validators/transformations.ts src/lib/validators/transformations.unit.test.ts
git commit -m "feat(transformations): add Zod validators + tests"
```

---

## Task 2: Analyze Route

**Files:**
- Create: `src/app/api/transformations/analyze/route.ts`

- [ ] **Step 1: Write the analyze route**

```typescript
// src/app/api/transformations/analyze/route.ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { analyzeSchema } from '@/lib/validators/transformations'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { data: body, error: valErr } = await validateBody(request, analyzeSchema)
  if (valErr) return valErr

  const { source_type, source_id } = body

  // Load source entity
  let sourceTitle = ''
  let sourceGoal = ''
  let sourceInstructions = ''

  if (source_type === 'project') {
    const { data } = await supabaseAdmin
      .from('projects')
      .select('title, goal, instructions')
      .eq('id', source_id)
      .is('deleted_at', null)
      .single()
    if (!data) return NextResponse.json({ error: 'Projekt nicht gefunden' }, { status: 404 })
    sourceTitle = data.title
    sourceGoal = data.goal ?? ''
    sourceInstructions = data.instructions ?? ''
  } else {
    const { data } = await supabaseAdmin
      .from('workspaces')
      .select('title, goal, domain')
      .eq('id', source_id)
      .is('deleted_at', null)
      .single()
    if (!data) return NextResponse.json({ error: 'Workspace nicht gefunden' }, { status: 404 })
    sourceTitle = data.title
    sourceGoal = data.goal ?? ''
    sourceInstructions = data.domain ?? ''
  }

  const prompt = `Du analysierst ein ${source_type === 'project' ? 'Projekt' : 'Workspace'} und schlägst sinnvolle Transformationen vor.

Quelle:
- Titel: ${sourceTitle}
- Ziel: ${sourceGoal}
- Kontext: ${sourceInstructions}

Mögliche Transformationstypen:
- workspace: Erstellt einen Arbeitsbereich mit Karten für tägl. Briefings und Analyse
- feed: Erstellt eine News-Quelle, die relevante Informationen zu diesem Thema sammelt

Antworte NUR mit einem JSON-Array (max. 2 Einträge), keine weiteren Texte:
[
  {
    "target_type": "workspace" | "feed",
    "title": "Vorgeschlagener Name",
    "rationale": "Kurze Begründung (1 Satz)",
    "config": { ... }
  }
]

Für "feed" enthält config: { "search_query": "...", "language": "de" | "en" }
Für "workspace" enthält config: { "goal": "...", "domain": "..." }`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '[]'

  let suggestions: unknown[] = []
  try {
    const parsed = JSON.parse(raw)
    suggestions = Array.isArray(parsed) ? parsed.slice(0, 2) : []
  } catch {
    suggestions = []
  }

  return NextResponse.json({ suggestions, source_type, source_id })
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/transformations/analyze/route.ts
git commit -m "feat(transformations): add analyze route — AI suggests transformations"
```

---

## Task 3: Transformations CRUD Routes

**Files:**
- Create: `src/app/api/transformations/route.ts`
- Create: `src/app/api/transformations/[id]/route.ts`

- [ ] **Step 1: Write the list + create route**

```typescript
// src/app/api/transformations/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'
import { validateBody } from '@/lib/validators'
import { createTransformationSchema } from '@/lib/validators/transformations'

// GET /api/transformations?source_type=project&source_id=...
export async function GET(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const source_type = searchParams.get('source_type')
  const source_id   = searchParams.get('source_id')

  if (!source_type || !source_id) {
    return NextResponse.json({ error: 'source_type und source_id erforderlich' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('transformations')
    .select('*')
    .eq('source_type', source_type)
    .eq('source_id', source_id)
    .eq('created_by', me.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

// POST /api/transformations — create pending transformation (preview)
export async function POST(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { data: body, error: valErr } = await validateBody(request, createTransformationSchema)
  if (valErr) return valErr

  const { data, error } = await supabaseAdmin
    .from('transformations')
    .insert({
      source_type:  body.source_type,
      source_id:    body.source_id,
      target_type:  body.target_type,
      status:       'pending',
      meta:         body.suggested_meta ?? {},
      created_by:   me.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: Write the execute route**

```typescript
// src/app/api/transformations/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'
import { validateBody } from '@/lib/validators'
import { executeTransformationSchema } from '@/lib/validators/transformations'

type Params = { params: Promise<{ id: string }> }

// GET /api/transformations/[id]
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('transformations')
    .select('*')
    .eq('id', id)
    .eq('created_by', me.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}

// PATCH /api/transformations/[id] — { action: 'execute' }
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { data: body, error: valErr } = await validateBody(request, executeTransformationSchema)
  if (valErr) return valErr

  // Load transformation
  const { data: tx, error: txErr } = await supabaseAdmin
    .from('transformations')
    .select('*')
    .eq('id', id)
    .eq('created_by', me.id)
    .single()

  if (txErr || !tx) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (tx.status !== 'pending') {
    return NextResponse.json({ error: 'Transformation ist nicht mehr pending' }, { status: 409 })
  }

  // Mark in_progress
  await supabaseAdmin
    .from('transformations')
    .update({ status: 'in_progress' })
    .eq('id', id)

  try {
    let targetId: string | null = null

    if (tx.target_type === 'workspace') {
      // Load source project title/goal
      const { data: src } = await supabaseAdmin
        .from('projects')
        .select('title, goal, department_id')
        .eq('id', tx.source_id)
        .single()

      const meta = (tx.meta ?? {}) as Record<string, unknown>
      const { data: ws, error: wsErr } = await supabaseAdmin
        .from('workspaces')
        .insert({
          title:          (meta.title as string | undefined) ?? `${src?.title ?? ''} — Workspace`,
          goal:           (meta.goal as string | undefined) ?? src?.goal ?? null,
          domain:         (meta.domain as string | undefined) ?? null,
          department_id:  src?.department_id ?? null,
          organization_id: me.organization_id,
          created_by:     me.id,
          status:         'draft',
          meta:           {},
        })
        .select('id')
        .single()

      if (wsErr) throw wsErr
      targetId = ws!.id

      // Add creator as admin
      await supabaseAdmin.from('workspace_participants').insert({
        workspace_id: targetId,
        user_id: me.id,
        role: 'admin',
      })

    } else if (tx.target_type === 'feed') {
      const meta = (tx.meta ?? {}) as Record<string, unknown>
      const { data: feed, error: feedErr } = await supabaseAdmin
        .from('feed_sources')
        .insert({
          organization_id: me.organization_id,
          created_by:      me.id,
          title:           (meta.title as string | undefined) ?? 'Feed',
          search_query:    (meta.config as Record<string, unknown> | undefined)?.search_query ?? '',
          language:        (meta.config as Record<string, unknown> | undefined)?.language ?? 'de',
          is_active:       false,  // user must activate manually
          min_score:       60,
        })
        .select('id')
        .single()

      if (feedErr) throw feedErr
      targetId = feed!.id
    }

    // Mark done + set target_id
    await supabaseAdmin
      .from('transformations')
      .update({ status: 'done', target_id: targetId, completed_at: new Date().toISOString() })
      .eq('id', id)

    // Create transformation link
    if (targetId) {
      await supabaseAdmin.from('transformation_links').insert({
        source_type: tx.source_type,
        source_id:   tx.source_id,
        target_type: tx.target_type,
        target_id:   targetId,
        is_active:   true,
      })
    }

    const { data: updated } = await supabaseAdmin
      .from('transformations')
      .select('*')
      .eq('id', id)
      .single()

    return NextResponse.json(updated)
  } catch (err) {
    await supabaseAdmin
      .from('transformations')
      .update({ status: 'failed' })
      .eq('id', id)

    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm exec tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/transformations/route.ts src/app/api/transformations/[id]/route.ts
git commit -m "feat(transformations): add CRUD + execute routes — project→workspace/feed"
```

---

## Task 4: Update CLAUDE.md + phase2-plans.md

- [ ] **Step 1: Update phase2-plans.md** — Plan E Status auf ✅
- [ ] **Step 2: Update CLAUDE.md** — Transformations-Engine Sektion hinzufügen
- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/phase2-plans.md
git commit -m "chore: update docs — Plan E done"
```
