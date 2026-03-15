# Tropen OS — Project Reference
> Projektspezifische Details für Claude Code. Ergänzt CLAUDE.md (Engineering Guidelines).
> Stand: 2026-03-13

---

## Tech Stack (spezifische Versionen)

| Technologie | Version | Hinweis |
|-------------|---------|---------|
| Next.js | ^16.1.6 | App Router, Turbopack |
| React | ^19 | |
| TypeScript | ^5 | strict mode |
| Tailwind CSS | ^3.4 | nur globals.css — Seiten nutzen inline `s`-Objekte |
| Supabase | @supabase/ssr + supabase-js | Auth + DB + Storage |
| Sentry | @sentry/nextjs ^10 | server + client + edge |
| Upstash Redis | @upstash/ratelimit + @upstash/redis | Rate Limiting in proxy.ts |
| pnpm | — | Package Manager |

---

## Rollen-Architektur

```
Superadmin (Timm) — über allen Orgs
OrgRole:       'owner' | 'admin' | 'member' | 'viewer'   (DB: users.role)
WorkspaceRole: 'admin' | 'member' | 'viewer'              (DB: workspace_members.role)
```

- **admin/owner** → NavBar: Dashboard, Modelle, Budget, Logs, User, Branding
- **member** → NavBar: Projekte, Dashboard, Modelle (read-only)
- **viewer** → Alle Links, aber alle Seiten read-only
- **AccountSwitcher** (superadmin only): [Super, Admin, Member, Viewer] via sessionStorage

---

## Datenbankzugriff — Pflichtmuster

```typescript
// ✅ Richtig: supabaseAdmin für Server/API Routes
import { supabaseAdmin } from '@/lib/supabase-admin'
const { data } = await supabaseAdmin.from('table').select(...)

// ✅ Richtig: createClient() für Server Components / Actions
import { createClient } from '@/utils/supabase/server'
const supabase = await createClient()

// ✅ Richtig: createClient() für Client Components
import { createClient } from '@/utils/supabase/client'

// ❌ Falsch: Drizzle für Queries (funktioniert nicht in dieser Umgebung)
// ❌ Falsch: DB-Zugriff direkt aus Frontend-Komponenten
```

---

## Design System

### CSS-Variablen (helles Theme, globals.css)

```css
--bg-base:       #EAE9E5   /* Beige/Sand Hintergrund */
--bg-surface:    rgba(255,255,255,0.80)
--bg-nav:        rgba(255,255,255,0.72)
--text-primary:  #1A1714
--text-secondary:#4A4540
--text-tertiary: #6B6560
--accent:        #2D7A50   /* Grün — Primärfarbe */
--accent-light:  #D4EDDE
--active-bg:     #1A2E23   /* Dunkelgrün Pill, weißer Text */
--border:        rgba(26,23,20,0.08)
```

> Altes Dunkelgrün-Theme (`#0d1f16`, `#134e3a`, `#a3b554`) ist abgelöst — nicht verwenden.

### Inline-Styles Konvention (alle Seiten)

```typescript
const s: Record<string, React.CSSProperties> = {
  wrap: { padding: 32 },
  // ...
}
// Funktionen die CSSProperties zurückgeben: AUSSERHALB des s-Objekts
function tabStyle(active: boolean): React.CSSProperties { ... }
```

### Komponenten-Klassen (globals.css)

```tsx
// Cards
<div className="card">
  <div className="card-header"><span className="card-header-label">Titel</span></div>
  <div className="card-body"></div>
</div>

// Buttons
<button className="btn btn-primary">Primär</button>
<button className="btn btn-ghost">Ghost</button>
<button className="btn btn-danger">Löschen</button>
<button className="btn btn-sm btn-ghost">Klein</button>
<button className="btn-icon"><Icon /></button>

// Page Header (jede Seite)
<div className="page-header">
  <div className="page-header-text">
    <h1 className="page-header-title">Titel</h1>
    <p className="page-header-sub">Untertitel</p>
  </div>
  <div className="page-header-actions">...</div>
</div>

// List Rows
<button className="list-row list-row--active">Aktiv</button>
<button className="list-row">Normal</button>

// Chips / Filter-Pills
<div className="chip chip--active">Aktiv</div>
<div className="chip">Normal</div>
```

### Content-Breiten

| Klasse | Max-Width | Verwendet für |
|--------|-----------|---------------|
| `.content-max` | 1200px | Standard-Seiten |
| `.content-narrow` | 720px | Formular-Seiten (Login, Onboarding) |
| `.content-wide` | 1400px | Superadmin-Seiten |
| `.content-full` | 100% | Chat-Interface |

### Icons
- **Phosphor Icons** (`@phosphor-icons/react`) — immer `weight="bold"` oder `weight="fill"`
- Größen: NavBar 18px · Cards/Listen 16px · Inline 14px

---

## Supabase-Schema (relevante Tabellen)

```
users:               id, organization_id, email, full_name, role
user_preferences:    user_id, chat_style, model_preference, onboarding_completed,
                     ai_act_acknowledged, memory_window, thinking_mode, proactive_hints
organization_settings: organization_id, organization_display_name, logo_url, primary_color, ai_guide_name
conversations:       id, workspace_id, user_id, title, task_type, project_id, deleted_at, dify_conversation_id
projects:            id, workspace_id, name, description, context, tone, language, target_audience, memory
messages:            id, conversation_id, role, content, model_used, cost_eur, created_at
knowledge_sources:   id, organization_id, user_id, project_id, name, type, url, sync_interval
knowledge_chunks:    id, document_id, content TEXT, embedding vector(1536), chunk_index
artifacts:           id, conversation_id, name, type, content
bookmarks:           id, message_id, user_id
agents:              id, organization_id, name, description, system_prompt, model
packages:            id, name, org_packages (join)
```

---

## Migrations-Übersicht

| Datei | Inhalt |
|-------|--------|
| 001–009 | Schema, RLS, Seed, Auth, Budget, Onboarding, AI Act |
| 010 | Jungle Order (soft-delete, merge, has_files) |
| 011–014 | Superadmin, Budget-Fix, Memory-Window, RLS-Audit |
| 015–018 | Thinking-Mode, Smart-Projects, RAG Foundation, RLS-Fix |
| 019–026 | Workspace-Members, Impersonation, Artifacts, Hints, Prompts, Agents, Packages |
| 027–033 | Dept-Rename, Phase-2 Schema (workspaces, cards, feeds, transformations) |

Migrations-Tool: Supabase CLI
Push: `cd "/c/Users/timmr/tropen OS" && supabase db push`

---

## Dify-Integration

- App-Typ: **Chatflow** — App: `tropen-os-chat-v2`
- Endpoint: `POST /v1/chat-messages`
- `conversation_id` aus `message_end`-Event → `conversations.dify_conversation_id`
- Beim ersten Request: `conversation_id` weglassen → Dify erstellt neu
- Jungle Order: separate Workflow-App `tropen-os-jungle-order` (`DIFY_JUNGLE_ORDER_KEY`)

---

## Umgebungsvariablen (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # NUR server-seitig!
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-...
DIFY_JUNGLE_ORDER_KEY=app-...
OPENAI_API_KEY=sk-...
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=
LANGSMITH_TRACING=false
NEXT_PUBLIC_SENTRY_DSN=
UPSTASH_REDIS_REST_URL=             # Rate Limiting
UPSTASH_REDIS_REST_TOKEN=
```

---

## Wichtige Dateipfade

```
src/proxy.ts                        — Middleware (Rate Limiting + Session Refresh + Auth-Guard)
src/lib/supabase-admin.ts           — Service Role Client (bypasses RLS)
src/lib/auth/guards.ts              — requireSuperadmin(), requireOrgAdmin()
src/lib/logger.ts                   — Strukturiertes Logging (immer verwenden, nie console.log)
src/lib/token-counter.ts            — Token-Schätzung für Context-Window
src/hooks/useWorkspaceState.ts      — Haupt-State-Hook für Chat/Workspace
src/components/workspace/          — Chat-Interface Komponenten
src/app/superadmin/                 — Superadmin-Tool (role-guard in layout.tsx)
supabase/migrations/                — DB-Migrationen (001–033+)
docs/webapp-manifest/               — Engineering Standards & Audit-System
docs/project-state.md               — Diese Datei
```

---

## Soft-Delete-Pattern

```typescript
// Alle Conversation-Queries müssen filtern:
.is('deleted_at', null)

// Ausnahme: Papierkorb-Query
.not('deleted_at', 'is', null)
```
