# Feed Feature Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vollständige Feed-UI mit 3-Spalten-Layout (Quellen · Stream · Konfiguration), Feature-Flag pro Org (Superadmin aktiviert, Admin verwaltet), NavBar-Link nur wenn aktiviert.

**Architecture:** Feature-Flag `feeds_enabled` in `organization_settings`. Superadmin schaltet pro Org ein. Admin sieht `/settings/feeds` Verwaltungsseite (eigene Route, nicht unter `/admin/*` wegen Layout-Guard). Member sieht `/feed` 3-Spalten-Layout. NavBar zeigt Feed-Link nur wenn Feature aktiv. Backend (actions/feeds.ts) ist vollständig vorhanden — nur UI wird gebaut.

**Tech Stack:** Next.js 15 App Router, React 19, Supabase (supabaseAdmin für Server-Queries), Phosphor Icons (weight="bold"), globals.css Utility-Klassen (.card, .btn, .list-row, .chip), inline-s Objekte für seitenspezifische Styles.

**Known Constraints:**
- `admin/layout.tsx` uses `requireSuperadmin()` — org admins cannot access `/admin/*`. Feed settings for org admins go to `/settings/feeds` instead.
- `requireOrgAdmin()` currently checks for `'org_admin'` (non-existent role) and doesn't return `organization_id`. **Must be rewritten as prerequisite (Chunk 3, first step).**
- `FeedImportance` enum values: `'high' | 'medium' | 'low' | 'none'` (not a numeric score).
- `FeedSourceType` enum values: `'rss' | 'newsletter' | 'api' | 'webhook' | 'url'`.

---

## Chunk 1: DB-Migration + Feature-Flag

### Task 1: Migration 028 — feeds_enabled

**Files:**
- Create: `supabase/migrations/028_feeds_enabled.sql`

- [ ] **Schreibe Migration**

```sql
-- 028_feeds_enabled.sql
ALTER TABLE organization_settings
  ADD COLUMN IF NOT EXISTS feeds_enabled BOOLEAN NOT NULL DEFAULT false;
```

- [ ] **Push migration**

```bash
cd "/c/Users/timmr/tropen OS" && supabase db push
```

Expected: `Applied 1 migration`

- [ ] **Commit**

```bash
git add supabase/migrations/028_feeds_enabled.sql
git commit -m "feat(feed): add feeds_enabled column to organization_settings"
```

---

## Chunk 2: Superadmin-Toggle

### Task 2: Superadmin — Feed-Toggle pro Org

**Files:**
- Modify: `src/app/superadmin/clients/page.tsx` (Feed-Toggle in Org-Zeile)
- Modify: `src/app/api/superadmin/clients/[id]/route.ts` (PATCH feeds_enabled)

- [ ] **API: PATCH feeds_enabled unterstützen**

In `src/app/api/superadmin/clients/[id]/route.ts`, im PATCH-Handler ergänzen:

```typescript
// Nach bestehenden update-Feldern:
if (typeof body.feeds_enabled === 'boolean') {
  await supabaseAdmin
    .from('organization_settings')
    .update({ feeds_enabled: body.feeds_enabled })
    .eq('organization_id', id)
}
```

- [ ] **Superadmin-API: feeds_enabled im GET mitsenden**

In `src/app/api/superadmin/clients/route.ts`, im Select-String `organization_settings(...)` das Feld `feeds_enabled` ergänzen:

```typescript
'id, name, slug, plan, budget_limit, created_at, workspaces(id, name, budget_limit), organization_settings(onboarding_completed, feeds_enabled), users(id, email, role)'
```

- [ ] **Type in clients/page.tsx erweitern**

```typescript
// Im Interface für organization_settings:
feeds_enabled?: boolean
```

- [ ] **Superadmin-Page: Feed-Toggle anzeigen**

In `src/app/superadmin/clients/page.tsx`, in der Org-Zeile (neben bestehenden Badges), eine Toggle-Checkbox für `feeds_enabled` hinzufügen. Der Toggle-Handler ruft die API auf und refresht die Seite mit `router.refresh()`:

```tsx
// Import am Dateianfang ergänzen:
import { useRouter } from 'next/navigation'

// Im Komponenten-Body (als Client-Komponente — ggf. eigene FeedToggleCell extrahieren):
function FeedToggleCell({ orgId, enabled }: { orgId: string; enabled: boolean }) {
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)

  async function toggle(checked: boolean) {
    setSaving(true)
    await fetch(`/api/superadmin/clients/${orgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feeds_enabled: checked }),
    })
    router.refresh()
    setSaving(false)
  }

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={enabled}
        disabled={saving}
        onChange={e => toggle(e.target.checked)}
      />
      Feed
    </label>
  )
}

// In der Tabellenspalte für Features/Pakete verwenden:
<FeedToggleCell orgId={org.id} enabled={org.organization_settings?.feeds_enabled ?? false} />
```

**Hinweis:** Die superadmin/clients/page.tsx ist eine Server Component. `FeedToggleCell` muss am Dateianfang mit `'use client'` markiert werden ODER als separate Datei `FeedToggleCell.tsx` im gleichen Verzeichnis mit `'use client'`.

- [ ] **Commit**

```bash
git add src/app/superadmin/clients/page.tsx src/app/api/superadmin/clients/route.ts src/app/api/superadmin/clients/[id]/route.ts
git commit -m "feat(feed): superadmin can toggle feeds_enabled per org"
```

---

## Chunk 3: Settings-Seite /settings/feeds (Org Admin)

**Hinweis:** `/admin/*` ist durch `admin/layout.tsx` mit `requireSuperadmin()` gesperrt. Org-Admin-Feed-Settings gehen deshalb nach `/settings/feeds`.

### Task 3: Admin-Seite für Feed-Verwaltung

**Files:**
- Modify: `src/lib/auth/guards.ts` (**PFLICHT-PREREQUISITE — muss zuerst**!)
- Create: `src/app/settings/feeds/page.tsx`
- Modify: `src/components/NavBar.tsx` (Admin-Nav: "Feed" Link → `/settings/feeds`)

- [ ] **PREREQUISITE: requireOrgAdmin() in guards.ts reparieren**

Die aktuelle Implementation prüft `'org_admin'` (nicht-existente Rolle) und gibt keine `organization_id` zurück. Vollständige Ersetzung:

```typescript
// src/lib/auth/guards.ts — requireOrgAdmin() komplett ersetzen:
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function requireOrgAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) redirect('/login')
  if (!['admin', 'owner', 'superadmin'].includes(profile.role ?? '')) redirect('/dashboard')

  return {
    id: user.id,
    organization_id: profile.organization_id,
    role: profile.role as string,
  }
}
```

**Achtung:** Diese Funktion wird aktuell nur in `src/app/api/admin/` verwendet. Alle Aufrufer prüfen, ob sie mit dem neuen Rückgabetyp (`{ id, organization_id, role }`) kompatibel sind. Der alte Aufrufer erwartet ein User-Objekt — ggf. müssen API-Routes angepasst werden (nur `me.id` statt `user.id` verwenden).

- [ ] **Erstelle /settings/feeds/page.tsx**

```tsx
import React from 'react'
import { redirect } from 'next/navigation'
import { requireOrgAdmin } from '@/lib/auth/guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import FeedToggle from './FeedToggle'

export default async function SettingsFeedsPage() {
  const me = await requireOrgAdmin()

  const { data: settings } = await supabaseAdmin
    .from('organization_settings')
    .select('feeds_enabled')
    .eq('organization_id', me.organization_id)
    .single()

  const feedsEnabled = settings?.feeds_enabled ?? false

  return (
    <div className="content-max" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">Feed</h1>
          <p className="page-header-sub" style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Steuere ob Members den Feed nutzen können
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-header">
          <span className="card-header-label">Einstellungen</span>
        </div>
        <div className="card-body" style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>Feed aktivieren</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
                Members können Quellen, Schemas und Streams verwalten
              </div>
            </div>
            <FeedToggle enabled={feedsEnabled} orgId={me.organization_id} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Erstelle /settings/feeds/FeedToggle.tsx (Client-Komponente)**

```tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FeedToggle({ enabled, orgId }: { enabled: boolean; orgId: string }) {
  const router = useRouter()
  const [active, setActive] = useState(enabled)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    setSaving(true)
    await fetch('/api/admin/feeds/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !active }),
    })
    setActive(v => !v)
    router.refresh()
    setSaving(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className="btn"
      style={{
        background: active ? 'var(--accent)' : 'var(--bg-surface-2)',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: '1px solid var(--border-medium)',
        minWidth: 80,
      }}
    >
      {saving ? '…' : active ? 'Aktiv' : 'Inaktiv'}
    </button>
  )
}
```

- [ ] **API Route: /api/admin/feeds/toggle**

Create `src/app/api/admin/feeds/toggle/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireOrgAdmin } from '@/lib/auth/guards'

export async function POST(request: Request) {
  let me
  try { me = await requireOrgAdmin() }
  catch { return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 }) }

  const { enabled } = await request.json()

  const { error } = await supabaseAdmin
    .from('organization_settings')
    .update({ feeds_enabled: enabled })
    .eq('organization_id', me.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

- [ ] **NavBar: Feed-Link im Admin-Nav ergänzen**

In `src/components/NavBar.tsx`, im `showAdminNav` Block (nach "Branding"), `Rss` importieren und Link zu `/settings/feeds` hinzufügen:

```tsx
// Import ergänzen:
import { Rss } from '@phosphor-icons/react'

// Im showAdminNav Block nach Branding:
<li>
  <Link href="/settings/feeds" style={navLinkStyle(isActive('/settings/feeds'))}
    aria-current={isActive('/settings/feeds') ? 'page' : undefined}>
    <Rss size={16} weight="bold" aria-hidden="true" />
    Feed
  </Link>
</li>
```

- [ ] **Commit**

```bash
git add src/app/settings/feeds/ src/app/api/admin/feeds/ src/components/NavBar.tsx src/lib/auth/guards.ts
git commit -m "feat(feed): org admin settings page + toggle API + nav link + fix requireOrgAdmin"
```

---

## Chunk 4: NavBar Member-Link + /feed Route Skeleton

### Task 4: /feed Route + NavBar-Link (nur wenn aktiviert)

**Files:**
- Create: `src/app/feed/page.tsx`
- Create: `src/app/feed/layout.tsx`
- Modify: `src/components/NavBar.tsx`

- [ ] **NavBar: feeds_enabled aus bestehender branding-Query mitselecten**

In `src/components/NavBar.tsx`, im bestehenden `organization_settings`-Select `feeds_enabled` ergänzen:

```tsx
// Bestehender Select (Zeile ~49):
.select('logo_url, primary_color, organization_display_name, ai_guide_name, feeds_enabled')

// State ergänzen:
const [feedsEnabled, setFeedsEnabled] = useState(false)

// Im .then()-Callback:
if (data) {
  setBranding(data)
  setFeedsEnabled(data.feeds_enabled ?? false)
}
```

Der `OrgBranding` Typ um `feeds_enabled` erweitern:
```typescript
interface OrgBranding {
  logo_url: string | null
  primary_color: string
  organization_display_name: string | null
  ai_guide_name: string
  feeds_enabled: boolean
}
```

- [ ] **NavBar: Feed-Link im Member-Nav (konditionell)**

```tsx
// Im showMemberNav Block, nach Chat-Link:
{feedsEnabled && (
  <li>
    <Link href="/feed" style={navLinkStyle(isActive('/feed'))}
      aria-current={isActive('/feed') ? 'page' : undefined}>
      <Rss size={16} weight="bold" aria-hidden="true" />
      Feed
    </Link>
  </li>
)}
```

**Hinweis:** `Rss` wurde bereits in Chunk 3 importiert.

- [ ] **Erstelle /feed/layout.tsx**

```tsx
import type { ReactNode } from 'react'

export default function FeedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Erstelle /feed/page.tsx (Server Component)**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import FeedClient from './FeedClient'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) redirect('/dashboard')

  // Feature-Flag prüfen
  const { data: settings } = await supabaseAdmin
    .from('organization_settings')
    .select('feeds_enabled')
    .eq('organization_id', profile.organization_id)
    .single()
  if (!settings?.feeds_enabled) redirect('/dashboard')

  return <FeedClient userId={user.id} />
}
```

- [ ] **Commit**

```bash
git add src/app/feed/ src/components/NavBar.tsx
git commit -m "feat(feed): /feed route skeleton + conditional nav link"
```

---

## Chunk 5: Feed-Seite — Quellen-Spalte (links)

### Task 5: FeedClient + SourcesCol

**Files:**
- Create: `src/app/feed/FeedClient.tsx`
- Create: `src/app/feed/SourcesCol.tsx`
- Create: `src/app/feed/types.ts`

- [ ] **Erstelle types.ts**

```typescript
// src/app/feed/types.ts
import type { FeedSource, FeedSchema, FeedItem, FeedImportance } from '@/db/schema'

export type SourceFilter = 'all' | string  // 'all' oder source.id
export type ImportanceFilter = 'all' | FeedImportance

export interface FeedState {
  sources: FeedSource[]
  schemas: FeedSchema[]
  items: FeedItem[]
  activeSourceId: SourceFilter
  importanceFilter: ImportanceFilter
  activeSchemaId: string | null
  loadingSources: boolean
  loadingItems: boolean
}
```

- [ ] **Erstelle FeedClient.tsx**

```tsx
'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  listFeedSources, listFeedSchemas, listFeedItems,
} from '@/actions/feeds'
import SourcesCol from './SourcesCol'
import StreamCol from './StreamCol'
import ConfigCol from './ConfigCol'
import type { ImportanceFilter } from './types'
import type { FeedSource, FeedSchema, FeedItem, FeedImportance } from '@/db/schema'

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh' },
  inner: { paddingTop: 32, paddingBottom: 48 },
  pageHeader: { marginBottom: 24 },
  grid: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr 248px',
    gap: 16,
    alignItems: 'start',
  },
}

export default function FeedClient({ userId }: { userId: string }) {
  const [sources, setSources] = useState<FeedSource[]>([])
  const [schemas, setSchemas] = useState<FeedSchema[]>([])
  const [items, setItems] = useState<FeedItem[]>([])
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null)
  const [importanceFilter, setImportanceFilter] = useState<ImportanceFilter>('all')
  const [activeSchemaId, setActiveSchemaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [srcs, schs] = await Promise.all([
      listFeedSources(userId),
      listFeedSchemas(userId),
    ])
    setSources(srcs)
    setSchemas(schs)
    if (srcs.length > 0 && !activeSourceId) setActiveSourceId(srcs[0].id)
    setLoading(false)
  }, [userId])

  const loadItems = useCallback(async () => {
    const fetched = await listFeedItems({
      sourceId: activeSourceId ?? undefined,
      schemaId: activeSchemaId ?? undefined,
      importance: importanceFilter === 'all' ? undefined : importanceFilter as FeedImportance,
      limit: 50,
    })
    setItems(fetched)
  }, [activeSourceId, importanceFilter, activeSchemaId])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadItems() }, [loadItems])

  return (
    <div style={s.page}>
      <div className="content-max" style={s.inner}>
        <div className="page-header" style={s.pageHeader}>
          <div className="page-header-text">
            <h1 className="page-header-title">Feed</h1>
            <p className="page-header-sub" style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
              KI-verarbeitete Inhalte aus deinen Quellen
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Lädt…</div>
        ) : (
          <div style={s.grid}>
            <SourcesCol
              sources={sources}
              activeSourceId={activeSourceId}
              onSelect={setActiveSourceId}
              onRefresh={load}
              userId={userId}
            />
            <StreamCol
              items={items}
              importanceFilter={importanceFilter}
              onImportanceFilter={setImportanceFilter}
            />
            <ConfigCol
              schemas={schemas}
              activeSchemaId={activeSchemaId}
              onSelectSchema={setActiveSchemaId}
              onRefresh={load}
              userId={userId}
            />
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Erstelle SourcesCol.tsx**

**Hinweis:** `FeedSourceType` enum = `'rss' | 'newsletter' | 'api' | 'webhook' | 'url'` — alle 5 müssen in `SOURCE_TYPE_GROUPS` und `SOURCE_TYPE_LABELS` erscheinen.

```tsx
'use client'

import React, { useState } from 'react'
import { Rss, EnvelopeSimple, Code, Webhook, Link as LinkIcon, Plus } from '@phosphor-icons/react'
import { createFeedSource, deleteFeedSource } from '@/actions/feeds'
import type { FeedSource, FeedSourceType } from '@/db/schema'

const SOURCE_TYPE_LABELS: Record<FeedSourceType, string> = {
  rss: 'RSS', newsletter: 'Newsletter', api: 'API', webhook: 'Webhook', url: 'URL',
}
const SOURCE_TYPE_GROUPS: FeedSourceType[] = ['rss', 'newsletter', 'api', 'webhook', 'url']

const s: Record<string, React.CSSProperties> = {
  groupLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--text-tertiary)',
    padding: '8px 10px 2px', display: 'block',
  },
}

interface Props {
  sources: FeedSource[]
  activeSourceId: string | null
  onSelect: (id: string | null) => void
  onRefresh: () => void
  userId: string
}

export default function SourcesCol({ sources, activeSourceId, onSelect, onRefresh, userId }: Props) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newType, setNewType] = useState<FeedSourceType>('rss')

  const grouped = SOURCE_TYPE_GROUPS.reduce((acc, type) => {
    acc[type] = sources.filter(s => s.type === type)
    return acc
  }, {} as Record<FeedSourceType, FeedSource[]>)

  async function handleAdd() {
    if (!newName.trim() || !newUrl.trim()) return
    await createFeedSource({ userId, name: newName.trim(), type: newType, url: newUrl.trim() })
    setAdding(false); setNewName(''); setNewUrl('')
    onRefresh()
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-label">
          <Rss size={14} weight="bold" /> Quellen
        </span>
      </div>
      <div className="card-body">
        {SOURCE_TYPE_GROUPS.map(type => {
          const group = grouped[type]
          if (group.length === 0 && !adding) return null
          return (
            <div key={type}>
              <span style={s.groupLabel}>{SOURCE_TYPE_LABELS[type]}</span>
              {group.map(src => (
                <button
                  key={src.id}
                  className={`list-row${activeSourceId === src.id ? ' list-row--active' : ''}`}
                  onClick={() => onSelect(src.id)}
                >
                  <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {src.name}
                  </span>
                  <span className="badge">{src.itemsTotal ?? 0}</span>
                </button>
              ))}
            </div>
          )
        })}

        {adding ? (
          <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as FeedSourceType)}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--bg-surface-solid)' }}
            >
              {SOURCE_TYPE_GROUPS.map(t => <option key={t} value={t}>{SOURCE_TYPE_LABELS[t]}</option>)}
            </select>
            <input
              placeholder="Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--bg-surface-solid)' }}
              autoFocus
            />
            <input
              placeholder="URL"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--bg-surface-solid)' }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-primary btn-sm" onClick={handleAdd}>Speichern</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Abbrechen</button>
            </div>
          </div>
        ) : (
          <button className="list-row list-row--add" onClick={() => setAdding(true)}>
            <Plus size={14} weight="bold" /> Quelle hinzufügen
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/feed/
git commit -m "feat(feed): FeedClient + SourcesCol"
```

---

## Chunk 6: Stream-Spalte (mitte)

### Task 6: StreamCol

**Files:**
- Create: `src/app/feed/StreamCol.tsx`

**Hinweis:** Score-Filterung erfolgt über `FeedImportance` enum (`'high' | 'medium' | 'low' | 'none'`), nicht über numerische Scores. Die Chips zeigen diese Werte. `search` ist kein Parameter von `listFeedItems` — clientseitige Filterung falls nötig, oder komplett weglassen.

- [ ] **Erstelle StreamCol.tsx**

```tsx
'use client'

import React from 'react'
import { ArrowSquareOut } from '@phosphor-icons/react'
import type { FeedItem, FeedImportance } from '@/db/schema'
import type { ImportanceFilter } from './types'

const s: Record<string, React.CSSProperties> = {
  filters: {
    display: 'flex', gap: 6, alignItems: 'center',
    padding: '10px 14px', borderBottom: '1px solid var(--border)',
    flexWrap: 'wrap' as const,
  },
  item: { padding: '14px 16px', borderBottom: '1px solid var(--border)' },
  source: {
    fontSize: 11, color: 'var(--text-tertiary)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  title: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 4 },
  summary: { fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: 8 },
  meta: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const },
  tag: {
    background: 'var(--bg-surface-2)', color: 'var(--text-secondary)',
    fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
  },
  empty: { padding: '48px 16px', textAlign: 'center' as const, color: 'var(--text-tertiary)', fontSize: 14 },
}

function importanceDotColor(importance: FeedImportance | null) {
  if (importance === 'high') return 'var(--accent)'
  if (importance === 'medium') return 'var(--warning, #f59e0b)'
  return 'rgba(26,23,20,0.18)'
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return 'gerade eben'
  if (h < 24) return `vor ${h}h`
  return `vor ${d}d`
}

const FILTERS: { key: ImportanceFilter; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'high', label: 'Hoch' },
  { key: 'medium', label: 'Mittel' },
  { key: 'low', label: 'Niedrig' },
]

interface Props {
  items: FeedItem[]
  importanceFilter: ImportanceFilter
  onImportanceFilter: (f: ImportanceFilter) => void
}

export default function StreamCol({ items, importanceFilter, onImportanceFilter }: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-label">Stream</span>
      </div>
      <div style={s.filters}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`chip${importanceFilter === f.key ? ' chip--active' : ''}`}
            onClick={() => onImportanceFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div style={s.empty}>Keine Artikel gefunden</div>
      ) : (
        items.map(item => {
          const output = item.stage3Output as { title?: string; summary?: string; topics?: string[] } | null
          const title = output?.title ?? item.rawTitle
          const summary = output?.summary ?? item.rawContent?.slice(0, 160)
          const topics = output?.topics ?? []

          return (
            <div key={item.id} style={s.item}>
              <div style={s.source}>
                <span style={{ ...s.dot, background: importanceDotColor(item.importance) }} />
                {timeAgo(item.createdAt)}
                {item.importance && item.importance !== 'none' && ` · ${item.importance}`}
              </div>
              <div style={s.title}>{title}</div>
              {summary && <div style={s.summary}>{summary}</div>}
              <div style={s.meta}>
                {topics.slice(0, 3).map(t => <span key={t} style={s.tag}>{t}</span>)}
                {item.rawUrl && (
                  <a href={item.rawUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <ArrowSquareOut size={11} weight="bold" /> Öffnen
                  </a>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/feed/StreamCol.tsx
git commit -m "feat(feed): StreamCol with importance filters + items"
```

---

## Chunk 7: Konfigurations-Spalte (rechts)

### Task 7: ConfigCol — Schemas, Verteilung, TTL

**Files:**
- Create: `src/app/feed/ConfigCol.tsx`

**Hinweis:** `createFeedSchema()` erfordert `outputStructure: Record<string, unknown>` — Pflichtfeld, Default `{}`.

- [ ] **Erstelle ConfigCol.tsx**

```tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Plus, ChatCircle, EnvelopeSimple, Newspaper } from '@phosphor-icons/react'
import {
  createFeedSchema, deleteFeedSchema,
  listDistributions, createDistribution, deleteDistribution,
} from '@/actions/feeds'
import type { FeedSchema, FeedDistribution } from '@/db/schema'

const s: Record<string, React.CSSProperties> = {
  distRow: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '7px 10px', borderRadius: 'var(--radius-sm)',
    fontSize: 13, color: 'var(--text-tertiary)',
  },
  distIcon: {
    width: 28, height: 28, borderRadius: 8,
    background: 'var(--bg-surface-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  distCheck: { marginLeft: 'auto', color: 'var(--accent)', fontWeight: 700 },
  ttlRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '6px 10px', fontSize: 13, color: 'var(--text-tertiary)',
  },
  ttlVal: { color: 'var(--text-primary)', fontWeight: 600, fontSize: 12 },
}

interface Props {
  schemas: FeedSchema[]
  activeSchemaId: string | null
  onSelectSchema: (id: string | null) => void
  onRefresh: () => void
  userId: string
}

export default function ConfigCol({ schemas, activeSchemaId, onSelectSchema, onRefresh, userId }: Props) {
  const [adding, setAdding] = useState(false)
  const [newSchemaName, setNewSchemaName] = useState('')
  const [distributions, setDistributions] = useState<FeedDistribution[]>([])

  useEffect(() => {
    if (activeSchemaId) {
      listDistributions(activeSchemaId).then(setDistributions)
    }
  }, [activeSchemaId])

  async function handleAddSchema() {
    if (!newSchemaName.trim()) return
    const schema = await createFeedSchema({
      userId,
      name: newSchemaName.trim(),
      scoringPrompt: 'Bewerte die Relevanz dieses Artikels auf einer Skala von 1-10.',
      extractionPrompt: 'Extrahiere Titel, Zusammenfassung und Hauptthemen.',
      outputStructure: {},        // required — default leer
      minScore: 5,
      maxAgeDays: 30,
    })
    setAdding(false); setNewSchemaName('')
    onSelectSchema(schema.id)
    onRefresh()
  }

  const DIST_TYPES = [
    { type: 'workspace' as const, label: 'Workspace (auto)', Icon: ChatCircle },
    { type: 'email' as const, label: 'E-Mail täglich', Icon: EnvelopeSimple },
    { type: 'newscenter' as const, label: 'Newscenter', Icon: Newspaper },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-label">Konfiguration</span>
      </div>
      <div className="card-body">

        <span className="card-section-label">Schemas</span>
        {schemas.map(schema => (
          <button
            key={schema.id}
            className={`list-row${activeSchemaId === schema.id ? ' list-row--active' : ''}`}
            onClick={() => onSelectSchema(activeSchemaId === schema.id ? null : schema.id)}
          >
            {schema.name}
          </button>
        ))}
        {adding ? (
          <div style={{ padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              placeholder="Schema-Name"
              value={newSchemaName}
              onChange={e => setNewSchemaName(e.target.value)}
              autoFocus
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-medium)', background: 'var(--bg-surface-solid)' }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-primary btn-sm" onClick={handleAddSchema}>Erstellen</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Abbrechen</button>
            </div>
          </div>
        ) : (
          <button className="list-row list-row--add" onClick={() => setAdding(true)}>
            <Plus size={14} weight="bold" /> Schema
          </button>
        )}

        <div className="card-divider" style={{ margin: '10px 0' }} />

        <span className="card-section-label">Verteilung</span>
        {DIST_TYPES.map(({ type, label, Icon }) => {
          const active = distributions.some(d => d.type === type && d.isActive)
          return (
            <div key={type} style={{ ...s.distRow, color: active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              <div style={s.distIcon}>
                <Icon size={16} weight="bold" color={active ? 'var(--accent)' : 'var(--text-tertiary)'} />
              </div>
              {label}
              {active && <span style={s.distCheck}>✓</span>}
            </div>
          )
        })}

        <div className="card-divider" style={{ margin: '10px 0' }} />

        <span className="card-section-label">TTL</span>
        <div style={s.ttlRow}>Standard <span style={s.ttlVal}>30 Tage</span></div>
        <div style={s.ttlRow}>Wichtig <span style={s.ttlVal}>90 Tage</span></div>

      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/feed/ConfigCol.tsx
git commit -m "feat(feed): ConfigCol with schemas + distribution + TTL"
```

---

## Chunk 8: Smoke-Test + Feinschliff

### Task 8: Manuelle Verifikation

- [ ] **App starten**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm dev
```

- [ ] **Superadmin: Feed für Test-Org aktivieren**

`/superadmin/clients` → Org auswählen → Feed-Checkbox aktivieren

- [ ] **Als Member: /feed aufrufen**

NavBar zeigt "Feed"-Link → klicken → 3-Spalten-Layout erscheint

- [ ] **Als Admin: /settings/feeds prüfen**

Toggle-Button schaltet Feature ein/aus, Seite refresht

- [ ] **Quelle hinzufügen testen**

SourcesCol → "+ Quelle hinzufügen" → Name + URL + Typ → Speichern → erscheint in Liste

- [ ] **Schema hinzufügen testen**

ConfigCol → "+ Schema" → Name → Erstellen → erscheint in Liste

- [ ] **TypeScript check**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm typecheck
```

Expected: keine Fehler (oder nur pre-existing)

- [ ] **Finaler Commit**

```bash
git add -A
git commit -m "feat(feed): complete Feed UI — 3-column layout, admin toggle, superadmin flag"
```
