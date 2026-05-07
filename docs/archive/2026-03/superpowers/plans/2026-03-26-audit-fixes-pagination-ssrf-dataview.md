# Audit Fixes: Pagination, SSRF Write-Time, DataView Split

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drei unabhängige Audit-Fixes aus dem 2026-03-26 Report: (1) Pagination für 6 API-Routes, (2) SSRF-Schutz beim Speichern von Feed-URLs, (3) DataView.tsx (793 Zeilen) in kleinere Komponenten aufteilen.

**Architecture:** Jede der drei Tasks ist unabhängig und kann einzeln gemergt werden. Pagination folgt dem bestehenden `{ data, total }` Pattern (bereits in `/api/workspaces`). SSRF-Schutz nutzt die vorhandene `isSafeUrl()` Funktion aus `ssrf-guard.ts`. DataView-Split extrahiert drei Subkomponenten ohne State-Umstrukturierung — State bleibt in DataView, Props fließen nach unten.

**Tech Stack:** Next.js App Router, Supabase (`supabaseAdmin`), TypeScript strict, Phosphor Icons, CSS-Variablen

---

## Kontext: Bestehende Patterns

### Pagination-Pattern (aus `/api/workspaces`)
```ts
// Response-Format: bereits etabliert
return NextResponse.json({ data: data ?? [], total: count ?? 0 })
// Query: .select('...', { count: 'exact' }).range(offset, offset + limit - 1)
```

### SSRF-Guard (bereits vorhanden)
```ts
// src/lib/feeds/ssrf-guard.ts
import { isSafeUrl } from '@/lib/feeds/ssrf-guard'
const { safe, reason } = await isSafeUrl(url)
if (!safe) return NextResponse.json({ error: `URL nicht erlaubt: ${reason}` }, { status: 422 })
```

### Komponenten-Pattern (CLAUDE.md)
- Nur `className="card"`, `className="btn btn-*"`
- Phosphor Icons, `weight="bold"` oder `weight="fill"`
- CSS-Variablen für Farben, kein Hex
- `'use client'` nur wo nötig

### Bekannte Consumer-Probleme (vor Pagination bereits kaputt)
- `SourcesView.tsx` Zeile 63: greift auf `wJson.workspaces` zu — Route gibt seit je `{ data, total }` zurück. Muss auf `wJson.data` geändert werden (unabhängig von Pagination).
- `agenten/page.tsx` Zeile 54: `Array.isArray(data)` auf `{ agents: [...] }` — immer `false`, immer `[]`. Muss auf `data.data` geändert werden.
- `superadmin/clients/page.tsx` Zeile 67: gleicher `Array.isArray` Anti-Pattern.

---

## Task 1: Pagination für 6 API-Routes

**Betroffene Routen und ihre Consumers:**
| Route | Aktueller Response | Consumer(s) |
|-------|-------------------|-------------|
| `GET /api/skills` | `{ skills: [...] }` | `SkillsSection.tsx` nutzt direktes Supabase (kein API-Call) — kein Consumer-Update nötig |
| `GET /api/agents` | `{ agents: [...] }` | `agenten/page.tsx` Zeile 52–55 |
| `GET /api/workspaces` | `{ data, total }` ✓ (kein `range()`) | `SourcesView.tsx` Zeile 60–63 (greift falsch auf `wJson.workspaces` zu — Fix erzwungen) |
| `GET /api/feeds/data-sources` | `[...]` (Array) | `DataView.tsx` Zeile 136 |
| `GET /api/admin/users` | `[...]` (Array) | `admin/users/page.tsx` Zeile 21–22 |
| `GET /api/superadmin/clients` | `[...]` (Array) | `superadmin/clients/page.tsx` Zeile 65–68, `superadmin/announcements/page.tsx` Zeile 68 |

### 1.1 — Hilfsfunktion für Pagination-Params

- [ ] **Datei anlegen:** `src/lib/api/pagination.ts`

```ts
// src/lib/api/pagination.ts
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit = 100,
  maxLimit = 500,
): { limit: number; offset: number } {
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get('limit') ?? String(defaultLimit), 10) || defaultLimit),
    maxLimit,
  )
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0)
  return { limit, offset }
}
```

- [ ] **Test schreiben:** `src/test/api/pagination.unit.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { parsePaginationParams } from '@/lib/api/pagination'

describe('parsePaginationParams', () => {
  it('defaults to limit=100 offset=0', () => {
    expect(parsePaginationParams(new URLSearchParams())).toEqual({ limit: 100, offset: 0 })
  })
  it('parses valid params', () => {
    expect(parsePaginationParams(new URLSearchParams('limit=25&offset=50'))).toEqual({ limit: 25, offset: 50 })
  })
  it('caps limit at maxLimit', () => {
    expect(parsePaginationParams(new URLSearchParams('limit=9999'))).toEqual({ limit: 500, offset: 0 })
  })
  it('ignores negative offset', () => {
    expect(parsePaginationParams(new URLSearchParams('offset=-5'))).toEqual({ limit: 100, offset: 0 })
  })
  it('handles non-numeric gracefully', () => {
    expect(parsePaginationParams(new URLSearchParams('limit=abc'))).toEqual({ limit: 100, offset: 0 })
  })
})
```

- [ ] **Test ausführen:** `pnpm test src/test/api/pagination.unit.test.ts`
  - Erwartet: PASS

- [ ] **Commit:** `feat(api): add parsePaginationParams helper`

### 1.2 — Route: `/api/skills`

**Hinweis:** `SkillsSection.tsx` nutzt direktes Supabase (`supabaseAdmin.from('skills')`) — kein API-Consumer-Update nötig. Response-Shape-Änderung ist backward-safe für aktuelles Frontend.

- [ ] **`src/app/api/skills/route.ts` — GET-Handler updaten:**

```ts
// Ergänze import:
import { parsePaginationParams } from '@/lib/api/pagination'

// GET-Handler — orFilter + query + return ersetzen:
export async function GET(request: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const scopeFilter = url.searchParams.get('scope')
  const activeOnly = url.searchParams.get('active') !== 'false'
  const { limit, offset } = parsePaginationParams(url.searchParams)

  const orFilter = [
    'scope.eq.system',
    'scope.eq.package',
    `and(scope.eq.org,organization_id.eq.${me.organization_id})`,
    `and(scope.eq.user,user_id.eq.${me.id})`,
  ].join(',')

  let query = supabaseAdmin
    .from('skills')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .or(orFilter)
    .order('scope', { ascending: true })
    .order('title', { ascending: true })
    .range(offset, offset + limit - 1)

  if (activeOnly) query = query.eq('is_active', true)
  if (scopeFilter) query = query.eq('scope', scopeFilter)

  const { data, error, count } = await query

  if (error) {
    log.error('GET /api/skills failed', { error: error.message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({
    data: (data ?? []).map((row) => mapSkill(row as Record<string, unknown>)),
    total: count ?? 0,
    limit,
    offset,
  })
}
```

- [ ] **Commit:** `feat(api): paginate GET /api/skills`

### 1.3 — Route: `/api/agents` + Consumer fix

- [ ] **`src/app/api/agents/route.ts` — GET-Handler updaten:**

```ts
import { parsePaginationParams } from '@/lib/api/pagination'

export async function GET(request: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const { limit, offset } = parsePaginationParams(url.searchParams)

  const { data, error, count } = await supabaseAdmin
    .from('agents')
    .select('*', { count: 'exact' })
    .eq('organization_id', me.organization_id)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    log.error('GET /api/agents failed', { error: error.message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({
    data: (data ?? []).map((row) => mapAgent(row as Record<string, unknown>)),
    total: count ?? 0,
    limit,
    offset,
  })
}
```

- [ ] **`src/app/agenten/page.tsx` Zeile ~52–55 — Consumer fixen:**

```ts
// Vorher (broken — Array.isArray auf Objekt):
fetch('/api/agents')
  .then(r => r.json())
  .then(data => setAgents(Array.isArray(data) ? data : []))

// Nachher:
fetch('/api/agents')
  .then(r => r.json())
  .then((json: { data: Agent[] }) => setAgents(json.data ?? []))
```

- [ ] **Typecheck:** `pnpm typecheck` — sicherstellen dass lokales `Agent`-Interface mit `mapAgent`-Output kompatibel ist. Falls TypeScript-Fehler: `Agent`-Import aus `@/types/agents` verwenden oder lokale Interface anpassen.

- [ ] **Commit:** `feat(api): paginate GET /api/agents + fix consumer`

### 1.4 — Route: `/api/workspaces` + Consumer fix (erzwungen)

**Wichtig:** `SourcesView.tsx` greift auf `wJson.workspaces` zu — dieser Key existiert nie. Fix ist unabhängig von Pagination nötig.

- [ ] **`src/app/api/workspaces/route.ts` — `range()` ergänzen:**

```ts
import { parsePaginationParams } from '@/lib/api/pagination'

// In GET, nach bestehenden searchParams:
const { limit, offset } = parsePaginationParams(searchParams)

// Query — nach allen .is/.not/.eq Filtern ergänzen:
query = query.range(offset, offset + limit - 1)

// Response ergänzen:
return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset })
```

- [ ] **`src/app/feeds/SourcesView.tsx` Zeile 63 — Consumer fixen:**

```ts
// Vorher (immer kaputt):
setWorkspaces(((wJson.workspaces ?? []) as Record<string, unknown>[]).map(...))

// Nachher:
setWorkspaces(((wJson.data ?? []) as Record<string, unknown>[]).map(...))
```

- [ ] **Commit:** `feat(api): add range() to /api/workspaces + fix SourcesView consumer`

### 1.5 — Route: `/api/feeds/data-sources` + Consumer

- [ ] **`src/app/api/feeds/data-sources/route.ts` — GET updaten:**

```ts
import { parsePaginationParams } from '@/lib/api/pagination'

export async function GET(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const { limit, offset } = parsePaginationParams(searchParams)

  const { data, error, count } = await supabaseAdmin
    .from('feed_data_sources')
    .select('*', { count: 'exact' })
    .eq('user_id', me.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    log.error('list data sources failed', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: (data ?? []).map((r) => mapSource(r as Record<string, unknown>)),
    total: count ?? 0,
    limit,
    offset,
  })
}
```

- [ ] **`src/app/feeds/DataView.tsx` Zeile ~136 — Consumer fixen:**

```ts
// Vorher:
const res = await fetch('/api/feeds/data-sources')
if (res.ok) setSources(await res.json())

// Nachher:
const res = await fetch('/api/feeds/data-sources')
if (res.ok) {
  const json = await res.json() as { data: FeedDataSource[] }
  setSources(json.data ?? [])
}
```

- [ ] **Commit:** `feat(api): paginate GET /api/feeds/data-sources + fix consumer`

### 1.6 — Route: `/api/admin/users` + Consumer

- [ ] **`src/app/api/admin/users/route.ts` lesen.** Dann GET-Handler mit `parsePaginationParams` + `.select('...', { count: 'exact' })` + `.range()` ergänzen. Response: `{ data, total, limit, offset }`.

- [ ] **`src/app/admin/users/page.tsx` Zeile ~21–22 — Consumer fixen:**

```ts
// Vorher:
setUsers(await res.json())

// Nachher:
const json = await res.json() as { data: OrgUser[] }
setUsers(json.data ?? [])
```

- [ ] **Commit:** `feat(api): paginate GET /api/admin/users + fix consumer`

### 1.7 — Route: `/api/superadmin/clients` + Consumers

- [ ] **`src/app/api/superadmin/clients/route.ts` lesen.** GET-Handler analog zu 1.6 updaten.

- [ ] **`src/app/superadmin/clients/page.tsx` Zeile ~65–68 — Consumer fixen:**

```ts
// Vorher (Array.isArray immer false auf Objekt):
fetch('/api/superadmin/clients')
  .then(r => r.json())
  .then((data) => setOrgs(Array.isArray(data) ? data : []))

// Nachher:
fetch('/api/superadmin/clients')
  .then(r => r.json())
  .then((json: { data: OrgRow[] }) => setOrgs(json.data ?? []))
```

- [ ] **`src/app/superadmin/announcements/page.tsx` Zeile ~68 — analog fixen.**

- [ ] **Commit:** `feat(api): paginate GET /api/superadmin/clients + fix consumers`

---

## Task 2: SSRF-Schutz beim Speichern von Feed-URLs

**Problem:** `isSafeUrl()` wird in den Fetchers (`rss.ts`, `url.ts`, `api.ts`) beim *Abrufen* aufgerufen — aber nicht beim *Speichern*. Eine URL könnte in die DB geschrieben werden und dann Crons triggern.

**Scope:**
- **Hauptfix:** `POST /api/feeds/data-sources` und `PATCH /api/feeds/data-sources/[id]` — betrifft `feed_data_sources` Tabelle
- **Defense-in-depth (optional):** `createFeedSource` / `updateFeedSource` in `actions/feeds.ts` — betrifft `feed_sources` Tabelle (RSS-Feeds). Die Fetchers prüfen bereits per `isSafeUrl()`, daher ist dies zusätzlicher Schutz, kein Hauptfix.

**Files:**
- Modify: `src/app/api/feeds/data-sources/route.ts` (POST)
- Modify: `src/app/api/feeds/data-sources/[id]/route.ts` (PATCH)
- Modify: `src/actions/feeds.ts` (createFeedSource, updateFeedSource) — defense-in-depth
- Create: `src/lib/feeds/ssrf-guard.unit.test.ts`

### 2.1 — Tests für SSRF-Guard

- [ ] **`src/lib/feeds/ssrf-guard.unit.test.ts` erstellen:**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('node:dns/promises', () => ({
  default: {
    resolve4: vi.fn(),
    resolve6: vi.fn(),
  },
}))

import dns from 'node:dns/promises'
import { isSafeUrl } from '@/lib/feeds/ssrf-guard'

const mockDns = dns as { resolve4: ReturnType<typeof vi.fn>; resolve6: ReturnType<typeof vi.fn> }

beforeEach(() => {
  mockDns.resolve4.mockResolvedValue(['1.2.3.4'])
  mockDns.resolve6.mockResolvedValue([])
})

describe('isSafeUrl', () => {
  it('allows public URLs', async () => {
    const result = await isSafeUrl('https://example.com/feed')
    expect(result.safe).toBe(true)
  })
  it('blocks file:// protocol', async () => {
    const result = await isSafeUrl('file:///etc/passwd')
    expect(result.safe).toBe(false)
    expect(result.reason).toContain('disallowed protocol')
  })
  it('blocks localhost directly', async () => {
    const result = await isSafeUrl('http://127.0.0.1/internal')
    expect(result.safe).toBe(false)
    expect(result.reason).toContain('private IP')
  })
  it('blocks 192.168.x.x directly', async () => {
    const result = await isSafeUrl('http://192.168.1.1/admin')
    expect(result.safe).toBe(false)
  })
  it('blocks DNS that resolves to private IP', async () => {
    mockDns.resolve4.mockResolvedValue(['10.0.0.1'])
    const result = await isSafeUrl('https://evil.example.com')
    expect(result.safe).toBe(false)
    expect(result.reason).toContain('private IP')
  })
  it('blocks invalid URL', async () => {
    const result = await isSafeUrl('not-a-url')
    expect(result.safe).toBe(false)
    expect(result.reason).toContain('invalid URL')
  })
})
```

- [ ] **Test ausführen:** `pnpm test src/lib/feeds/ssrf-guard.unit.test.ts`
  - Erwartet: PASS

- [ ] **Commit:** `test(feeds): add ssrf-guard unit tests`

### 2.2 — SSRF-Check in POST `/api/feeds/data-sources`

- [ ] **`src/app/api/feeds/data-sources/route.ts` — im POST-Handler, nach `validateBody`, vor DB-Insert:**

```ts
import { isSafeUrl } from '@/lib/feeds/ssrf-guard'

// Nach validateBody, vor supabaseAdmin.from(...).insert:
const { safe, reason } = await isSafeUrl(body.url)
if (!safe) {
  log.warn('SSRF blocked on data source create', { url: body.url, reason })
  return NextResponse.json({ error: `URL nicht erlaubt: ${reason}` }, { status: 422 })
}
```

- [ ] **Commit:** `fix(security): SSRF check on POST /api/feeds/data-sources`

### 2.3 — SSRF-Check in PATCH `/api/feeds/data-sources/[id]`

- [ ] **`src/app/api/feeds/data-sources/[id]/route.ts` lesen.** Im PATCH-Handler, wenn `body.url` vorhanden:

```ts
import { isSafeUrl } from '@/lib/feeds/ssrf-guard'

if (body.url) {
  const { safe, reason } = await isSafeUrl(body.url)
  if (!safe) {
    log.warn('SSRF blocked on data source update', { url: body.url, reason })
    return NextResponse.json({ error: `URL nicht erlaubt: ${reason}` }, { status: 422 })
  }
}
```

- [ ] **Commit:** `fix(security): SSRF check on PATCH /api/feeds/data-sources/[id]`

### 2.4 — Defense-in-depth: `actions/feeds.ts` (feed_sources / RSS)

**Hinweis:** `createFeedSource` und `updateFeedSource` betreffen die `feed_sources` Tabelle (RSS-Feeds), nicht `feed_data_sources`. Die Fetchers prüfen URLs bereits per `isSafeUrl()` beim Abrufen. Dies ist zusätzlicher Schutz beim Speichern.

- [ ] **`src/actions/feeds.ts` — in `createFeedSource`, nach `parsed.success`, wenn `b.url` vorhanden:**

```ts
import { isSafeUrl } from '@/lib/feeds/ssrf-guard'

// Nach parsed.success, vor supabaseAdmin insert:
if (b.url) {
  const { safe, reason } = await isSafeUrl(b.url)
  if (!safe) return { error: `URL nicht erlaubt: ${reason}` }
}
```

- [ ] **In `updateFeedSource`, wenn `b.url !== undefined`:**

```ts
if (b.url !== undefined) {
  const { safe, reason } = await isSafeUrl(b.url)
  if (!safe) return { error: `URL nicht erlaubt: ${reason}` }
  updates.url = b.url
}
```

- [ ] **Commit:** `fix(security): SSRF defense-in-depth in createFeedSource / updateFeedSource`

---

## Task 3: DataView.tsx aufteilen (793 → ~4 × 200 Zeilen)

**Ziel:** `DataView.tsx` in vier fokussierte Dateien aufteilen. State bleibt im Orchestrator. Callbacks als Props nach unten.

**Komponenten-Aufteilung:**
| Datei | Inhalt | Zeilen (ca.) |
|-------|--------|-------------|
| `DataView.tsx` | State, Callbacks, Orchestrierung | ~200 |
| `_components/DataSourceCard.tsx` | Einzelne Karte + Aktions-Menü | ~150 |
| `_components/DataSourceForm.tsx` | Create/Edit-Modal | ~250 |
| `_components/DataSourceHistory.tsx` | History-Drawer (Tabelle) | ~100 |
| `_components/DataSourceHelpers.tsx` | Helpers, Konstanten, FormState, FormSection, FormField | ~120 |

**Wichtig:** Die Helpers-Datei heißt `.tsx` (nicht `.ts`), weil `FormSection` und `FormField` JSX exportieren.

**Files:**
- Modify: `src/app/feeds/DataView.tsx`
- Create: `src/app/feeds/_components/DataSourceHelpers.tsx`
- Create: `src/app/feeds/_components/DataSourceCard.tsx`
- Create: `src/app/feeds/_components/DataSourceForm.tsx`
- Create: `src/app/feeds/_components/DataSourceHistory.tsx`

### 3.1 — Helpers + JSX-Helpers extrahieren

- [ ] **`src/app/feeds/_components/DataSourceHelpers.tsx` erstellen:**

```tsx
// src/app/feeds/_components/DataSourceHelpers.tsx
'use client'
import React from 'react'

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'gerade eben'
  if (m < 60) return `vor ${m} Min`
  const h = Math.floor(m / 60)
  if (h < 24) return `vor ${h}h`
  return `vor ${Math.floor(h / 24)}d`
}

export function authLabel(type: string | null): string {
  if (!type || type === 'none') return 'Keine Auth'
  if (type === 'bearer') return 'Bearer'
  if (type === 'api_key') return 'API-Key'
  if (type === 'basic') return 'Basic Auth'
  return type
}

export function intervalLabel(sec: number): string {
  if (sec === 0) return 'Manuell'
  if (sec <= 300) return 'Alle 5 Min'
  if (sec <= 3600) return 'Stündlich'
  if (sec <= 86400) return 'Täglich'
  return `${sec}s`
}

export const INTERVAL_OPTIONS = [
  { label: 'Manuell', value: 0 },
  { label: 'Alle 5 Min', value: 300 },
  { label: 'Stündlich', value: 3600 },
  { label: 'Täglich', value: 86400 },
]

export const AUTH_OPTIONS = [
  { label: 'Keine', value: 'none' },
  { label: 'Bearer Token', value: 'bearer' },
  { label: 'API-Key', value: 'api_key' },
  { label: 'Basic Auth', value: 'basic' },
]

// ─── FormState ────────────────────────────────────────────────────────────────

export interface FormState {
  name: string
  description: string
  url: string
  method: 'GET' | 'POST'
  authType: string
  bearerToken: string
  apiKeyHeader: string
  apiKeyValue: string
  basicUser: string
  basicPassword: string
  fetchInterval: number
  schemaPath: string
}

export function blankForm(): FormState {
  return {
    name: '', description: '',
    url: 'https://',        // ← exakt wie in DataView.tsx Zeile 95
    method: 'GET',
    authType: 'none', bearerToken: '', apiKeyHeader: 'X-API-Key',
    apiKeyValue: '', basicUser: '', basicPassword: '',
    fetchInterval: 3600, schemaPath: '',
  }
}

export function buildAuthConfig(form: FormState): Record<string, string> {
  if (form.authType === 'bearer')  return { token: form.bearerToken }
  if (form.authType === 'api_key') return { header: form.apiKeyHeader, key: form.apiKeyValue }
  if (form.authType === 'basic')   return { username: form.basicUser, password: form.basicPassword }
  return {}
}

// ─── JSX Form layout helpers ──────────────────────────────────────────────────
// Exakt aus DataView.tsx Zeilen 54–89 übernehmen:

export function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  // ← Code aus DataView.tsx Zeile 54–65 hier einfügen
}

export function FormField({
  label, required, children,
}: {
  label: string; required?: boolean; children: React.ReactNode
}) {
  // ← Code aus DataView.tsx Zeile 67–89 hier einfügen
}
```

**Wichtig:** Den exakten JSX-Code von `FormSection` und `FormField` aus `DataView.tsx` Zeilen 54–89 übernehmen. Obige Signaturen sind korrekt, der Body muss aus der Quelldatei kopiert werden.

- [ ] **In `DataView.tsx`:** Die lokalen Definitionen von `relativeTime`, `authLabel`, `intervalLabel`, `INTERVAL_OPTIONS`, `AUTH_OPTIONS`, `FormState`, `blankForm`, `buildAuthConfig`, `FormSection`, `FormField` löschen und durch Import ersetzen:

```ts
import {
  relativeTime, authLabel, intervalLabel, INTERVAL_OPTIONS, AUTH_OPTIONS,
  FormState, blankForm, buildAuthConfig, FormSection, FormField,
} from './_components/DataSourceHelpers'
```

- [ ] **Typecheck:** `pnpm typecheck`

- [ ] **Commit:** `refactor(feeds): extract DataView helpers to DataSourceHelpers.tsx`

### 3.2 — `DataSourceHistory` extrahieren

Die History-Komponente rendert eine Tabelle mit Spalten: Zeitpunkt, Datensätze, Status, Dauer. Der exakte JSX-Code liegt in `DataView.tsx` ab ca. Zeile 730.

- [ ] **`src/app/feeds/_components/DataSourceHistory.tsx` erstellen:**

```tsx
'use client'
import { X, Check } from '@phosphor-icons/react'
import type { FeedDataSource, FeedDataRecord } from '@/types/feeds'

interface Props {
  source: FeedDataSource
  records: FeedDataRecord[]
  loading: boolean
  onClose: () => void
}

export function DataSourceHistory({ source, records, loading, onClose }: Props) {
  return (
    // ← Exakten Drawer-JSX aus DataView.tsx (History-Abschnitt, ~Zeilen 720–788) hier einfügen.
    // Die Komponente rendert: Overlay-Backdrop → Drawer-Panel → Header (Name + X-Button) →
    // Tabelle mit fetchedAt, recordCount, error/httpStatus, fetchDurationMs
    // onClose auf Backdrop-Click und X-Button und "Schließen"-Button
  )
}
```

**Wichtig:** Den vollständigen JSX-Code aus `DataView.tsx` kopieren, nicht das Skeleton oben. `FeedDataRecord` hat die Felder: `id`, `fetchedAt`, `recordCount`, `httpStatus`, `error`, `fetchDurationMs`.

- [ ] **In `DataView.tsx`:** Den History-Drawer JSX durch `<DataSourceHistory>` ersetzen:

```tsx
import { DataSourceHistory } from './_components/DataSourceHistory'

// Im return:
{historySource && (
  <DataSourceHistory
    source={historySource}
    records={historyRecords}
    loading={historyLoading}
    onClose={() => setHistorySource(null)}
  />
)}
```

- [ ] **Typecheck:** `pnpm typecheck`

- [ ] **Commit:** `refactor(feeds): extract DataSourceHistory component`

### 3.3 — `DataSourceForm` extrahieren

- [ ] **`src/app/feeds/_components/DataSourceForm.tsx` erstellen:**

```tsx
'use client'
import { FormSection, FormField, FormState, INTERVAL_OPTIONS, AUTH_OPTIONS } from './DataSourceHelpers'
// weitere Imports nach Bedarf

interface Props {
  open: boolean
  editingId: string | null
  form: FormState
  saving: boolean
  error: string
  onChange: (patch: Partial<FormState>) => void
  onSave: () => void
  onClose: () => void
}

export function DataSourceForm({ open, editingId, form, saving, error, onChange, onSave, onClose }: Props) {
  if (!open) return null
  const f = (patch: Partial<FormState>) => onChange(patch)

  return (
    // ← Exakten Modal-JSX aus DataView.tsx (Create/Edit Modal, ~Zeilen 223–309) hier einfügen.
    // `f(...)` Aufrufe für onChange, `onSave`, `onClose` für Buttons verwenden.
  )
}
```

- [ ] **In `DataView.tsx`:** Modal-JSX durch `<DataSourceForm>` ersetzen:

```tsx
import { DataSourceForm } from './_components/DataSourceForm'

<DataSourceForm
  open={modalOpen}
  editingId={editingId}
  form={form}
  saving={formSaving}
  error={formError}
  onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
  onSave={handleSave}
  onClose={() => setModalOpen(false)}
/>
```

- [ ] **`handleSave` in DataView prüfen:** `buildAuthConfig(form)` statt `buildAuthConfig()` aufrufen (da `buildAuthConfig` jetzt `form` als Parameter nimmt).

- [ ] **Typecheck:** `pnpm typecheck`

- [ ] **Commit:** `refactor(feeds): extract DataSourceForm component`

### 3.4 — `DataSourceCard` extrahieren

- [ ] **`src/app/feeds/_components/DataSourceCard.tsx` erstellen:**

```tsx
'use client'
import { /* Icons aus DataView */ } from '@phosphor-icons/react'
import type { FeedDataSource } from '@/types/feeds'
import { relativeTime, authLabel, intervalLabel } from './DataSourceHelpers'

interface Props {
  source: FeedDataSource
  fetchingId: string | null
  fetchMsg: Record<string, string>
  menuOpen: string | null
  onMenuOpen: (id: string | null) => void
  onFetch: (src: FeedDataSource) => void
  onToggleActive: (src: FeedDataSource) => void
  onDelete: (src: FeedDataSource) => void
  onOpenHistory: (src: FeedDataSource) => void
  onEdit: (src: FeedDataSource) => void
}

export function DataSourceCard({ source, fetchingId, fetchMsg, menuOpen, onMenuOpen, onFetch, onToggleActive, onDelete, onOpenHistory, onEdit }: Props) {
  // ← Exakten Karten-JSX aus DataView.tsx (sources.map Inhalt) hier einfügen.
}
```

- [ ] **In `DataView.tsx`:** `sources.map(...)` durch `<DataSourceCard>` ersetzen:

```tsx
import { DataSourceCard } from './_components/DataSourceCard'

{sources.map((src) => (
  <DataSourceCard
    key={src.id}
    source={src}
    fetchingId={fetchingId}
    fetchMsg={fetchMsg}
    menuOpen={menuOpen}
    onMenuOpen={setMenuOpen}
    onFetch={handleFetch}
    onToggleActive={handleToggleActive}
    onDelete={handleDelete}
    onOpenHistory={openHistory}
    onEdit={openEdit}
  />
))}
```

- [ ] **Typecheck:** `pnpm typecheck`

- [ ] **Commit:** `refactor(feeds): extract DataSourceCard component`

### 3.5 — Abschluss

- [ ] **Zeilenzahl prüfen:** `wc -l src/app/feeds/DataView.tsx` — sollte deutlich unter 300 sein.

- [ ] **Alle Tests:** `pnpm test`

- [ ] **Design-Lint:** `node scripts/ci/lint-design-system.mjs`

- [ ] **Browser-Check:** `/feeds` öffnen — DataView muss identisch aussehen wie vorher (Karten, Modal, History-Drawer, Toast).

- [ ] **Finaler Commit** (falls noch Cleanups):
  ```bash
  git commit -m "refactor(feeds): split DataView.tsx into focused components

  793 lines → DataView (~200) + DataSourceCard + DataSourceForm + DataSourceHistory + DataSourceHelpers
  No behavioral change — identical UI output."
  ```

---

## Ausführungsreihenfolge

Die drei Tasks sind vollständig unabhängig. Empfehlung:

1. **Task 2 (SSRF)** — kleinstes Risiko, höchster Security-Impact
2. **Task 1 (Pagination)** — mechanisch, klar definiert
3. **Task 3 (DataView Split)** — größtes Refactoring-Risiko, zuletzt

Jede Task kann als eigener PR gemergt werden.
