# Plan K — Geteilte Chats + Team-Antwort

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nutzer können eine Konversation per Link mit Org-Mitgliedern teilen; Empfänger sehen den Chat read-only und können mit einem Klick eine neue Antwort-Konversation starten.

**Architecture:** `share_token` wird direkt auf der `conversations`-Tabelle gespeichert (kein eigener Table nötig). Die öffentliche View-Route `/s/[token]` lädt Conversation + Messages ohne Auth via dediziertem API-Endpoint; Team-Antwort erstellt eine neue Konversation mit `shared_from_id`-Referenz. Scope MVP: nur `'org'` (Org-Mitglieder müssen eingeloggt sein).

**Tech Stack:** Next.js App Router, Supabase (supabaseAdmin), Phosphor Icons, CSS-Variablen, `nanoid` für Token-Generierung (bereits in package.json vorhanden prüfen — sonst `crypto.randomUUID()` nutzen).

---

## Codebase-Kontext (vor dem Bauen lesen)

- `conversations`-Tabelle: `id, workspace_id, user_id, title, created_at, deleted_at, conversation_type, ...`
  - `workspace_id` referenziert `departments` (das Org-Department) — **nicht** Canvas-Workspaces
  - `/chat/[id]/page.tsx` ermittelt `workspace_id` selbst via `department_members` — URL braucht keinen param
- `messages`-Tabelle: `id, conversation_id, role, content, created_at`
- **Auth-Pattern**: `getAuthUser()` aus `@/lib/api/projects` importieren (gibt `{ id, organization_id, role }` zurück, gibt `null` wenn kein Org-Profil). Nie lokal re-definieren.
- `supabaseAdmin` für alle DB-Queries auf dem Server
- `WorkspaceState` Interface liegt in `src/lib/workspace-types.ts` — muss für neue State-Felder erweitert werden
- Modals werden in `ChatArea.tsx` gemountet (nicht in `WorkspaceLayout`) — dort liegt z.B. `MemorySaveModal`
- ContextMenu liegt in `src/components/workspace/ContextMenu.tsx` — dort kommt der Share-Button rein
- Design-Pflicht: `.card`, `.btn`, `.chip`, CSS-Variablen, Phosphor Icons (`weight="bold"` oder `weight="fill"`)
- CI-Lint blockt: `console.log`, Hex-Farben, Icon `weight="regular"/"thin"`, Dateien > 500 Zeilen
- Alle neuen API-Routes brauchen: `export const runtime = 'nodejs'` (sonst Edge-Runtime auf Vercel)

---

## Dateistruktur

| Datei | Aktion | Verantwortung |
|-------|--------|---------------|
| `supabase/migrations/20260319000050_shared_chats.sql` | **Neu** | `share_token`, `shared_at`, `share_scope`, `shared_from_id` auf `conversations` |
| `src/app/api/conversations/[id]/share/route.ts` | **Neu** | POST (Token generieren) + DELETE (Token widerrufen) |
| `src/app/api/s/[token]/route.ts` | **Neu** | GET — Conversation + Messages via Token (kein Auth nötig, org-intern geprüft nach Login) |
| `src/app/s/[token]/page.tsx` | **Neu** | Server Component — Auth-Check + SharedChatClient mounten |
| `src/app/s/[token]/SharedChatClient.tsx` | **Neu** | Read-only Chat-View + "Antworten"-Button |
| `src/components/workspace/ShareModal.tsx` | **Neu** | Modal: Link kopieren + Share widerrufen |
| `src/components/workspace/ContextMenu.tsx` | **Ändern** | "Teilen"-Button hinzufügen |
| `src/lib/workspace-types.ts` | **Ändern** | `shareModalConvId` + `setShareModalConvId` zu `WorkspaceState` Interface hinzufügen |
| `src/hooks/useWorkspaceState.ts` | **Ändern** | `shareModalConvId` State |

---

## Task 1: Migration

**Files:**
- Create: `supabase/migrations/20260319000050_shared_chats.sql`

- [ ] **Migration schreiben:**

```sql
-- 20260319000050_shared_chats.sql
-- Plan K: Geteilte Chats — share_token + Team-Antwort-Referenz

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS share_token    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS shared_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS share_scope    TEXT CHECK (share_scope IN ('org')) DEFAULT 'org',
  ADD COLUMN IF NOT EXISTS shared_from_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

-- Schneller Lookup via Token
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_share_token
  ON public.conversations(share_token)
  WHERE share_token IS NOT NULL;

-- Antwort-Ketten finden
CREATE INDEX IF NOT EXISTS idx_conversations_shared_from
  ON public.conversations(shared_from_id)
  WHERE shared_from_id IS NOT NULL;
```

- [ ] **Migration pushen:**
```bash
cd "/c/Users/timmr/tropenOS" && supabase db push
```
Expected: `Remote database already up to date` oder `Applied 1 migration`

- [ ] **Commit:**
```bash
git add supabase/migrations/20260319000050_shared_chats.sql
git commit -m "feat(db): Plan K — share_token + shared_from_id auf conversations (Migration 050)"
```

---

## Task 2: Share API

**Files:**
- Create: `src/app/api/conversations/[id]/share/route.ts`

- [ ] **Route schreiben:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'

export const runtime = 'nodejs'

// POST /api/conversations/[id]/share → Token generieren (idempotent)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Ownership prüfen
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, user_id, share_token')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Idempotent: schon geteilt → bestehenden Token zurückgeben
  if (conv.share_token) {
    return NextResponse.json({ share_token: conv.share_token })
  }

  const token = crypto.randomUUID().replace(/-/g, '')

  const { error } = await supabaseAdmin
    .from('conversations')
    .update({
      share_token: token,
      shared_at: new Date().toISOString(),
      share_scope: 'org',
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ share_token: token })
}

// DELETE /api/conversations/[id]/share → Share widerrufen
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await supabaseAdmin
    .from('conversations')
    .update({ share_token: null, shared_at: null, share_scope: null })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
```

- [ ] **TypeScript prüfen:**
```bash
npx tsc --noEmit 2>&1 | grep -v "npm warn"
```
Expected: keine Fehler

- [ ] **Commit:**
```bash
git add src/app/api/conversations/[id]/share/route.ts
git commit -m "feat(api): POST/DELETE /api/conversations/[id]/share — Token generieren + widerrufen"
```

---

## Task 3: Token-Lookup API

**Files:**
- Create: `src/app/api/s/[token]/route.ts`

- [ ] **Route schreiben:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'

export const runtime = 'nodejs'

// GET /api/s/[token] — Geteilte Konversation laden (scope=org → Login erforderlich)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Token validieren
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, title, created_at, user_id')
    .eq('share_token', token)
    .is('deleted_at', null)
    .single()

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Auth + gleiche Org prüfen (getAuthUser gibt null wenn kein Org-Profil)
  const viewer = await getAuthUser()
  if (!viewer) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  // Owner-Org ermitteln und mit Viewer-Org vergleichen
  const { data: ownerProfile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', conv.user_id)
    .single()

  if (!ownerProfile || viewer.organization_id !== ownerProfile.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Messages laden
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conv.id)
    .order('created_at')

  return NextResponse.json({
    conversation: { id: conv.id, title: conv.title, created_at: conv.created_at },
    messages: messages ?? [],
  })
}
```

- [ ] **TypeScript prüfen:**
```bash
npx tsc --noEmit 2>&1 | grep -v "npm warn"
```
Expected: keine Fehler

- [ ] **Commit:**
```bash
git add src/app/api/s/[token]/route.ts
git commit -m "feat(api): GET /api/s/[token] — shared chat read endpoint (org-scoped)"
```

---

## Task 4: ShareModal Komponente

**Files:**
- Create: `src/components/workspace/ShareModal.tsx`

- [ ] **Komponente schreiben:**

```typescript
'use client'

import React, { useEffect, useState } from 'react'
import { LinkSimple, X, Check, Trash } from '@phosphor-icons/react'

interface ShareModalProps {
  convId: string
  convTitle: string | null
  onClose: () => void
}

export default function ShareModal({ convId, convTitle, onClose }: ShareModalProps) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/conversations/${convId}/share`, { method: 'POST' })
      .then(r => r.ok ? r.json() : null)
      .then(data => setToken(data?.share_token ?? null))
      .finally(() => setLoading(false))
  }, [convId])

  const shareUrl = token ? `${window.location.origin}/s/${token}` : ''

  function handleCopy() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleRevoke() {
    setRevoking(true)
    await fetch(`/api/conversations/${convId}/share`, { method: 'DELETE' })
    setToken(null)
    setRevoking(false)
    onClose()
  }

  const s: Record<string, React.CSSProperties> = {
    backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: 'var(--bg-surface)', borderRadius: 12, padding: 24, width: 420, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    title: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 },
    sub: { fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 },
    row: { display: 'flex', gap: 8, alignItems: 'center' },
    urlBox: { flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    footer: { marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    hint: { fontSize: 11, color: 'var(--text-tertiary)' },
  }

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <p style={s.title}>
            <LinkSimple size={15} weight="bold" style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Chat teilen
          </p>
          <button className="btn-icon" onClick={onClose} aria-label="Schließen">
            <X size={16} weight="bold" />
          </button>
        </div>
        <p style={s.sub}>
          {convTitle ? `„${convTitle}"` : 'Dieser Chat'} ist für alle Mitglieder deiner Organisation sichtbar.
        </p>

        {loading ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Link wird erstellt…</p>
        ) : token ? (
          <>
            <div style={s.row}>
              <div style={s.urlBox}>{shareUrl}</div>
              <button className="btn btn-primary" onClick={handleCopy}>
                {copied ? <Check size={14} weight="bold" /> : <LinkSimple size={14} weight="bold" />}
                {copied ? 'Kopiert' : 'Kopieren'}
              </button>
            </div>
            <div style={s.footer}>
              <span style={s.hint}>Nur für Org-Mitglieder zugänglich</span>
              <button className="btn btn-ghost" onClick={handleRevoke} disabled={revoking}>
                <Trash size={14} weight="bold" />
                {revoking ? 'Widerrufe…' : 'Freigabe aufheben'}
              </button>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Fehler beim Erstellen des Links.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **TypeScript prüfen:**
```bash
npx tsc --noEmit 2>&1 | grep -v "npm warn"
```

- [ ] **Commit:**
```bash
git add src/components/workspace/ShareModal.tsx
git commit -m "feat(ui): ShareModal Komponente — Link kopieren + Freigabe widerrufen"
```

---

## Task 5: Share-Button im ContextMenu + State

**Files:**
- Modify: `src/components/workspace/ContextMenu.tsx`
- Modify: `src/hooks/useWorkspaceState.ts`
- Modify: `src/lib/workspace-actions.ts`

**5a — ContextMenu erweitern:**

- [ ] Import in `ContextMenu.tsx` ergänzen:
```typescript
import { PencilSimple, FolderSimple, CaretRight, Trash, LinkSimple } from '@phosphor-icons/react'
```

- [ ] Interface um `onShare` erweitern:
```typescript
onShare: (convId: string) => void
```

- [ ] Share-Button vor dem Divider einfügen (nach "Zu Projekt"-Block, vor `wl-ctx-divider`):
```tsx
<button className="wl-ctx-item" onMouseDown={(e) => {
  e.stopPropagation()
  onSetContextMenuId(null)
  onSetMenuAnchor(null)
  onShare(menuConv.id)
}}>
  <LinkSimple size={15} weight="bold" className="wl-ctx-icon" />
  Teilen
</button>
```

**5b — WorkspaceState Interface + State:**

- [ ] In `src/lib/workspace-types.ts` → `WorkspaceState` Interface erweitern:
```typescript
shareModalConvId: string | null
setShareModalConvId: React.Dispatch<React.SetStateAction<string | null>>
```

- [ ] In `src/hooks/useWorkspaceState.ts` State hinzufügen:
```typescript
const [shareModalConvId, setShareModalConvId] = useState<string | null>(null)
```

- [ ] Im Return-Objekt des Hooks exponieren:
```typescript
shareModalConvId,
setShareModalConvId,
```

**5c — ShareModal in `ChatArea.tsx` mounten** (dort liegt auch `MemorySaveModal`):

- [ ] Import in `ChatArea.tsx`:
```tsx
import ShareModal from './ShareModal'
```

- [ ] Im JSX, nach `MemorySaveModal` (Props `shareModalConvId`, `setShareModalConvId`, `conversations` kommen via `WorkspaceState`-Props):
```tsx
{shareModalConvId && (
  <ShareModal
    convId={shareModalConvId}
    convTitle={conversations.find(c => c.id === shareModalConvId)?.title ?? null}
    onClose={() => setShareModalConvId(null)}
  />
)}
```

- [ ] `onShare` an ContextMenu weiterleiten (ContextMenu erhält Props über `LeftNav` → `WorkspaceLayout`):
```tsx
onShare={(convId) => setShareModalConvId(convId)}
```

- [ ] **TypeScript prüfen:**
```bash
npx tsc --noEmit 2>&1 | grep -v "npm warn"
```

- [ ] **Commit:**
```bash
git add src/components/workspace/ContextMenu.tsx src/hooks/useWorkspaceState.ts
git commit -m "feat(ui): Share-Button im ContextMenu + shareModalConvId State"
```

---

## Task 6: Shared Chat Seite `/s/[token]`

**Files:**
- Create: `src/app/s/[token]/page.tsx`
- Create: `src/app/s/[token]/SharedChatClient.tsx`

**6a — Server Component:**

- [ ] `src/app/s/[token]/page.tsx` schreiben:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import SharedChatClient from './SharedChatClient'

export default async function SharedChatPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Auth prüfen — nicht eingeloggt → Login mit Redirect
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=/s/${token}`)
  }

  return <SharedChatClient token={token} />
}
```

**6b — Client Component:**

- [ ] `src/app/s/[token]/SharedChatClient.tsx` schreiben:

```typescript
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatCircle, ArrowLeft } from '@phosphor-icons/react'

interface Message {
  id: string
  role: string
  content: string
  created_at: string
}

interface SharedData {
  conversation: { id: string; title: string | null; created_at: string }
  messages: Message[]
}

export default function SharedChatClient({ token }: { token: string }) {
  const router = useRouter()
  const [data, setData] = useState<SharedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [replying, setReplying] = useState(false)

  useEffect(() => {
    fetch(`/api/s/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch(() => setError('Chat nicht gefunden oder kein Zugriff.'))
  }, [token])

  async function handleReply() {
    if (!data) return
    setReplying(true)
    // Neue Konversation mit shared_from_id erstellen
    const res = await fetch('/api/conversations/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shared_from_id: data.conversation.id,
        title: `Antwort: ${data.conversation.title ?? 'Geteilter Chat'}`,
      }),
    })
    if (res.ok) {
      const newConv = await res.json()
      router.push(`/chat/${newConv.id}`)
    }
    setReplying(false)
  }

  const s: Record<string, React.CSSProperties> = {
    wrap: { maxWidth: 720, margin: '0 auto', padding: '32px 16px 48px' },
    header: { marginBottom: 32 },
    title: { fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' },
    meta: { fontSize: 13, color: 'var(--text-tertiary)' },
    badge: { display: 'inline-block', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, marginLeft: 8 },
    messages: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 },
    msgUser: { background: 'var(--bg-surface)', borderRadius: 10, padding: '12px 16px', alignSelf: 'flex-end', maxWidth: '85%', border: '1px solid var(--border)' },
    msgAssistant: { background: 'transparent', maxWidth: '85%' },
    role: { fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
    content: { fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 },
    actions: { display: 'flex', gap: 12, justifyContent: 'center' },
  }

  if (error) {
    return (
      <div style={s.wrap}>
        <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', paddingTop: 80 }}>{error}</p>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={() => router.push('/chat')}>
            <ArrowLeft size={14} weight="bold" /> Zurück
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div style={{ ...s.wrap, color: 'var(--text-tertiary)', textAlign: 'center', paddingTop: 80 }}>Lade…</div>
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => router.back()}>
          <ArrowLeft size={14} weight="bold" /> Zurück
        </button>
        <h1 style={s.title}>
          {data.conversation.title ?? 'Geteilter Chat'}
          <span style={s.badge}>Geteilt</span>
        </h1>
        <p style={s.meta}>{new Date(data.conversation.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      <div style={s.messages}>
        {data.messages.map(msg => (
          <div key={msg.id} style={msg.role === 'user' ? s.msgUser : s.msgAssistant}>
            <p style={s.role}>{msg.role === 'user' ? 'Du' : 'Toro'}</p>
            <p style={s.content}>{msg.content}</p>
          </div>
        ))}
      </div>

      <div style={s.actions}>
        <button className="btn btn-primary" onClick={handleReply} disabled={replying}>
          <ChatCircle size={15} weight="bold" />
          {replying ? 'Erstelle Chat…' : 'Im eigenen Chat antworten'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **TypeScript prüfen:**
```bash
npx tsc --noEmit 2>&1 | grep -v "npm warn"
```

- [ ] **Commit:**
```bash
git add src/app/s/
git commit -m "feat(ui): /s/[token] — read-only Shared Chat View + Team-Antwort-Button"
```

---

## Task 7: Reply API

**Files:**
- Create: `src/app/api/conversations/reply/route.ts`

- [ ] **Route schreiben:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'

export const runtime = 'nodejs'

// POST /api/conversations/reply — neue Konversation als Antwort auf geteilten Chat
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { shared_from_id: string; title?: string }
  if (!body.shared_from_id) {
    return NextResponse.json({ error: 'shared_from_id fehlt' }, { status: 400 })
  }

  // shared_from_id muss existieren und geteilt sein
  const { data: source } = await supabaseAdmin
    .from('conversations')
    .select('id, user_id, share_token')
    .eq('id', body.shared_from_id)
    .not('share_token', 'is', null)
    .single()

  if (!source) return NextResponse.json({ error: 'Geteilter Chat nicht gefunden' }, { status: 404 })

  // Gleiche Org prüfen
  const { data: ownerProfile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', source.user_id)
    .single()

  if (!ownerProfile || user.organization_id !== ownerProfile.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Replying user's department ermitteln
  const { data: membership } = await supabaseAdmin
    .from('department_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  // Neue Konversation in der eigenen Department des Replyers anlegen
  // workspace_id = eigenes Department (nicht das des Source-Owners)
  const { data: newConv, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      workspace_id: membership?.workspace_id ?? null,
      user_id: user.id,
      title: body.title ?? 'Antwort auf geteilten Chat',
      conversation_type: 'chat',
      shared_from_id: source.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(newConv)
}
```

- [ ] **TypeScript prüfen:**
```bash
npx tsc --noEmit 2>&1 | grep -v "npm warn"
```

- [ ] **Commit:**
```bash
git add src/app/api/conversations/reply/route.ts
git commit -m "feat(api): POST /api/conversations/reply — neue Konversation als Team-Antwort"
```

---

## Task 8: CLAUDE.md + superadmin.md aktualisieren

- [ ] In `CLAUDE.md` → Migrations-Übersicht:
```
| 20260319000050_shared_chats.sql | conversations: share_token, shared_at, share_scope, shared_from_id |
```

- [ ] In `docs/product/superadmin.md` → Superadmin To-Do:
```
| ✅ Fertig | **Plan K** — Geteilte Chats (Share-Link, /s/[token], Team-Antwort) | ✅ 2026-03-19 |
```

- [ ] Entfernen:
```
| 🟡 Mittel | **Plan K** — Geteilte Chats + Team-Antwort | ⬜ Offen |
```

- [ ] **Commit:**
```bash
git add CLAUDE.md docs/product/superadmin.md
git commit -m "docs: Plan K als Fertig markieren, Migration 050 in CLAUDE.md"
```

---

## Abschluss-Check

```bash
npx tsc --noEmit 2>&1 | grep -v "npm warn"
node scripts/ci/lint-design-system.mjs 2>&1 | head -20
```

Beide müssen grün sein.

---

## Was Plan K explizit NICHT baut

- Öffentliches Teilen (ohne Login) — bewusst weggelassen (KMU-Kontext, Datenschutz)
- Kommentar-Threads auf geteilten Chats (Phase 3 / Kollaborative Chats)
- Share-Status-Indikator in der Chat-Liste (Folge-Ticket)
- Ablaufdatum für Share-Links (Folge-Ticket)
