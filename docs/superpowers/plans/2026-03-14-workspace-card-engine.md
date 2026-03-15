# Workspace + Card Engine (Plan C) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend of the Workspace + Card Engine — DB migration, all API routes, stale propagation, briefing flow, chart theming, context builder, time dimension, and markdown/chat export.

**Architecture:** All queries use `supabaseAdmin` directly (no Drizzle for data access). New API routes under `/api/workspaces/[id]/...`. Business logic is isolated in `src/lib/` modules, never in `route.ts` files. Card history is append-only — no UPDATE or DELETE on `card_history`.

**Tech Stack:** Next.js App Router, TypeScript strict, Supabase (supabaseAdmin), @anthropic-ai/sdk@^0.78.0, zod v4, echarts + echarts-for-react (to install), Vitest for unit tests.

---

## Pre-flight: Understand the codebase

Before starting, read these files to understand existing patterns:
- `src/app/api/projects/route.ts` — canonical route pattern (auth, validation, supabaseAdmin)
- `src/lib/api/projects.ts` — `getAuthUser()` helper pattern
- `src/lib/supabase-admin.ts` — supabaseAdmin usage
- `src/lib/card-history.ts` — existing card snapshot code (will be updated)
- `src/lib/context-builder.ts` — existing context builder (will be replaced)
- `supabase/migrations/031_workspaces_schema.sql` — current DB state for workspace tables

Key auth pattern (used in every route):
```typescript
const me = await getAuthUser()
if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
```

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/20260314000035_workspace_plan_c.sql` | CREATE | Schema migration: alter existing + new tables |
| `src/types/workspace-plan-c.types.ts` | CREATE | All Plan C TypeScript interfaces |
| `src/lib/validators/workspace-plan-c.ts` | CREATE | Zod schemas for all Plan C inputs |
| `src/lib/api/workspaces.ts` | CREATE | `getAuthUser` + workspace access helpers |
| `src/lib/stale-propagation.ts` | CREATE | Stale marking logic (direct deps only) |
| `src/lib/chart-theme.ts` | CREATE | ECharts org-color theme builder |
| `src/lib/workspace-context.ts` | CREATE | Context builder for Silo-Chat + Card-Chat |
| `src/lib/workspace-time.ts` | CREATE | Time-travel: getWorkspaceAt, getCardHistoryAt |
| `src/lib/card-history.ts` | MODIFY | Align writeCardSnapshot to Plan C schema |
| `src/lib/context-builder.ts` | MODIFY | Point imports to workspace-context.ts |
| `src/app/api/workspaces/route.ts` | CREATE | GET + POST /api/workspaces |
| `src/app/api/workspaces/[id]/route.ts` | CREATE | GET + PATCH + DELETE |
| `src/app/api/workspaces/[id]/cards/route.ts` | CREATE | GET + POST cards |
| `src/app/api/workspaces/[id]/cards/[cid]/route.ts` | CREATE | PATCH + DELETE + stale propagation |
| `src/app/api/workspaces/[id]/connections/route.ts` | CREATE | POST connection |
| `src/app/api/workspaces/[id]/connections/[connid]/route.ts` | CREATE | DELETE connection |
| `src/app/api/workspaces/[id]/assets/route.ts` | CREATE | GET + POST assets |
| `src/app/api/workspaces/[id]/assets/[aid]/route.ts` | CREATE | DELETE asset |
| `src/app/api/workspaces/[id]/chat/route.ts` | CREATE | GET + POST workspace/card chat |
| `src/app/api/workspaces/[id]/briefing/route.ts` | CREATE | POST briefing flow (Toro) |
| `src/app/api/workspaces/[id]/export/route.ts` | CREATE | POST export (chat + markdown) |
| `src/app/api/workspaces/[id]/exports/route.ts` | CREATE | GET export history |
| `src/lib/workspace-context.unit.test.ts` | CREATE | Tests: buildWorkspaceContext |
| `src/lib/stale-propagation.unit.test.ts` | CREATE | Tests: markDirectDepsStale |
| `src/lib/chart-theme.unit.test.ts` | CREATE | Tests: buildOrgChartTheme |
| `src/lib/workspace-time.unit.test.ts` | CREATE | Tests: getWorkspaceAt |
| `CLAUDE.md` | MODIFY | Add Workspace + Card Engine section |

---

## Chunk 1: Migration + Types + Validators

### Task 1: Write migration 20260314000035_workspace_plan_c.sql

**Files:**
- Create: `supabase/migrations/20260314000035_workspace_plan_c.sql`

> Context: The 031 migration created `workspaces` and `cards` with a different schema. This migration extends them idempotently and creates new tables. The `card_history` table schema changes from field-diff style to full-snapshot style. Do NOT drop `card_history` — add new columns alongside old and migrate.

- [ ] **Step 1: Write the migration**

```sql
-- 20260314000035_workspace_plan_c.sql
-- Plan C: Workspace + Card Engine
-- Extends existing workspace tables and adds new ones.
-- All DDL is idempotent (IF NOT EXISTS / IF COLUMN NOT EXISTS).

BEGIN;

-- ── workspaces: add missing Plan C columns ───────────────────────────────────
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','exported','locked')),
  ADD COLUMN IF NOT EXISTS briefing_chat_id UUID,
  ADD COLUMN IF NOT EXISTS domain TEXT;

CREATE INDEX IF NOT EXISTS workspaces_org_id_idx ON public.workspaces(organization_id);
CREATE INDEX IF NOT EXISTS workspaces_status_idx ON public.workspaces(status);

-- ── cards: align to Plan C schema ────────────────────────────────────────────
-- Add role (replaces old 'type' TEXT column semantically; keep type for compat)
ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('input','process','output')),
  ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text'
    CHECK (content_type IN ('text','table','chart','list','code','map','mindmap','kanban','timeline','image','embed')),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS chart_config JSONB,
  ADD COLUMN IF NOT EXISTS stale_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stale_reason TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Rename content TEXT → content_legacy, add content JSONB
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cards' AND column_name = 'content'
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public.cards RENAME COLUMN content TO content_legacy;
  END IF;
END;
$$;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS content JSONB;

-- Replace old enum status with Plan C status (avoid enum rename complexity)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cards' AND column_name = 'status'
    AND udt_name = 'card_status'
  ) THEN
    ALTER TABLE public.cards DROP COLUMN status;
  END IF;
END;
$$;
ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','ready','stale','processing','error'));

CREATE INDEX IF NOT EXISTS cards_status_planc_idx ON public.cards(status);
CREATE INDEX IF NOT EXISTS cards_sort_order_idx ON public.cards(sort_order);

-- ── card_history: add Plan C snapshot columns ─────────────────────────────────
-- Keep old columns (field, old_value, new_value) — add new columns for Plan C.
-- APPEND ONLY — never UPDATE or DELETE rows.
ALTER TABLE public.card_history
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS snapshot JSONB,
  ADD COLUMN IF NOT EXISTS change_reason TEXT;

-- changed_by already exists in 031 as UUID
CREATE INDEX IF NOT EXISTS card_history_workspace_id_idx ON public.card_history(workspace_id);
CREATE INDEX IF NOT EXISTS card_history_created_at_idx ON public.card_history(created_at);

-- ── connections: rename columns to Plan C naming ──────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'connections' AND column_name = 'from_card_id'
  ) THEN
    ALTER TABLE public.connections RENAME COLUMN from_card_id TO source_card_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'connections' AND column_name = 'to_card_id'
  ) THEN
    ALTER TABLE public.connections RENAME COLUMN to_card_id TO target_card_id;
  END IF;
END;
$$;

-- ── workspace_assets (NEW) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  card_id       UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  type          TEXT NOT NULL CHECK (type IN ('image','chart','link','upload','video')),
  name          TEXT NOT NULL,
  url           TEXT NOT NULL,
  size          INTEGER,
  meta          JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS workspace_assets_workspace_id_idx ON public.workspace_assets(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_assets_card_id_idx ON public.workspace_assets(card_id);

-- ── workspace_exports (NEW) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_exports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  format        TEXT NOT NULL CHECK (format IN ('chat','word','pdf','markdown','presentation')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','error')),
  file_url      TEXT,
  is_stale      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS workspace_exports_workspace_id_idx ON public.workspace_exports(workspace_id);

-- ── workspace_messages (NEW) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  card_id          UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  role             TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content          TEXT NOT NULL,
  context_snapshot JSONB,
  token_usage      JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS workspace_messages_workspace_id_idx ON public.workspace_messages(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_messages_card_id_idx ON public.workspace_messages(card_id);

-- ── RLS for new tables ────────────────────────────────────────────────────────
ALTER TABLE public.workspace_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_messages ENABLE ROW LEVEL SECURITY;

-- Helper: is user a workspace participant?
-- (uses existing workspace_participants table from 031)

DROP POLICY IF EXISTS "workspace_assets_select" ON public.workspace_assets;
CREATE POLICY "workspace_assets_select" ON public.workspace_assets
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_assets_insert" ON public.workspace_assets;
CREATE POLICY "workspace_assets_insert" ON public.workspace_assets
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid() AND role IN ('admin','member')
    )
  );

DROP POLICY IF EXISTS "workspace_assets_delete" ON public.workspace_assets;
CREATE POLICY "workspace_assets_delete" ON public.workspace_assets
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "workspace_exports_select" ON public.workspace_exports;
CREATE POLICY "workspace_exports_select" ON public.workspace_exports
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_exports_insert" ON public.workspace_exports;
CREATE POLICY "workspace_exports_insert" ON public.workspace_exports
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid() AND role IN ('admin','member')
    )
  );

DROP POLICY IF EXISTS "workspace_messages_select" ON public.workspace_messages;
CREATE POLICY "workspace_messages_select" ON public.workspace_messages
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_messages_insert" ON public.workspace_messages;
CREATE POLICY "workspace_messages_insert" ON public.workspace_messages
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid() AND role IN ('admin','member')
    )
  );

COMMIT;
```

- [ ] **Step 2: Apply migration in Supabase Dashboard (SQL Editor) or CLI**

```bash
# Via CLI (if configured):
supabase db push
# Or paste the migration SQL into the Supabase Dashboard → SQL Editor
```

Expected: No errors. Tables `workspace_assets`, `workspace_exports`, `workspace_messages` exist. `workspaces` has `status`, `organization_id` columns.

- [ ] **Step 3: Verify in Supabase**

Run in SQL Editor:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'workspaces'
ORDER BY ordinal_position;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cards'
ORDER BY ordinal_position;

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('workspace_assets','workspace_exports','workspace_messages');
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260314000035_workspace_plan_c.sql
git commit -m "feat(db): Plan C migration — extend workspace/card schema + new tables"
```

---

### Task 2: TypeScript Types (Plan C)

**Files:**
- Create: `src/types/workspace-plan-c.types.ts`

- [ ] **Step 1: Write types**

```typescript
// src/types/workspace-plan-c.types.ts
// Plan C — Workspace + Card Engine TypeScript interfaces
// All DB rows are mapped to camelCase here.

export type WorkspaceStatus = 'draft' | 'active' | 'exported' | 'locked'
export type ContentType =
  | 'text' | 'table' | 'chart' | 'list' | 'code'
  | 'map' | 'mindmap' | 'kanban' | 'timeline' | 'image' | 'embed'
export type CardRole = 'input' | 'process' | 'output'
export type CardStatus = 'draft' | 'ready' | 'stale' | 'processing' | 'error'
export type ExportFormat = 'chat' | 'word' | 'pdf' | 'markdown' | 'presentation'
export type ExportStatus = 'pending' | 'processing' | 'ready' | 'error'
export type AssetType = 'image' | 'chart' | 'link' | 'upload' | 'video'

export interface WorkspacePlanC {
  id: string
  organizationId: string | null
  departmentId: string | null
  createdBy: string | null
  title: string
  goal: string | null
  domain: string | null
  meta: Record<string, unknown>
  status: WorkspaceStatus
  briefingChatId: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CardPlanC {
  id: string
  workspaceId: string
  title: string
  description: string | null
  contentType: ContentType
  role: CardRole
  content: Record<string, unknown> | null
  chartConfig: Record<string, unknown> | null
  status: CardStatus
  staleSince: string | null
  staleReason: string | null
  sortOrder: number
  meta: Record<string, unknown>
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CardHistoryEntry {
  id: string
  cardId: string
  workspaceId: string | null
  snapshot: Record<string, unknown>
  changedBy: string | null
  changeReason: string | null
  createdAt: string
}

export interface ConnectionPlanC {
  id: string
  workspaceId: string
  sourceCardId: string
  targetCardId: string
  label: string | null
  createdAt: string
}

export interface WorkspaceAsset {
  id: string
  workspaceId: string
  cardId: string | null
  type: AssetType
  name: string
  url: string
  size: number | null
  meta: Record<string, unknown>
  createdAt: string
}

export interface WorkspaceExport {
  id: string
  workspaceId: string
  format: ExportFormat
  status: ExportStatus
  fileUrl: string | null
  isStale: boolean
  createdAt: string
}

export interface WorkspaceMessage {
  id: string
  workspaceId: string
  cardId: string | null
  role: 'user' | 'assistant'
  content: string
  contextSnapshot: Record<string, unknown> | null
  tokenUsage: Record<string, unknown> | null
  createdAt: string
}

// Briefing card proposal — returned by Toro before user confirms
export interface BriefingCardProposal {
  title: string
  role: CardRole
  contentType: ContentType
  description: string
}

export interface BriefingProposal {
  goal: string
  cards: BriefingCardProposal[]
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/workspace-plan-c.types.ts
git commit -m "feat(types): Plan C workspace + card TypeScript interfaces"
```

---

### Task 3: Validators (Plan C)

**Files:**
- Create: `src/lib/validators/workspace-plan-c.ts`

- [ ] **Step 1: Write validators**

```typescript
// src/lib/validators/workspace-plan-c.ts
import { z } from 'zod'

export const createWorkspacePlanCSchema = z.object({
  title: z.string().min(1).max(255),
  goal: z.string().optional(),
  domain: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type CreateWorkspacePlanCInput = z.infer<typeof createWorkspacePlanCSchema>

export const updateWorkspacePlanCSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  goal: z.string().optional(),
  domain: z.string().optional(),
  status: z.enum(['draft','active','exported','locked']).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type UpdateWorkspacePlanCInput = z.infer<typeof updateWorkspacePlanCSchema>

export const createCardSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  contentType: z.enum(['text','table','chart','list','code','map','mindmap','kanban','timeline','image','embed']).default('text'),
  role: z.enum(['input','process','output']),
  content: z.record(z.string(), z.unknown()).optional(),
  chartConfig: z.record(z.string(), z.unknown()).optional(),
  sortOrder: z.number().int().min(0).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type CreateCardInput = z.infer<typeof createCardSchema>

export const updateCardSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  contentType: z.enum(['text','table','chart','list','code','map','mindmap','kanban','timeline','image','embed']).optional(),
  role: z.enum(['input','process','output']).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  chartConfig: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['draft','ready','stale','processing','error']).optional(),
  sortOrder: z.number().int().min(0).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  changeReason: z.string().optional(),
})
export type UpdateCardInput = z.infer<typeof updateCardSchema>

export const createConnectionSchema = z.object({
  sourceCardId: z.string().uuid(),
  targetCardId: z.string().uuid(),
  label: z.string().optional(),
})
export type CreateConnectionInput = z.infer<typeof createConnectionSchema>

export const createAssetSchema = z.object({
  type: z.enum(['image','chart','link','upload','video']),
  name: z.string().min(1).max(255),
  url: z.string().url(),
  cardId: z.string().uuid().optional(),
  size: z.number().int().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})
export type CreateAssetInput = z.infer<typeof createAssetSchema>

export const sendChatMessageSchema = z.object({
  content: z.string().min(1),
  cardId: z.string().uuid().optional(), // null = Silo-Chat
})
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>

export const startBriefingSchema = z.object({
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(['user','assistant']),
    content: z.string(),
  })).optional().default([]),
})
export type StartBriefingInput = z.infer<typeof startBriefingSchema>

export const exportWorkspaceSchema = z.object({
  format: z.enum(['chat','word','pdf','markdown','presentation']),
})
export type ExportWorkspaceInput = z.infer<typeof exportWorkspaceSchema>
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/validators/workspace-plan-c.ts
git commit -m "feat(validators): Plan C workspace + card zod schemas"
```

---

## Chunk 2: Core Lib Modules

### Task 4: Auth Helper for Workspace Routes

**Files:**
- Create: `src/lib/api/workspaces.ts`

> This is the same pattern as `src/lib/api/projects.ts`. Read that file before writing this.

- [ ] **Step 1: Write workspace auth helper**

```typescript
// src/lib/api/workspaces.ts
// Auth + access helpers for workspace API routes.
// Uses supabaseAdmin for server-side checks.

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type AuthUser = { id: string; organization_id: string; role: string }

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) return null
  return { id: user.id, organization_id: profile.organization_id, role: profile.role }
}

// Returns true if user is a participant in the workspace (any role).
// Superadmins bypass all workspace checks.
export async function canReadWorkspace(
  workspaceId: string,
  me: AuthUser
): Promise<boolean> {
  if (me.role === 'superadmin') return true
  const { data } = await supabaseAdmin
    .from('workspace_participants')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', me.id)
    .maybeSingle()
  return !!data
}

// Returns true if user is admin or member (can write).
export async function canWriteWorkspace(
  workspaceId: string,
  me: AuthUser
): Promise<boolean> {
  if (me.role === 'superadmin') return true
  const { data } = await supabaseAdmin
    .from('workspace_participants')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', me.id)
    .maybeSingle()
  return !!data && ['admin', 'member'].includes(data.role)
}

// Returns the workspace if it exists, is not deleted, and user can access it.
// Returns null if not found or no access.
export async function requireWorkspaceAccess(
  workspaceId: string,
  me: AuthUser
): Promise<Record<string, unknown> | null> {
  if (me.role !== 'superadmin') {
    const allowed = await canReadWorkspace(workspaceId, me)
    if (!allowed) return null
  }
  const { data } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .is('deleted_at', null)
    .maybeSingle()
  return data
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/workspaces.ts
git commit -m "feat(lib): workspace auth helpers (getAuthUser, canRead/Write)"
```

---

### Task 5: Update card-history.ts for Plan C schema

**Files:**
- Modify: `src/lib/card-history.ts`

> Read the current file first. The existing `writeCardSnapshot` uses `triggered_by` but Plan C spec uses `changed_by`. The DB migration added `workspace_id`, `snapshot`, `change_reason` columns.

- [ ] **Step 1: Update writeCardSnapshot to use Plan C column names**

In `src/lib/card-history.ts`, change the insert call from `triggered_by` to `changed_by`:

```typescript
// Replace the insert object in writeCardSnapshot:
.insert({
  card_id: card.id,
  workspace_id: card.workspaceId,          // already present ✓
  snapshot: card as unknown as Record<string, unknown>,  // already present ✓
  changed_by: triggeredBy ?? null,          // was: triggered_by
  change_reason: changeReason,             // already present ✓
  // Remove: triggered_by_operator (not in Plan C schema)
})
```

Also update `mapCardHistory` to match Plan C types from `workspace-plan-c.types.ts`:

```typescript
import type { CardHistoryEntry } from '@/types/workspace-plan-c.types'

export function mapCardHistory(row: Record<string, unknown>): CardHistoryEntry {
  return {
    id: row.id as string,
    cardId: row.card_id as string,
    workspaceId: (row.workspace_id as string) ?? null,
    snapshot: (row.snapshot as Record<string, unknown>) ?? {},
    changedBy: (row.changed_by as string) ?? null,
    changeReason: (row.change_reason as string) ?? null,
    createdAt: row.created_at as string,
  }
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/card-history.ts
git commit -m "fix(card-history): align to Plan C schema (changed_by, CardHistoryEntry type)"
```

---

### Task 6: Stale Propagation

**Files:**
- Create: `src/lib/stale-propagation.ts`
- Create: `src/lib/stale-propagation.unit.test.ts`

> Rule: when a card changes, find all cards that are DIRECT targets in `connections` where `source_card_id = changedCardId`. Mark those as `status='stale'`. NOT recursive — only direct deps. writeCardSnapshot is called separately in the route handler before this.

- [ ] **Step 1: Write failing test first**

```typescript
// src/lib/stale-propagation.unit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { markDirectDepsStale } from './stale-propagation'

// Mock supabaseAdmin
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

import { supabaseAdmin } from '@/lib/supabase-admin'

describe('markDirectDepsStale', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('marks direct dependent cards as stale', async () => {
    const mockConnections = [
      { target_card_id: 'card-b' },
      { target_card_id: 'card-c' },
    ]
    const selectConnMock = { data: mockConnections, error: null }
    const updateMock = { error: null }

    const fromMock = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        data: mockConnections,
        error: null,
        // chain: .select().eq('workspace_id',...).eq('source_card_id',...)
      })

    // More robust: mock the full chain
    let callCount = 0
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'connections' && callCount === 0) {
        callCount++
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve(selectConnMock),
            }),
          }),
        }
      }
      if (table === 'cards') {
        return {
          update: () => ({
            in: () => Promise.resolve(updateMock),
          }),
        }
      }
      return { select: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }) }
    })

    await markDirectDepsStale('workspace-1', 'card-a', 'Karte "Marktanalyse" wurde geändert')

    expect(supabaseAdmin.from).toHaveBeenCalledWith('connections')
    expect(supabaseAdmin.from).toHaveBeenCalledWith('cards')
  })

  it('does nothing if no dependent cards exist', async () => {
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }))

    await expect(
      markDirectDepsStale('workspace-1', 'card-a', 'reason')
    ).resolves.not.toThrow()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm test stale-propagation
```
Expected: FAIL (module not found)

- [ ] **Step 3: Implement stale-propagation.ts**

```typescript
// src/lib/stale-propagation.ts
// Marks DIRECT dependent cards as stale when a source card changes.
// NOT recursive — only one hop.
// Called from PATCH /api/workspaces/[id]/cards/[cid] after writeCardSnapshot.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('stale-propagation')

/**
 * Find all cards that have a connection FROM changedCardId TO them,
 * and mark each as status='stale'.
 */
export async function markDirectDepsStale(
  workspaceId: string,
  changedCardId: string,
  staleReason: string
): Promise<void> {
  // 1. Find direct dependents (target cards)
  const { data: connections, error: connErr } = await supabaseAdmin
    .from('connections')
    .select('target_card_id')
    .eq('workspace_id', workspaceId)
    .eq('source_card_id', changedCardId)

  if (connErr) {
    log.error('[stale-propagation] connection lookup failed', { error: connErr.message, changedCardId })
    return
  }

  const depIds = (connections ?? []).map((c: Record<string, unknown>) => c.target_card_id as string)
  if (depIds.length === 0) return

  // 2. Mark all dependents as stale
  const { error: updateErr } = await supabaseAdmin
    .from('cards')
    .update({
      status: 'stale',
      stale_since: new Date().toISOString(),
      stale_reason: staleReason,
      updated_at: new Date().toISOString(),
    })
    .in('id', depIds)

  if (updateErr) {
    log.error('[stale-propagation] update failed', { error: updateErr.message, depIds })
    return
  }

  log.info('[stale-propagation] marked deps stale', { changedCardId, count: depIds.length })
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pnpm test stale-propagation
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/stale-propagation.ts src/lib/stale-propagation.unit.test.ts
git commit -m "feat(lib): stale propagation — mark direct card deps as stale"
```

---

### Task 7: Chart Theme

**Files:**
- Create: `src/lib/chart-theme.ts`
- Create: `src/lib/chart-theme.unit.test.ts`

> Install echarts first. The theme builder reads `OrgSettings.primary_color` and generates an ECharts theme config. It does NOT call Supabase — the caller fetches org settings and passes them in.

- [ ] **Step 1: Install echarts**

```bash
cd "C:/Users/timmr/tropen OS" && pnpm add echarts echarts-for-react
```
Expected: echarts and echarts-for-react added to package.json.

- [ ] **Step 2: Write failing test**

```typescript
// src/lib/chart-theme.unit.test.ts
import { describe, it, expect } from 'vitest'
import { buildOrgChartTheme } from './chart-theme'

const mockOrgSettings = {
  primaryColor: '#2563EB',
  secondaryColor: null,
}

describe('buildOrgChartTheme', () => {
  it('uses primary color as first color in palette', () => {
    const theme = buildOrgChartTheme(mockOrgSettings)
    expect(theme.color[0]).toBe('#2563EB')
  })

  it('returns transparent background', () => {
    const theme = buildOrgChartTheme(mockOrgSettings)
    expect(theme.backgroundColor).toBe('transparent')
  })

  it('generates a full palette of at least 5 colors', () => {
    const theme = buildOrgChartTheme(mockOrgSettings)
    expect(theme.color.length).toBeGreaterThanOrEqual(5)
  })

  it('falls back to default blue if no primaryColor', () => {
    const theme = buildOrgChartTheme({ primaryColor: null, secondaryColor: null })
    expect(theme.color[0]).toBe('#2563EB')
  })
})
```

- [ ] **Step 3: Run test — verify it fails**

```bash
pnpm test chart-theme
```

- [ ] **Step 4: Implement chart-theme.ts**

```typescript
// src/lib/chart-theme.ts
// Builds an ECharts theme config from org primary color.
// Called with org settings fetched by the caller.
// Register in component: echarts.registerTheme('org-theme', buildOrgChartTheme(orgSettings))

export interface OrgSettings {
  primaryColor: string | null
  secondaryColor?: string | null
}

export interface EChartsTheme {
  color: string[]
  backgroundColor: string
  textStyle: { color: string }
  line: { itemStyle: { borderWidth: number } }
  bar: { itemStyle: { barBorderWidth: number; barBorderColor: string } }
  pie: { itemStyle: { borderWidth: number; borderColor: string } }
}

const DEFAULT_PRIMARY = '#2563EB'

// Derive complementary palette from primary color (hue shifts)
function deriveColorPalette(primary: string): string[] {
  // Simple static offsets — can be made dynamic with a color library later
  return [
    primary,
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
    '#F97316', // orange-500
  ]
}

export function buildOrgChartTheme(orgSettings: OrgSettings): EChartsTheme {
  const primary = orgSettings.primaryColor ?? DEFAULT_PRIMARY
  const palette = deriveColorPalette(primary)

  return {
    color: palette,
    backgroundColor: 'transparent',
    textStyle: { color: '#374151' },
    line: { itemStyle: { borderWidth: 2 } },
    bar: { itemStyle: { barBorderWidth: 0, barBorderColor: 'transparent' } },
    pie: { itemStyle: { borderWidth: 2, borderColor: '#ffffff' } },
  }
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
pnpm test chart-theme
```

- [ ] **Step 6: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/chart-theme.ts src/lib/chart-theme.unit.test.ts
git commit -m "feat(lib): ECharts org theme builder"
```

---

### Task 8: Context Builder

**Files:**
- Create: `src/lib/workspace-context.ts`
- Create: `src/lib/workspace-context.unit.test.ts`

> Replaces/extends old `context-builder.ts`. Three functions: `buildWorkspaceContext` (silo system prompt), `buildCardContext` (card chat system prompt), `buildContextSnapshot` (compressed snapshot for message storage).

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/workspace-context.unit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildWorkspaceContext, buildContextSnapshot } from './workspace-context'

const mockWorkspace = {
  id: 'ws-1', title: 'Q2 Kampagne', goal: 'Kampagnenplan erstellen', domain: 'marketing', status: 'draft',
}
const mockCards = [
  { id: 'card-1', title: 'Zielgruppe', role: 'input', status: 'ready', content: { text: 'B2B SaaS' }, content_type: 'text' },
  { id: 'card-2', title: 'Analyse', role: 'process', status: 'stale', content: null, content_type: 'text' },
]

describe('buildWorkspaceContext', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('includes workspace goal in output', async () => {
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>)
      .mockImplementation((table: string) => {
        if (table === 'workspaces') return { select: () => ({ eq: () => ({ is: () => ({ maybeSingle: () => Promise.resolve({ data: mockWorkspace }) }) }) }) }
        if (table === 'cards') return { select: () => ({ eq: () => ({ is: () => ({ order: () => Promise.resolve({ data: mockCards }) }) }) }) }
        if (table === 'connections') return { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) }
        return { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) }
      })

    const ctx = await buildWorkspaceContext('ws-1')
    expect(ctx).toContain('Kampagnenplan erstellen')
  })

  it('marks stale cards in context', async () => {
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>)
      .mockImplementation((table: string) => {
        if (table === 'workspaces') return { select: () => ({ eq: () => ({ is: () => ({ maybeSingle: () => Promise.resolve({ data: mockWorkspace }) }) }) }) }
        if (table === 'cards') return { select: () => ({ eq: () => ({ is: () => ({ order: () => Promise.resolve({ data: mockCards }) }) }) }) }
        if (table === 'connections') return { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) }
        return { select: () => ({ eq: () => Promise.resolve({ data: [] }) }) }
      })

    const ctx = await buildWorkspaceContext('ws-1')
    expect(ctx).toContain('stale')
  })
})

describe('buildContextSnapshot', () => {
  it('returns a serializable snapshot object', () => {
    const snap = buildContextSnapshot('ws-1', mockWorkspace as never, mockCards as never)
    expect(snap.workspaceId).toBe('ws-1')
    expect(snap.cardCount).toBe(2)
    expect(typeof snap.capturedAt).toBe('string')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm test workspace-context
```

- [ ] **Step 3: Implement workspace-context.ts**

```typescript
// src/lib/workspace-context.ts
// Builds system prompts and context snapshots for Workspace Silo-Chat and Card-Chat.
// All queries use supabaseAdmin.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import type { CardPlanC, WorkspacePlanC } from '@/types/workspace-plan-c.types'

const log = createLogger('workspace-context')

// ---------------------------------------------------------------------------
// buildWorkspaceContext — system prompt for Silo-Chat
// ---------------------------------------------------------------------------
export async function buildWorkspaceContext(workspaceId: string): Promise<string> {
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('id, title, goal, domain, status')
    .eq('id', workspaceId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!workspace) throw new Error(`Workspace ${workspaceId} nicht gefunden`)

  const { data: cardRows } = await supabaseAdmin
    .from('cards')
    .select('id, title, role, status, content_type, content, stale_reason')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  const { data: connRows } = await supabaseAdmin
    .from('connections')
    .select('source_card_id, target_card_id, label')
    .eq('workspace_id', workspaceId)

  const cards = (cardRows ?? []) as CardPlanC[]
  const connections = connRows ?? []

  const cardSummaries = cards.map((c) => {
    const staleNote = c.status === 'stale' ? ` [VERALTET: ${c.staleReason ?? 'Abhängigkeit geändert'}]` : ''
    const contentPreview = c.content
      ? JSON.stringify(c.content).slice(0, 200)
      : '(leer)'
    return `- [${c.role.toUpperCase()}] "${c.title}" (${c.contentType})${staleNote}: ${contentPreview}`
  }).join('\n')

  const connectionSummaries = connections.map((conn: Record<string, unknown>) => {
    const src = cards.find((c) => c.id === conn.source_card_id)?.title ?? conn.source_card_id
    const tgt = cards.find((c) => c.id === conn.target_card_id)?.title ?? conn.target_card_id
    const lbl = conn.label ? ` (${conn.label})` : ''
    return `  ${src} → ${tgt}${lbl}`
  }).join('\n')

  return `Du bist Toro, ein KI-Assistent von Tropen OS. Du hilfst im Workspace "${workspace.title}".

Ziel: ${workspace.goal ?? '(kein Ziel definiert)'}
Bereich: ${workspace.domain ?? '(kein Bereich)'}
Status: ${workspace.status}

Aktuelle Karten (${cards.length}):
${cardSummaries || '(keine Karten)'}

Verbindungen:
${connectionSummaries || '(keine Verbindungen)'}

Antworte präzise und auf Deutsch. Beziehe dich auf konkrete Karten wenn du Empfehlungen gibst.`
}

// ---------------------------------------------------------------------------
// buildCardContext — system prompt for Card-Chat
// ---------------------------------------------------------------------------
export async function buildCardContext(cardId: string): Promise<string> {
  const { data: card } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!card) throw new Error(`Karte ${cardId} nicht gefunden`)

  // Load last 5 history snapshots
  const { data: historyRows } = await supabaseAdmin
    .from('card_history')
    .select('snapshot, change_reason, created_at')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false })
    .limit(5)

  // Load upstream cards (cards that connect INTO this card)
  const { data: incomingConns } = await supabaseAdmin
    .from('connections')
    .select('source_card_id')
    .eq('target_card_id', cardId)

  const upstreamIds = (incomingConns ?? []).map((c: Record<string, unknown>) => c.source_card_id as string)
  let upstreamCards: CardPlanC[] = []

  if (upstreamIds.length > 0) {
    const { data: upstreamRows } = await supabaseAdmin
      .from('cards')
      .select('id, title, role, content_type, content, status')
      .in('id', upstreamIds)
    upstreamCards = (upstreamRows ?? []) as CardPlanC[]
  }

  const upstreamSummary = upstreamCards.length > 0
    ? upstreamCards.map((c) => `- "${c.title}" (${c.role}): ${JSON.stringify(c.content ?? {}).slice(0, 300)}`).join('\n')
    : '(keine upstream Karten)'

  const historySummary = (historyRows ?? []).map((h: Record<string, unknown>) => {
    const snap = h.snapshot as Record<string, unknown>
    return `- ${h.created_at as string}: ${h.change_reason as string ?? 'geändert'} → "${snap.title ?? '?'}"`
  }).join('\n') || '(keine History)'

  const currentContent = card.content ? JSON.stringify(card.content).slice(0, 500) : '(leer)'

  return `Du bist Toro. Du arbeitest an der Karte "${card.title as string}" (${card.role as string} / ${card.content_type as string}).

Aktueller Inhalt:
${currentContent}

Upstream-Karten (Eingaben für diese Karte):
${upstreamSummary}

Letzte 5 Änderungen:
${historySummary}

Hilf dem User dabei, den Inhalt dieser Karte zu verbessern oder zu generieren. Antworte auf Deutsch.`
}

// ---------------------------------------------------------------------------
// buildContextSnapshot — compressed snapshot for workspace_messages storage
// ---------------------------------------------------------------------------
export function buildContextSnapshot(
  workspaceId: string,
  workspace: Pick<WorkspacePlanC, 'title' | 'goal' | 'status'>,
  cards: Pick<CardPlanC, 'id' | 'title' | 'role' | 'status'>[],
  cardId?: string
): Record<string, unknown> {
  return {
    workspaceId,
    workspaceTitle: workspace.title,
    workspaceGoal: workspace.goal,
    workspaceStatus: workspace.status,
    cardCount: cards.length,
    cardId: cardId ?? null,
    cardStatuses: cards.reduce<Record<string, string>>((acc, c) => {
      acc[c.id] = c.status
      return acc
    }, {}),
    capturedAt: new Date().toISOString(),
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pnpm test workspace-context
```

- [ ] **Step 5: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/workspace-context.ts src/lib/workspace-context.unit.test.ts
git commit -m "feat(lib): workspace context builder (silo-chat, card-chat, snapshot)"
```

---

### Task 9: Time Dimension

**Files:**
- Create: `src/lib/workspace-time.ts`
- Create: `src/lib/workspace-time.unit.test.ts`

> Reconstructs workspace state at a point in time using `context_snapshot` from `workspace_messages` and card history.

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/workspace-time.unit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: vi.fn() },
}))

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getWorkspaceAt, getCardHistoryAt } from './workspace-time'

describe('getWorkspaceAt', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns context_snapshot from nearest message before the given time', async () => {
    const mockSnapshot = {
      workspaceId: 'ws-1',
      workspaceTitle: 'Test',
      cardCount: 3,
      capturedAt: '2026-03-01T10:00:00Z',
    }
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          lte: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: { context_snapshot: mockSnapshot } }),
              }),
            }),
          }),
        }),
      }),
    }))

    const result = await getWorkspaceAt('ws-1', new Date('2026-03-01T12:00:00Z'))
    expect(result?.workspaceTitle).toBe('Test')
    expect(result?.cardCount).toBe(3)
  })

  it('returns null if no messages found before that time', async () => {
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          lte: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: null }),
              }),
            }),
          }),
        }),
      }),
    }))

    const result = await getWorkspaceAt('ws-1', new Date('2025-01-01'))
    expect(result).toBeNull()
  })
})

describe('getCardHistoryAt', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns the most recent snapshot before the given time', async () => {
    const mockSnap = { id: 'card-1', title: 'Test Karte', status: 'ready' }
    ;(supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          lte: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: { snapshot: mockSnap, created_at: '2026-03-01T10:00:00Z' } }),
              }),
            }),
          }),
        }),
      }),
    }))

    const result = await getCardHistoryAt('card-1', new Date('2026-03-02'))
    expect(result?.snapshot?.title).toBe('Test Karte')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm test workspace-time
```

- [ ] **Step 3: Implement workspace-time.ts**

```typescript
// src/lib/workspace-time.ts
// Time-travel: reconstruct workspace or card state at a given point in time.
// Uses context_snapshot from workspace_messages and card_history snapshots.

import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Returns the workspace context_snapshot from the nearest message
 * sent at or before `at`.
 * Returns null if no messages exist before that time.
 */
export async function getWorkspaceAt(
  workspaceId: string,
  at: Date
): Promise<Record<string, unknown> | null> {
  const { data } = await supabaseAdmin
    .from('workspace_messages')
    .select('context_snapshot')
    .eq('workspace_id', workspaceId)
    .lte('created_at', at.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data?.context_snapshot) return null
  return data.context_snapshot as Record<string, unknown>
}

/**
 * Returns the card history snapshot at or before `at`.
 * Returns null if no history exists for that card before that time.
 */
export async function getCardHistoryAt(
  cardId: string,
  at: Date
): Promise<{ snapshot: Record<string, unknown>; createdAt: string } | null> {
  const { data } = await supabaseAdmin
    .from('card_history')
    .select('snapshot, created_at')
    .eq('card_id', cardId)
    .lte('created_at', at.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data?.snapshot) return null
  return {
    snapshot: data.snapshot as Record<string, unknown>,
    createdAt: data.created_at as string,
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pnpm test workspace-time
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/workspace-time.ts src/lib/workspace-time.unit.test.ts
git commit -m "feat(lib): workspace time dimension (getWorkspaceAt, getCardHistoryAt)"
```

---

## Chunk 3: API Routes — Workspaces + Cards

### Task 10: GET + POST /api/workspaces

**Files:**
- Create: `src/app/api/workspaces/route.ts`

> Follow the pattern from `src/app/api/projects/route.ts` exactly. Use `getAuthUser` from `@/lib/api/workspaces`.

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/workspaces/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { validateBody } from '@/lib/validators'
import { getAuthUser } from '@/lib/api/workspaces'
import { createWorkspacePlanCSchema } from '@/lib/validators/workspace-plan-c'

const log = createLogger('api:workspaces')

// GET /api/workspaces?department_id=...
export async function GET(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const department_id = searchParams.get('department_id')
  if (!department_id) return NextResponse.json({ error: 'department_id fehlt' }, { status: 400 })

  // Build query — superadmin sees all, others see only their workspaces in the dept
  let query = supabaseAdmin
    .from('workspaces')
    .select('id, department_id, organization_id, title, goal, domain, status, created_by, created_at, updated_at')
    .eq('department_id', department_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (me.role !== 'superadmin') {
    // Intersect with workspace_participants
    const { data: participantRows } = await supabaseAdmin
      .from('workspace_participants')
      .select('workspace_id')
      .eq('user_id', me.id)
    const ids = (participantRows ?? []).map((r: Record<string, unknown>) => r.workspace_id as string)
    if (ids.length === 0) return NextResponse.json({ data: [], total: 0 })
    query = query.in('id', ids)
  }

  const { data, error, count } = await (query as typeof query & { count: number | null })

  if (error) {
    log.error('[workspaces] GET failed', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0 })
}

// POST /api/workspaces
export async function POST(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { data: body, error: valErr } = await validateBody(request, createWorkspacePlanCSchema)
  if (valErr) return valErr

  const { data: workspace, error } = await supabaseAdmin
    .from('workspaces')
    .insert({
      title: body.title.trim(),
      goal: body.goal?.trim() ?? null,
      domain: body.domain?.trim() ?? null,
      department_id: body.departmentId ?? null,
      organization_id: me.organization_id,
      created_by: me.id,
      status: 'draft',
      meta: body.meta ?? {},
    })
    .select()
    .single()

  if (error) {
    log.error('[workspaces] POST insert failed', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-add creator as admin participant
  const { error: participantErr } = await supabaseAdmin
    .from('workspace_participants')
    .insert({ workspace_id: workspace.id, user_id: me.id, role: 'admin' })
  if (participantErr) {
    log.error('[workspaces] participant insert failed', { error: participantErr.message })
  }

  return NextResponse.json(workspace, { status: 201 })
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/workspaces/route.ts
git commit -m "feat(api): GET + POST /api/workspaces"
```

---

### Task 11: GET + PATCH + DELETE /api/workspaces/[id]

**Files:**
- Create: `src/app/api/workspaces/[id]/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/workspaces/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { validateBody } from '@/lib/validators'
import { getAuthUser, requireWorkspaceAccess, canWriteWorkspace } from '@/lib/api/workspaces'
import { updateWorkspacePlanCSchema } from '@/lib/validators/workspace-plan-c'

const log = createLogger('api:workspaces:[id]')

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  return NextResponse.json(workspace)
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, updateWorkspacePlanCSchema)
  if (valErr) return valErr

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.goal !== undefined) updates.goal = body.goal.trim()
  if (body.domain !== undefined) updates.domain = body.domain.trim()
  if (body.status !== undefined) updates.status = body.status
  if (body.meta !== undefined) updates.meta = body.meta

  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    log.error('[workspaces/[id]] PATCH failed', { error: error.message, id })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mark last export as stale
  await supabaseAdmin
    .from('workspace_exports')
    .update({ is_stale: true })
    .eq('workspace_id', id)
    .eq('status', 'ready')

  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  // Only workspace admin or superadmin can delete
  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { error } = await supabaseAdmin
    .from('workspaces')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    log.error('[workspaces/[id]] DELETE failed', { error: error.message, id })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add src/app/api/workspaces/[id]/route.ts
git commit -m "feat(api): GET + PATCH + DELETE /api/workspaces/[id]"
```

---

### Task 12: Cards CRUD

**Files:**
- Create: `src/app/api/workspaces/[id]/cards/route.ts`
- Create: `src/app/api/workspaces/[id]/cards/[cid]/route.ts`

> The PATCH route must: 1) write card snapshot to card_history, 2) run stale propagation, 3) update the card. Import `writeCardSnapshot` from `@/lib/card-history` and `markDirectDepsStale` from `@/lib/stale-propagation`.

- [ ] **Step 1: Write GET + POST /cards**

```typescript
// src/app/api/workspaces/[id]/cards/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { validateBody } from '@/lib/validators'
import { getAuthUser, canWriteWorkspace, requireWorkspaceAccess } from '@/lib/api/workspaces'
import { createCardSchema } from '@/lib/validators/workspace-plan-c'

const log = createLogger('api:workspaces:cards')
type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('cards')
    .select('id, workspace_id, title, description, content_type, role, content, chart_config, status, stale_since, stale_reason, sort_order, meta, created_at, updated_at')
    .eq('workspace_id', id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, createCardSchema)
  if (valErr) return valErr

  const { data: card, error } = await supabaseAdmin
    .from('cards')
    .insert({
      workspace_id: id,
      title: body.title.trim(),
      description: body.description?.trim() ?? null,
      content_type: body.contentType,
      role: body.role,
      content: body.content ?? null,
      chart_config: body.chartConfig ?? null,
      sort_order: body.sortOrder ?? 0,
      meta: body.meta ?? {},
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    log.error('[cards] POST failed', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(card, { status: 201 })
}
```

- [ ] **Step 2: Write PATCH + DELETE /cards/[cid]**

```typescript
// src/app/api/workspaces/[id]/cards/[cid]/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { validateBody } from '@/lib/validators'
import { getAuthUser, canWriteWorkspace } from '@/lib/api/workspaces'
import { updateCardSchema } from '@/lib/validators/workspace-plan-c'
import { writeCardSnapshot, mapCard } from '@/lib/card-history'
import { markDirectDepsStale } from '@/lib/stale-propagation'

const log = createLogger('api:workspaces:cards:[cid]')
type Params = { params: Promise<{ id: string; cid: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id, cid } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, updateCardSchema)
  if (valErr) return valErr

  // 1. Load current card for snapshot
  const { data: current, error: fetchErr } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('id', cid)
    .eq('workspace_id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchErr || !current) return NextResponse.json({ error: 'Karte nicht gefunden' }, { status: 404 })

  // 2. Write history snapshot (APPEND ONLY)
  try {
    await writeCardSnapshot(
      mapCard(current),
      body.changeReason ?? 'Karte aktualisiert',
      me.id
    )
  } catch (err) {
    log.error('[cards/[cid]] snapshot failed', { error: String(err) })
    // Non-fatal — continue with update
  }

  // 3. Apply updates
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.description !== undefined) updates.description = body.description.trim()
  if (body.contentType !== undefined) updates.content_type = body.contentType
  if (body.role !== undefined) updates.role = body.role
  if (body.content !== undefined) updates.content = body.content
  if (body.chartConfig !== undefined) updates.chart_config = body.chartConfig
  if (body.status !== undefined) updates.status = body.status
  if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder
  if (body.meta !== undefined) updates.meta = body.meta

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('cards')
    .update(updates)
    .eq('id', cid)
    .select()
    .single()

  if (updateErr) {
    log.error('[cards/[cid]] PATCH failed', { error: updateErr.message })
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // 4. Stale propagation (non-blocking)
  const cardTitle = (updates.title ?? current.title) as string
  markDirectDepsStale(id, cid, `Karte "${cardTitle}" wurde geändert`).catch((err) => {
    log.error('[cards/[cid]] stale propagation failed', { error: String(err) })
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id, cid } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { error } = await supabaseAdmin
    .from('cards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', cid)
    .eq('workspace_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add src/app/api/workspaces/[id]/cards/route.ts src/app/api/workspaces/[id]/cards/[cid]/route.ts
git commit -m "feat(api): cards CRUD with snapshot + stale propagation"
```

---

## Chunk 4: API Routes — Connections, Assets, Chat, Briefing, Export

### Task 13: Connections Routes

**Files:**
- Create: `src/app/api/workspaces/[id]/connections/route.ts`
- Create: `src/app/api/workspaces/[id]/connections/[connid]/route.ts`

- [ ] **Step 1: Write connections routes**

```typescript
// src/app/api/workspaces/[id]/connections/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { getAuthUser, canWriteWorkspace } from '@/lib/api/workspaces'
import { createConnectionSchema } from '@/lib/validators/workspace-plan-c'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, createConnectionSchema)
  if (valErr) return valErr

  // Verify both cards belong to this workspace
  const { data: cards } = await supabaseAdmin
    .from('cards')
    .select('id')
    .eq('workspace_id', id)
    .in('id', [body.sourceCardId, body.targetCardId])
  if (!cards || cards.length < 2)
    return NextResponse.json({ error: 'Karten nicht gefunden' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('connections')
    .insert({
      workspace_id: id,
      source_card_id: body.sourceCardId,
      target_card_id: body.targetCardId,
      label: body.label ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

```typescript
// src/app/api/workspaces/[id]/connections/[connid]/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser, canWriteWorkspace } from '@/lib/api/workspaces'

type Params = { params: Promise<{ id: string; connid: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { id, connid } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { error } = await supabaseAdmin
    .from('connections')
    .delete()
    .eq('id', connid)
    .eq('workspace_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add src/app/api/workspaces/[id]/connections/route.ts src/app/api/workspaces/[id]/connections/[connid]/route.ts
git commit -m "feat(api): connections POST + DELETE"
```

---

### Task 14: Assets Routes

**Files:**
- Create: `src/app/api/workspaces/[id]/assets/route.ts`
- Create: `src/app/api/workspaces/[id]/assets/[aid]/route.ts`

- [ ] **Step 1: Write asset routes**

```typescript
// src/app/api/workspaces/[id]/assets/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { getAuthUser, canWriteWorkspace, requireWorkspaceAccess } from '@/lib/api/workspaces'
import { createAssetSchema } from '@/lib/validators/workspace-plan-c'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('workspace_assets')
    .select('*')
    .eq('workspace_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, createAssetSchema)
  if (valErr) return valErr

  const { data, error } = await supabaseAdmin
    .from('workspace_assets')
    .insert({
      workspace_id: id,
      card_id: body.cardId ?? null,
      type: body.type,
      name: body.name.trim(),
      url: body.url,
      size: body.size ?? null,
      meta: body.meta ?? {},
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

```typescript
// src/app/api/workspaces/[id]/assets/[aid]/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser, canWriteWorkspace } from '@/lib/api/workspaces'

type Params = { params: Promise<{ id: string; aid: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { aid, id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { error } = await supabaseAdmin
    .from('workspace_assets')
    .delete()
    .eq('id', aid)
    .eq('workspace_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add src/app/api/workspaces/[id]/assets/route.ts src/app/api/workspaces/[id]/assets/[aid]/route.ts
git commit -m "feat(api): workspace assets GET + POST + DELETE"
```

---

### Task 15: Workspace Chat Route

**Files:**
- Create: `src/app/api/workspaces/[id]/chat/route.ts`

> POST sends a message (Silo or Card chat), calls Anthropic SDK, saves messages to workspace_messages with context_snapshot. GET loads message history. Use `buildWorkspaceContext` or `buildCardContext` depending on whether `card_id` is provided.

- [ ] **Step 1: Write chat route**

```typescript
// src/app/api/workspaces/[id]/chat/route.ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { getAuthUser, requireWorkspaceAccess, canWriteWorkspace } from '@/lib/api/workspaces'
import { sendChatMessageSchema } from '@/lib/validators/workspace-plan-c'
import { buildWorkspaceContext, buildCardContext, buildContextSnapshot } from '@/lib/workspace-context'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:workspaces:chat')
const anthropic = new Anthropic()
type Params = { params: Promise<{ id: string }> }

// GET /api/workspaces/[id]/chat?card_id=...&limit=50
export async function GET(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const cardId = searchParams.get('card_id')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)

  let query = supabaseAdmin
    .from('workspace_messages')
    .select('id, workspace_id, card_id, role, content, token_usage, created_at')
    .eq('workspace_id', id)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (cardId) {
    query = query.eq('card_id', cardId)
  } else {
    query = query.is('card_id', null)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

// POST /api/workspaces/[id]/chat
export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, sendChatMessageSchema)
  if (valErr) return valErr

  // Build system prompt
  let systemPrompt: string
  try {
    systemPrompt = body.cardId
      ? await buildCardContext(body.cardId)
      : await buildWorkspaceContext(id)
  } catch (err) {
    log.error('[chat] context build failed', { error: String(err) })
    return NextResponse.json({ error: 'Kontext-Aufbau fehlgeschlagen' }, { status: 500 })
  }

  // Load recent message history (last 20)
  let historyQuery = supabaseAdmin
    .from('workspace_messages')
    .select('role, content')
    .eq('workspace_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  historyQuery = body.cardId
    ? historyQuery.eq('card_id', body.cardId)
    : historyQuery.is('card_id', null)

  const { data: histRows } = await historyQuery
  const history = ((histRows ?? []) as Array<{ role: string; content: string }>)
    .reverse()
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  // Call Claude
  let assistantContent = ''
  let tokenUsage: Record<string, unknown> = {}

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: body.content },
      ],
    })
    assistantContent = response.content[0].type === 'text' ? response.content[0].text : ''
    tokenUsage = { input: response.usage.input_tokens, output: response.usage.output_tokens }
  } catch (err) {
    log.error('[chat] Anthropic call failed', { error: String(err) })
    return NextResponse.json({ error: 'KI-Antwort fehlgeschlagen' }, { status: 500 })
  }

  // Save user + assistant messages
  const contextSnapshot = buildContextSnapshot(
    id,
    { title: '', goal: null, status: 'draft' }, // minimal — full snapshot built in context builder
    []
  )

  await supabaseAdmin.from('workspace_messages').insert([
    {
      workspace_id: id,
      card_id: body.cardId ?? null,
      role: 'user',
      content: body.content,
      context_snapshot: contextSnapshot,
      token_usage: null,
    },
    {
      workspace_id: id,
      card_id: body.cardId ?? null,
      role: 'assistant',
      content: assistantContent,
      context_snapshot: contextSnapshot,
      token_usage: tokenUsage,
    },
  ])

  return NextResponse.json({ content: assistantContent, token_usage: tokenUsage })
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add src/app/api/workspaces/[id]/chat/route.ts
git commit -m "feat(api): workspace chat route (silo + card-specific)"
```

---

### Task 16: Briefing Route

**Files:**
- Create: `src/app/api/workspaces/[id]/briefing/route.ts`

> Toro asks max 4 questions to understand goal/context/audience/output. When it has enough info, it responds with a JSON card structure. The client detects JSON in the response (via `"cards":` key) and shows a confirmation UI. After confirmation, the client calls POST /api/workspaces/[id]/cards for each proposed card.

- [ ] **Step 1: Write briefing route**

```typescript
// src/app/api/workspaces/[id]/briefing/route.ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { validateBody } from '@/lib/validators'
import { getAuthUser, canWriteWorkspace } from '@/lib/api/workspaces'
import { startBriefingSchema } from '@/lib/validators/workspace-plan-c'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:workspaces:briefing')
const anthropic = new Anthropic()
type Params = { params: Promise<{ id: string }> }

const BRIEFING_SYSTEM = `Du bist Toro, ein KI-Assistent von Tropen OS. Der User möchte einen neuen Workspace für eine komplexe Aufgabe anlegen.

Stelle maximal 4 kurze, gezielte Fragen um das Ziel, den Kontext, die Zielgruppe und das gewünschte Ergebnis zu verstehen.

Wenn du genug weißt, schlage eine Karten-Struktur vor im folgenden JSON-Format:
{
  "goal": "...",
  "cards": [
    { "title": "...", "role": "input|process|output", "content_type": "text|table|chart|list|code|map|mindmap|kanban|timeline|image|embed", "description": "..." }
  ]
}

Gib ONLY the JSON aus wenn du bereit bist Karten vorzuschlagen — kein Text davor oder danach.
Antworte immer auf Deutsch.`

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, startBriefingSchema)
  if (valErr) return valErr

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: BRIEFING_SYSTEM,
      messages: [
        ...body.history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: body.message },
      ],
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    const tokenUsage = { input: response.usage.input_tokens, output: response.usage.output_tokens }

    // Detect if it's a JSON card proposal
    let proposal = null
    try {
      const trimmed = content.trim()
      if (trimmed.startsWith('{') && trimmed.includes('"cards"')) {
        proposal = JSON.parse(trimmed)
      }
    } catch {
      // Not JSON — it's a follow-up question
    }

    return NextResponse.json({
      content,
      proposal,          // non-null → show confirmation UI
      token_usage: tokenUsage,
    })
  } catch (err) {
    log.error('[briefing] Anthropic call failed', { error: String(err) })
    return NextResponse.json({ error: 'Briefing-Anfrage fehlgeschlagen' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add src/app/api/workspaces/[id]/briefing/route.ts
git commit -m "feat(api): briefing route — Toro card proposal flow"
```

---

### Task 17: Export Routes

**Files:**
- Create: `src/app/api/workspaces/[id]/export/route.ts`
- Create: `src/app/api/workspaces/[id]/exports/route.ts`

> Implement `chat` and `markdown` exports. Word/PDF/Presentation return 501. When cards are stale, include a warning in the response but don't block the export.

- [ ] **Step 1: Write export/route.ts**

```typescript
// src/app/api/workspaces/[id]/export/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { getAuthUser, canWriteWorkspace, requireWorkspaceAccess } from '@/lib/api/workspaces'
import { exportWorkspaceSchema } from '@/lib/validators/workspace-plan-c'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:workspaces:export')
type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, exportWorkspaceSchema)
  if (valErr) return valErr

  // 501 for unimplemented formats
  if (['word', 'pdf', 'presentation'].includes(body.format)) {
    return NextResponse.json({
      error: 'Noch nicht implementiert',
      roadmap: 'Word, PDF und Presentation Export kommen in Phase 3 (Plan F/G).',
    }, { status: 501 })
  }

  // Load workspace
  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  // Load all active cards sorted by sort_order
  const { data: cardRows, error: cardsErr } = await supabaseAdmin
    .from('cards')
    .select('id, title, description, role, content_type, content, status, sort_order')
    .eq('workspace_id', id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  if (cardsErr) return NextResponse.json({ error: cardsErr.message }, { status: 500 })

  const cards = cardRows ?? []
  const staleCards = cards.filter((c: Record<string, unknown>) => c.status === 'stale')
  const warnings = staleCards.length > 0
    ? [`${staleCards.length} Karte(n) sind veraltet: ${staleCards.map((c: Record<string, unknown>) => `"${c.title}"`).join(', ')}`]
    : []

  // Create export record
  const { data: exportRecord, error: insertErr } = await supabaseAdmin
    .from('workspace_exports')
    .insert({
      workspace_id: id,
      format: body.format,
      status: 'processing',
    })
    .select()
    .single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  // Generate content
  let content = ''

  if (body.format === 'markdown') {
    content = generateMarkdownExport(
      workspace as Record<string, unknown>,
      cards as Record<string, unknown>[]
    )
  } else if (body.format === 'chat') {
    content = generateChatExport(
      workspace as Record<string, unknown>,
      cards as Record<string, unknown>[]
    )
  }

  // Update export record with content (stored as base64 data URL for now)
  const dataUrl = `data:text/plain;base64,${Buffer.from(content).toString('base64')}`
  await supabaseAdmin
    .from('workspace_exports')
    .update({ status: 'ready', file_url: dataUrl })
    .eq('id', exportRecord.id)

  return NextResponse.json({
    export: { ...exportRecord, status: 'ready', file_url: dataUrl },
    warnings,
    content, // also return inline for immediate use
  })
}

function generateMarkdownExport(
  workspace: Record<string, unknown>,
  cards: Record<string, unknown>[]
): string {
  const lines: string[] = [
    `# ${workspace.title}`,
    '',
    workspace.goal ? `**Ziel:** ${workspace.goal}` : '',
    workspace.domain ? `**Bereich:** ${workspace.domain}` : '',
    '',
    '---',
    '',
  ]

  for (const card of cards) {
    lines.push(`## ${card.title} (${card.role})`)
    if (card.description) lines.push(`> ${card.description}`)
    lines.push('')

    const content = card.content as Record<string, unknown> | null
    if (content) {
      if (card.content_type === 'text' && content.text) {
        lines.push(String(content.text))
      } else {
        lines.push('```json')
        lines.push(JSON.stringify(content, null, 2))
        lines.push('```')
      }
    } else {
      lines.push('*(leer)*')
    }

    if (card.status === 'stale') lines.push('\n> ⚠️ Diese Karte ist veraltet.')
    lines.push('')
  }

  return lines.filter(Boolean).join('\n')
}

function generateChatExport(
  workspace: Record<string, unknown>,
  cards: Record<string, unknown>[]
): string {
  const sections = cards.map((card) => {
    const content = card.content as Record<string, unknown> | null
    const contentStr = content
      ? (card.content_type === 'text' && content.text ? String(content.text) : JSON.stringify(content))
      : '(leer)'
    return `**${card.title}** (${card.role}):\n${contentStr}`
  })

  return [
    `Workspace: ${workspace.title}`,
    workspace.goal ? `Ziel: ${workspace.goal}` : '',
    '',
    ...sections,
  ].filter(Boolean).join('\n\n')
}
```

- [ ] **Step 2: Write exports/route.ts (export history)**

```typescript
// src/app/api/workspaces/[id]/exports/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser, requireWorkspaceAccess } from '@/lib/api/workspaces'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('workspace_exports')
    .select('id, format, status, file_url, is_stale, created_at')
    .eq('workspace_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add src/app/api/workspaces/[id]/export/route.ts src/app/api/workspaces/[id]/exports/route.ts
git commit -m "feat(api): workspace export (markdown + chat) + export history"
```

---

## Chunk 5: Finalization

### Task 18: Update context-builder.ts

**Files:**
- Modify: `src/lib/context-builder.ts`

> The old context-builder.ts references `operator_results` table which doesn't exist in Plan C. Add a deprecation notice and re-export the new functions from workspace-context.ts for backwards compatibility.

- [ ] **Step 1: Read context-builder.ts fully first**

Read `src/lib/context-builder.ts` to understand all exports.

- [ ] **Step 2: Add re-exports pointing to new module**

Add at the top of the file:

```typescript
// context-builder.ts is superseded by workspace-context.ts (Plan C).
// This file is kept for backwards compatibility. Import from workspace-context.ts directly.
export { buildWorkspaceContext, buildCardContext, buildContextSnapshot } from '@/lib/workspace-context'
```

Remove or comment out the old implementation that references `operator_results`.

- [ ] **Step 3: Typecheck + commit**

```bash
pnpm typecheck
git add src/lib/context-builder.ts
git commit -m "refactor(context-builder): re-export from workspace-context.ts (Plan C migration)"
```

---

### Task 19: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add Workspace + Card Engine section to the Routen & Semantik table**

In the table at "Routen & Semantik", update the `/workspace` row to reflect Plan C is now built, and add a new section below documenting the key architectural facts:

```markdown
## Workspace + Card Engine (Plan C)

Gebaut in Phase 2. Backend vollständig, UI kommt in Plan F.

**Core-Prinzip:** Ein Workspace ist für mehrstufige, komplexe Aufgaben.
Karten (input → process → output) produzieren zusammen ein Ergebnis.

**Stale-Propagation:** Änderung an Karte → direkte Abhängigkeiten werden auf
`status='stale'` gesetzt (nicht rekursiv). Logik: `src/lib/stale-propagation.ts`.

**Briefing-Flow:** POST `/api/workspaces/[id]/briefing` → Toro stellt Fragen →
gibt JSON `{ goal, cards[] }` zurück → Client bestätigt → Cards werden angelegt.

**Export:** `chat` und `markdown` implementiert. `word/pdf/presentation` → 501
(kommt Plan F/G).

**Zeitdimension:** `getWorkspaceAt(id, date)` aus `src/lib/workspace-time.ts`
rekonstruiert Workspace-Zustand aus `context_snapshot` in `workspace_messages`.

**card_history ist APPEND ONLY.** Kein UPDATE, kein DELETE — weder in Code noch in Policies.

**Neue Tabellen:** `workspace_assets`, `workspace_exports`, `workspace_messages`
(Migration: `20260314000035_workspace_plan_c.sql`)
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(CLAUDE.md): document Plan C Workspace + Card Engine architecture"
```

---

### Task 20: Full typecheck + test run

- [ ] **Step 1: Run all tests**

```bash
pnpm test
```
Expected: All unit tests pass (stale-propagation, chart-theme, workspace-context, workspace-time).

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```
Expected: 0 TypeScript errors.

- [ ] **Step 3: Run lint**

```bash
pnpm lint
```
Expected: 0 lint errors.

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -p  # stage any cleanup
git commit -m "chore: Plan C finalization — typecheck + lint clean"
```

---

## Definition of Done

- [ ] Migration `20260314000035_workspace_plan_c.sql` deployed to Supabase
- [ ] All API Routes respond correctly (test via curl or Postman):
  - POST /api/workspaces → creates workspace + auto-adds participant
  - GET /api/workspaces?department_id=... → returns list
  - POST /api/workspaces/[id]/cards → creates card
  - PATCH /api/workspaces/[id]/cards/[cid] → writes snapshot + marks deps stale
  - POST /api/workspaces/[id]/connections → creates connection
  - POST /api/workspaces/[id]/briefing → Toro responds (and eventually returns JSON proposal)
  - POST /api/workspaces/[id]/export with format=markdown → returns markdown content
  - POST /api/workspaces/[id]/export with format=pdf → returns 501
  - GET /api/workspaces/[id]/exports → returns history
- [ ] `pnpm test` — all tests green
- [ ] `pnpm typecheck` — 0 errors
- [ ] CLAUDE.md updated

---

## What is NOT built in this plan (by design)

- UI / Canvas (Plan F)
- Transformations-Engine (Plan E)
- Feed-Integration in Karten (Plan G)
- Word/PDF/Presentation Export (Plan F/G)
- Mobile-Ansicht
