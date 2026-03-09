# Smarte Projekte Phase 2 – Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `/projects`-Seite mit 4 Tabs (Tab 1 + Tab 4 voll funktional, Tab 2 + 3 Platzhalter), erweitertes Projekt-Schema mit Kontext/Ton/Sprache/Zielgruppe.

**Architecture:** Migration erweitert `projects`-Tabelle um 7 Spalten. Neue API-Route `/api/projects` (GET/POST/PATCH/DELETE). Client-seitige `/projects`-Seite mit 2-Column-Layout (Grid links, Detail-Panel rechts). LeftNav bekommt direkten Link.

**Tech Stack:** Next.js 15 App Router, React 19, Supabase (supabaseAdmin), TypeScript, Phosphor Icons, globals.css Design-System (s-Objekte + CSS-Vars)

---

## Referenzen

- Design-Doc: `docs/plans/2026-03-09-smarte-projekte-design.md`
- Bestehendes API-Muster: `src/app/api/admin/users/route.ts`
- Bestehende Typen: `src/hooks/useWorkspaceState.ts` (Project-Interface, Zeile 43-47)
- Vorlagen-Daten: `src/lib/prompt-templates.ts` (TEMPLATES-Array)
- LeftNav: `src/components/workspace/LeftNav.tsx`
- Globals: `src/app/globals.css` (Klassen: `.t-primary`, `.t-secondary`, `.t-dezent`, `.chip`, `.chip--active`)
- CSS-Vars: `--bg-base: #0d1f16`, `--bg-surface: #134e3a`, `--accent: #a3b554`, `--color-border`

---

## Task 1: Migration – projects-Tabelle erweitern

**Files:**
- Erstelle: `supabase/migrations/016_smart_projects.sql`

**Step 1: SQL-Datei anlegen**

```sql
-- Tropen OS – Smarte Projekte Phase 2
-- Erweitert projects um Kontext, Ton, Sprache, Zielgruppe, Gedächtnis

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS description    TEXT,
  ADD COLUMN IF NOT EXISTS context        TEXT,
  ADD COLUMN IF NOT EXISTS tone           TEXT DEFAULT 'casual'
    CHECK (tone IN ('formal','casual','technical','creative')),
  ADD COLUMN IF NOT EXISTS language       TEXT DEFAULT 'auto'
    CHECK (language IN ('de','en','auto')),
  ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'internal'
    CHECK (target_audience IN ('internal','customers','public')),
  ADD COLUMN IF NOT EXISTS memory         TEXT,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT NOW();
```

**Step 2: Migration im Supabase Dashboard ausführen**

Öffne Supabase Dashboard → SQL Editor → Inhalt der Datei einfügen → Run.
Erwartete Ausgabe: `ALTER TABLE` ohne Fehler.

**Step 3: Commit**

```bash
git add supabase/migrations/016_smart_projects.sql
git commit -m "feat: migration 016 – smart projects (context, tone, language, memory)"
```

---

## Task 2: API-Route `/api/projects`

**Files:**
- Erstelle: `src/app/api/projects/route.ts`

**Muster:** Gleich wie `src/app/api/admin/users/route.ts` — `createClient()` für Auth-Check, dann `supabaseAdmin` für DB-Operationen.

**Step 1: Datei anlegen**

```typescript
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
  if (!profile) return null
  return { id: user.id, ...profile } as { id: string; organization_id: string; role: string }
}

// GET /api/projects?workspace_id=...
export async function GET(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workspace_id = searchParams.get('workspace_id')
  if (!workspace_id) return NextResponse.json({ error: 'workspace_id fehlt' }, { status: 400 })

  // Chat-Zähler via subquery
  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select(`
      id, name, description, context, tone, language, target_audience,
      memory, display_order, created_at, updated_at,
      conversations(count)
    `)
    .eq('workspace_id', workspace_id)
    .is('conversations.deleted_at', null)
    .order('display_order')

  return NextResponse.json(projects ?? [])
}

// POST /api/projects
export async function POST(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const body = await request.json()
  const { workspace_id, name } = body
  if (!workspace_id || !name?.trim())
    return NextResponse.json({ error: 'workspace_id und name erforderlich' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({ workspace_id, name: name.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/projects
export async function PATCH(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { id, ...fields } = await request.json()
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })

  const allowed = ['name','description','context','tone','language','target_audience']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in fields) update[key] = fields[key]
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

// DELETE /api/projects
export async function DELETE(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })

  // conversations.project_id wird via ON DELETE SET NULL automatisch auf NULL gesetzt
  const { error } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

**Step 2: Manuell testen**

Browser oder curl:
```
GET http://localhost:3000/api/projects?workspace_id=[gültige-id]
```
Erwartung: JSON-Array (leer oder mit bestehenden Projekten), HTTP 200.

```
POST http://localhost:3000/api/projects
Body: { "workspace_id": "...", "name": "Test" }
```
Erwartung: Neu erstelltes Projekt-Objekt, HTTP 200.

**Step 3: Commit**

```bash
git add src/app/api/projects/route.ts
git commit -m "feat: api/projects – GET/POST/PATCH/DELETE"
```

---

## Task 3: Project-Typ erweitern

**Files:**
- Ändere: `src/hooks/useWorkspaceState.ts` (Zeile 43-47)

**Step 1: Interface erweitern**

```typescript
export interface Project {
  id: string
  name: string
  description?: string | null
  context?: string | null
  tone?: string | null
  language?: string | null
  target_audience?: string | null
  memory?: string | null
  display_order: number
  conversations?: { count: number }[]
}
```

Alle neuen Felder sind optional (bestehender Code bricht nicht).

**Step 2: Commit**

```bash
git add src/hooks/useWorkspaceState.ts
git commit -m "feat: extend Project type with smart fields"
```

---

## Task 4: `/projects`-Seite aufbauen

**Files:**
- Erstelle: `src/app/projects/page.tsx`

Die Seite ist vollständig Client-seitig (`'use client'`). Workspace-ID kommt aus dem ersten Workspace des Users (geladen beim Mount).

**Step 1: Grundgerüst + Tab-Navigation**

```typescript
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  FolderOpen, Robot, Users, BookOpen, Lock,
  Plus, PencilSimple, Trash, FloppyDisk, X,
  LightbulbFilament, Info,
} from '@phosphor-icons/react'
import { TEMPLATES } from '@/lib/prompt-templates'
import type { Project } from '@/hooks/useWorkspaceState'

type Tab = 'projects' | 'agents' | 'community' | 'templates'

const TONE_LABELS: Record<string, string> = {
  formal: 'Formell', casual: 'Locker', technical: 'Technisch', creative: 'Kreativ'
}
const LANG_LABELS: Record<string, string> = { de: 'Deutsch', en: 'Englisch', auto: 'Auto' }
const AUD_LABELS: Record<string, string> = {
  internal: 'Intern', customers: 'Kunden', public: 'Öffentlichkeit'
}

export default function ProjectsPage() {
  const [tab, setTab] = useState<Tab>('projects')
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [form, setForm] = useState({ name: '', description: '', context: '', tone: 'casual', language: 'auto', target_audience: 'internal' })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    loadWorkspace()
  }, [])

  async function loadWorkspace() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    const wsId = memberships?.workspace_id ?? null
    setWorkspaceId(wsId)
    if (wsId) await loadProjects(wsId)
    setLoading(false)
  }

  async function loadProjects(wsId: string) {
    const res = await fetch(`/api/projects?workspace_id=${wsId}`)
    if (res.ok) setProjects(await res.json())
  }

  function selectProject(p: Project) {
    setSelected(p)
    setForm({
      name: p.name,
      description: p.description ?? '',
      context: p.context ?? '',
      tone: p.tone ?? 'casual',
      language: p.language ?? 'auto',
      target_audience: p.target_audience ?? 'internal',
    })
    setDeleteConfirm(false)
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    const res = await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, ...form }),
    })
    if (res.ok) {
      const updated = await res.json()
      setProjects(ps => ps.map(p => p.id === updated.id ? updated : p))
      setSelected(updated)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!selected || !workspaceId) return
    await fetch('/api/projects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id }),
    })
    setProjects(ps => ps.filter(p => p.id !== selected.id))
    setSelected(null)
    setDeleteConfirm(false)
  }

  async function handleCreate() {
    if (!newName.trim() || !workspaceId) return
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspaceId, name: newName.trim() }),
    })
    if (res.ok) {
      const created = await res.json()
      setProjects(ps => [...ps, created])
      setCreating(false)
      setNewName('')
      selectProject(created)
    }
  }

  const s: Record<string, React.CSSProperties> = {
    page:        { minHeight: '100vh', background: 'var(--bg-base)', padding: '32px 24px' },
    inner:       { maxWidth: 1100, margin: '0 auto' },
    header:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    h1:          { fontSize: 'var(--text-xl)', fontFamily: 'var(--font-display)', margin: 0 },
    tabs:        { display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--color-border)', paddingBottom: 0 },
    tab:         { padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)' },
    tabActive:   { background: 'var(--bg-surface)', borderBottom: '2px solid var(--accent)' },
    tabDisabled: { opacity: 0.5, cursor: 'default' },
    cols:        { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 },
    grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 },
    card:        { background: 'var(--bg-surface)', borderRadius: 10, padding: '16px', border: '1px solid var(--color-border)', cursor: 'pointer' },
    cardActive:  { background: 'var(--bg-surface)', borderRadius: 10, padding: '16px', border: '1px solid var(--accent)', cursor: 'pointer' },
    detail:      { background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--color-border)', padding: 24 },
    fieldWrap:   { marginBottom: 16 },
    label:       { display: 'block', fontSize: 'var(--text-xs)', marginBottom: 6 },
    input:       { width: '100%', background: 'var(--bg-base)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--color-text)', fontSize: 'var(--text-sm)', boxSizing: 'border-box' },
    textarea:    { width: '100%', background: 'var(--bg-base)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--color-text)', fontSize: 'var(--text-sm)', minHeight: 100, resize: 'vertical', boxSizing: 'border-box' },
    select:      { width: '100%', background: 'var(--bg-base)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--color-text)', fontSize: 'var(--text-sm)' },
    hintBox:     { background: 'rgba(163,181,84,0.08)', border: '1px solid rgba(163,181,84,0.25)', borderRadius: 8, padding: '12px 14px', marginBottom: 8, fontSize: 'var(--text-xs)' },
    hintRow:     { display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 },
    actions:     { display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 20 },
    btnPrimary:  { padding: '8px 16px', background: 'var(--accent)', color: '#0d1f16', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6 },
    btnDanger:   { padding: '8px 16px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6 },
    placeholder: { textAlign: 'center', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
    tplGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
    tplCard:     { background: 'var(--bg-surface)', borderRadius: 10, padding: 20, border: '1px solid var(--color-border)' },
    addBtn:      { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(163,181,84,0.12)', border: '1px solid rgba(163,181,84,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--accent)' },
    chatCount:   { fontSize: 'var(--text-xs)', padding: '2px 8px', background: 'rgba(255,255,255,0.07)', borderRadius: 20, display: 'inline-block' },
    infoBox:     { display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, marginTop: 6, fontSize: 'var(--text-xs)' },
  }

  if (loading) return (
    <div style={s.page}>
      <div style={s.inner}>
        <p className="t-dezent">Lädt…</p>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={s.header}>
          <h1 style={s.h1} className="t-primary">Projekte & Vorlagen</h1>
        </div>

        {/* ── Tabs ── */}
        <div style={s.tabs}>
          {[
            { id: 'projects', label: 'Meine Projekte', icon: <FolderOpen size={16} />, active: true },
            { id: 'agents',    label: 'Meine Agenten',  icon: <Robot size={16} />,      active: false },
            { id: 'community', label: 'Community',      icon: <Users size={16} />,      active: false },
            { id: 'templates', label: 'Vorlagen',       icon: <BookOpen size={16} />,   active: true },
          ].map(t => (
            <button
              key={t.id}
              style={{
                ...s.tab,
                ...(tab === t.id ? s.tabActive : {}),
                ...(!t.active ? s.tabDisabled : {}),
              }}
              className={tab === t.id ? 't-primary' : 't-secondary'}
              onClick={() => t.active && setTab(t.id as Tab)}
            >
              {t.icon}
              {t.label}
              {!t.active && <Lock size={12} style={{ marginLeft: 2 }} />}
            </button>
          ))}
        </div>

        {/* ── Tab: Meine Projekte ── */}
        {tab === 'projects' && (
          <div style={s.cols}>
            {/* Linke Spalte */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                {creating ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      autoFocus
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
                      placeholder="Projektname…"
                      style={{ ...s.input, width: 200 }}
                    />
                    <button style={s.btnPrimary} onClick={handleCreate}>Erstellen</button>
                    <button style={{ ...s.btnDanger, border: 'none', background: 'none' }} onClick={() => { setCreating(false); setNewName('') }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button style={s.addBtn} onClick={() => setCreating(true)}>
                    <Plus size={16} /> Neues Projekt
                  </button>
                )}
              </div>

              {projects.length === 0 ? (
                <div style={s.placeholder}>
                  <FolderOpen size={48} weight="thin" color="rgba(255,255,255,0.2)" />
                  <p className="t-dezent">Noch keine Projekte</p>
                  <button style={s.addBtn} onClick={() => setCreating(true)}>
                    <Plus size={16} /> Erstes Projekt anlegen
                  </button>
                </div>
              ) : (
                <div style={s.grid}>
                  {projects.map(p => {
                    const count = (p.conversations as unknown as { count: number }[] | undefined)?.[0]?.count ?? 0
                    const isActive = selected?.id === p.id
                    return (
                      <div
                        key={p.id}
                        style={isActive ? s.cardActive : s.card}
                        onClick={() => selectProject(p)}
                      >
                        <p className="t-primary" style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                          {p.name}
                        </p>
                        {p.description && (
                          <p className="t-secondary" style={{ margin: '0 0 8px', fontSize: 'var(--text-xs)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {p.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {p.tone && <span className="chip">{TONE_LABELS[p.tone] ?? p.tone}</span>}
                          <span style={s.chatCount} className="t-dezent">{count} Chats</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Rechte Spalte – Detail-Panel */}
            {selected ? (
              <div style={s.detail}>
                <p className="t-primary" style={{ margin: '0 0 20px', fontWeight: 600, fontSize: 'var(--text-base)' }}>
                  <PencilSimple size={16} style={{ marginRight: 6 }} />
                  Projekt bearbeiten
                </p>

                <div style={s.fieldWrap}>
                  <label style={s.label} className="t-dezent">Name</label>
                  <input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>

                <div style={s.fieldWrap}>
                  <label style={s.label} className="t-dezent">Beschreibung</label>
                  <input style={s.input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Kurze Beschreibung…" />
                </div>

                <div style={s.fieldWrap}>
                  <label style={s.label} className="t-dezent">Projekt-Kontext für Toro</label>
                  {/* HintBox */}
                  <div style={s.hintBox}>
                    <div style={s.hintRow}>
                      <LightbulbFilament size={16} color="var(--accent)" weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span className="t-secondary">
                        Schreib hier alles, was Toro über dieses Projekt wissen soll – Hintergrund, Ziele, Einschränkungen, wichtige Begriffe.
                      </span>
                    </div>
                    <p className="t-dezent" style={{ margin: '6px 0 0 24px', fontStyle: 'italic' }}>
                      Beispiel: „Dieses Projekt ist für den Launch unserer App ‚Waldpfad'. Zielgruppe: 30–50 jährige Outdoor-Enthusiasten. Budget: 50.000 €. Launch: 15. Mai 2026."
                    </p>
                  </div>
                  <textarea style={s.textarea} value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} placeholder="Kontext für Toro…" />
                  <div style={s.infoBox}>
                    <Info size={14} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span className="t-dezent">Auto-Extraktion (Toro liest Chats und ergänzt den Kontext automatisch) kommt in Phase 3.</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div>
                    <label style={s.label} className="t-dezent">Ton</label>
                    <select style={s.select} value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
                      {Object.entries(TONE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label} className="t-dezent">Sprache</label>
                    <select style={s.select} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                      {Object.entries(LANG_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label} className="t-dezent">Zielgruppe</label>
                    <select style={s.select} value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}>
                      {Object.entries(AUD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div style={s.actions}>
                  {deleteConfirm ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="t-secondary" style={{ fontSize: 'var(--text-xs)' }}>Wirklich löschen?</span>
                      <button style={{ ...s.btnDanger, padding: '6px 12px' }} onClick={handleDelete}>Ja</button>
                      <button style={{ padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer' }} className="t-dezent" onClick={() => setDeleteConfirm(false)}>Nein</button>
                    </div>
                  ) : (
                    <button style={{ ...s.btnDanger, padding: '8px 12px' }} onClick={() => setDeleteConfirm(true)}>
                      <Trash size={15} />
                    </button>
                  )}
                  <button style={s.btnPrimary} onClick={handleSave} disabled={saving}>
                    <FloppyDisk size={15} />
                    {saving ? 'Speichert…' : 'Speichern'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ ...s.detail, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="t-dezent" style={{ textAlign: 'center', fontSize: 'var(--text-sm)' }}>
                  Projekt auswählen oder neu anlegen
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Meine Agenten (Platzhalter) ── */}
        {tab === 'agents' && (
          <div style={s.placeholder}>
            <Lock size={48} weight="thin" color="rgba(255,255,255,0.2)" />
            <p className="t-primary" style={{ margin: 0, fontWeight: 600 }}>Kommt in Phase 3</p>
            <p className="t-secondary" style={{ maxWidth: 420, textAlign: 'center', margin: 0 }}>
              Erstelle eigene Agenten, weise sie Projekten zu und teile sie mit deinem Team. Agenten bauen auf System-Agenten auf und können mit eigenem System-Prompt erweitert werden.
            </p>
            <a
              href="mailto:hello@tropen-os.de?subject=Interesse: Agenten-System"
              style={{ color: 'var(--accent)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}
            >
              Interesse melden →
            </a>
          </div>
        )}

        {/* ── Tab: Community (Platzhalter) ── */}
        {tab === 'community' && (
          <div style={s.placeholder}>
            <Lock size={48} weight="thin" color="rgba(255,255,255,0.2)" />
            <p className="t-primary" style={{ margin: 0, fontWeight: 600 }}>Kommt in Phase 4</p>
            <p className="t-secondary" style={{ maxWidth: 420, textAlign: 'center', margin: 0 }}>
              Entdecke öffentliche Agenten, teile deine eigenen und baue auf dem Wissen der Community auf. Mit Bewertungen, Nutzungszahlen und kuratierten Featured Agents.
            </p>
            <a
              href="mailto:hello@tropen-os.de?subject=Interesse: Community"
              style={{ color: 'var(--accent)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}
            >
              Interesse melden →
            </a>
          </div>
        )}

        {/* ── Tab: Vorlagen ── */}
        {tab === 'templates' && (
          <div>
            <p className="t-secondary" style={{ marginBottom: 24, fontSize: 'var(--text-sm)' }}>
              Starte einen Chat mit einer strukturierten Vorlage.
            </p>
            <div style={s.tplGrid}>
              {TEMPLATES.map(t => (
                <div key={t.id} style={s.tplCard}>
                  <p className="t-primary" style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                    {t.label}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                    {t.fields.map(f => (
                      <span key={f.id} className="chip t-dezent">{f.label}</span>
                    ))}
                  </div>
                  <a
                    href={workspaceId ? `/workspaces/${workspaceId}?template=${t.id}` : '/workspaces'}
                    style={{ ...s.addBtn, textDecoration: 'none', display: 'inline-flex' }}
                  >
                    Im Workspace öffnen
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Manuell prüfen**

- `http://localhost:3000/projects` öffnen
- Alle 4 Tabs klicken: Tab 1 + 4 müssen funktionieren, Tab 2 + 3 Platzhalter zeigen
- Neues Projekt anlegen, Felder ausfüllen, Speichern → Supabase Dashboard prüfen
- Projekt löschen → aus Liste verschwunden

**Step 3: Commit**

```bash
git add src/app/projects/page.tsx
git commit -m "feat: /projects page – 4 tabs, project detail panel, templates"
```

---

## Task 5: LeftNav – Link zu `/projects`

**Files:**
- Ändere: `src/components/workspace/LeftNav.tsx`

**Step 1: NavItem nach Dashboard einfügen**

Finde in `LeftNav.tsx` die Zeile:
```tsx
<NavItem href="/dashboard" icon={<ChartBar size={22} weight="fill" />} label="Dashboard" />
```

Füge direkt darunter ein:
```tsx
<NavItem href="/projects" icon={<FolderOpen size={22} weight="fill" />} label="Projekte" />
```

Wichtig: `FolderOpen` zu den Importen in der Datei hinzufügen (aktuell importiert: `Folders`, `ChartBar`, etc.).

Import-Zeile anpassen:
```typescript
import {
  Folders, ChartBar, Robot, CurrencyEur, ClipboardText,
  Users, TreePalm, SignOut, Gear, CaretDown, Plus,
  ArrowsMerge, FolderSimple, Trash, FolderOpen,
} from '@phosphor-icons/react'
```

**Step 2: Visuell prüfen**

Im Workspace `/workspaces/[id]` öffnen → LeftNav zeigt "Projekte"-Link → Klick führt zu `/projects`.

**Step 3: Commit**

```bash
git add src/components/workspace/LeftNav.tsx
git commit -m "feat: LeftNav – add Projekte link"
```

---

## Task 6: CLAUDE.md aktualisieren

**Files:**
- Ändere: `CLAUDE.md`

**Step 1: Smarte Projekte als erledigt markieren + Schema-Docs updaten**

Im Abschnitt `## Supabase-Schema (relevante Tabellen)` die projects-Zeile aktualisieren:
```
- `projects`: id, workspace_id, name, description, context, tone, language, target_audience, memory, display_order, created_at, updated_at
```

Im Abschnitt `## Migrations-Übersicht` ergänzen:
```
| 016_smart_projects.sql | projects um context, tone, language, target_audience, memory, description, updated_at erweitert |
```

Im Abschnitt `### Nächste Schritte` den Smarte-Projekte-Eintrag als erledigt markieren.

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md – mark smarte projekte as done, update schema docs"
```

---

## Abschluss-Check

Bevor du „fertig" meldest:

1. `http://localhost:3000/projects` → Seite lädt, kein 404
2. Tab 1: Projekt anlegen, Kontext ausfüllen, Speichern → Supabase `projects`-Tabelle hat Werte
3. Tab 1: Projekt löschen → weg aus Liste
4. Tab 2: Lock-Icon + Platzhalter + mailto-Link sichtbar
5. Tab 3: Lock-Icon + Platzhalter + mailto-Link sichtbar
6. Tab 4: Alle 5 Templates als Karten, "Im Workspace öffnen"-Link funktioniert
7. LeftNav: "Projekte"-Link sichtbar und aktiv wenn auf /projects
