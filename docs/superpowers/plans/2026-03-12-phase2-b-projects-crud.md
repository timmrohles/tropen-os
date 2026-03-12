# Phase 2 — Plan B: Projekte CRUD + Gedächtnis + Context-Awareness

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Projekte mit neuem Schema zum Leben erwecken — CRUD-API, aktualisierte UI, Gedächtnis-API, und Context-Window-Anzeige im Chat.

**Architecture:** Die alte /api/projects-Route wird komplett ersetzt (neues Schema: department_id, title, goal, instructions statt workspace_id/name). project_memory ist APPEND ONLY, geschrieben via supabaseAdmin. ContextBar zeigt Tokenfüllstand im Chat-Header. MemorySaveModal ermöglicht manuelles Speichern oder AI-Zusammenfassung via Haiku.

**Tech Stack:** Next.js 15 API Routes, supabaseAdmin, @anthropic-ai/sdk (claude-haiku-4-5-20251001 max_tokens:400), React 19, Phosphor Icons, CSS vars

**Wichtig für alle Tasks:**
- Arbeitsverzeichnis: `C:/Users/timmr/tropen OS`
- `department_members.workspace_id` = department ID (historischer Spaltenname — korrekt so)
- KEIN `supabase db push` nötig — alle Tabellen existieren bereits (Migration 030-033)
- `project_memory` APPEND ONLY: kein update, kein delete in Code oder API
- `supabaseAdmin` für alle DB-Operationen in API Routes
- Soft Delete: `deleted_at` setzen, nie hard delete

---

## Chunk A — API Layer

### Task 1: Projekt-API v2 — Route rewrite

**Files:**
- Rewrite: `src/app/api/projects/route.ts`

**What changes:** Die aktuelle Route benutzt `workspace_id` und `name` — beide Spalten existieren nicht mehr im neuen Schema. Kompletter Rewrite auf das neue Schema mit `department_id`, `title`, `goal`, `instructions`, `meta`.

**Steps:**

- [ ] Read `src/app/api/projects/route.ts` to confirm current content (already read — old schema with workspace_id/name)
- [ ] Rewrite `src/app/api/projects/route.ts` with the complete new implementation below
- [ ] Verify the file compiles (no TypeScript errors) by checking import paths
- [ ] Git commit

**Complete file content for `src/app/api/projects/route.ts`:**

```typescript
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('organization_id, role').eq('id', user.id).single()
  if (!profile?.organization_id) return null
  return { id: user.id, organization_id: profile.organization_id, role: profile.role } as
    { id: string; organization_id: string; role: string }
}

/** IDOR-Schutz: department muss zur Organisation des Users gehören. */
async function verifyDeptOrg(departmentId: string, organizationId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('departments').select('id')
    .eq('id', departmentId).eq('organization_id', organizationId).single()
  return !!data
}

/** Lädt department_id eines Projekts für IDOR-Schutz. */
async function getProjectDepartment(projectId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('projects').select('department_id').eq('id', projectId).single()
  return data?.department_id ?? null
}

// GET /api/projects?department_id=...
export async function GET(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const department_id = searchParams.get('department_id')
  if (!department_id) return NextResponse.json({ error: 'department_id fehlt' }, { status: 400 })

  // IDOR-Schutz: department muss zur eigenen Organisation gehören (Superadmin bypassed)
  if (me.role !== 'superadmin') {
    const allowed = await verifyDeptOrg(department_id, me.organization_id)
    if (!allowed) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('id, department_id, title, goal, instructions, meta, created_by, created_at, updated_at')
    .eq('department_id', department_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/projects
export async function POST(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 }) }

  const { department_id, title, goal, instructions } = body as {
    department_id?: string; title?: string; goal?: string; instructions?: string
  }
  if (!department_id || !title?.trim())
    return NextResponse.json({ error: 'department_id und title erforderlich' }, { status: 400 })

  // IDOR-Schutz (Superadmin bypassed)
  if (me.role !== 'superadmin') {
    const allowed = await verifyDeptOrg(department_id, me.organization_id)
    if (!allowed) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      department_id,
      title: title.trim(),
      goal: goal?.trim() ?? null,
      instructions: instructions?.trim() ?? null,
      created_by: me.id,
      meta: {},
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Ersteller als project_participants admin eintragen
  await supabaseAdmin
    .from('project_participants')
    .insert({ project_id: data.id, user_id: me.id, role: 'admin' })
    .select()

  return NextResponse.json(data, { status: 201 })
}
```

**Note:** PATCH and DELETE are moved to `src/app/api/projects/[id]/route.ts` (Task 2). The collection route only handles GET (list) and POST (create).

**Commit:**
```
git add src/app/api/projects/route.ts
git commit -m "feat(api): replace projects API with new schema (department_id, title, goal)"
```

---

### Task 2: Projekt [id] Routes + Memory API

**Files:**
- Create: `src/app/api/projects/[id]/route.ts`
- Create: `src/app/api/projects/[id]/memory/route.ts`
- Create: `src/app/api/projects/[id]/memory/summary/route.ts`

**What changes:** Drei neue verschachtelte Routes für Einzel-Projekt-Operationen (GET/PATCH/DELETE), Gedächtnis-Einträge (GET/POST — APPEND ONLY), und AI-Zusammenfassung (POST via Haiku).

**Steps:**

- [ ] Create directory `src/app/api/projects/[id]/` (Next.js App Router creates it automatically when the file is placed there)
- [ ] Create `src/app/api/projects/[id]/route.ts`
- [ ] Create `src/app/api/projects/[id]/memory/route.ts`
- [ ] Create `src/app/api/projects/[id]/memory/summary/route.ts`
- [ ] Verify `ANTHROPIC_API_KEY` is set in `.env.local`
- [ ] Git commit

**Complete file content for `src/app/api/projects/[id]/route.ts`:**

```typescript
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('organization_id, role').eq('id', user.id).single()
  if (!profile?.organization_id) return null
  return { id: user.id, organization_id: profile.organization_id, role: profile.role } as
    { id: string; organization_id: string; role: string }
}

async function verifyProjectAccess(projectId: string, organizationId: string, isSuperadmin: boolean): Promise<boolean> {
  if (isSuperadmin) return true
  const { data } = await supabaseAdmin
    .from('projects')
    .select('id, departments!inner(organization_id)')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()
  if (!data) return false
  // @ts-expect-error Supabase join typing
  return data.departments?.organization_id === organizationId
}

// GET /api/projects/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const allowed = await verifyProjectAccess(id, me.organization_id, me.role === 'superadmin')
  if (!allowed) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select(`
      id, department_id, title, goal, instructions, meta,
      created_by, created_at, updated_at,
      project_participants(user_id, role, joined_at)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}

// PATCH /api/projects/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const allowed = await verifyProjectAccess(id, me.organization_id, me.role === 'superadmin')
  if (!allowed) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 }) }

  // Allowlist für direkte Felder
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if ('title' in body && typeof body.title === 'string') update.title = body.title.trim()
  if ('goal' in body) update.goal = body.goal
  if ('instructions' in body) update.instructions = body.instructions

  // Meta: merge (nie ersetzen)
  if ('meta' in body && typeof body.meta === 'object' && body.meta !== null) {
    const { data: existing } = await supabaseAdmin
      .from('projects').select('meta').eq('id', id).single()
    update.meta = { ...(existing?.meta ?? {}), ...(body.meta as Record<string, unknown>) }
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/projects/[id]  →  Soft Delete
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const allowed = await verifyProjectAccess(id, me.organization_id, me.role === 'superadmin')
  if (!allowed) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

**Complete file content for `src/app/api/projects/[id]/memory/route.ts`:**

```typescript
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('organization_id, role').eq('id', user.id).single()
  if (!profile?.organization_id) return null
  return { id: user.id, organization_id: profile.organization_id, role: profile.role } as
    { id: string; organization_id: string; role: string }
}

// GET /api/projects/[id]/memory
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('project_memory')
    .select('id, project_id, type, content, source_conversation_id, importance, tags, frozen, created_at')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/projects/[id]/memory  — APPEND ONLY, kein Update/Delete Handler
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 }) }

  const { type, content, conversation_id, importance, tags, frozen } = body as {
    type?: string
    content?: string
    conversation_id?: string
    importance?: string
    tags?: string[]
    frozen?: boolean
  }

  if (!type || !content?.trim())
    return NextResponse.json({ error: 'type und content erforderlich' }, { status: 400 })

  const validTypes = ['insight', 'decision', 'open_question', 'summary', 'fact']
  if (!validTypes.includes(type))
    return NextResponse.json({ error: `Ungültiger type. Erlaubt: ${validTypes.join(', ')}` }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('project_memory')
    .insert({
      project_id: id,
      type,
      content: content.trim(),
      source_conversation_id: conversation_id ?? null,
      importance: importance ?? 'medium',
      tags: tags ?? [],
      frozen: frozen ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

**Complete file content for `src/app/api/projects/[id]/memory/summary/route.ts`:**

```typescript
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('organization_id, role').eq('id', user.id).single()
  if (!profile?.organization_id) return null
  return { id: user.id, organization_id: profile.organization_id, role: profile.role } as
    { id: string; organization_id: string; role: string }
}

// POST /api/projects/[id]/memory/summary
// Body: { conversation_id: string }
// Lädt Messages, ruft Haiku zur Analyse auf, speichert frozen Summary in project_memory
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 }) }

  const { conversation_id } = body as { conversation_id?: string }
  if (!conversation_id)
    return NextResponse.json({ error: 'conversation_id erforderlich' }, { status: 400 })

  // Nachrichten laden (max. 8000 Zeichen)
  const { data: messages, error: msgError } = await supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: true })

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 })
  if (!messages || messages.length === 0)
    return NextResponse.json({ error: 'Keine Nachrichten in diesem Gespräch' }, { status: 400 })

  // Gesprächstext aufbauen, max 8000 Zeichen
  let convText = ''
  for (const msg of messages) {
    const prefix = msg.role === 'user' ? 'Nutzer: ' : 'Toro: '
    const line = `${prefix}${msg.content}\n\n`
    if ((convText + line).length > 8000) break
    convText += line
  }

  // Haiku aufrufen
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  let summary: string
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Analysiere dieses Gespräch und extrahiere die wichtigsten Erkenntnisse, Entscheidungen und offene Fragen.
Format: Kompakte Bullet-Liste, max. 5 Punkte. Jeder Punkt beginnt mit [Erkenntnis], [Entscheidung] oder [Offen].

Gespräch:
${convText}`
      }]
    })
    summary = (response.content[0] as { type: string; text: string }).text.trim()
  } catch (err) {
    console.error('[memory/summary] Haiku error:', err)
    return NextResponse.json({ error: 'AI-Analyse fehlgeschlagen' }, { status: 500 })
  }

  // Als frozen summary in project_memory speichern (APPEND ONLY)
  const { data, error: insertError } = await supabaseAdmin
    .from('project_memory')
    .insert({
      project_id: id,
      type: 'summary',
      content: summary,
      source_conversation_id: conversation_id,
      importance: 'high',
      tags: ['auto-summary'],
      frozen: true,
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

**Commit:**
```
git add src/app/api/projects/[id]/route.ts src/app/api/projects/[id]/memory/route.ts src/app/api/projects/[id]/memory/summary/route.ts
git commit -m "feat(api): add projects [id] routes and project memory API"
```

---

## Chunk B — Page + Types

### Task 3: Project Type Update + Projects Page Rewrite

**Files:**
- Modify: `src/hooks/useWorkspaceState.ts` (Project interface only)
- Rewrite: `src/app/projects/page.tsx`

**What changes:** Das `Project`-Interface in `useWorkspaceState.ts` benutzt noch `name`, `description`, `context`, `tone` etc. — alles nicht mehr in der DB. Außerdem benutzt `LeftNav.tsx` bei Zeile 189 `p.name` für die Projekt-Liste in der Move-Auswahl — das muss ebenfalls auf `p.title` umgestellt werden. `projects/page.tsx` wird komplett umgeschrieben.

**Steps:**

- [ ] Read `src/hooks/useWorkspaceState.ts` lines 43-56 (current Project interface)
- [ ] Replace the `Project` interface in `src/hooks/useWorkspaceState.ts`
- [ ] Read `src/components/workspace/LeftNav.tsx` around line 189 — fix `p.name` → `p.title`
- [ ] Read `src/components/workspace/ProjectSidebar.tsx` around lines 354-364 — fix `project.name` → `project.title` and `onSetEditingProjectName` references (the function name stays, but the value changes from `project.name` to `project.title`)
- [ ] Read `src/components/workspace/WorkspaceLayout.tsx` around line 398 — fix `p.name` → `p.title`
- [ ] Read `src/components/workspace/modals/MergeModal.tsx` around line 110 — fix `p.name` → `p.title`
- [ ] Rewrite `src/app/projects/page.tsx`
- [ ] Git commit

**New `Project` interface for `src/hooks/useWorkspaceState.ts`** — replace lines 43-56:

```typescript
export interface Project {
  id: string
  title: string
  goal: string | null
  instructions: string | null
  meta: Record<string, unknown>
  department_id: string
  created_by: string
  created_at: string
  updated_at: string | null
  conversations?: string[]  // kept for LeftNav grouping
}
```

**Also update `loadProjects` in `useWorkspaceState.ts`:** The function currently calls `/api/projects?workspace_id=...` — change the param name to `department_id`. The workspace/department ID variable is likely called `workspaceId` internally; the query param name changes but the value is the same department ID.

Search for the `loadProjects` function and update:
```typescript
// OLD:
const res = await fetch(`/api/projects?workspace_id=${wsId}`)
// NEW:
const res = await fetch(`/api/projects?department_id=${wsId}`)
```

**Fix `p.name` in `src/components/workspace/LeftNav.tsx` line 189:**
```tsx
// OLD:
{p.name}
// NEW:
{p.title}
```

**Fix `p.name` in `src/components/workspace/WorkspaceLayout.tsx`** (line ~398):
```tsx
// OLD:
{p.name}
// NEW:
{p.title}
```

**Fix `p.name` in `src/components/workspace/modals/MergeModal.tsx`** (line ~110):
```tsx
// OLD:
{p.name}
// NEW:
{p.title}
```

**Fix `project.name` in `src/components/workspace/ProjectSidebar.tsx`** (lines ~354, ~356, ~364):
```tsx
// OLD (each occurrence):
onSetEditingProjectName(project.name)
// and:
>{project.name}</span>
// NEW:
onSetEditingProjectName(project.title)
// and:
>{project.title}</span>
```

**Complete file content for `src/app/projects/page.tsx`:**

```tsx
'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  FolderOpen, Robot, Users, BookOpen, Lock,
  Plus, PencilSimple, Trash, FloppyDisk, X,
  LightbulbFilament,
} from '@phosphor-icons/react'
import { TEMPLATES } from '@/lib/prompt-templates'
import type { Project } from '@/hooks/useWorkspaceState'

type Tab = 'projects' | 'agents' | 'community' | 'templates'

interface Agent {
  id: string
  name: string
  description: string | null
  system_prompt: string | null
  visibility: 'private' | 'org'
  created_at: string
}

type AgentVisibility = 'private' | 'org'
const EMPTY_AGENT_FORM: { name: string; description: string; system_prompt: string; visibility: AgentVisibility } = {
  name: '', description: '', system_prompt: '', visibility: 'private'
}

const inp: React.CSSProperties = {
  width: '100%', background: '#fff', border: '1px solid var(--border-medium)',
  borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
  fontSize: 13, boxSizing: 'border-box', outline: 'none',
  fontFamily: 'var(--font-sans, system-ui)',
}
const textarea: React.CSSProperties = { ...inp, minHeight: 96, resize: 'vertical' as const }

const s: Record<string, React.CSSProperties> = {
  page: { padding: '32px 0 48px' },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.03em' },
  sub: { fontSize: 14, color: 'var(--text-secondary)', margin: 0 },
  tabs: { display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 },
  tab: { padding: '8px 16px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', borderBottom: '2px solid transparent', marginBottom: -1 },
  tabActive: { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { background: 'var(--bg-surface)', borderRadius: 12, padding: 20, border: '1px solid var(--border)', cursor: 'pointer', transition: 'box-shadow 0.15s' },
  cardActive: { boxShadow: '0 0 0 2px var(--accent)' },
  cardTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' },
  cardSub: { fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 },
  addCard: { background: 'var(--bg-surface)', borderRadius: 12, padding: 20, border: '2px dashed var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--accent)', fontSize: 14, fontWeight: 600 },
  detail: { background: 'var(--bg-surface)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  detailTitle: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'block', marginBottom: 4 },
  fieldGroup: { marginBottom: 16 },
  actions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' },
  btnPrimary: { padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  btnGhost: { padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' },
  btnDanger: { padding: '8px 16px', background: 'none', border: '1px solid #dc2626', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#dc2626' },
  empty: { textAlign: 'center' as const, padding: '48px 24px', color: 'var(--text-tertiary)' },
  error: { color: '#dc2626', fontSize: 12, marginTop: 4 },
  newForm: { background: 'var(--bg-surface)', borderRadius: 12, padding: 20, border: '1px solid var(--accent)', marginBottom: 16 },
  newFormTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' },
  tplCard: { background: 'var(--bg-surface)', borderRadius: 12, padding: 20, border: '1px solid var(--border)' },
  tplTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' },
  tplSub: { fontSize: 12, color: 'var(--text-secondary)', margin: 0 },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'var(--accent-light)', color: 'var(--accent)', marginLeft: 8 },
}

export default function ProjectsPage() {
  const [tab, setTab] = useState<Tab>('projects')
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  // Project form state
  const [editForm, setEditForm] = useState({ title: '', goal: '', instructions: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [newError, setNewError] = useState<string | null>(null)

  // Agent state (kept as-is — separate fetch to /api/agents)
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agentForm, setAgentForm] = useState<{ name: string; description: string; system_prompt: string; visibility: AgentVisibility }>(EMPTY_AGENT_FORM)
  const [agentSaving, setAgentSaving] = useState(false)
  const [agentDeleteConfirm, setAgentDeleteConfirm] = useState(false)
  const [creatingAgent, setCreatingAgent] = useState(false)

  const loadProjects = useCallback(async (deptId: string) => {
    const res = await fetch(`/api/projects?department_id=${deptId}`)
    if (res.ok) setProjects(await res.json())
  }, [])

  const loadDepartment = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      // department_members.workspace_id stores the department_id (historical column name)
      const { data: membership } = await supabase
        .from('department_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      const deptId = membership?.workspace_id ?? null
      setDepartmentId(deptId)
      if (deptId) await loadProjects(deptId)
    } catch (err) {
      console.error('[projects] loadDepartment error:', err)
    } finally {
      setLoading(false)
    }
  }, [loadProjects])

  useEffect(() => { loadDepartment() }, [loadDepartment])

  // Agents tab — unchanged fetch to /api/agents
  useEffect(() => {
    if (tab !== 'agents') return
    setAgentsLoading(true)
    fetch('/api/agents')
      .then(r => r.ok ? r.json() : [])
      .then(setAgents)
      .catch(() => setAgents([]))
      .finally(() => setAgentsLoading(false))
  }, [tab])

  // Select a project → populate edit form
  function handleSelectProject(p: Project) {
    setSelected(p)
    setEditForm({ title: p.title, goal: p.goal ?? '', instructions: p.instructions ?? '' })
    setSaveError(null)
    setDeleteConfirm(false)
  }

  async function handleCreateProject() {
    if (!departmentId || !newTitle.trim()) return
    setNewError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_id: departmentId, title: newTitle.trim(), goal: newGoal.trim() || null }),
      })
      if (!res.ok) {
        const err = await res.json()
        setNewError(err.error ?? 'Fehler beim Erstellen')
        return
      }
      const created: Project = await res.json()
      setProjects(prev => [created, ...prev])
      setCreating(false)
      setNewTitle('')
      setNewGoal('')
      handleSelectProject(created)
    } catch {
      setNewError('Netzwerkfehler')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProject() {
    if (!selected) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/projects/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          goal: editForm.goal.trim() || null,
          instructions: editForm.instructions.trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setSaveError(err.error ?? 'Fehler beim Speichern')
        return
      }
      const updated: Project = await res.json()
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
      setSelected(updated)
    } catch {
      setSaveError('Netzwerkfehler')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProject() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${selected.id}`, { method: 'DELETE' })
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== selected.id))
        setSelected(null)
        setDeleteConfirm(false)
      }
    } catch {
      setSaveError('Löschen fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  // ── Agent handlers (unchanged logic, just kept here) ──

  async function handleCreateAgent() {
    if (!agentForm.name.trim()) return
    setAgentSaving(true)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentForm),
      })
      if (res.ok) {
        const created: Agent = await res.json()
        setAgents(prev => [created, ...prev])
        setCreatingAgent(false)
        setAgentForm(EMPTY_AGENT_FORM)
        setSelectedAgent(created)
      }
    } finally { setAgentSaving(false) }
  }

  async function handleSaveAgent() {
    if (!selectedAgent) return
    setAgentSaving(true)
    try {
      const res = await fetch(`/api/agents/${selectedAgent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentForm),
      })
      if (res.ok) {
        const updated: Agent = await res.json()
        setAgents(prev => prev.map(a => a.id === updated.id ? updated : a))
        setSelectedAgent(updated)
      }
    } finally { setAgentSaving(false) }
  }

  async function handleDeleteAgent() {
    if (!selectedAgent) return
    setAgentSaving(true)
    try {
      const res = await fetch(`/api/agents/${selectedAgent.id}`, { method: 'DELETE' })
      if (res.ok) {
        setAgents(prev => prev.filter(a => a.id !== selectedAgent.id))
        setSelectedAgent(null)
        setAgentDeleteConfirm(false)
        setAgentForm(EMPTY_AGENT_FORM)
      }
    } finally { setAgentSaving(false) }
  }

  function tabStyle(t: Tab): React.CSSProperties {
    return tab === t ? { ...s.tab, ...s.tabActive } : s.tab
  }

  return (
    <div className="content-max" style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Projekte</h1>
        <p style={s.sub}>Smarte Projektordner mit Gedächtnis für deine Departments</p>
      </div>

      <div style={s.tabs}>
        {([['projects', 'Meine Projekte', FolderOpen], ['agents', 'Meine Agenten', Robot], ['community', 'Community', Users], ['templates', 'Vorlagen', BookOpen]] as const).map(([key, label, Icon]) => (
          <button key={key} style={tabStyle(key as Tab)} onClick={() => { setTab(key as Tab); setSelected(null) }}>
            <Icon size={14} style={{ marginRight: 6 }} />{label}
          </button>
        ))}
      </div>

      {/* ── PROJEKTE TAB ── */}
      {tab === 'projects' && (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 24 }}>
          <div>
            {loading ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Lade Projekte…</p>
            ) : (
              <>
                {creating && (
                  <div style={s.newForm}>
                    <p style={s.newFormTitle}>Neues Projekt</p>
                    <div style={s.fieldGroup}>
                      <label style={s.label} htmlFor="new-title">Name</label>
                      <input
                        id="new-title"
                        style={inp}
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="Projektname"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                      />
                    </div>
                    <div style={s.fieldGroup}>
                      <label style={s.label} htmlFor="new-goal">Ziel (optional)</label>
                      <input
                        id="new-goal"
                        style={inp}
                        value={newGoal}
                        onChange={e => setNewGoal(e.target.value)}
                        placeholder="Was soll dieses Projekt erreichen?"
                      />
                    </div>
                    {newError && <p style={s.error}>{newError}</p>}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                      <button style={s.btnGhost} onClick={() => { setCreating(false); setNewTitle(''); setNewGoal(''); setNewError(null) }}>
                        <X size={14} style={{ marginRight: 4 }} />Abbrechen
                      </button>
                      <button style={s.btnPrimary} onClick={handleCreateProject} disabled={saving || !newTitle.trim()}>
                        <FloppyDisk size={14} />Erstellen
                      </button>
                    </div>
                  </div>
                )}

                <div style={s.grid}>
                  {!creating && (
                    <button style={s.addCard} onClick={() => setCreating(true)}>
                      <Plus size={20} weight="bold" />Neues Projekt
                    </button>
                  )}
                  {projects.map(p => (
                    <div
                      key={p.id}
                      style={{ ...s.card, ...(selected?.id === p.id ? s.cardActive : {}) }}
                      onClick={() => handleSelectProject(p)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && handleSelectProject(p)}
                    >
                      <p style={s.cardTitle}>{p.title}</p>
                      {p.goal && <p style={s.cardSub}>{p.goal}</p>}
                    </div>
                  ))}
                  {projects.length === 0 && !creating && (
                    <div style={s.empty}>
                      <FolderOpen size={40} weight="thin" style={{ marginBottom: 12, opacity: 0.4 }} />
                      <p style={{ margin: 0, fontSize: 14 }}>Noch keine Projekte</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {selected && (
            <div style={s.detail}>
              <div style={s.detailHeader}>
                <h2 style={s.detailTitle}>{selected.title}</h2>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={() => setSelected(null)} aria-label="Schließen">
                  <X size={18} />
                </button>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label} htmlFor="edit-title">Name</label>
                <input
                  id="edit-title"
                  style={inp}
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label} htmlFor="edit-goal">Ziel</label>
                <input
                  id="edit-goal"
                  style={inp}
                  value={editForm.goal}
                  onChange={e => setEditForm(f => ({ ...f, goal: e.target.value }))}
                  placeholder="Was soll dieses Projekt erreichen?"
                />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label} htmlFor="edit-instructions">Anweisungen für Toro</label>
                <textarea
                  id="edit-instructions"
                  style={textarea}
                  value={editForm.instructions}
                  onChange={e => setEditForm(f => ({ ...f, instructions: e.target.value }))}
                  placeholder="Kontext, Ton, Zielgruppe — alles was Toro für dieses Projekt wissen soll"
                />
              </div>

              {saveError && <p style={s.error}>{saveError}</p>}

              <div style={s.actions}>
                {deleteConfirm ? (
                  <>
                    <span style={{ fontSize: 13, color: '#dc2626', alignSelf: 'center' }}>Wirklich löschen?</span>
                    <button style={s.btnGhost} onClick={() => setDeleteConfirm(false)}>Nein</button>
                    <button style={s.btnDanger} onClick={handleDeleteProject} disabled={saving}>
                      <Trash size={14} style={{ marginRight: 4 }} />Ja, löschen
                    </button>
                  </>
                ) : (
                  <>
                    <button style={s.btnDanger} onClick={() => setDeleteConfirm(true)}>
                      <Trash size={14} style={{ marginRight: 4 }} />Löschen
                    </button>
                    <button style={s.btnPrimary} onClick={handleSaveProject} disabled={saving || !editForm.title.trim()}>
                      <FloppyDisk size={14} />Speichern
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AGENTEN TAB — kept exactly as-is ── */}
      {tab === 'agents' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedAgent ? '1fr 360px' : '1fr', gap: 24 }}>
          <div>
            {agentsLoading ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Lade Agenten…</p>
            ) : (
              <>
                {creatingAgent && (
                  <div style={s.newForm}>
                    <p style={s.newFormTitle}>Neuer Agent</p>
                    <div style={s.fieldGroup}>
                      <label style={s.label} htmlFor="agent-name">Name</label>
                      <input id="agent-name" style={inp} value={agentForm.name} onChange={e => setAgentForm(f => ({ ...f, name: e.target.value }))} placeholder="Agent-Name" autoFocus />
                    </div>
                    <div style={s.fieldGroup}>
                      <label style={s.label} htmlFor="agent-desc">Beschreibung</label>
                      <input id="agent-desc" style={inp} value={agentForm.description} onChange={e => setAgentForm(f => ({ ...f, description: e.target.value }))} placeholder="Kurze Beschreibung" />
                    </div>
                    <div style={s.fieldGroup}>
                      <label style={s.label} htmlFor="agent-prompt">System-Prompt</label>
                      <textarea id="agent-prompt" style={textarea} value={agentForm.system_prompt} onChange={e => setAgentForm(f => ({ ...f, system_prompt: e.target.value }))} placeholder="Du bist ein spezialisierter Assistent für…" />
                    </div>
                    <div style={s.fieldGroup}>
                      <label style={s.label} htmlFor="agent-vis">Sichtbarkeit</label>
                      <select id="agent-vis" style={inp} value={agentForm.visibility} onChange={e => setAgentForm(f => ({ ...f, visibility: e.target.value as AgentVisibility }))}>
                        <option value="private">Nur ich</option>
                        <option value="org">Ganze Organisation</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                      <button style={s.btnGhost} onClick={() => { setCreatingAgent(false); setAgentForm(EMPTY_AGENT_FORM) }}>
                        <X size={14} style={{ marginRight: 4 }} />Abbrechen
                      </button>
                      <button style={s.btnPrimary} onClick={handleCreateAgent} disabled={agentSaving || !agentForm.name.trim()}>
                        <FloppyDisk size={14} />Erstellen
                      </button>
                    </div>
                  </div>
                )}

                <div style={s.grid}>
                  {!creatingAgent && (
                    <button style={s.addCard} onClick={() => setCreatingAgent(true)}>
                      <Plus size={20} weight="bold" />Neuer Agent
                    </button>
                  )}
                  {agents.map(a => (
                    <div
                      key={a.id}
                      style={{ ...s.card, ...(selectedAgent?.id === a.id ? s.cardActive : {}) }}
                      onClick={() => { setSelectedAgent(a); setAgentForm({ name: a.name, description: a.description ?? '', system_prompt: a.system_prompt ?? '', visibility: a.visibility }); setAgentDeleteConfirm(false) }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && (() => { setSelectedAgent(a); setAgentForm({ name: a.name, description: a.description ?? '', system_prompt: a.system_prompt ?? '', visibility: a.visibility }); setAgentDeleteConfirm(false) })()}
                    >
                      <p style={s.cardTitle}>
                        <Robot size={14} style={{ marginRight: 6 }} />{a.name}
                        {a.visibility === 'private' && <Lock size={12} style={{ marginLeft: 6, opacity: 0.5 }} />}
                      </p>
                      {a.description && <p style={s.cardSub}>{a.description}</p>}
                    </div>
                  ))}
                  {agents.length === 0 && !creatingAgent && (
                    <div style={s.empty}>
                      <Robot size={40} weight="thin" style={{ marginBottom: 12, opacity: 0.4 }} />
                      <p style={{ margin: 0, fontSize: 14 }}>Noch keine Agenten</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {selectedAgent && (
            <div style={s.detail}>
              <div style={s.detailHeader}>
                <h2 style={s.detailTitle}>{selectedAgent.name}</h2>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={() => setSelectedAgent(null)} aria-label="Schließen">
                  <X size={18} />
                </button>
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label} htmlFor="edit-agent-name">Name</label>
                <input id="edit-agent-name" style={inp} value={agentForm.name} onChange={e => setAgentForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label} htmlFor="edit-agent-desc">Beschreibung</label>
                <input id="edit-agent-desc" style={inp} value={agentForm.description} onChange={e => setAgentForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label} htmlFor="edit-agent-prompt">System-Prompt</label>
                <textarea id="edit-agent-prompt" style={textarea} value={agentForm.system_prompt} onChange={e => setAgentForm(f => ({ ...f, system_prompt: e.target.value }))} />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label} htmlFor="edit-agent-vis">Sichtbarkeit</label>
                <select id="edit-agent-vis" style={inp} value={agentForm.visibility} onChange={e => setAgentForm(f => ({ ...f, visibility: e.target.value as AgentVisibility }))}>
                  <option value="private">Nur ich</option>
                  <option value="org">Ganze Organisation</option>
                </select>
              </div>
              <div style={s.actions}>
                {agentDeleteConfirm ? (
                  <>
                    <span style={{ fontSize: 13, color: '#dc2626', alignSelf: 'center' }}>Wirklich löschen?</span>
                    <button style={s.btnGhost} onClick={() => setAgentDeleteConfirm(false)}>Nein</button>
                    <button style={s.btnDanger} onClick={handleDeleteAgent} disabled={agentSaving}>
                      <Trash size={14} style={{ marginRight: 4 }} />Ja, löschen
                    </button>
                  </>
                ) : (
                  <>
                    <button style={s.btnDanger} onClick={() => setAgentDeleteConfirm(true)}>
                      <Trash size={14} style={{ marginRight: 4 }} />Löschen
                    </button>
                    <button style={s.btnPrimary} onClick={handleSaveAgent} disabled={agentSaving || !agentForm.name.trim()}>
                      <FloppyDisk size={14} />Speichern
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── COMMUNITY TAB ── */}
      {tab === 'community' && (
        <div style={s.empty}>
          <Users size={40} weight="thin" style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Community-Projekte</p>
          <p style={{ margin: '8px 0 0', fontSize: 13 }}>Geteilte Projekte aus der Tropen-Community kommen bald.</p>
        </div>
      )}

      {/* ── VORLAGEN TAB ── */}
      {tab === 'templates' && (
        <div style={s.grid}>
          {TEMPLATES.map(tpl => (
            <div key={tpl.id} style={s.tplCard}>
              <p style={s.tplTitle}>
                <LightbulbFilament size={14} style={{ marginRight: 6, color: 'var(--accent)' }} weight="fill" />
                {tpl.label}
                <span style={s.badge}>{tpl.taskType}</span>
              </p>
              <p style={s.tplSub}>{tpl.fields.length} Felder</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Commit:**
```
git add src/hooks/useWorkspaceState.ts src/app/projects/page.tsx src/components/workspace/LeftNav.tsx src/components/workspace/ProjectSidebar.tsx src/components/workspace/WorkspaceLayout.tsx src/components/workspace/modals/MergeModal.tsx
git commit -m "feat(projects): update Project type and projects page to new schema"
```

---

## Chunk C — Context + Memory

### Task 4: Token Counter + ContextBar

**Files:**
- Create: `src/lib/token-counter.ts`
- Create: `src/components/workspace/ContextBar.tsx`
- Modify: `src/hooks/useWorkspaceState.ts` (add contextPercent)
- Modify: `src/components/workspace/ChatArea.tsx` (add ContextBar)

**What changes:** Schätzt Tokenfüllstand des Context-Windows lokal (kein API-Aufruf). Zeigt einen dünnen `█░`-Balken unter dem ChatHeaderStrip an. Verschwindet bei unter 5%.

**Steps:**

- [ ] Create `src/lib/token-counter.ts`
- [ ] Create `src/components/workspace/ContextBar.tsx`
- [ ] Read `src/hooks/useWorkspaceState.ts` to find where to add `useMemo` and exports — add near the top of the hook body, after `messages` state is declared
- [ ] Add `useMemo` import to `useWorkspaceState.ts` if not already imported
- [ ] Add `contextPercent` to the `WorkspaceState` type and the hook return value
- [ ] Read `src/components/workspace/ChatArea.tsx` to find `ChatHeaderStrip` usage — add `ContextBar` after it
- [ ] Add `contextPercent` to `ChatAreaProps` interface
- [ ] Read `src/components/workspace/WorkspaceLayout.tsx` to find where `ChatArea` is rendered — pass `contextPercent` prop
- [ ] Git commit

**Complete file content for `src/lib/token-counter.ts`:**

```typescript
/** Rough token estimate: ~4 chars per token for mixed German/English */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function estimateConversationTokens(messages: Array<{ content: string }>): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content) + 10, 0)
}

/** Default limit for claude-sonnet-4-6 */
export const MODEL_CONTEXT_LIMIT = 200_000
```

**Complete file content for `src/components/workspace/ContextBar.tsx`:**

```tsx
'use client'
import React from 'react'

interface ContextBarProps {
  percent: number  // 0-100
}

export default function ContextBar({ percent }: ContextBarProps) {
  if (percent < 5) return null
  const filled = Math.round(percent / 5)  // 0-20 blocks
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled)
  const color = percent >= 85 ? 'var(--error, #dc2626)' : percent >= 60 ? '#f59e0b' : 'var(--accent)'
  return (
    <div style={{
      padding: '3px 16px',
      fontSize: 11,
      color: 'var(--text-tertiary)',
      fontFamily: 'monospace',
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-nav)',
    }}>
      <span style={{ color, letterSpacing: -1 }}>{bar}</span>
      <span>{percent}% Context</span>
    </div>
  )
}
```

**Additions to `src/hooks/useWorkspaceState.ts`:**

At the top of the file, add to the imports:
```typescript
import { useEffect, useMemo, useRef, useState } from 'react'
import { estimateConversationTokens, MODEL_CONTEXT_LIMIT } from '@/lib/token-counter'
```

Near the top of the hook body, after `messages` state is declared:
```typescript
const contextTokens = useMemo(
  () => estimateConversationTokens(messages),
  [messages]
)
const contextPercent = Math.min(100, Math.round((contextTokens / MODEL_CONTEXT_LIMIT) * 100))
```

Add `contextPercent: number` to the `WorkspaceState` type (find the interface or type that describes the hook return value), and include `contextPercent` in the return object.

**Additions to `src/components/workspace/ChatArea.tsx`:**

Add to imports:
```tsx
import ContextBar from './ContextBar'
```

Add `contextPercent: number` to `ChatAreaProps` interface.

Add `contextPercent` to the destructuring in the function signature.

In the JSX, directly after `<ChatHeaderStrip ... />` and before the messages `<div>`:
```tsx
{activeConvId && <ContextBar percent={contextPercent} />}
```

**Additions to `src/components/workspace/WorkspaceLayout.tsx`:**

Find where `<ChatArea` is rendered and pass the new prop:
```tsx
<ChatArea
  // ... existing props ...
  contextPercent={contextPercent}
/>
```

(The `contextPercent` value comes from the `useWorkspaceState` hook which is already called in `WorkspaceLayout` or wherever the state is used — find the exact variable name and pass it through.)

**Commit:**
```
git add src/lib/token-counter.ts src/components/workspace/ContextBar.tsx src/hooks/useWorkspaceState.ts src/components/workspace/ChatArea.tsx src/components/workspace/WorkspaceLayout.tsx
git commit -m "feat(chat): add context-window progress bar"
```

---

### Task 5: Memory Save Modal

**Files:**
- Create: `src/components/workspace/MemorySaveModal.tsx`
- Modify: `src/components/workspace/ChatArea.tsx` (add modal)
- Modify: `src/hooks/useWorkspaceState.ts` (add showMemoryModal state, auto-trigger at 85%)
- Modify: `src/components/workspace/WorkspaceLayout.tsx` (pass modal props)

**What changes:** Modal mit zwei Tabs — AI-Zusammenfassung (Standard) und manuelle Notiz. Öffnet automatisch wenn Context-Window 85% erreicht und die aktive Conversation einem Projekt zugeordnet ist. Das Modal benötigt `projectId` und `conversationId`. `projectId` wird aus der aktiven Conversation abgeleitet.

**How to find `activeConvProjectId`:** In `useWorkspaceState.ts` gibt es bereits eine `conversations: Conversation[]` State-Variable und `activeConvId: string | null`. Die `Conversation` interface hat `project_id: string | null`. Daraus lässt sich der `projectId` der aktiven Conversation ableiten:

```typescript
const activeConvProjectId = conversations.find(c => c.id === activeConvId)?.project_id ?? null
```

Diesen Wert im Hook berechnen (mit `useMemo` oder direkt), exportieren, und via `WorkspaceLayout` → `ChatArea` → `MemorySaveModal` durchreichen.

**Steps:**

- [ ] Create `src/components/workspace/MemorySaveModal.tsx`
- [ ] Read `src/hooks/useWorkspaceState.ts` to find the `WorkspaceState` type and return object
- [ ] Add `showMemoryModal`, `setShowMemoryModal`, `memorySavedConvIds`, `setMemorySavedConvIds`, `activeConvProjectId` to the hook
- [ ] Add the `warnedConvRef` and auto-trigger `useEffect` (85% threshold)
- [ ] Read `src/components/workspace/ChatArea.tsx` to find the JSX structure for modal placement
- [ ] Add modal props to `ChatAreaProps` and render `<MemorySaveModal>` in `ChatArea`
- [ ] Read `src/components/workspace/WorkspaceLayout.tsx` to find ChatArea usage
- [ ] Pass `showMemoryModal`, `onSetShowMemoryModal`, and `activeConvProjectId` from WorkspaceLayout to ChatArea
- [ ] Git commit

**Complete file content for `src/components/workspace/MemorySaveModal.tsx`:**

```tsx
'use client'
import React, { useState } from 'react'
import { X, Brain, Sparkle } from '@phosphor-icons/react'

interface MemorySaveModalProps {
  projectId: string
  conversationId: string
  onClose: () => void
  onSaved: () => void
}

export default function MemorySaveModal({ projectId, conversationId, onClose, onSaved }: MemorySaveModalProps) {
  const [tab, setTab] = useState<'manual' | 'ai'>('ai')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'insight' | 'decision' | 'open_question' | 'fact'>('insight')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleManualSave() {
    if (!content.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content, conversation_id: conversationId })
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  async function handleAISummary() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/memory/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId })
      })
      if (!res.ok) throw new Error('Zusammenfassung fehlgeschlagen')
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="memory-modal-title"
    >
      <div
        style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: 24, width: 420, maxWidth: '90vw' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 id="memory-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain weight="fill" />
            Gedächtnis speichern
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="Schließen">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setTab('ai')}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: tab === 'ai' ? 'var(--accent)' : 'var(--bg-base)',
              color: tab === 'ai' ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Sparkle weight="fill" size={14} />AI-Zusammenfassung
          </button>
          <button
            onClick={() => setTab('manual')}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: tab === 'manual' ? 'var(--accent)' : 'var(--bg-base)',
              color: tab === 'manual' ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: 13,
            }}
          >
            Notiz speichern
          </button>
        </div>

        {tab === 'ai' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Toro analysiert das Gespräch und speichert die wichtigsten Erkenntnisse, Entscheidungen und offene Fragen.
            </p>
            {error && <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 8 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
              >
                Später
              </button>
              <button
                onClick={handleAISummary}
                disabled={saving}
                style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'wait' : 'pointer', fontSize: 13 }}
              >
                {saving ? 'Analysiere…' : 'Jetzt zusammenfassen'}
              </button>
            </div>
          </div>
        )}

        {tab === 'manual' && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <label htmlFor="memory-type" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Typ</label>
              <select
                id="memory-type"
                value={type}
                onChange={e => setType(e.target.value as typeof type)}
                style={{ width: '100%', marginBottom: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13 }}
              >
                <option value="insight">Erkenntnis</option>
                <option value="decision">Entscheidung</option>
                <option value="open_question">Offene Frage</option>
                <option value="fact">Fakt</option>
              </select>
            </div>
            <div>
              <label htmlFor="memory-content" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Inhalt</label>
              <textarea
                id="memory-content"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Was soll Toro sich merken?"
                style={{ width: '100%', minHeight: 80, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                onClick={onClose}
                style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleManualSave}
                disabled={saving || !content.trim()}
                style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'wait' : 'pointer', fontSize: 13 }}
              >
                {saving ? 'Speichere…' : 'Speichern'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Additions to `src/hooks/useWorkspaceState.ts`:**

Add to imports (ensure `useRef` is imported):
```typescript
import { useEffect, useMemo, useRef, useState } from 'react'
```

In the hook body, after `contextPercent` is calculated:
```typescript
// Derive projectId for the active conversation
const activeConvProjectId = useMemo(
  () => conversations.find(c => c.id === activeConvId)?.project_id ?? null,
  [conversations, activeConvId]
)

// Memory modal state
const [showMemoryModal, setShowMemoryModal] = useState(false)
const [memorySavedConvIds, setMemorySavedConvIds] = useState<Set<string>>(new Set())
const warnedConvRef = useRef<Set<string>>(new Set())

// Auto-trigger memory modal at 85% context usage
useEffect(() => {
  if (!activeConvId) return
  if (contextPercent < 85) return
  if (warnedConvRef.current.has(activeConvId)) return
  const activeConv = conversations.find(c => c.id === activeConvId)
  if (!activeConv?.project_id) return
  warnedConvRef.current.add(activeConvId)
  setShowMemoryModal(true)
}, [contextPercent, activeConvId, conversations])
```

Add to the `WorkspaceState` type:
```typescript
activeConvProjectId: string | null
showMemoryModal: boolean
setShowMemoryModal: (v: boolean) => void
memorySavedConvIds: Set<string>
setMemorySavedConvIds: (ids: Set<string>) => void
```

Include all five in the hook's return object.

**Additions to `src/components/workspace/ChatArea.tsx`:**

Add to imports:
```tsx
import MemorySaveModal from './MemorySaveModal'
```

Add to `ChatAreaProps`:
```typescript
contextPercent: number
showMemoryModal: boolean
activeConvProjectId: string | null
onSetShowMemoryModal: (v: boolean) => void
```

Add to function destructuring: `contextPercent`, `showMemoryModal`, `activeConvProjectId`, `onSetShowMemoryModal`.

At the bottom of the JSX (before the closing `</div>` of the root element), add:
```tsx
{showMemoryModal && activeConvProjectId && activeConvId && (
  <MemorySaveModal
    projectId={activeConvProjectId}
    conversationId={activeConvId}
    onClose={() => onSetShowMemoryModal(false)}
    onSaved={() => onSetShowMemoryModal(false)}
  />
)}
```

Also add a "Gedächtnis" icon button in the chat header area — visible only when the active conversation has a project. Find the ChatHeaderStrip area and add a small button next to the existing controls:
```tsx
{activeConvId && activeConvProjectId && (
  <button
    onClick={() => onSetShowMemoryModal(true)}
    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
    title="Gedächtnis speichern"
    aria-label="Gedächtnis speichern"
  >
    <Brain size={14} />
  </button>
)}
```

Add `Brain` to the `@phosphor-icons/react` import at the top of `ChatArea.tsx`.

**Additions to `src/components/workspace/WorkspaceLayout.tsx`:**

Read the file first to find where `<ChatArea` is rendered and what props it receives. Then add the new props by passing values from `useWorkspaceState`:

```tsx
<ChatArea
  // ... existing props ...
  contextPercent={contextPercent}
  showMemoryModal={showMemoryModal}
  activeConvProjectId={activeConvProjectId}
  onSetShowMemoryModal={setShowMemoryModal}
/>
```

**Commit:**
```
git add src/components/workspace/MemorySaveModal.tsx src/components/workspace/ChatArea.tsx src/hooks/useWorkspaceState.ts src/components/workspace/WorkspaceLayout.tsx
git commit -m "feat(chat): add memory save modal with AI summary and manual entry"
```

---

## Self-Review Checklist

**1. Do API routes use `await params` for Next.js 15?**
- `src/app/api/projects/[id]/route.ts` — YES: `const { id } = await params` in all three handlers (GET, PATCH, DELETE)
- `src/app/api/projects/[id]/memory/route.ts` — YES: `const { id } = await params` in GET and POST
- `src/app/api/projects/[id]/memory/summary/route.ts` — YES: `const { id } = await params` in POST

**2. Are all imports complete?**
- `route.ts` files import: `createClient`, `supabaseAdmin`, `NextResponse`, `Anthropic` (where needed)
- `ContextBar.tsx`: `React` from 'react'
- `MemorySaveModal.tsx`: `React`, `useState` from 'react', `X`, `Brain`, `Sparkle` from `@phosphor-icons/react`
- `token-counter.ts`: no imports needed (pure functions)
- `useWorkspaceState.ts` additions: `useMemo`, `useRef` (add to existing React import), `estimateConversationTokens`, `MODEL_CONTEXT_LIMIT` from `@/lib/token-counter`
- `ChatArea.tsx` additions: `ContextBar` from `./ContextBar`, `MemorySaveModal` from `./MemorySaveModal`, `Brain` from `@phosphor-icons/react`

**3. Are all commit steps present?**
- Task 1: `feat(api): replace projects API with new schema (department_id, title, goal)` — YES
- Task 2: `feat(api): add projects [id] routes and project memory API` — YES
- Task 3: `feat(projects): update Project type and projects page to new schema` — YES
- Task 4: `feat(chat): add context-window progress bar` — YES
- Task 5: `feat(chat): add memory save modal with AI summary and manual entry` — YES

**4. Does the plan explain how to find `activeConvProjectId`?**
YES — Task 5 explicitly explains:
> `activeConvProjectId` wird aus `conversations.find(c => c.id === activeConvId)?.project_id ?? null` abgeleitet. Die `Conversation` interface hat bereits `project_id: string | null`. Der Wert wird im Hook via `useMemo` berechnet und via `WorkspaceLayout → ChatArea → MemorySaveModal` durchgereicht.
