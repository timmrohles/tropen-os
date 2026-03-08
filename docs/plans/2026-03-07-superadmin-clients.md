# Superadmin Client Management – Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Internes `/superadmin/clients`-Tool für Tropen zum Anlegen und Verwalten von Kunden-Organisationen.

**Architecture:** Neue Rolle `superadmin` in `users.role`. Server-seitiger Layout-Guard für `/superadmin/*`. API-Route erstellt Org + Workspace + Organization Settings + sendet Owner-Einladung per Supabase Admin API.

**Tech Stack:** Next.js 15 App Router, Supabase SSR + Admin (Service Role), TypeScript, Inline-Styles (`s`-Objekte), `@supabase/ssr`

---

### Task 1: Migration – superadmin Rolle hinzufügen

**Files:**
- Create: `supabase/migrations/011_superadmin.sql`

**Step 1: Migration schreiben**

```sql
-- 011_superadmin.sql
-- Erweitert users.role um 'superadmin' für internes Tropen-Tool

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('superadmin', 'owner', 'admin', 'member', 'viewer'));
```

**Step 2: Migration in Supabase ausführen**

Im Supabase Dashboard → SQL Editor → Migration einfügen → Run.

Oder per CLI (falls lokal):
```bash
supabase db push
```

**Step 3: Tropen-Account auf superadmin setzen**

Im Supabase Dashboard → SQL Editor:
```sql
UPDATE users SET role = 'superadmin' WHERE email = 'hello@tropen.de';
-- Ergebnis prüfen:
SELECT id, email, role FROM users WHERE role = 'superadmin';
```

Erwartetes Ergebnis: 1 Zeile mit `role = 'superadmin'`.

**Step 4: Commit**

```bash
git add supabase/migrations/011_superadmin.sql
git commit -m "feat: superadmin Rolle in users.role ergänzt"
```

---

### Task 2: API-Route GET + POST /api/superadmin/clients

**Files:**
- Create: `src/app/api/superadmin/clients/route.ts`

**Step 1: Implementierung schreiben**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Superadmin-Check: User muss role = 'superadmin' haben
async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (me?.role !== 'superadmin') return null
  return user
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const suffix = Date.now().toString(36).slice(-4)
  return `${base}-${suffix}`
}

// GET /api/superadmin/clients – alle Organisationen mit Details
export async function GET() {
  const user = await requireSuperadmin()
  if (!user) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const { data: orgs, error } = await supabaseAdmin
    .from('organizations')
    .select(`
      id, name, slug, plan, budget_limit, created_at,
      workspaces(id, name, budget_limit),
      organization_settings(onboarding_completed),
      users(id, email, role)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('superadmin clients GET:', error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }

  return NextResponse.json(orgs ?? [])
}

// POST /api/superadmin/clients – neuen Client anlegen
export async function POST(req: NextRequest) {
  const user = await requireSuperadmin()
  if (!user) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const {
    org_name,
    plan,
    org_budget_limit,
    workspace_name,
    workspace_budget_limit,
    owner_email,
  } = await req.json()

  if (!org_name?.trim() || !plan || !workspace_name?.trim() || !owner_email?.trim()) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 })
  }

  // 1. Organisation anlegen
  const { data: org, error: orgErr } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: org_name.trim(),
      slug: generateSlug(org_name.trim()),
      plan,
      budget_limit: org_budget_limit || null,
    })
    .select('id, name, slug, plan, budget_limit')
    .single()

  if (orgErr || !org) {
    console.error('org insert:', orgErr)
    return NextResponse.json({ error: 'Organisation konnte nicht angelegt werden' }, { status: 500 })
  }

  // 2. Workspace anlegen
  const { data: workspace, error: wsErr } = await supabaseAdmin
    .from('workspaces')
    .insert({
      organization_id: org.id,
      name: workspace_name.trim(),
      budget_limit: workspace_budget_limit || null,
    })
    .select('id, name, budget_limit')
    .single()

  if (wsErr || !workspace) {
    console.error('workspace insert:', wsErr)
    // Org cleanup
    await supabaseAdmin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: 'Workspace konnte nicht angelegt werden' }, { status: 500 })
  }

  // 3. Organization Settings anlegen (Defaults)
  await supabaseAdmin.from('organization_settings').insert({
    organization_id: org.id,
    primary_color: '#14b8a6',
    ai_guide_name: 'Toro',
    ai_guide_description: 'Dein KI-Guide durch den Informationsdschungel',
    onboarding_completed: false,
  })

  // 4. Owner einladen
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    owner_email.trim(),
    {
      data: { organization_id: org.id, role: 'owner' },
      redirectTo: `${siteUrl}/auth/callback`,
    }
  )

  if (inviteErr) {
    console.error('invite error:', inviteErr)
    // Org + Workspace cleanup
    await supabaseAdmin.from('workspaces').delete().eq('id', workspace.id)
    await supabaseAdmin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json(
      { error: `Einladung fehlgeschlagen: ${inviteErr.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ organization: org, workspace, invited: true }, { status: 201 })
}
```

**Step 2: Manuell testen (curl oder Browser)**

```bash
# Erfordert eingeloggten superadmin-User (Cookie)
curl -X POST http://localhost:3000/api/superadmin/clients \
  -H "Content-Type: application/json" \
  -d '{"org_name":"Test GmbH","plan":"free","workspace_name":"Haupt-Workspace","owner_email":"test@example.com"}'
```

Erwartung: `201` mit `{ organization: {...}, workspace: {...}, invited: true }`

**Step 3: Commit**

```bash
git add src/app/api/superadmin/clients/route.ts
git commit -m "feat: POST/GET /api/superadmin/clients – Org + Workspace + Einladung"
```

---

### Task 3: Superadmin Layout mit Auth-Guard

**Files:**
- Create: `src/app/superadmin/layout.tsx`

**Step 1: Layout schreiben**

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { ReactNode } from 'react'

export default async function SuperadminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') redirect('/workspaces')

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #1e1e1e' }}>
        <span style={{ fontSize: 11, color: '#444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          🦜 Tropen Superadmin
        </span>
      </div>
      {children}
    </div>
  )
}
```

**Step 2: Middleware – /superadmin/* vom Onboarding-Guard ausschließen**

In `src/middleware.ts` direkt nach dem `/reset-password`-Block einfügen:

```typescript
// /superadmin/*: Layout-Guard übernimmt die Auth-Prüfung (Server Component)
if (pathname.startsWith('/superadmin')) {
  return response
}
```

**Step 3: Verify**

Browser → `http://localhost:3000/superadmin/clients` als normaler User → Redirect zu `/workspaces`. Als superadmin → Seite lädt.

**Step 4: Commit**

```bash
git add src/app/superadmin/layout.tsx src/middleware.ts
git commit -m "feat: superadmin Layout mit Role-Guard"
```

---

### Task 4: Client-Übersicht /superadmin/clients

**Files:**
- Create: `src/app/superadmin/clients/page.tsx`

**Step 1: Seite schreiben**

```typescript
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface OrgRow {
  id: string
  name: string
  plan: string
  budget_limit: number | null
  created_at: string
  workspaces: { id: string; name: string; budget_limit: number | null }[]
  organization_settings: { onboarding_completed: boolean }[]
  users: { id: string; email: string; role: string }[]
}

export default function SuperadminClientsPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/superadmin/clients')
      .then((r) => r.json())
      .then((data) => { setOrgs(data); setLoading(false) })
  }, [])

  const owner = (org: OrgRow) =>
    org.users.find((u) => u.role === 'owner')?.email ?? '–'

  const onboardingDone = (org: OrgRow) =>
    org.organization_settings?.[0]?.onboarding_completed === true

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={s.h1}>Clients</h1>
          <p style={s.sub}>{orgs.length} Organisation{orgs.length !== 1 ? 'en' : ''}</p>
        </div>
        <Link href="/superadmin/clients/new" style={s.btnPrimary}>
          + Neuer Client
        </Link>
      </div>

      {loading ? (
        <p style={{ color: '#555', fontSize: 13 }}>Lade…</p>
      ) : orgs.length === 0 ? (
        <p style={{ color: '#555', fontSize: 13 }}>Noch keine Clients angelegt.</p>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              {['Firma', 'Plan', 'Budget Org', 'Workspace', 'Owner', 'Onboarding'].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id}>
                <td style={s.td}>
                  <div style={{ color: '#fff', fontWeight: 500 }}>{org.name}</div>
                  <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{org.id.slice(0, 8)}…</div>
                </td>
                <td style={s.td}>
                  <span style={{ ...s.badge, background: planColor(org.plan) }}>{org.plan}</span>
                </td>
                <td style={s.td}>
                  <span style={{ color: '#888', fontSize: 13 }}>
                    {org.budget_limit != null ? `€${org.budget_limit}/Mo` : '–'}
                  </span>
                </td>
                <td style={s.td}>
                  <span style={{ color: '#ccc', fontSize: 13 }}>
                    {org.workspaces?.[0]?.name ?? '–'}
                  </span>
                </td>
                <td style={s.td}>
                  <span style={{ color: '#888', fontSize: 12 }}>{owner(org)}</span>
                </td>
                <td style={s.td}>
                  <span style={{
                    ...s.badge,
                    background: onboardingDone(org) ? '#1a3a1a' : '#2a1a1a',
                    color: onboardingDone(org) ? '#22c55e' : '#888',
                  }}>
                    {onboardingDone(org) ? 'Fertig' : 'Ausstehend'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function planColor(plan: string) {
  return { free: '#1e1e1e', pro: '#1a2a3a', enterprise: '#1a3a2a' }[plan] ?? '#1e1e1e'
}

const s: Record<string, React.CSSProperties> = {
  h1: { fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 },
  sub: { fontSize: 13, color: '#555', margin: '4px 0 0' },
  btnPrimary: {
    background: '#14b8a6', color: '#000', border: 'none',
    padding: '10px 20px', borderRadius: 7, fontSize: 13, fontWeight: 600,
    textDecoration: 'none', cursor: 'pointer', display: 'inline-block',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 11, color: '#555', padding: '6px 12px', borderBottom: '1px solid #1e1e1e', textTransform: 'uppercase', letterSpacing: '0.06em' },
  td: { fontSize: 13, color: '#ccc', padding: '12px 12px', borderBottom: '1px solid #111', verticalAlign: 'middle' },
  badge: { fontSize: 11, padding: '3px 8px', borderRadius: 4, color: '#aaa' },
}
```

**Step 2: Verify**

Browser → `/superadmin/clients` → Tabelle erscheint (leer oder mit Daten).

**Step 3: Commit**

```bash
git add src/app/superadmin/clients/page.tsx
git commit -m "feat: /superadmin/clients – Client-Übersicht"
```

---

### Task 5: Client anlegen /superadmin/clients/new

**Files:**
- Create: `src/app/superadmin/clients/new/page.tsx`

**Step 1: Formular-Seite schreiben**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PLANS = ['free', 'pro', 'enterprise'] as const

export default function NewClientPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    org_name: '',
    plan: 'free' as typeof PLANS[number],
    org_budget_limit: '',
    workspace_name: 'Haupt-Workspace',
    workspace_budget_limit: '',
    owner_email: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.org_name.trim() || !form.workspace_name.trim() || !form.owner_email.trim()) {
      setError('Bitte alle Pflichtfelder ausfüllen.')
      return
    }
    setSaving(true)
    setError('')

    const res = await fetch('/api/superadmin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_name: form.org_name.trim(),
        plan: form.plan,
        org_budget_limit: form.org_budget_limit ? parseFloat(form.org_budget_limit) : null,
        workspace_name: form.workspace_name.trim(),
        workspace_budget_limit: form.workspace_budget_limit ? parseFloat(form.workspace_budget_limit) : null,
        owner_email: form.owner_email.trim(),
      }),
    })

    setSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Fehler beim Anlegen.')
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/superadmin/clients'), 2000)
  }

  if (success) {
    return (
      <div style={s.successWrap}>
        <div style={s.successIcon}>🦜</div>
        <h2 style={s.successTitle}>Client angelegt!</h2>
        <p style={s.successSub}>Einladung wurde an {form.owner_email} gesendet. Weiterleitung…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 28 }}>
        <Link href="/superadmin/clients" style={s.back}>← Alle Clients</Link>
        <h1 style={s.h1}>Neuer Client</h1>
      </div>

      <form onSubmit={handleSubmit} style={s.form}>

        {/* Organisation */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Organisation</div>

          <div style={s.field}>
            <label style={s.label}>Firmenname *</label>
            <input style={s.input} placeholder="Muster GmbH" value={form.org_name}
              onChange={(e) => set('org_name', e.target.value)} required />
          </div>

          <div style={s.row}>
            <div style={{ ...s.field, flex: 1 }}>
              <label style={s.label}>Plan *</label>
              <select style={s.input} value={form.plan}
                onChange={(e) => set('plan', e.target.value)}>
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ ...s.field, flex: 1 }}>
              <label style={s.label}>Budget Limit (€/Mo)</label>
              <input style={s.input} type="number" min="0" step="10"
                placeholder="Kein Limit" value={form.org_budget_limit}
                onChange={(e) => set('org_budget_limit', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Workspace</div>

          <div style={s.row}>
            <div style={{ ...s.field, flex: 2 }}>
              <label style={s.label}>Workspace-Name *</label>
              <input style={s.input} placeholder="Haupt-Workspace" value={form.workspace_name}
                onChange={(e) => set('workspace_name', e.target.value)} required />
            </div>
            <div style={{ ...s.field, flex: 1 }}>
              <label style={s.label}>Budget Limit (€/Mo)</label>
              <input style={s.input} type="number" min="0" step="10"
                placeholder="Kein Limit" value={form.workspace_budget_limit}
                onChange={(e) => set('workspace_budget_limit', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Owner */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Owner einladen</div>

          <div style={s.field}>
            <label style={s.label}>E-Mail-Adresse *</label>
            <input style={s.input} type="email" placeholder="owner@firma.de"
              value={form.owner_email}
              onChange={(e) => set('owner_email', e.target.value)} required />
            <span style={s.hint}>
              Einladungsmail wird sofort versendet. Owner landet im Onboarding.
            </span>
          </div>
        </div>

        {error && <div style={s.error}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button style={s.btnPrimary} type="submit" disabled={saving}>
            {saving ? 'Wird angelegt…' : 'Client anlegen & Einladung senden'}
          </button>
          <Link href="/superadmin/clients" style={s.btnGhost}>Abbrechen</Link>
        </div>
      </form>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  h1: { fontSize: 22, fontWeight: 700, color: '#fff', margin: '8px 0 0' },
  back: { fontSize: 12, color: '#555', textDecoration: 'none', display: 'block', marginBottom: 8 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  section: {
    background: '#111', border: '1px solid #1e1e1e', borderRadius: 10,
    padding: 20, display: 'flex', flexDirection: 'column', gap: 0,
  },
  sectionTitle: { fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 },
  field: { display: 'flex', flexDirection: 'column', marginBottom: 14 },
  row: { display: 'flex', gap: 12 },
  label: { fontSize: 11, color: '#666', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff',
    padding: '9px 12px', borderRadius: 7, fontSize: 13, outline: 'none',
    width: '100%', boxSizing: 'border-box' as const,
  },
  hint: { fontSize: 11, color: '#444', marginTop: 6, lineHeight: 1.5 },
  error: { fontSize: 13, color: '#ef4444', background: '#1f0a0a', padding: '10px 14px', borderRadius: 6 },
  btnPrimary: {
    background: '#14b8a6', color: '#000', border: 'none',
    padding: '11px 22px', borderRadius: 7, fontSize: 13, fontWeight: 700,
    cursor: 'pointer',
  },
  btnGhost: {
    background: 'none', border: '1px solid #2a2a2a', color: '#666',
    padding: '11px 18px', borderRadius: 7, fontSize: 13,
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
  },
  successWrap: { textAlign: 'center' as const, paddingTop: 80 },
  successIcon: { fontSize: 48, marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 8px' },
  successSub: { fontSize: 14, color: '#555' },
}
```

**Step 2: End-to-End Test**

1. Browser → `/superadmin/clients/new`
2. Formular ausfüllen: Firma „Test GmbH", Plan „free", Workspace „Haupt-Workspace", Owner-Email (echte Testadresse)
3. Submit → Success-Screen erscheint → Redirect zu `/superadmin/clients`
4. In der Tabelle: neue Org sichtbar, Onboarding-Status „Ausstehend"
5. Supabase Dashboard → Authentication → Users → Einladung für Owner-Email sichtbar
6. Resend Dashboard → E-Mail gesendet

**Step 3: Commit**

```bash
git add src/app/superadmin/clients/new/page.tsx
git commit -m "feat: /superadmin/clients/new – Client-Formular"
```

---

### Task 6: CLAUDE.md aktualisieren

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Superadmin-Abschnitt ergänzen**

Im Abschnitt „Supabase-Schema" oder am Ende hinzufügen:

```markdown
## Superadmin-Tool

- Route: `/superadmin/clients` – nur für `role = 'superadmin'`
- Kein Link in NavBar – direkte URL-Eingabe
- Tropen-Account per SQL auf superadmin setzen: `UPDATE users SET role = 'superadmin' WHERE email = 'hello@tropen.de'`
- Migration: `011_superadmin.sql` – erweitert users_role_check um 'superadmin'
- API: `POST /api/superadmin/clients` → erstellt Org + Workspace + organization_settings + sendet Einladung
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: Superadmin-Tool in CLAUDE.md dokumentiert"
```

---

## Reihenfolge der Tasks

1. **Task 1** – Migration (Datenbankgrundlage)
2. **Task 2** – API-Route (Business-Logik)
3. **Task 3** – Layout + Middleware-Update (Sicherheit)
4. **Task 4** – Übersichtsseite
5. **Task 5** – Formularseite
6. **Task 6** – Dokumentation

## Fertig wenn

- [ ] `/superadmin/clients` zeigt alle Orgs (als superadmin-User)
- [ ] Als normaler User → Redirect zu `/workspaces`
- [ ] Formular legt Org + Workspace an, sendet Einladungsmail
- [ ] Owner erhält E-Mail, klickt Link, landet im Onboarding (Schritte 1–5 als Admin)
- [ ] Neu angelegte Org erscheint sofort in der Übersicht
