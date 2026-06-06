# Pre-Flight Projekt-Fläche — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-Flight von einem One-Shot zu einer benannten, persistenten Projekt-Fläche mit voller CRUD und einem Repo-Artefakt-Browser ausbauen.

**Architecture:** Neue Tabelle `preflight_projects` (Container) + bestehende `preflight_runs` bekommt `project_id` (1:n, neuester Run = aktuelles Startpaket). Schreibzugriff via Service-Role (`supabaseAdmin`) in API-Routen mit `getAuthUser`-Org-Scoping; SELECT-RLS org-scoped. Frontend: Listen-/Leerseite (`/preflight`) + Detail-/Ergebnis-Seite (`/preflight/[id]`) mit `ArtifactBrowser`. Generierte Dateien leben in `preflight_runs.result.startpaket` (JSONB) — der Browser ist eine Sicht, kein zweiter Store.

**Tech Stack:** Next.js 15 App Router · TypeScript strict · Supabase (`supabaseAdmin`) · Zod (`validateBody`) · Vitest · next-intl-Navigation · Phosphor Icons · bestehende `CodeBlock`/Design-System-CSS.

**Referenz-Spec:** `docs/superpowers/specs/2026-06-05-preflight-projects-crud-design.md`

---

## File Structure

**Neu:**
- `supabase/migrations/20260605000002_preflight_projects.sql` — Tabelle + FK auf runs + RLS + Indizes
- `src/lib/api/preflight.ts` — `verifyPreflightProjectAccess(id, me)`
- `src/lib/download.ts` — `downloadTextFile(filename, content)`
- `src/app/api/preflight/projects/route.ts` — GET Liste
- `src/app/api/preflight/projects/[id]/route.ts` — GET/PATCH/DELETE
- `src/app/api/preflight/projects/[id]/runs/route.ts` — POST Re-Analyse
- `src/app/[locale]/(app)/preflight/_components/IntakePanel.tsx` — Eingabe (Name + Pivots + Konzept + Datei)
- `src/app/[locale]/(app)/preflight/_components/ProjectGrid.tsx` — `ProjectCard` + `ProjectGrid`
- `src/app/[locale]/(app)/preflight/_components/ArtifactBrowser.tsx` — Repo-Browser
- `src/app/[locale]/(app)/preflight/_components/EmptyStateIntro.tsx` — Split-Leerzustand (Erklärung links)
- `src/app/[locale]/(app)/preflight/[id]/page.tsx` — Detail-Seite (Client)
- Tests: `src/lib/__tests__/download.unit.test.ts`, `src/lib/validators/__tests__/preflight.unit.test.ts`, `src/app/api/preflight/__tests__/projects.unit.test.ts`, `src/app/api/preflight/__tests__/project-id.unit.test.ts`, `src/app/api/preflight/__tests__/project-runs.unit.test.ts`

**Geändert:**
- `src/lib/validators/preflight.ts` — `name` optional in `preflightBody`, neu `renameProjectBody`
- `src/lib/preflight/types.ts` — `PreflightProjectListItem`, `PreflightProjectDetail`
- `src/app/api/preflight/analyze/route.ts` — legt Projekt+Run an, gibt `{ projectId, result }`
- `src/app/api/preflight/__tests__/analyze.unit.test.ts` — an neue Insert-Kette angepasst
- `src/app/[locale]/(app)/preflight/_components/PreflightResult.tsx` — wird Detail-Komposition (Path B raus, ArtifactBrowser rein)
- `src/app/[locale]/(app)/preflight/page.tsx` — Liste + Leerzustand + Intake

---

## Task 1: Migration — `preflight_projects` + `project_id` auf runs

**Files:**
- Create: `supabase/migrations/20260605000002_preflight_projects.sql`

- [ ] **Step 1: Migrationsdatei schreiben**

```sql
-- 20260605000002_preflight_projects.sql
-- Pre-Flight Projekt-Fläche: benannter Container (1:n zu preflight_runs).
-- Schreibzugriff ausschließlich Service-Role (API) — daher keine INSERT/UPDATE-Policy.

CREATE TABLE preflight_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pivots JSONB NOT NULL,
  red_count INTEGER NOT NULL DEFAULT 0,
  latest_run_id UUID,            -- FK wird nach preflight_runs.project_id ergänzt
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- runs an Projekt hängen
ALTER TABLE preflight_runs
  ADD COLUMN project_id UUID REFERENCES preflight_projects(id) ON DELETE CASCADE;

-- jetzt den latest_run_id-FK ergänzen (zirkuläre Beziehung aufgelöst)
ALTER TABLE preflight_projects
  ADD CONSTRAINT preflight_projects_latest_run_fk
  FOREIGN KEY (latest_run_id) REFERENCES preflight_runs(id) ON DELETE SET NULL;

ALTER TABLE preflight_projects ENABLE ROW LEVEL SECURITY;

-- SELECT: eigene Org
CREATE POLICY "preflight_projects_select_own_org" ON preflight_projects
  FOR SELECT USING (organization_id = get_my_organization_id());

-- DELETE: eigener Eintrag (DSGVO-Hygiene; reguläres Löschen = Soft-Delete über API)
CREATE POLICY "preflight_projects_delete_own" ON preflight_projects
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_preflight_projects_org_list
  ON preflight_projects (organization_id, deleted_at, updated_at DESC);
CREATE INDEX idx_preflight_runs_project
  ON preflight_runs (project_id, created_at DESC);
```

- [ ] **Step 2: Migrationsdatei committen (Git zuerst, dann DB)**

```bash
git add supabase/migrations/20260605000002_preflight_projects.sql
git commit -m "feat(preflight): Migration preflight_projects + runs.project_id"
```

- [ ] **Step 3: Migration anwenden**

Anwenden über Supabase MCP `apply_migration` (name `preflight_projects`, obiger SQL-Body) ODER `supabase db push`.
Hinweis CLAUDE.md: Bei MCP-Anwendung vergibt Supabase eine eigene Timestamp-Version — danach History an die Dateiversion `20260605000002` angleichen.

- [ ] **Step 4: Anwendung verifizieren**

Über Supabase MCP `list_tables` (Schema `public`) prüfen, dass `preflight_projects` existiert und `preflight_runs` die Spalte `project_id` hat.
Expected: Tabelle + Spalte vorhanden, RLS aktiv.

---

## Task 2: Validatoren erweitern

**Files:**
- Modify: `src/lib/validators/preflight.ts`
- Test: `src/lib/validators/__tests__/preflight.unit.test.ts`

- [ ] **Step 1: Failing test schreiben**

```typescript
import { describe, it, expect } from 'vitest'
import { preflightBody, renameProjectBody } from '../preflight'

describe('preflightBody', () => {
  const base = {
    input: 'Ein hinreichend langer Konzepttext.',
    pivots: { buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu', stack: 'Next.js' },
  }

  it('akzeptiert optionalen name', () => {
    const r = preflightBody.safeParse({ ...base, name: 'Mein Projekt' })
    expect(r.success).toBe(true)
  })

  it('akzeptiert fehlenden name', () => {
    const r = preflightBody.safeParse(base)
    expect(r.success).toBe(true)
  })

  it('lehnt name > 120 Zeichen ab', () => {
    const r = preflightBody.safeParse({ ...base, name: 'x'.repeat(121) })
    expect(r.success).toBe(false)
  })
})

describe('renameProjectBody', () => {
  it('akzeptiert nicht-leeren name', () => {
    expect(renameProjectBody.safeParse({ name: 'Neu' }).success).toBe(true)
  })
  it('lehnt leeren name ab', () => {
    expect(renameProjectBody.safeParse({ name: '   ' }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `pnpm test -- src/lib/validators/__tests__/preflight.unit.test.ts`
Expected: FAIL (`renameProjectBody` ist nicht exportiert).

- [ ] **Step 3: Validator implementieren**

```typescript
import { z } from 'zod'

export const pivotsSchema = z.object({
  buildTool: z.enum(['claude-code', 'cursor', 'lovable', 'bolt', 'other', 'unsure']),
  businessModel: z.enum(['b2c', 'b2b', 'internal', 'unsure']),
  audienceRegion: z.enum(['eu', 'non_eu', 'global', 'unsure']),
  hosting: z.enum(['eu', 'non_eu', 'global', 'unsure']),
  stack: z.string(),
})

export const preflightBody = z.object({
  input: z.string().min(1),
  pivots: pivotsSchema,
  name: z.string().trim().max(120).optional(),
})

export const renameProjectBody = z.object({
  name: z.string().trim().min(1).max(120),
})
```

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `pnpm test -- src/lib/validators/__tests__/preflight.unit.test.ts`
Expected: PASS (5 Tests grün).

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators/preflight.ts src/lib/validators/__tests__/preflight.unit.test.ts
git commit -m "feat(preflight): name optional + renameProjectBody validator"
```

---

## Task 3: Projekt-Typen ergänzen

**Files:**
- Modify: `src/lib/preflight/types.ts` (am Dateiende anfügen)

- [ ] **Step 1: Typen hinzufügen**

Am Ende von `src/lib/preflight/types.ts` anfügen:

```typescript
/** Listen-Eintrag auf /preflight. */
export interface PreflightProjectListItem {
  id: string
  name: string
  stack: string
  redCount: number
  updatedAt: string
}

/** Detail-Ansicht /preflight/[id]: Projekt + neuestes Ergebnis + Input des letzten Runs. */
export interface PreflightProjectDetail {
  id: string
  name: string
  pivots: PreflightPivots
  input: string
  result: PreflightResult
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS (keine neuen Fehler).

- [ ] **Step 3: Commit**

```bash
git add src/lib/preflight/types.ts
git commit -m "feat(preflight): list/detail project types"
```

---

## Task 4: Download-Helfer + Projekt-Zugriffsprüfung

**Files:**
- Create: `src/lib/download.ts`
- Create: `src/lib/api/preflight.ts`
- Test: `src/lib/__tests__/download.unit.test.ts`

- [ ] **Step 1: Failing test für downloadTextFile**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { downloadTextFile } from '../download'

describe('downloadTextFile', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // jsdom: URL.createObjectURL/revokeObjectURL existieren nicht — stubben
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  it('erzeugt einen Anchor mit korrektem download-Namen und klickt', () => {
    const click = vi.fn()
    const anchor = { href: '', download: '', click } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)

    downloadTextFile('.cursorrules', '# rules')

    expect(anchor.download).toBe('.cursorrules')
    expect(anchor.href).toBe('blob:fake')
    expect(click).toHaveBeenCalledOnce()
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `pnpm test -- src/lib/__tests__/download.unit.test.ts`
Expected: FAIL (Modul existiert nicht).

- [ ] **Step 3: download.ts implementieren**

```typescript
// src/lib/download.ts
// Lädt beliebigen Textinhalt als Datei herunter (Browser-Blob, keine Lib).
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `pnpm test -- src/lib/__tests__/download.unit.test.ts`
Expected: PASS.

- [ ] **Step 5: verifyPreflightProjectAccess implementieren**

```typescript
// src/lib/api/preflight.ts
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * True, wenn das Projekt zur Org des Users gehört (oder Superadmin).
 * Liefert das Projekt mit, um eine zweite Query zu sparen.
 */
export async function getPreflightProjectForUser(
  id: string,
  me: { organization_id: string; role: string },
): Promise<{ id: string; organization_id: string; name: string; pivots: unknown; latest_run_id: string | null } | null> {
  const { data } = await supabaseAdmin
    .from('preflight_projects')
    .select('id, organization_id, name, pivots, latest_run_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (!data) return null
  if (me.role !== 'superadmin' && data.organization_id !== me.organization_id) return null
  return data
}
```

- [ ] **Step 6: Typecheck + Commit**

Run: `pnpm typecheck`
Expected: PASS.

```bash
git add src/lib/download.ts src/lib/api/preflight.ts src/lib/__tests__/download.unit.test.ts
git commit -m "feat(preflight): downloadTextFile + project access helper"
```

---

## Task 5: `analyze`-Route — Projekt + Run anlegen

**Files:**
- Modify: `src/app/api/preflight/analyze/route.ts`
- Modify: `src/app/api/preflight/__tests__/analyze.unit.test.ts`

- [ ] **Step 1: Route umschreiben**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { validateBody } from '@/lib/validators'
import { preflightBody } from '@/lib/validators/preflight'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { runPreflight } from '@/lib/preflight/run'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:preflight:analyze')

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error: validationError } = await validateBody(req, preflightBody)
  if (validationError) return validationError

  const { input, pivots, name } = data

  const budget = await checkBudget(me.organization_id, 'preflight', null)
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  try {
    let result
    try {
      result = await runPreflight(input, pivots)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Input ungültig'
      logger.warn('runPreflight rejected input', { message })
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // 1. Projekt (latest_run_id zunächst NULL)
    const projectName = (name?.trim() || result.summary.projectLabel).slice(0, 120)
    const { data: project, error: projErr } = await supabaseAdmin
      .from('preflight_projects')
      .insert({
        organization_id: me.organization_id,
        user_id: me.id,
        name: projectName,
        pivots,
        red_count: result.gaps.red.length,
      })
      .select('id')
      .single()
    if (projErr || !project) {
      logger.error('preflight_projects insert failed', { error: projErr?.message })
      return NextResponse.json({ error: 'Fehler beim Speichern', code: 'DB_ERROR' }, { status: 500 })
    }

    // 2. Run mit project_id
    const { data: run, error: runErr } = await supabaseAdmin
      .from('preflight_runs')
      .insert({
        organization_id: me.organization_id,
        user_id: me.id,
        project_id: project.id,
        input_text: input,
        result,
      })
      .select('id')
      .single()
    if (runErr || !run) {
      logger.error('preflight_runs insert failed', { error: runErr?.message })
      return NextResponse.json({ error: 'Fehler beim Speichern', code: 'DB_ERROR' }, { status: 500 })
    }

    // 3. latest_run_id setzen
    await supabaseAdmin
      .from('preflight_projects')
      .update({ latest_run_id: run.id, updated_at: new Date().toISOString() })
      .eq('id', project.id)

    return NextResponse.json({ projectId: project.id, result })
  } catch (err) {
    logger.error('preflight analyze error', { err })
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Test an neue Insert-Kette anpassen**

Ersetze in `analyze.unit.test.ts` den `buildInsertMock`-Helfer und die Happy-Path-Tests (ab Zeile 69) durch:

```typescript
// Baut einen supabaseAdmin-Mock, der projects.insert→select→single, runs.insert→select→single
// und projects.update→eq auflöst.
function buildProjectRunMocks(projectId = 'proj-1', runId = 'run-1') {
  const projInsertSingle = vi.fn().mockResolvedValue({ data: { id: projectId }, error: null })
  const runInsertSingle  = vi.fn().mockResolvedValue({ data: { id: runId }, error: null })
  const updateEq = vi.fn().mockResolvedValue({ data: null, error: null })

  mockSupabaseAdmin.from = vi.fn((table: string) => {
    if (table === 'preflight_projects') {
      return {
        insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: projInsertSingle }) }),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      }
    }
    // preflight_runs
    return {
      insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: runInsertSingle }) }),
    }
  }) as unknown as typeof mockSupabaseAdmin.from
  return { updateEq }
}
```

Und die beiden 200er-Tests ersetzen durch:

```typescript
  it('returns 200 with projectId and result on success', async () => {
    mockGetAuthUser.mockResolvedValue(FAKE_USER)
    mockCheckBudget.mockResolvedValue({ allowed: true })
    mockRunPreflight.mockResolvedValue(FAKE_RESULT)
    buildProjectRunMocks('proj-9', 'run-9')

    const res = await POST(makeRequest({ input: 'This is a sufficiently long design document', pivots: FAKE_PIVOTS }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('projectId', 'proj-9')
    expect(body.result.gaps).toEqual(FAKE_RESULT.gaps)
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('preflight_projects')
    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('preflight_runs')
  })

  it('uses projectLabel as name when name is omitted', async () => {
    mockGetAuthUser.mockResolvedValue(FAKE_USER)
    mockCheckBudget.mockResolvedValue({ allowed: true })
    mockRunPreflight.mockResolvedValue(FAKE_RESULT)
    buildProjectRunMocks()
    const res = await POST(makeRequest({ input: 'A design doc with meaningful content here', pivots: FAKE_PIVOTS }))
    expect(res.status).toBe(200)
  })
```

(Die 401/402/400-Tests bleiben unverändert.)

- [ ] **Step 3: Tests laufen lassen**

Run: `pnpm test -- src/app/api/preflight/__tests__/analyze.unit.test.ts`
Expected: PASS (alle Tests grün).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/preflight/analyze/route.ts src/app/api/preflight/__tests__/analyze.unit.test.ts
git commit -m "feat(preflight): analyze legt Projekt + Run an, gibt projectId"
```

---

## Task 6: `GET /api/preflight/projects` — Liste

**Files:**
- Create: `src/app/api/preflight/projects/route.ts`
- Test: `src/app/api/preflight/__tests__/projects.unit.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/lib/api/projects', () => ({ getAuthUser: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { GET } from '../projects/route'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'

const mockAuth = vi.mocked(getAuthUser)
const mockAdmin = vi.mocked(supabaseAdmin)
const USER = { id: 'u1', organization_id: 'org1', role: 'member' }

function mockList(rows: unknown[]) {
  const order = vi.fn().mockResolvedValue({ data: rows, error: null })
  const isNull = vi.fn().mockReturnValue({ order })
  const eq = vi.fn().mockReturnValue({ is: isNull })
  const select = vi.fn().mockReturnValue({ eq })
  mockAdmin.from = vi.fn().mockReturnValue({ select }) as unknown as typeof mockAdmin.from
}

describe('GET /api/preflight/projects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('401 ohne Auth', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('mappt Zeilen auf Listen-Items', async () => {
    mockAuth.mockResolvedValue(USER)
    mockList([
      { id: 'p1', name: 'LMS', pivots: { stack: 'Next.js' }, red_count: 17, updated_at: '2026-06-06T10:00:00Z' },
    ])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data[0]).toEqual({ id: 'p1', name: 'LMS', stack: 'Next.js', redCount: 17, updatedAt: '2026-06-06T10:00:00Z' })
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `pnpm test -- src/app/api/preflight/__tests__/projects.unit.test.ts`
Expected: FAIL (Route existiert nicht).

- [ ] **Step 3: Route implementieren**

```typescript
// src/app/api/preflight/projects/route.ts
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import type { PreflightProjectListItem } from '@/lib/preflight/types'

export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('preflight_projects')
    .select('id, name, pivots, red_count, updated_at')
    .eq('organization_id', me.organization_id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) return apiError(error)

  const items: PreflightProjectListItem[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    stack: (r.pivots as { stack?: string })?.stack ?? '',
    redCount: r.red_count ?? 0,
    updatedAt: r.updated_at,
  }))
  return NextResponse.json({ data: items })
}
```

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `pnpm test -- src/app/api/preflight/__tests__/projects.unit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/preflight/projects/route.ts src/app/api/preflight/__tests__/projects.unit.test.ts
git commit -m "feat(preflight): GET projects list route"
```

---

## Task 7: `GET/PATCH/DELETE /api/preflight/projects/[id]`

**Files:**
- Create: `src/app/api/preflight/projects/[id]/route.ts`
- Test: `src/app/api/preflight/__tests__/project-id.unit.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/lib/api/projects', () => ({ getAuthUser: vi.fn() }))
vi.mock('@/lib/api/preflight', () => ({ getPreflightProjectForUser: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { GET, PATCH, DELETE } from '../projects/[id]/route'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { supabaseAdmin } from '@/lib/supabase-admin'

const mockAuth = vi.mocked(getAuthUser)
const mockAccess = vi.mocked(getPreflightProjectForUser)
const mockAdmin = vi.mocked(supabaseAdmin)
const USER = { id: 'u1', organization_id: 'org1', role: 'member' }
const PROJECT = { id: 'p1', organization_id: 'org1', name: 'LMS', pivots: { stack: 'Next.js' }, latest_run_id: 'run1' }
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

function req(body?: unknown) {
  return new Request('http://localhost/api/preflight/projects/p1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('preflight project [id] route', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET 404 wenn kein Zugriff', async () => {
    mockAuth.mockResolvedValue(USER)
    mockAccess.mockResolvedValue(null)
    const res = await GET(req(), ctx('p1'))
    expect(res.status).toBe(404)
  })

  it('GET liefert Projekt + result des latest run', async () => {
    mockAuth.mockResolvedValue(USER)
    mockAccess.mockResolvedValue(PROJECT)
    const single = vi.fn().mockResolvedValue({ data: { result: { summary: { projectLabel: 'LMS', headline: 'x' }, gaps: {}, startpaket: {} }, input_text: 'mein konzept' }, error: null })
    mockAdmin.from = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single }) }) }) as unknown as typeof mockAdmin.from
    const res = await GET(req(), ctx('p1'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ id: 'p1', name: 'LMS', input: 'mein konzept' })
    expect(body.result.summary.projectLabel).toBe('LMS')
  })

  it('PATCH benennt um', async () => {
    mockAuth.mockResolvedValue(USER)
    mockAccess.mockResolvedValue(PROJECT)
    const single = vi.fn().mockResolvedValue({ data: { id: 'p1', name: 'Neu' }, error: null })
    mockAdmin.from = vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }) }) }) as unknown as typeof mockAdmin.from
    const res = await PATCH(req({ name: 'Neu' }), ctx('p1'))
    expect(res.status).toBe(200)
    expect((await res.json()).name).toBe('Neu')
  })

  it('PATCH 400 bei leerem name', async () => {
    mockAuth.mockResolvedValue(USER)
    mockAccess.mockResolvedValue(PROJECT)
    const res = await PATCH(req({ name: '   ' }), ctx('p1'))
    expect(res.status).toBe(400)
  })

  it('DELETE soft-deletes', async () => {
    mockAuth.mockResolvedValue(USER)
    mockAccess.mockResolvedValue(PROJECT)
    const eq = vi.fn().mockResolvedValue({ data: null, error: null })
    mockAdmin.from = vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) }) as unknown as typeof mockAdmin.from
    const res = await DELETE(req(), ctx('p1'))
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `pnpm test -- src/app/api/preflight/__tests__/project-id.unit.test.ts`
Expected: FAIL (Route existiert nicht).

- [ ] **Step 3: Route implementieren**

```typescript
// src/app/api/preflight/projects/[id]/route.ts
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { renameProjectBody } from '@/lib/validators/preflight'
import { apiError } from '@/lib/api-error'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await getPreflightProjectForUser(id, me)
  if (!project) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  let result: unknown = null
  let input = ''
  if (project.latest_run_id) {
    const { data: run, error } = await supabaseAdmin
      .from('preflight_runs')
      .select('result, input_text')
      .eq('id', project.latest_run_id)
      .single()
    if (error) return apiError(error)
    result = run?.result ?? null
    input = run?.input_text ?? ''
  }

  return NextResponse.json({ id: project.id, name: project.name, pivots: project.pivots, input, result })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await getPreflightProjectForUser(id, me)
  if (!project) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error: validationError } = await validateBody(req, renameProjectBody)
  if (validationError) return validationError

  const { data: updated, error } = await supabaseAdmin
    .from('preflight_projects')
    .update({ name: data.name.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, name')
    .single()
  if (error) return apiError(error)
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await getPreflightProjectForUser(id, me)
  if (!project) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('preflight_projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return apiError(error)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `pnpm test -- src/app/api/preflight/__tests__/project-id.unit.test.ts`
Expected: PASS (5 Tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/preflight/projects/[id]/route.ts src/app/api/preflight/__tests__/project-id.unit.test.ts
git commit -m "feat(preflight): GET/PATCH/DELETE project detail route"
```

---

## Task 8: `POST /api/preflight/projects/[id]/runs` — Re-Analyse

**Files:**
- Create: `src/app/api/preflight/projects/[id]/runs/route.ts`
- Test: `src/app/api/preflight/__tests__/project-runs.unit.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
vi.mock('@/lib/api/projects', () => ({ getAuthUser: vi.fn() }))
vi.mock('@/lib/api/preflight', () => ({ getPreflightProjectForUser: vi.fn() }))
vi.mock('@/lib/budget', () => ({
  checkBudget: vi.fn(),
  budgetExhaustedResponse: vi.fn(() => new Response(JSON.stringify({ code: 'BUDGET_EXHAUSTED' }), { status: 402 })),
}))
vi.mock('@/lib/preflight/run', () => ({ runPreflight: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { POST } from '../projects/[id]/runs/route'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { checkBudget } from '@/lib/budget'
import { runPreflight } from '@/lib/preflight/run'
import { supabaseAdmin } from '@/lib/supabase-admin'

const mockAuth = vi.mocked(getAuthUser)
const mockAccess = vi.mocked(getPreflightProjectForUser)
const mockBudget = vi.mocked(checkBudget)
const mockRun = vi.mocked(runPreflight)
const mockAdmin = vi.mocked(supabaseAdmin)
const USER = { id: 'u1', organization_id: 'org1', role: 'member' }
const PROJECT = { id: 'p1', organization_id: 'org1', name: 'LMS', pivots: {}, latest_run_id: 'r0' }
const PIVOTS = { buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu', stack: 'Next.js' } as const
const RESULT = { summary: { projectLabel: 'LMS', headline: 'x' }, gaps: { red: [], yellow: [], decidedCount: 0, naCount: 0 }, startpaket: { decisionLog: '', conventions: { filename: '.cursorrules', content: '' }, envExample: '' } }
const ctx = { params: Promise.resolve({ id: 'p1' }) }
const req = (b: unknown) => new Request('http://localhost/api/preflight/projects/p1/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })

describe('POST project runs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('404 ohne Zugriff', async () => {
    mockAuth.mockResolvedValue(USER); mockAccess.mockResolvedValue(null)
    expect((await POST(req({ input: 'genug text hier', pivots: PIVOTS }), ctx)).status).toBe(404)
  })

  it('200 + neuer Run, latest_run_id aktualisiert', async () => {
    mockAuth.mockResolvedValue(USER); mockAccess.mockResolvedValue(PROJECT)
    mockBudget.mockResolvedValue({ allowed: true }); mockRun.mockResolvedValue(RESULT)
    const runSingle = vi.fn().mockResolvedValue({ data: { id: 'r1' }, error: null })
    const updateEq = vi.fn().mockResolvedValue({ data: null, error: null })
    mockAdmin.from = vi.fn((t: string) => t === 'preflight_runs'
      ? { insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: runSingle }) }) }
      : { update: vi.fn().mockReturnValue({ eq: updateEq }) }
    ) as unknown as typeof mockAdmin.from
    const res = await POST(req({ input: 'ein hinreichend langer text', pivots: PIVOTS }), ctx)
    expect(res.status).toBe(200)
    expect((await res.json()).result.summary.projectLabel).toBe('LMS')
    expect(updateEq).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `pnpm test -- src/app/api/preflight/__tests__/project-runs.unit.test.ts`
Expected: FAIL (Route existiert nicht).

- [ ] **Step 3: Route implementieren**

```typescript
// src/app/api/preflight/projects/[id]/runs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { validateBody } from '@/lib/validators'
import { preflightBody } from '@/lib/validators/preflight'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { runPreflight } from '@/lib/preflight/run'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:preflight:runs')

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await getPreflightProjectForUser(id, me)
  if (!project) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error: validationError } = await validateBody(req, preflightBody)
  if (validationError) return validationError
  const { input, pivots } = data

  const budget = await checkBudget(me.organization_id, 'preflight', null)
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  let result
  try {
    result = await runPreflight(input, pivots)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Input ungültig'
    logger.warn('runPreflight rejected input', { message })
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { data: run, error: runErr } = await supabaseAdmin
    .from('preflight_runs')
    .insert({
      organization_id: me.organization_id,
      user_id: me.id,
      project_id: project.id,
      input_text: input,
      result,
    })
    .select('id')
    .single()
  if (runErr || !run) {
    logger.error('preflight_runs insert failed', { error: runErr?.message })
    return NextResponse.json({ error: 'Fehler beim Speichern', code: 'DB_ERROR' }, { status: 500 })
  }

  await supabaseAdmin
    .from('preflight_projects')
    .update({
      latest_run_id: run.id,
      pivots,
      red_count: result.gaps.red.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', project.id)

  return NextResponse.json({ result })
}
```

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `pnpm test -- src/app/api/preflight/__tests__/project-runs.unit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/preflight/projects/[id]/runs/route.ts src/app/api/preflight/__tests__/project-runs.unit.test.ts
git commit -m "feat(preflight): POST re-analyse run route"
```

---

## Task 9: `IntakePanel` extrahieren

**Files:**
- Create: `src/app/[locale]/(app)/preflight/_components/IntakePanel.tsx`

Extrahiert die Eingabe (Name + Pivots + DropZone + Textarea + Submit) aus der heutigen `page.tsx`, ergänzt das **Name-Feld**. Erhält Callbacks; macht selbst keinen fetch.

- [ ] **Step 1: Komponente schreiben**

```tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { UploadSimple, ArrowRight, Warning, X } from '@phosphor-icons/react'
import type { PreflightPivots } from '@/lib/preflight/types'

const ACCEPTED_EXTENSIONS = ['.md', '.txt']
const ACCEPTED_TEXT_TYPES = ['text/plain', 'text/markdown', 'application/octet-stream']

const PLACEHOLDER = `Füge hier dein Konzept, deine README, dein PRD oder eine kurze Beschreibung ein …

Beispiele:
• Next.js SaaS mit Supabase Auth, Stripe-Zahlungen und einer KI-Chat-Funktion
• Internes Tool zur Dokumentenverarbeitung mit Datei-Upload, OCR und PDF-Export
• README oder PRD deines Projekts`

export const DEFAULT_PIVOTS: PreflightPivots = {
  buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu', stack: 'Next.js + Supabase',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)',
  marginBottom: 5, letterSpacing: '0.04em', textTransform: 'uppercase',
}

function isAcceptedFile(file: File): boolean {
  const n = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some(e => n.endsWith(e)) || ACCEPTED_TEXT_TYPES.includes(file.type)
}
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = e => resolve((e.target?.result as string) ?? '')
    r.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
    r.readAsText(file, 'utf-8')
  })
}

export interface IntakePanelProps {
  name: string
  onNameChange: (v: string) => void
  pivots: PreflightPivots
  onPivotsChange: (p: PreflightPivots) => void
  input: string
  onInputChange: (v: string) => void
  onSubmit: () => void
  isLoading: boolean
  error: string | null
  onClearError: () => void
}

export function IntakePanel(props: IntakePanelProps) {
  const { name, onNameChange, pivots, onPivotsChange, input, onInputChange, onSubmit, isLoading, error, onClearError } = props
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof PreflightPivots>(k: K, v: PreflightPivots[K]) => onPivotsChange({ ...pivots, [k]: v })

  const handleFile = useCallback(async (file: File) => {
    setFileError(null)
    if (!isAcceptedFile(file)) {
      setFileError('Direkt gelesen werden nur .md und .txt. Für .docx/.pdf bitte den Text per Copy-Paste oben einfügen.')
      return
    }
    try {
      const text = await readFileAsText(file)
      const header = `# ${file.name}\n\n`
      onInputChange(input ? `${input}\n\n---\n\n${header}${text}` : `${header}${text}`)
    } catch { setFileError('Datei konnte nicht gelesen werden.') }
  }, [input, onInputChange])

  return (
    <form onSubmit={e => { e.preventDefault(); if (input.trim() && !isLoading) onSubmit() }} noValidate>
      {/* Name */}
      <label htmlFor="pf-name" style={LABEL_STYLE}>Projektname (optional)</label>
      <input id="pf-name" className="input" value={name} disabled={isLoading}
        onChange={e => onNameChange(e.target.value)} placeholder="Wird sonst aus der Analyse abgeleitet"
        style={{ width: '100%', fontSize: 13, marginBottom: 14 }} />

      {/* Pivots */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px 12px', marginBottom: 14 }}>
        <div>
          <label htmlFor="pf-tool" style={LABEL_STYLE}>Womit baust du?</label>
          <select id="pf-tool" className="input" disabled={isLoading} value={pivots.buildTool}
            onChange={e => set('buildTool', e.target.value as PreflightPivots['buildTool'])} style={{ width: '100%', fontSize: 13 }}>
            <option value="cursor">Cursor</option><option value="claude-code">Claude Code</option>
            <option value="lovable">Lovable</option><option value="bolt">Bolt</option>
            <option value="other">Anderes</option><option value="unsure">Weiß nicht</option>
          </select>
        </div>
        <div>
          <label htmlFor="pf-bm" style={LABEL_STYLE}>Wer nutzt es?</label>
          <select id="pf-bm" className="input" disabled={isLoading} value={pivots.businessModel}
            onChange={e => set('businessModel', e.target.value as PreflightPivots['businessModel'])} style={{ width: '100%', fontSize: 13 }}>
            <option value="b2c">Endkunden (B2C)</option><option value="b2b">Unternehmen (B2B)</option>
            <option value="internal">Intern</option><option value="unsure">Weiß nicht</option>
          </select>
        </div>
        <div>
          <label htmlFor="pf-ar" style={LABEL_STYLE}>Wo sitzen die Nutzer?</label>
          <select id="pf-ar" className="input" disabled={isLoading} value={pivots.audienceRegion}
            onChange={e => set('audienceRegion', e.target.value as PreflightPivots['audienceRegion'])} style={{ width: '100%', fontSize: 13 }}>
            <option value="eu">EU</option><option value="non_eu">Außerhalb EU</option>
            <option value="global">Weltweit</option><option value="unsure">Weiß nicht</option>
          </select>
        </div>
        <div>
          <label htmlFor="pf-host" style={LABEL_STYLE}>Wo gehostet?</label>
          <select id="pf-host" className="input" disabled={isLoading} value={pivots.hosting}
            onChange={e => set('hosting', e.target.value as PreflightPivots['hosting'])} style={{ width: '100%', fontSize: 13 }}>
            <option value="eu">EU</option><option value="non_eu">Außerhalb EU</option>
            <option value="global">Weltweit</option><option value="unsure">Weiß nicht</option>
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="pf-stack" style={LABEL_STYLE}>Stack</label>
          <input id="pf-stack" className="input" disabled={isLoading} value={pivots.stack}
            onChange={e => set('stack', e.target.value)} placeholder="z.B. Next.js + Supabase + Stripe"
            style={{ width: '100%', fontSize: 13 }} />
        </div>
      </div>

      {/* Konzept */}
      <label htmlFor="pf-input" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
        Projekt-Beschreibung, README oder PRD
      </label>
      <textarea id="pf-input" className="input" value={input} disabled={isLoading}
        onChange={e => onInputChange(e.target.value)} placeholder={PLACEHOLDER} rows={9}
        style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.6 }} aria-required="true" />

      {/* Datei */}
      <button type="button" disabled={isLoading} onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); if (!isLoading) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f && !isLoading) void handleFile(f) }}
        aria-label="Datei hochladen (.md oder .txt)"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 10,
          padding: '10px 16px', border: `1px dashed ${dragOver ? 'var(--teal)' : 'var(--border)'}`, borderRadius: 6,
          background: dragOver ? 'var(--teal-light)' : 'transparent', color: 'var(--text-secondary)', fontSize: 13,
          cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1 }}>
        <UploadSimple size={16} weight="bold" aria-hidden="true" />
        Datei hochladen (.md / .txt) — oder hier ablegen
      </button>
      <input ref={inputRef} type="file" accept=".md,.txt,text/plain,text/markdown" style={{ display: 'none' }}
        tabIndex={-1} aria-hidden="true"
        onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = '' }} />
      {fileError && <p role="alert" style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--error)', lineHeight: 1.5 }}>{fileError}</p>}

      {/* Fehler */}
      {error && (
        <div role="alert" style={{ marginTop: 12, padding: '10px 14px', border: '1px solid var(--error)', borderRadius: 6,
          background: 'rgba(168,48,30,0.06)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Warning size={16} weight="fill" color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--error)', flex: 1 }}>{error}</p>
          <button type="button" className="btn-icon" onClick={onClearError} aria-label="Fehlermeldung schließen" style={{ flexShrink: 0 }}>
            <X size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* Submit */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary" disabled={isLoading || !input.trim()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
          {isLoading
            ? (<><span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} aria-hidden="true" />Analysiere …</>)
            : (<>Analysieren<ArrowRight size={14} weight="bold" aria-hidden="true" /></>)}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/preflight/_components/IntakePanel.tsx"
git commit -m "feat(preflight): extract IntakePanel with name field"
```

---

## Task 10: `ArtifactBrowser` (Repo-Browser)

**Files:**
- Create: `src/app/[locale]/(app)/preflight/_components/ArtifactBrowser.tsx`

Leitet die Dateiliste aus `Startpaket` ab, zeigt Vorschau (`CodeBlock`), Kopieren + Download je Datei + „Alle als Prompt kopieren".

- [ ] **Step 1: Komponente schreiben**

```tsx
'use client'

import { useMemo, useState } from 'react'
import { File, Copy, DownloadSimple, Check } from '@phosphor-icons/react'
import CodeBlock from '@/components/workspace/CodeBlock'
import { downloadTextFile } from '@/lib/download'
import { buildDecisionPrompt } from '@/lib/preflight/export-prompt'
import type { PreflightResult } from '@/lib/preflight/types'

interface FileEntry { filename: string; content: string; language: string }

function deriveFiles(result: PreflightResult): FileEntry[] {
  const sp = result.startpaket
  const files: FileEntry[] = [
    { filename: sp.conventions.filename, content: sp.conventions.content, language: 'markdown' },
    { filename: 'DECISIONS.md', content: sp.decisionLog, language: 'markdown' },
    { filename: '.env.example', content: sp.envExample, language: 'bash' },
  ]
  if (sp.migrationDraft?.sql) {
    files.push({ filename: 'migration.sql', content: sp.migrationDraft.sql, language: 'sql' })
  }
  return files
}

export function ArtifactBrowser({ result }: { result: PreflightResult }) {
  const files = useMemo(() => deriveFiles(result), [result])
  const [selected, setSelected] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)
  const active = files[selected]

  const copy = (key: string, text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(c => (c === key ? null : c)), 1800)
    })
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', minHeight: 240, flexWrap: 'wrap' }}>
        {/* Dateiliste */}
        <div style={{ width: 220, borderRight: '1px solid var(--border)', padding: 10, flexShrink: 0 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '2px 6px 8px' }}>Dateien</p>
          {files.map((f, i) => (
            <button key={f.filename} type="button" onClick={() => setSelected(i)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                padding: '6px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12,
                background: i === selected ? 'var(--teal-light)' : 'transparent',
                color: i === selected ? 'var(--teal)' : 'var(--text-secondary)' }}>
              <File size={14} weight="bold" aria-hidden="true" />{f.filename}
            </button>
          ))}
        </div>

        {/* Vorschau */}
        <div style={{ flex: 1, minWidth: 280, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{active.filename}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(active.filename, active.content)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                {copied === active.filename ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
                {copied === active.filename ? 'Kopiert' : 'Kopieren'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadTextFile(active.filename, active.content)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                <DownloadSimple size={13} weight="bold" />Download
              </button>
            </div>
          </div>
          <CodeBlock language={active.language} customStyle={{ maxHeight: 360, overflow: 'auto', margin: 0 }}>
            {active.content || '(leer)'}
          </CodeBlock>
        </div>
      </div>

      {/* Fußzeile */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy('__all__', buildDecisionPrompt(result))}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
          {copied === '__all__' ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
          {copied === '__all__' ? 'Kopiert' : 'Alle offenen Punkte als Prompt kopieren'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/preflight/_components/ArtifactBrowser.tsx"
git commit -m "feat(preflight): ArtifactBrowser repo-style file viewer"
```

---

## Task 11: `ProjectGrid` + `ProjectCard`

**Files:**
- Create: `src/app/[locale]/(app)/preflight/_components/ProjectGrid.tsx`

Karten mit `[···]`-Menü (Umbenennen inline, Löschen rot mit Bestätigung). Muster aus `ArtifactCard.tsx`.

- [ ] **Step 1: Komponente schreiben**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { DotsThree, PencilSimple, Trash, Warning } from '@phosphor-icons/react'
import { Link } from '@/i18n/navigation'
import type { PreflightProjectListItem } from '@/lib/preflight/types'

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'gerade eben'
  if (min < 60) return `vor ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `vor ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'gestern' : `vor ${d} Tagen`
}

function ProjectCard({ p, onRename, onDelete }: {
  p: PreflightProjectListItem
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(p.name)
  const [confirmDel, setConfirmDel] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  return (
    <div className="card" style={{ padding: 0, position: 'relative' }}>
      <div style={{ padding: '14px 16px' }}>
        {renaming ? (
          <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && renameVal.trim()) { void onRename(p.id, renameVal.trim()); setRenaming(false) }
              if (e.key === 'Escape') { setRenameVal(p.name); setRenaming(false) }
            }}
            onBlur={() => { setRenameVal(p.name); setRenaming(false) }}
            style={{ width: '100%', background: 'var(--bg-surface-solid)', border: '1px solid var(--accent)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, outline: 'none' }} />
        ) : (
          <Link href={`/preflight/${p.id}`} style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
          </Link>
        )}
        <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
          {[p.stack, `${p.redCount} ${p.redCount === 1 ? 'Lücke' : 'Lücken'}`, relTime(p.updatedAt)].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* [···] */}
      <div ref={ref} style={{ position: 'absolute', top: 10, right: 10 }}>
        <button type="button" className="btn-icon" aria-label="Aktionen" onClick={() => setMenuOpen(o => !o)}>
          <DotsThree size={16} weight="bold" />
        </button>
        {menuOpen && (
          <div className="dropdown animate-dropdown" style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 170, zIndex: 50 }}>
            <button className="dropdown-item" onClick={() => { setMenuOpen(false); setRenaming(true) }}>
              <PencilSimple size={14} weight="bold" /> Umbenennen
            </button>
            <div className="dropdown-divider" />
            {confirmDel ? (
              <button className="dropdown-item dropdown-item--danger" onClick={() => { setMenuOpen(false); setConfirmDel(false); void onDelete(p.id) }}>
                <Warning size={14} weight="fill" /> Wirklich löschen?
              </button>
            ) : (
              <button className="dropdown-item dropdown-item--danger" onClick={() => setConfirmDel(true)}>
                <Trash size={14} weight="bold" /> Löschen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function ProjectGrid({ projects, onRename, onDelete }: {
  projects: PreflightProjectListItem[]
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
      {projects.map(p => <ProjectCard key={p.id} p={p} onRename={onRename} onDelete={onDelete} />)}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/preflight/_components/ProjectGrid.tsx"
git commit -m "feat(preflight): ProjectGrid + ProjectCard with rename/delete"
```

---

## Task 12: `PreflightResult` → Detail-Komposition

**Files:**
- Modify: `src/app/[locale]/(app)/preflight/_components/PreflightResult.tsx`

`ActionPaths` (Path A/B) entfernen; `ArtifactBrowser` einsetzen. `ResultSummaryBox` + `ReifegradSignal` + `GapsSection` bleiben.

- [ ] **Step 1: Datei umschreiben (nur das Nötige)**

Ersetze in `PreflightResult.tsx`:
- den Import-Block (Zeilen 1–13) durch:

```tsx
'use client'

import { Warning, CheckCircle, Clock } from '@phosphor-icons/react'
import type { PreflightResult } from '@/lib/preflight/types'
import { GapsSection } from './GapCard'
import { ArtifactBrowser } from './ArtifactBrowser'
```

- die gesamte `ActionPaths`-Funktion (Zeilen 142–271) **löschen** (inklusive des `useState`/`useCallback`-Imports — bereits oben entfernt; `Export`/`HardDrives` Icons nicht mehr importieren).
- den `PreflightResult`-Export (ab Zeile 275) durch:

```tsx
export function PreflightResult({ result }: Props) {
  const { summary, gaps } = result
  return (
    <div style={{ marginTop: 8 }}>
      <ResultSummaryBox summary={summary} />
      <ReifegradSignal gaps={gaps} />

      <GapsSection gaps={gaps} />

      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', marginBottom: 12, letterSpacing: '0.02em' }}>
          <span style={{ width: 28, height: 1, background: 'rgba(45,122,80,0.3)', flexShrink: 0 }} />
          Dein Startpaket
        </span>
        <ArtifactBrowser result={result} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck (fängt verwaiste Importe/Variablen)**

Run: `pnpm typecheck`
Expected: PASS. Falls Fehler „`ReifegradSignal` nutzt `Clock`" o.ä. — sicherstellen, dass `Warning`, `CheckCircle`, `Clock` weiter importiert sind (oben) und nur `Export`/`HardDrives`/`useState`/`useCallback`/`buildDecisionPrompt` entfernt wurden.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/preflight/_components/PreflightResult.tsx"
git commit -m "feat(preflight): PreflightResult zeigt ArtifactBrowser statt Path B"
```

---

## Task 13: `/preflight` Seite — Liste + Leerzustand

**Files:**
- Create: `src/app/[locale]/(app)/preflight/_components/EmptyStateIntro.tsx`
- Modify (Rewrite): `src/app/[locale]/(app)/preflight/page.tsx`

- [ ] **Step 1: EmptyStateIntro schreiben (Erklär-Spalte des Splits)**

```tsx
'use client'

export function EmptyStateIntro() {
  const steps = [
    { n: '01', t: 'Konzept rein', d: 'README, PRD oder kurze Beschreibung' },
    { n: '02', t: 'Wir prüfen', d: 'Lücken, Konventionen, Compliance' },
    { n: '03', t: 'Startpaket raus', d: 'Repo-Dateien, copy-ready' },
  ]
  return (
    <div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', marginBottom: 16, letterSpacing: '0.02em' }}>
        <span style={{ width: 28, height: 1, background: 'rgba(45,122,80,0.3)' }} />PRE-FLIGHT
      </span>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, margin: '0 0 10px' }}>
        Dein Repo-Fundament — bevor die erste Zeile entsteht.
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 22px' }}>
        Wir analysieren dein Konzept, schließen die Architektur-Lücken und erzeugen dein Start-Repo mit allen Regeln,
        Konventionen &amp; Sicherheits-Leitplanken. Damit Claude, Cursor &amp; Co. ohne Drift bauen — wartbar, erklärbar, sicher.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
        {steps.map(s => (
          <div key={s.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-tertiary)', minWidth: 24 }}>{s.n}</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{s.t}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{s.d}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
        <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Das bekommst du</p>
        <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          CLAUDE.md / .cursorrules · DECISIONS.md · .env.example · migration.sql
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: page.tsx neu schreiben**

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Compass, Plus } from '@phosphor-icons/react'
import { useRouter } from '@/i18n/navigation'
import type { PreflightPivots, PreflightProjectListItem } from '@/lib/preflight/types'
import { IntakePanel, DEFAULT_PIVOTS } from './_components/IntakePanel'
import { EmptyStateIntro } from './_components/EmptyStateIntro'
import { ProjectGrid } from './_components/ProjectGrid'

export default function PreflightPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<PreflightProjectListItem[] | null>(null)
  const [showIntake, setShowIntake] = useState(false)

  const [name, setName] = useState('')
  const [pivots, setPivots] = useState<PreflightPivots>(DEFAULT_PIVOTS)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/preflight/projects')
      if (!res.ok) { setProjects([]); return }
      const json = await res.json() as { data: PreflightProjectListItem[] }
      setProjects(json.data)
    } catch { setProjects([]) }
  }, [])

  useEffect(() => { void loadProjects() }, [loadProjects])

  const submit = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/preflight/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed, pivots, name: name.trim() || undefined }),
      })
      const json = await res.json() as { error?: string; projectId?: string }
      if (!res.ok || !json.projectId) { setError(json.error ?? 'Ein Fehler ist aufgetreten.'); setLoading(false); return }
      router.push(`/preflight/${json.projectId}`)
    } catch { setError('Netzwerkfehler — bitte erneut versuchen.'); setLoading(false) }
  }, [input, pivots, name, loading, router])

  const renameProject = useCallback(async (id: string, newName: string) => {
    await fetch(`/api/preflight/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) })
    setProjects(prev => prev?.map(p => p.id === id ? { ...p, name: newName } : p) ?? null)
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    await fetch(`/api/preflight/projects/${id}`, { method: 'DELETE' })
    setProjects(prev => prev?.filter(p => p.id !== id) ?? null)
  }, [])

  const hasProjects = (projects?.length ?? 0) > 0
  const intakeNode = (
    <IntakePanel name={name} onNameChange={setName} pivots={pivots} onPivotsChange={setPivots}
      input={input} onInputChange={setInput} onSubmit={submit} isLoading={loading}
      error={error} onClearError={() => setError(null)} />
  )

  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Compass size={30} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Pre-Flight
          </h1>
          <p className="page-header-sub">Repo-Fundamente für sorgenfreies Bauen — kein Drift, wartbar, sicher.</p>
        </div>
        {hasProjects && (
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={() => setShowIntake(s => !s)}>
              <Plus size={16} weight="bold" aria-hidden="true" /> Neues Projekt
            </button>
          </div>
        )}
      </div>

      {/* Leerzustand: Split */}
      {projects !== null && !hasProjects && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, alignItems: 'start' }}>
          <EmptyStateIntro />
          <div className="card" style={{ padding: 20 }}>{intakeNode}</div>
        </div>
      )}

      {/* Liste */}
      {hasProjects && (
        <>
          {showIntake && (
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>{intakeNode}</div>
          )}
          <ProjectGrid projects={projects!} onRename={renameProject} onDelete={deleteProject} />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Typecheck + Lint**

Run: `pnpm typecheck && pnpm lint:design`
Expected: PASS (keine Hex-Farben, nur Phosphor-Icons).

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(app)/preflight/page.tsx" "src/app/[locale]/(app)/preflight/_components/EmptyStateIntro.tsx"
git commit -m "feat(preflight): list + split empty-state page"
```

---

## Task 14: `/preflight/[id]` Detail-Seite

**Files:**
- Create: `src/app/[locale]/(app)/preflight/[id]/page.tsx`

- [ ] **Step 1: Detail-Seite schreiben**

```tsx
'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { Compass, ArrowLeft, ArrowsClockwise, Trash, PencilSimple } from '@phosphor-icons/react'
import { Link, useRouter } from '@/i18n/navigation'
import type { PreflightProjectDetail } from '@/lib/preflight/types'
import { PreflightResult } from '../_components/PreflightResult'

export default function PreflightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [detail, setDetail] = useState<PreflightProjectDetail | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const [reanalyzing, setReanalyzing] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/preflight/projects/${id}`)
    if (!res.ok) { setNotFound(true); return }
    const json = await res.json() as PreflightProjectDetail
    setDetail(json); setRenameVal(json.name)
  }, [id])

  useEffect(() => { void load() }, [load])

  const rename = useCallback(async () => {
    if (!renameVal.trim() || !detail) return
    await fetch(`/api/preflight/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: renameVal.trim() }) })
    setDetail(d => d ? { ...d, name: renameVal.trim() } : d); setRenaming(false)
  }, [id, renameVal, detail])

  const remove = useCallback(async () => {
    await fetch(`/api/preflight/projects/${id}`, { method: 'DELETE' })
    router.push('/preflight')
  }, [id, router])

  const reanalyze = useCallback(async () => {
    if (!detail || reanalyzing) return
    setReanalyzing(true)
    try {
      const res = await fetch(`/api/preflight/projects/${id}/runs`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: detail.input, pivots: detail.pivots }),
      })
      if (res.ok) {
        const json = await res.json() as { result: PreflightProjectDetail['result'] }
        setDetail(d => d ? { ...d, result: json.result } : d)
      }
    } finally { setReanalyzing(false) }
  }, [id, detail, reanalyzing])

  if (notFound) {
    return (
      <div className="content-max">
        <p style={{ marginTop: 40, color: 'var(--text-secondary)' }}>
          Projekt nicht gefunden. <Link href="/preflight" style={{ color: 'var(--teal)' }}>Zurück zur Übersicht</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="content-max">
      <div style={{ marginBottom: 8 }}>
        <Link href="/preflight" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ArrowLeft size={14} weight="bold" aria-hidden="true" /> Übersicht
        </Link>
      </div>

      <div className="page-header">
        <div className="page-header-text">
          {renaming ? (
            <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void rename(); if (e.key === 'Escape') { setRenameVal(detail?.name ?? ''); setRenaming(false) } }}
              onBlur={() => void rename()}
              style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--accent)', borderRadius: 6, padding: '6px 10px', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', outline: 'none' }} />
          ) : (
            <h1 className="page-header-title">
              <Compass size={30} color="var(--text-primary)" weight="fill" aria-hidden="true" />
              {detail?.name ?? 'Lädt …'}
            </h1>
          )}
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost" onClick={() => void reanalyze()} disabled={reanalyzing || !detail?.input}>
            <ArrowsClockwise size={14} weight="bold" aria-hidden="true" /> {reanalyzing ? 'Analysiere …' : 'Neu analysieren'}
          </button>
          <button className="btn btn-ghost" onClick={() => setRenaming(true)}>
            <PencilSimple size={14} weight="bold" aria-hidden="true" /> Umbenennen
          </button>
          {confirmDel ? (
            <>
              <button className="btn btn-danger" onClick={() => void remove()}>Wirklich löschen</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(false)}>Abbrechen</button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={() => setConfirmDel(true)}>
              <Trash size={14} weight="bold" aria-hidden="true" /> Löschen
            </button>
          )}
        </div>
      </div>

      {detail?.result
        ? <PreflightResult result={detail.result} />
        : <p style={{ color: 'var(--text-tertiary)', marginTop: 24 }}>Lädt …</p>}
    </div>
  )
}
```

Hinweis: „Neu analysieren" ruft `POST /api/preflight/projects/[id]/runs` mit dem gespeicherten `input` + `pivots` (beide aus dem Detail-GET, Task 7) und ersetzt das angezeigte Ergebnis. Editieren-und-neu-analysieren (IntakePanel vorgefüllt) ist bewusst Fast-Follow.

- [ ] **Step 2: Typecheck + Lint**

Run: `pnpm typecheck && pnpm lint:design`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/preflight/[id]/page.tsx"
git commit -m "feat(preflight): project detail page with rename/delete"
```

---

## Task 15: Gesamt-Verifikation

- [ ] **Step 1: Alle Preflight-Tests**

Run: `pnpm test -- src/lib/preflight src/lib/validators src/lib/__tests__/download.unit.test.ts src/app/api/preflight`
Expected: alle grün.

- [ ] **Step 2: Typecheck + Lints**

Run: `pnpm typecheck && pnpm lint && pnpm lint:design`
Expected: keine Fehler.

- [ ] **Step 3: Dev-Server + visueller Sweep (CLAUDE.md-Pflicht)**

Run: `pnpm dev` (Wrapper lädt API-Keys), dann im Browser `http://localhost:3000/de/preflight`:
- Leerzustand: Split sichtbar (Erklärung links, Intake rechts).
- Analyse starten → Redirect auf Detail mit Lücken + ArtifactBrowser (Datei wählen, Kopieren, Download).
- Zurück zur Übersicht → Projektkarte sichtbar; Umbenennen + Löschen testen.
- Prüfen: nur `var(--…)`-Farben, Phosphor-Icons, page-header korrekt, kein Sidebar-Layout.

- [ ] **Step 4: Abschluss-Commit (falls Sweep-Korrekturen)**

```bash
git add -A
git commit -m "fix(preflight): visual sweep corrections"
```

---

## Self-Review (vom Plan-Autor durchgeführt)

- **Spec-Abdeckung:** Datenmodell (T1), Validatoren/Name-Default (T2,T5), 6 Routen (T5–T8), Recycling CodeBlock/downloadTextFile (T4,T10), Leerzustand-Split (T13), Liste/CRUD (T13,T11,T7), Detail+ArtifactBrowser (T12,T14). Fast-Follows (Playwright, .zip, Verlaufs-UI) bewusst nicht enthalten. ✔
- **Platzhalter:** keine — alle Schritte enthalten echten Code/Befehle. ✔
- **Typ-Konsistenz:** `PreflightProjectListItem`/`PreflightProjectDetail` (T3) konsistent in Routen + UI verwendet; `getPreflightProjectForUser` (T4) in T7/T8; `downloadTextFile` (T4) in T10; `DEFAULT_PIVOTS` aus IntakePanel (T9) in page (T13). ✔
- **Offen/bewusst:** „Neu analysieren" re-analysiert mit gespeichertem Input (T14); Editieren-und-neu-analysieren = Fast-Follow. Migrationsanwendung via MCP mit History-Angleichung (CLAUDE.md-Regel). ✔
