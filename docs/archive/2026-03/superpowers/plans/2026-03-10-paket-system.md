# Paket-System (Marketing-Paket Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Marketing-Paket als erstes Paket in Tropen OS — 5 vorgefertigte Agenten mit System-Prompts und je 4 klickbaren Schnellstart-Chips im Chat, aktivierbar per Superadmin pro Org.

**Architecture:** Pakete sind global in der DB gespeichert (`packages` + `package_agents`). Org-Aktivierung via `org_packages`-Junction-Tabelle. Package-Agenten erscheinen im ChatInput-Dropdown unter eigenem Abschnitt; gewählter Agent zeigt 4 Chips über dem Eingabefeld.

**Tech Stack:** Next.js 15 App Router, Supabase (supabaseAdmin), TypeScript, Phosphor Icons, CSS custom properties (var(--accent) etc.)

---

## Chunk 1: Datenbankschema + Seed-Daten

### Task 1: Migration 026 — packages, package_agents, org_packages + Seed

**Files:**
- Create: `supabase/migrations/026_packages.sql`

- [ ] **Step 1: Migration schreiben**

```sql
-- supabase/migrations/026_packages.sql

-- 1. packages
CREATE TABLE IF NOT EXISTS packages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. package_agents
CREATE TABLE IF NOT EXISTS package_agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id    UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  system_prompt TEXT,
  quick_chips   JSONB NOT NULL DEFAULT '[]',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. org_packages
CREATE TABLE IF NOT EXISTS org_packages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  package_id      UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  activated_by    UUID REFERENCES auth.users(id),
  activated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, package_id)
);

-- RLS
ALTER TABLE packages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_packages  ENABLE ROW LEVEL SECURITY;

-- packages: jeder authentifizierte User kann lesen
CREATE POLICY "packages_select" ON packages FOR SELECT TO authenticated USING (true);

-- package_agents: jeder authentifizierte User kann lesen
CREATE POLICY "package_agents_select" ON package_agents FOR SELECT TO authenticated USING (true);

-- org_packages: User sieht nur die seiner Org
CREATE POLICY "org_packages_select" ON org_packages FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Seed: Marketing-Paket
INSERT INTO packages (slug, name, description, icon) VALUES
  ('marketing', 'Marketing-Paket', '5 spezialisierte Marketing-Agenten für Kampagnen, Brand Voice, Social Media, Newsletter und Copywriting.', '📣')
ON CONFLICT (slug) DO NOTHING;

-- Seed: 5 Agenten
INSERT INTO package_agents (package_id, name, description, system_prompt, quick_chips, display_order)
SELECT
  p.id,
  a.name,
  a.description,
  a.system_prompt,
  a.quick_chips::JSONB,
  a.display_order
FROM packages p,
(VALUES
  (
    '🎯 Campaign Planner',
    'Kampagnen von der Idee bis zum Briefing strukturieren',
    'Du bist ein erfahrener Marketing-Stratege. Du hilfst dabei, Kampagnen von der Idee bis zum Briefing zu strukturieren. Du denkst in Zielen, Zielgruppen, Botschaften und Kanälen. Du stellst immer zuerst klärende Fragen bevor du eine Kampagne entwirfst.',
    '["Hilf mir eine Kampagne für [Produkt] zu planen","Erstelle ein Kampagnen-Briefing für unseren Newsletter-Launch","Welche Kanäle passen zu meiner Zielgruppe [Zielgruppe]?","Strukturiere meine Kampagnenidee: [Idee]"]',
    0
  ),
  (
    '✍️ Brand Voice Writer',
    'Konsistente Markenstimme entwickeln und anwenden',
    'Du bist ein Brand-Voice-Experte. Du hilfst dabei, eine konsistente Markenstimme zu entwickeln, zu dokumentieren und auf alle Texte anzuwenden. Du analysierst bestehende Texte, erkennst Muster und formulierst klare Regeln für Ton, Sprache und Persönlichkeit.',
    '["Analysiere diese Texte und beschreibe unsere Brand Voice: [Texte einfügen]","Schreib diesen Text in unserer Markenstimme um: [Text]","Erstelle ein Brand Voice Dokument für [Unternehmensname]","Wie klingt [Konkurrent] – und wie unterscheiden wir uns?"]',
    1
  ),
  (
    '📱 Social Adapter',
    'Inhalte für LinkedIn, Instagram, X und TikTok adaptieren',
    'Du bist ein Social-Media-Spezialist. Du adaptierst Inhalte für verschiedene Plattformen und deren spezifische Formate, Tonalitäten und Algorithmus-Logiken. Du kennst die Unterschiede zwischen LinkedIn, Instagram, X und TikTok genau.',
    '["Adaptiere diesen Text für LinkedIn, Instagram und X: [Text]","Schreib 5 LinkedIn-Posts zum Thema [Thema]","Erstelle eine Instagram-Caption mit Hashtags für: [Inhalt]","Welches Format funktioniert gerade am besten auf [Plattform]?"]',
    2
  ),
  (
    '📧 Newsletter Spezialist',
    'Öffnungsraten, Klickrate und Leserbindung optimieren',
    'Du bist ein Newsletter-Experte mit Fokus auf Öffnungsraten, Klickrate und Leserbindung. Du schreibst Betreffzeilen die neugierig machen, Intros die zum Lesen verführen und CTAs die konvertieren. Du kennst die Unterschiede zwischen B2B und B2C Newslettern.',
    '["Schreib 5 Betreffzeilen für einen Newsletter über [Thema]","Verfasse einen Newsletter für [Zielgruppe] zum Thema [Thema]","Optimiere diesen Newsletter-Text: [Text einfügen]","Erstelle eine Willkommens-Mail für neue Abonnenten von [Marke]"]',
    3
  ),
  (
    '✏️ Copy Texter',
    'Headlines, Ads und Landingpage-Texte die verkaufen',
    'Du bist ein erfahrener Werbetexter. Du schreibst Headlines, Ads, Landingpage-Texte und CTAs die verkaufen. Du arbeitest mit bewährten Frameworks wie AIDA, PAS und StoryBrand. Du fragst immer nach Zielgruppe, Angebot und gewünschter Reaktion bevor du schreibst.',
    '["Schreib eine Headline und 3 Varianten für [Produkt/Angebot]","Erstelle einen Landingpage-Text nach AIDA für [Produkt]","Schreib eine Google Ads-Anzeige für [Angebot, Zielgruppe]","Optimiere diesen Text für mehr Conversions: [Text]"]',
    4
  )
) AS a(name, description, system_prompt, quick_chips, display_order)
WHERE p.slug = 'marketing'
ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: Migration pushen**

```bash
cd "/c/Users/timmr/tropen OS" && supabase db push
```

Expected: `Applied 1 migration(s)` ohne Fehler.

---

## Chunk 2: API-Routen

### Task 2: GET /api/packages/agents — Package-Agenten für aktive Org-Pakete

**Files:**
- Create: `src/app/api/packages/agents/route.ts`

- [ ] **Step 1: Route erstellen**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Org des Users laden
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.organization_id) return NextResponse.json([])

  // Aktive Pakete der Org
  const { data: orgPkgs } = await supabaseAdmin
    .from('org_packages')
    .select('package_id')
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)

  if (!orgPkgs?.length) return NextResponse.json([])

  const packageIds = orgPkgs.map(p => p.package_id)

  // Agenten + Paket-Infos laden
  const { data, error } = await supabaseAdmin
    .from('package_agents')
    .select('id, name, description, system_prompt, quick_chips, display_order, package_id, packages(slug, name, icon)')
    .in('package_id', packageIds)
    .order('display_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
```

- [ ] **Step 2: TypeScript prüfen**

```bash
cd "/c/Users/timmr/tropen OS" && npx tsc --noEmit 2>&1 | head -20
```

Expected: keine Fehler.

---

### Task 3: Superadmin-API — Pakete pro Org verwalten

**Files:**
- Create: `src/app/api/superadmin/packages/route.ts`
- Create: `src/app/api/superadmin/packages/[orgId]/route.ts`

- [ ] **Step 1: GET /api/superadmin/packages — alle Pakete + Org-Aktivierungsstatus**

```typescript
// src/app/api/superadmin/packages/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('users').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('packages')
    .select('id, slug, name, description, icon')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
```

- [ ] **Step 2: PATCH /api/superadmin/packages/[orgId] — Paket aktivieren/deaktivieren**

```typescript
// src/app/api/superadmin/packages/[orgId]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(_req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('users').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('org_packages')
    .select('id, package_id, is_active, activated_at')
    .eq('organization_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('users').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { package_id, is_active } = await req.json()

  const { data, error } = await supabaseAdmin
    .from('org_packages')
    .upsert({
      organization_id: orgId,
      package_id,
      is_active,
      activated_by: user.id,
      activated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,package_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 3: TypeScript prüfen**

```bash
cd "/c/Users/timmr/tropen OS" && npx tsc --noEmit 2>&1 | head -20
```

---

## Chunk 3: Superadmin-UI

### Task 4: Pakete-Sektion in /superadmin/clients

**Files:**
- Modify: `src/app/superadmin/clients/page.tsx`

- [ ] **Step 1: Interfaces + State erweitern**

Oben in der Datei, nach den vorhandenen Interfaces, hinzufügen:

```typescript
interface Package {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string | null
}

interface OrgPackage {
  id: string
  package_id: string
  is_active: boolean
  activated_at: string
}
```

Im `ClientsPage`-Komponenten-Body nach den vorhandenen States:

```typescript
const [packages, setPackages] = useState<Package[]>([])
const [orgPackages, setOrgPackages] = useState<Record<string, OrgPackage[]>>({}) // keyed by orgId
const [pkgTogglingKey, setPkgTogglingKey] = useState<string | null>(null) // `${orgId}:${packageId}`
```

- [ ] **Step 2: Pakete beim Load laden**

Im bestehenden `useEffect` (der `loadOrgs()` aufruft), nach dem Laden der Orgs:

```typescript
// Pakete laden
fetch('/api/superadmin/packages')
  .then(r => r.ok ? r.json() : [])
  .then(data => setPackages(Array.isArray(data) ? data : []))
  .catch(() => {})
```

- [ ] **Step 3: Helper-Funktion zum Laden von Org-Paketen**

```typescript
async function loadOrgPackages(orgId: string) {
  const res = await fetch(`/api/superadmin/packages/${orgId}`)
  if (!res.ok) return
  const data: OrgPackage[] = await res.json()
  setOrgPackages(prev => ({ ...prev, [orgId]: data }))
}

async function handleTogglePackage(orgId: string, packageId: string, currentActive: boolean) {
  const key = `${orgId}:${packageId}`
  setPkgTogglingKey(key)
  try {
    await fetch(`/api/superadmin/packages/${orgId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_id: packageId, is_active: !currentActive }),
    })
    await loadOrgPackages(orgId)
  } finally {
    setPkgTogglingKey(null)
  }
}
```

- [ ] **Step 4: Pakete-Sektion in der Org-Karte rendern**

In der Org-Karten-Darstellung (wo Workspaces und Users gelistet werden), einen neuen Abschnitt "Pakete" hinzufügen. Direkt vor dem Edit-Button-Bereich einfügen:

```tsx
{/* ── Pakete ── */}
<div style={{ marginTop: 12 }}>
  <button
    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 6 }}
    onClick={() => {
      if (!orgPackages[org.id]) loadOrgPackages(org.id)
      else setOrgPackages(prev => { const n = { ...prev }; delete n[org.id]; return n })
    }}
  >
    📦 Pakete {orgPackages[org.id] ? '▲' : '▼'}
  </button>
  {orgPackages[org.id] && packages.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {packages.map(pkg => {
        const orgPkg = orgPackages[org.id]?.find(p => p.package_id === pkg.id)
        const active = orgPkg?.is_active ?? false
        const key = `${org.id}:${pkg.id}`
        return (
          <div key={pkg.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
            <span style={{ fontSize: 16 }}>{pkg.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#fff' }}>{pkg.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{pkg.description}</div>
            </div>
            <button
              onClick={() => handleTogglePackage(org.id, pkg.id, active)}
              disabled={pkgTogglingKey === key}
              style={{
                background: active ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: 5,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                color: active ? '#0d2418' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                minWidth: 80,
              }}
            >
              {pkgTogglingKey === key ? '…' : active ? 'Aktiv' : 'Inaktiv'}
            </button>
          </div>
        )
      })}
    </div>
  )}
</div>
```

- [ ] **Step 5: TypeScript prüfen**

```bash
cd "/c/Users/timmr/tropen OS" && npx tsc --noEmit 2>&1 | head -20
```

---

## Chunk 4: ChatInput — Package-Agenten + Schnellstart-Chips

### Task 5: ChatInput erweitern

**Files:**
- Modify: `src/components/workspace/ChatInput.tsx`

- [ ] **Step 1: PackageAgent-Interface + State hinzufügen**

Nach dem bestehenden `Agent`-Interface:

```typescript
interface PackageAgent {
  id: string
  name: string
  description: string | null
  system_prompt: string | null
  quick_chips: string[]
  package_id: string
  packages: { slug: string; name: string; icon: string | null } | null
}
```

Im Komponenten-Body nach dem `agents`-State:

```typescript
const [packageAgents, setPackageAgents] = useState<PackageAgent[]>([])
```

- [ ] **Step 2: Package-Agenten laden**

Im bestehenden `useEffect` (der `/api/agents` fetcht), parallel einen zweiten Fetch hinzufügen:

```typescript
useEffect(() => {
  fetch('/api/agents')
    .then(r => r.ok ? r.json() : [])
    .then(data => setAgents(Array.isArray(data) ? data : []))
    .catch(() => {})
  fetch('/api/packages/agents')
    .then(r => r.ok ? r.json() : [])
    .then(data => setPackageAgents(Array.isArray(data) ? data : []))
    .catch(() => {})
}, [])
```

- [ ] **Step 3: activeAgent auch aus packageAgents resolven**

```typescript
const activeAgent = agents.find(a => a.id === activeAgentId) ?? null
const activePackageAgent = packageAgents.find(a => a.id === activeAgentId) ?? null
const activeAnyAgent = activeAgent ?? activePackageAgent
```

- [ ] **Step 4: Package-Agenten im Dropdown anzeigen**

Im Dropdown (`cinput-agent-drop`), nach der bestehenden Agenten-Liste:

```tsx
{packageAgents.length > 0 && (
  <div className="cinput-agent-pkg-section">
    <span className="cinput-agent-pkg-label">
      {packageAgents[0].packages?.icon} {packageAgents[0].packages?.name}
    </span>
    {packageAgents.map(a => (
      <button
        key={a.id}
        className={`cinput-agent-option${activeAgentId === a.id ? ' cinput-agent-option--active' : ''}`}
        onClick={() => { onSetActiveAgentId!(a.id); setDropOpen(false) }}
      >
        <span className="cinput-agent-option-name">{a.name}</span>
        {a.description && <span className="cinput-agent-option-desc">{a.description}</span>}
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 5: Schnellstart-Chips über dem Input rendern**

Zwischen Agent-Bar und Form, Chips für den aktiven Package-Agenten:

```tsx
{activePackageAgent && activePackageAgent.quick_chips.length > 0 && (
  <div className="cinput-chips">
    {activePackageAgent.quick_chips.map((chip, i) => (
      <button
        key={i}
        className="cinput-chip"
        type="button"
        onClick={() => setInput(chip)}
      >
        {chip}
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 6: Placeholder + Button-Label anpassen**

`activeAgent`-Referenzen für Placeholder/Button auf `activeAnyAgent` umstellen:

```tsx
placeholder={activeAnyAgent ? `Nachricht an ${activeAnyAgent.name}…` : 'Nachricht eingeben…'}
```

Agent-Bar-Button:
```tsx
<span>{activeAnyAgent ? activeAnyAgent.name : 'Kein Agent'}</span>
<Robot size={13} weight={activeAnyAgent ? 'fill' : 'regular'} />
```

- [ ] **Step 7: TypeScript prüfen**

```bash
cd "/c/Users/timmr/tropen OS" && npx tsc --noEmit 2>&1 | head -20
```

---

### Task 6: CSS-Klassen für Chips und Package-Sektion

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Klassen nach `.cinput-agent-empty` einfügen**

```css
/* Package-Agenten-Abschnitt im Dropdown */
.cinput-agent-pkg-section { border-top: 1px solid rgba(255,255,255,0.06); margin-top: 4px; padding-top: 4px; }
.cinput-agent-pkg-label { display: block; font-size: 10px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 10px 2px; }

/* Schnellstart-Chips */
.cinput-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 0 4px; }
.cinput-chip { background: rgba(163,181,84,0.12); border: 1px solid rgba(163,181,84,0.25); border-radius: 20px; padding: 5px 12px; font-size: 12px; color: rgba(255,255,255,0.75); cursor: pointer; transition: background 0.15s, color 0.15s; white-space: nowrap; max-width: 280px; overflow: hidden; text-overflow: ellipsis; }
.cinput-chip:hover { background: rgba(163,181,84,0.22); color: #fff; }
```

- [ ] **Step 2: TypeScript + Build prüfen**

```bash
cd "/c/Users/timmr/tropen OS" && npx tsc --noEmit 2>&1 | head -20
```

---

## Abschluss

- [ ] CLAUDE.md Migrations-Tabelle um `026_packages.sql` ergänzen
- [ ] CLAUDE.md Roadmap: "Paket-System Phase 1" in ✅ Fertig verschieben
