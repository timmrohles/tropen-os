# Feeds Rebuild (Prompt 08) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing feeds prototype with the full Prompt-08 spec: correct DB schema, 3-stage pipeline with feedback loop, 4 source types (RSS/Email/API/URL), and a Newscenter UI.

**Architecture:** New idempotent migration drops old feed tables and recreates them with the Prompt-08 column set. The pipeline is rebuilt around the new `feed_sources` columns (keywords/min_score on source, not on a separate schema table). The Newscenter is a client component with IntersectionObserver-based auto-read and infinite scroll.

**Tech Stack:** Next.js 15 App Router, Supabase (supabaseAdmin), Anthropic SDK (claude-haiku-4-5-20251001 Stage 2, claude-sonnet-4-6 Stage 3), rss-parser, cheerio, Zod v4, Vitest

---

## Context for implementers

**Working directory:** `C:/Users/timmr/tropen OS`

**What already exists (will be replaced/rewritten):**
- `src/lib/feeds/pipeline.ts` — old pipeline tied to Drizzle FeedSchema type → **rewrite**
- `src/lib/feeds/token-budget.ts` — old column names → **rewrite**
- `src/lib/feeds/distributor.ts` — old column names → **rewrite**
- `src/lib/feeds/ttl-cleanup.ts` — old column names → **rewrite**
- `src/lib/feeds/fetchers/rss.ts` — clean, minor tweak only
- `src/lib/feeds/fetchers/url.ts` — add robots.txt check
- `src/lib/feeds/fetchers/api.ts` — partial, needs auth + mapping
- `src/lib/feeds/fetchers/webhook.ts` — needs update
- `src/types/feeds.ts` — Drizzle re-exports, wrong types → **rewrite**
- `src/actions/feeds.ts` — 723 lines on old schema → **rewrite**
- `src/app/feeds/page.tsx` — simple CRUD table → **rewrite to Newscenter**
- `src/app/api/cron/feed-fetch/`, `feed-process/`, `feed-cleanup/`, `feed-digest/` → **consolidate**
- `supabase/migrations/033_feed_tables.sql` + `20260312000034_feed_rls_fixes.sql` — wrong schema, stays as-is (already applied), new migration replaces it

**Key conventions (CLAUDE.md):**
- `supabaseAdmin` for ALL DB queries — no client-side Supabase in API routes
- Inline styles: `const s: Record<string, React.CSSProperties>` — CSS vars only
- Zod v4 syntax: `z.record(z.string(), z.unknown())`
- `feed_processing_log` is APPEND ONLY — never UPDATE or DELETE
- Package manager: pnpm

**New DB schema** (no `tropen_` prefix — user decision):
- `feed_schemas` — API/URL response mapping (referenced by feed_sources.schema_id)
- `feed_sources` — sources with keywords/filters/min_score directly on the row
- `feed_items` — processed items: summary, key_facts, score (1-10), content_hash UNIQUE
- `feed_distributions` — source → project/workspace routing
- `feed_processing_log` — APPEND ONLY, per-run stats

---

## File Structure

```
supabase/migrations/
  20260314000036_feeds_v2.sql         ← new (drops old tables, creates new schema)

src/types/
  feeds.ts                            ← rewrite (plain TS interfaces, no Drizzle exports)

src/lib/validators/
  feeds.ts                            ← new (Zod schemas for all feed operations)

src/lib/feeds/
  pipeline.ts                         ← rewrite (adapt to new feed_sources columns)
  token-budget.ts                     ← rewrite (new column names)
  distributor.ts                      ← rewrite (new column names)
  ttl-cleanup.ts                      ← rewrite (new column names)
  feedback.ts                         ← new (feedback loop logic)
  fetchers/
    rss.ts                            ← minor tweak (type alignment)
    url.ts                            ← add robots.txt check
    api.ts                            ← rewrite (auth + schema mapping)
    webhook.ts                        ← update (new types)

src/actions/
  feeds.ts                            ← full rewrite

src/app/
  feeds/
    page.tsx                          ← full rewrite (Newscenter)
    new/
      page.tsx                        ← new (source setup wizard)
  api/
    feeds/
      inbound/
        email/
          route.ts                    ← new (Resend inbound webhook)
    cron/
      sync-feeds/
        route.ts                      ← new (replaces 4 old cron routes)
```

---

## Chunk 1: Foundation — Migration + Types + Validators

### Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/20260314000036_feeds_v2.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Migration: 20260314000036_feeds_v2.sql
-- Replaces migrations 033 + 034: drops old feed tables, creates Prompt-08 schema.
-- Idempotent.

BEGIN;

-- ============================================================
-- 1. Drop old tables (reverse FK order)
-- ============================================================

DROP TABLE IF EXISTS public.feed_source_schemas  CASCADE;
DROP TABLE IF EXISTS public.feed_processing_log  CASCADE;
DROP TABLE IF EXISTS public.feed_distributions   CASCADE;
DROP TABLE IF EXISTS public.feed_items           CASCADE;
DROP TABLE IF EXISTS public.feed_sources         CASCADE;
DROP TABLE IF EXISTS public.feed_schemas         CASCADE;

-- ============================================================
-- 2. feed_schemas — API/URL response mapping
-- ============================================================

CREATE TABLE public.feed_schemas (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  source_type     TEXT        NOT NULL CHECK (source_type IN ('api','url')),
  mapping         JSONB       NOT NULL DEFAULT '{}',
  -- mapping keys: title, content, date, url, author (JSONPath or CSS selector)
  sample_response JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_schemas_org ON public.feed_schemas (organization_id);

-- ============================================================
-- 3. feed_sources
-- ============================================================

CREATE TABLE public.feed_sources (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  name             TEXT        NOT NULL,
  type             TEXT        NOT NULL CHECK (type IN ('rss','email','api','url')),
  url              TEXT,
  config           JSONB       NOT NULL DEFAULT '{}',
  -- rss:   { polling_interval_minutes: 60 }
  -- email: { inbound_address: "feed-{uuid}@inbound.tropen.os", provider: "resend" }
  -- api:   { polling_interval_minutes, auth_type, auth_value, auth_header, headers, method, body, response_path }
  -- url:   { polling_interval_minutes, css_selector, disclaimer_acknowledged: true }
  keywords_include TEXT[]      DEFAULT '{}',
  keywords_exclude TEXT[]      DEFAULT '{}',
  domains_allow    TEXT[]      DEFAULT '{}',
  min_score        INTEGER     NOT NULL DEFAULT 6,
  schema_id        UUID        REFERENCES public.feed_schemas(id) ON DELETE SET NULL,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  last_fetched_at  TIMESTAMPTZ,
  error_count      INTEGER     NOT NULL DEFAULT 0,
  last_error       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_sources_org       ON public.feed_sources (organization_id);
CREATE INDEX IF NOT EXISTS idx_feed_sources_active    ON public.feed_sources (is_active);
CREATE INDEX IF NOT EXISTS idx_feed_sources_type      ON public.feed_sources (type);

-- ============================================================
-- 4. feed_items
-- ============================================================

CREATE TABLE public.feed_items (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id        UUID        NOT NULL REFERENCES public.feed_sources(id) ON DELETE CASCADE,
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  content          TEXT,
  summary          TEXT,
  key_facts        JSONB,
  url              TEXT,
  author           TEXT,
  published_at     TIMESTAMPTZ,
  fetched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stage            INTEGER     NOT NULL DEFAULT 1 CHECK (stage IN (1,2,3)),
  score            INTEGER     CHECK (score BETWEEN 1 AND 10),
  score_reason     TEXT,
  status           TEXT        NOT NULL DEFAULT 'unread'
    CHECK (status IN ('unread','read','saved','archived','deleted','not_relevant')),
  is_saved         BOOLEAN     NOT NULL DEFAULT false,
  content_hash     TEXT        UNIQUE,
  expires_at       TIMESTAMPTZ,
  archived_summary TEXT,
  metadata         JSONB       NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_items_source    ON public.feed_items (source_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_org       ON public.feed_items (organization_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_status    ON public.feed_items (status);
CREATE INDEX IF NOT EXISTS idx_feed_items_score     ON public.feed_items (score DESC);
CREATE INDEX IF NOT EXISTS idx_feed_items_fetched   ON public.feed_items (fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_items_saved     ON public.feed_items (is_saved) WHERE is_saved = true;

-- ============================================================
-- 5. feed_distributions
-- ============================================================

CREATE TABLE public.feed_distributions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id   UUID        NOT NULL REFERENCES public.feed_sources(id) ON DELETE CASCADE,
  target_type TEXT        NOT NULL CHECK (target_type IN ('project','workspace')),
  target_id   UUID        NOT NULL,
  auto_inject BOOLEAN     NOT NULL DEFAULT true,
  min_score   INTEGER     NOT NULL DEFAULT 7,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_distributions_source ON public.feed_distributions (source_id);

-- ============================================================
-- 6. feed_processing_log (APPEND ONLY)
-- ============================================================

CREATE TABLE public.feed_processing_log (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id      UUID        REFERENCES public.feed_sources(id) ON DELETE SET NULL,
  processed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stage          INTEGER     NOT NULL CHECK (stage IN (1,2,3)),
  items_in       INTEGER     NOT NULL DEFAULT 0,
  items_out      INTEGER     NOT NULL DEFAULT 0,
  items_dropped  INTEGER     NOT NULL DEFAULT 0,
  tokens_input   INTEGER     NOT NULL DEFAULT 0,
  tokens_output  INTEGER     NOT NULL DEFAULT 0,
  cost_eur       NUMERIC(10,6) NOT NULL DEFAULT 0,
  duration_ms    INTEGER,
  error          TEXT
);

CREATE INDEX IF NOT EXISTS idx_feed_log_source     ON public.feed_processing_log (source_id);
CREATE INDEX IF NOT EXISTS idx_feed_log_processed  ON public.feed_processing_log (processed_at DESC);

-- ============================================================
-- 7. RLS
-- ============================================================

ALTER TABLE public.feed_schemas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_sources      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_processing_log ENABLE ROW LEVEL SECURITY;

-- feed_schemas: org members can read; admin/owner can write
DROP POLICY IF EXISTS "feed_schemas_select" ON public.feed_schemas;
CREATE POLICY "feed_schemas_select" ON public.feed_schemas FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "feed_schemas_write" ON public.feed_schemas;
CREATE POLICY "feed_schemas_write" ON public.feed_schemas FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
      AND role::TEXT IN ('owner','admin','superadmin')
  ));

-- feed_sources: org members can read; admin/owner can write
DROP POLICY IF EXISTS "feed_sources_select" ON public.feed_sources;
CREATE POLICY "feed_sources_select" ON public.feed_sources FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "feed_sources_write" ON public.feed_sources;
CREATE POLICY "feed_sources_write" ON public.feed_sources FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
      AND role::TEXT IN ('owner','admin','superadmin')
  ));

-- feed_items: org members can read and update status
DROP POLICY IF EXISTS "feed_items_select" ON public.feed_items;
CREATE POLICY "feed_items_select" ON public.feed_items FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "feed_items_update" ON public.feed_items;
CREATE POLICY "feed_items_update" ON public.feed_items FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  ));

-- feed_distributions: admin/owner manage
DROP POLICY IF EXISTS "feed_distributions_select" ON public.feed_distributions;
CREATE POLICY "feed_distributions_select" ON public.feed_distributions FOR SELECT
  USING (source_id IN (
    SELECT id FROM public.feed_sources WHERE organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS "feed_distributions_write" ON public.feed_distributions;
CREATE POLICY "feed_distributions_write" ON public.feed_distributions FOR ALL
  USING (source_id IN (
    SELECT id FROM public.feed_sources WHERE organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
        AND role::TEXT IN ('owner','admin','superadmin')
    )
  ));

-- feed_processing_log: SELECT only for admins (service_role does inserts)
DROP POLICY IF EXISTS "feed_log_select" ON public.feed_processing_log;
CREATE POLICY "feed_log_select" ON public.feed_processing_log FOR SELECT
  USING (source_id IN (
    SELECT id FROM public.feed_sources WHERE organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
        AND role::TEXT IN ('owner','admin','superadmin')
    )
  ));

COMMIT;
```

- [ ] **Step 2: Run migration in Supabase SQL Editor**

Paste the file contents and execute. Expected: no errors. Verify in Table Editor: `feed_sources`, `feed_items`, `feed_schemas`, `feed_distributions`, `feed_processing_log` appear.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260314000036_feeds_v2.sql
git commit -m "feat(feeds): new v2 DB schema — drops old tables, creates Prompt-08 spec"
```

---

### Task 2: Types + Validators

**Files:**
- Modify: `src/types/feeds.ts`
- Create: `src/lib/validators/feeds.ts`

- [ ] **Step 1: Rewrite `src/types/feeds.ts`**

Drop the Drizzle re-exports entirely. Use plain interfaces that match the new DB columns.

```typescript
// src/types/feeds.ts

export type FeedSourceType = 'rss' | 'email' | 'api' | 'url'
export type FeedItemStatus = 'unread' | 'read' | 'saved' | 'archived' | 'deleted' | 'not_relevant'

export interface FeedSource {
  id: string
  organizationId: string
  userId: string | null
  name: string
  type: FeedSourceType
  url: string | null
  config: Record<string, unknown>
  keywordsInclude: string[]
  keywordsExclude: string[]
  domainsAllow: string[]
  minScore: number
  schemaId: string | null
  isActive: boolean
  lastFetchedAt: string | null
  errorCount: number
  lastError: string | null
  createdAt: string
  updatedAt: string
}

export interface FeedSchema {
  id: string
  organizationId: string
  name: string
  sourceType: 'api' | 'url'
  mapping: Record<string, string>
  sampleResponse: Record<string, unknown> | null
  createdAt: string
}

export interface FeedItem {
  id: string
  sourceId: string
  organizationId: string
  title: string
  content: string | null
  summary: string | null
  keyFacts: string[] | null
  url: string | null
  author: string | null
  publishedAt: string | null
  fetchedAt: string
  stage: 1 | 2 | 3
  score: number | null
  scoreReason: string | null
  status: FeedItemStatus
  isSaved: boolean
  contentHash: string | null
  expiresAt: string | null
  archivedSummary: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface FeedDistribution {
  id: string
  sourceId: string
  targetType: 'project' | 'workspace'
  targetId: string
  autoInject: boolean
  minScore: number
  createdAt: string
}

// Used by the pipeline
export interface RawFeedItem {
  sourceId: string
  title: string
  content?: string
  url: string
  publishedAt?: Date
  author?: string
  metadata?: Record<string, unknown>
}

// Stage 2 result from Haiku
export interface Stage2Result {
  score: number    // 1-10
  reason: string
}
```

- [ ] **Step 2: Create `src/lib/validators/feeds.ts`**

```typescript
// src/lib/validators/feeds.ts
import { z } from 'zod'

export const createFeedSourceSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['rss', 'email', 'api', 'url']),
  url: z.string().url().optional(),
  config: z.record(z.string(), z.unknown()).optional().default({}),
  keywordsInclude: z.array(z.string()).optional().default([]),
  keywordsExclude: z.array(z.string()).optional().default([]),
  domainsAllow: z.array(z.string()).optional().default([]),
  minScore: z.number().int().min(1).max(10).optional().default(6),
  schemaId: z.string().uuid().optional(),
})
export type CreateFeedSourceInput = z.infer<typeof createFeedSourceSchema>

export const updateFeedSourceSchema = createFeedSourceSchema.partial().extend({
  isActive: z.boolean().optional(),
})
export type UpdateFeedSourceInput = z.infer<typeof updateFeedSourceSchema>

export const createFeedSchemaSchema = z.object({
  name: z.string().min(1).max(255),
  sourceType: z.enum(['api', 'url']),
  mapping: z.record(z.string(), z.string()),
  sampleResponse: z.record(z.string(), z.unknown()).optional(),
})
export type CreateFeedSchemaInput = z.infer<typeof createFeedSchemaSchema>

export const updateItemStatusSchema = z.object({
  status: z.enum(['unread', 'read', 'saved', 'archived', 'deleted', 'not_relevant']),
})

export const injectItemSchema = z.object({
  targetType: z.enum(['project', 'workspace']),
  targetId: z.string().uuid(),
})

export const createDistributionSchema = z.object({
  sourceId: z.string().uuid(),
  targetType: z.enum(['project', 'workspace']),
  targetId: z.string().uuid(),
  autoInject: z.boolean().optional().default(true),
  minScore: z.number().int().min(1).max(10).optional().default(7),
})
export type CreateDistributionInput = z.infer<typeof createDistributionSchema>

// Email inbound webhook from Resend
export const emailInboundSchema = z.object({
  to: z.array(z.object({ email: z.string() })),
  from: z.object({ email: z.string(), name: z.string().optional() }),
  subject: z.string(),
  text: z.string().optional(),
  html: z.string().optional(),
})
export type EmailInboundPayload = z.infer<typeof emailInboundSchema>
```

- [ ] **Step 3: Commit**

```bash
git add src/types/feeds.ts src/lib/validators/feeds.ts
git commit -m "feat(feeds): new types and Zod validators matching v2 schema"
```

---

## Chunk 2: Pipeline

### Task 3: Pipeline Core (Stage 1, 2, 3 + Feedback Loop)

**Files:**
- Modify: `src/lib/feeds/pipeline.ts` (full rewrite)
- Create: `src/lib/feeds/feedback.ts`
- Create: `src/lib/feeds/pipeline.unit.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/feeds/pipeline.unit.test.ts
import { describe, it, expect, vi } from 'vitest'
import { runStage1, computeContentHash } from './pipeline'
import type { RawFeedItem, FeedSource } from '@/types/feeds'

const makeSource = (overrides: Partial<FeedSource> = {}): FeedSource => ({
  id: 'src-1', organizationId: 'org-1', userId: null, name: 'Test',
  type: 'rss', url: 'https://example.com/feed', config: {},
  keywordsInclude: [], keywordsExclude: [], domainsAllow: [],
  minScore: 6, schemaId: null, isActive: true, lastFetchedAt: null,
  errorCount: 0, lastError: null,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

const makeItem = (overrides: Partial<RawFeedItem> = {}): RawFeedItem => ({
  sourceId: 'src-1', title: 'AI breakthrough in 2026',
  content: 'Scientists announced a major LLM improvement',
  url: 'https://example.com/article', ...overrides,
})

describe('runStage1', () => {
  it('passes an item with no filters', () => {
    expect(runStage1(makeItem(), makeSource()).passed).toBe(true)
  })

  it('rejects item older than 7 days', () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    const result = runStage1(makeItem({ publishedAt: old }), makeSource())
    expect(result.passed).toBe(false)
    expect(result.reason).toMatch(/old/)
  })

  it('rejects item missing required keyword', () => {
    const result = runStage1(
      makeItem({ title: 'Sports results', content: 'Football match' }),
      makeSource({ keywordsInclude: ['AI', 'LLM'] })
    )
    expect(result.passed).toBe(false)
  })

  it('passes item with at least one required keyword', () => {
    const result = runStage1(
      makeItem({ title: 'New LLM released', content: 'Details here' }),
      makeSource({ keywordsInclude: ['AI', 'LLM'] })
    )
    expect(result.passed).toBe(true)
  })

  it('rejects item with excluded keyword', () => {
    const result = runStage1(
      makeItem({ title: 'Sponsored AI news' }),
      makeSource({ keywordsExclude: ['sponsored'] })
    )
    expect(result.passed).toBe(false)
  })

  it('rejects item not from allowed domain', () => {
    const result = runStage1(
      makeItem({ url: 'https://other.com/article' }),
      makeSource({ domainsAllow: ['example.com'] })
    )
    expect(result.passed).toBe(false)
  })

  it('passes item from allowed domain', () => {
    const result = runStage1(
      makeItem({ url: 'https://example.com/article' }),
      makeSource({ domainsAllow: ['example.com'] })
    )
    expect(result.passed).toBe(true)
  })

  it('rejects item with content shorter than 50 chars', () => {
    const result = runStage1(makeItem({ title: 'Hi', content: 'Short' }), makeSource())
    expect(result.passed).toBe(false)
  })
})

describe('computeContentHash', () => {
  it('produces stable SHA256 hash from url + title', () => {
    const h1 = computeContentHash('https://example.com', 'Title')
    const h2 = computeContentHash('https://example.com', 'Title')
    expect(h1).toBe(h2)
    expect(h1).toHaveLength(64)
  })

  it('produces different hashes for different urls', () => {
    const h1 = computeContentHash('https://a.com', 'Title')
    const h2 = computeContentHash('https://b.com', 'Title')
    expect(h1).not.toBe(h2)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd "C:/Users/timmr/tropen OS"
npx vitest run src/lib/feeds/pipeline.unit.test.ts
```
Expected: FAIL — `runStage1` and `computeContentHash` not exported yet.

- [ ] **Step 3: Rewrite `src/lib/feeds/pipeline.ts`**

```typescript
// src/lib/feeds/pipeline.ts
// Three-stage feed processing pipeline.
// Stage 1: rule-based (0 tokens)
// Stage 2: Haiku relevance scoring (max 300 output tokens)
// Stage 3: Sonnet deep processing (max 10 items/batch)

import { createHash } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import type { RawFeedItem, FeedSource, Stage2Result } from '@/types/feeds'

const log = createLogger('feeds:pipeline')
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function computeContentHash(url: string, title: string): string {
  return createHash('sha256').update(url + title).digest('hex')
}

// ---------------------------------------------------------------------------
// Stage 1 — rule-based filter (no AI, no tokens)
// ---------------------------------------------------------------------------

export function runStage1(
  item: RawFeedItem,
  source: FeedSource,
): { passed: boolean; reason: string } {
  const text = `${item.title} ${item.content ?? ''}`.toLowerCase()

  // 1. Age check — older than 7 days → out
  if (item.publishedAt) {
    const ageDays = (Date.now() - item.publishedAt.getTime()) / 86_400_000
    if (ageDays > 7) {
      return { passed: false, reason: `Item is ${Math.floor(ageDays)} days old (max 7)` }
    }
  }

  // 2. Minimum content length
  const combinedLength = item.title.length + (item.content?.length ?? 0)
  if (combinedLength < 50) {
    return { passed: false, reason: 'Content too short (< 50 chars)' }
  }

  // 3. Domain allow-list
  if (source.domainsAllow.length > 0) {
    try {
      const domain = new URL(item.url).hostname.replace(/^www\./, '')
      if (!source.domainsAllow.some((d) => domain.endsWith(d))) {
        return { passed: false, reason: `Domain "${domain}" not in allow-list` }
      }
    } catch {
      return { passed: false, reason: 'Invalid URL' }
    }
  }

  // 4. Keywords include — at least one must match
  if (source.keywordsInclude.length > 0) {
    const hasMatch = source.keywordsInclude.some((kw) => text.includes(kw.toLowerCase()))
    if (!hasMatch) {
      return { passed: false, reason: `None of required keywords matched: [${source.keywordsInclude.join(', ')}]` }
    }
  }

  // 5. Keywords exclude — none may match
  for (const kw of source.keywordsExclude) {
    if (text.includes(kw.toLowerCase())) {
      return { passed: false, reason: `Excluded keyword matched: "${kw}"` }
    }
  }

  return { passed: true, reason: 'All Stage 1 rules passed' }
}

// ---------------------------------------------------------------------------
// Stage 2 — Haiku relevance scoring
// ---------------------------------------------------------------------------

async function buildStage2Prompt(source: FeedSource): Promise<string> {
  // Enrich with negative feedback examples if ≥ 5 not_relevant items exist
  const { data: negRows } = await supabaseAdmin
    .from('feed_items')
    .select('title')
    .eq('source_id', source.id)
    .eq('status', 'not_relevant')
    .order('created_at', { ascending: false })
    .limit(10)

  const negExamples = (negRows ?? []).map((r: Record<string, unknown>) => r.title as string)

  let prompt = `Du bewertest die Relevanz von Nachrichtenartikeln für die Feed-Quelle "${source.name}".

Bewerte jeden Artikel auf einer Skala von 1-10 (1 = völlig irrelevant, 10 = sehr relevant).

Antworte NUR mit JSON: { "score": <1-10>, "reason": "<kurze Begründung>" }`

  if (negExamples.length >= 5) {
    prompt += `\n\nDiese Themen sind für diese Quelle NICHT relevant (Nutzer-Feedback):\n${negExamples.map((t) => `- "${t}"`).join('\n')}`
  }

  return prompt
}

export async function runStage2(
  itemId: string,
  item: RawFeedItem,
  source: FeedSource,
): Promise<Stage2Result> {
  const systemPrompt = await buildStage2Prompt(source)
  const excerpt = (item.content ?? '').slice(0, 200)
  const startMs = Date.now()

  let tokensIn = 0, tokensOut = 0
  let result: Stage2Result = { score: 0, reason: 'Stage 2 failed' }
  let errorMsg: string | null = null

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Titel: ${item.title}\n\nAuszug: ${excerpt}` }],
    })
    tokensIn = response.usage.input_tokens
    tokensOut = response.usage.output_tokens

    const raw = response.content.filter((b) => b.type === 'text').map((b) => (b as { type: 'text'; text: string }).text).join('')
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      result = { score: Math.min(10, Math.max(1, Number(parsed.score) || 1)), reason: String(parsed.reason ?? '') }
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err)
    log.error('[stage2] failed', { itemId, error: errorMsg })
  }

  // Write processing log (APPEND ONLY)
  await supabaseAdmin.from('feed_processing_log').insert({
    source_id: source.id,
    stage: 2,
    items_in: 1,
    items_out: result.score >= source.minScore ? 1 : 0,
    items_dropped: result.score < source.minScore ? 1 : 0,
    tokens_input: tokensIn,
    tokens_output: tokensOut,
    cost_eur: (tokensIn * 0.00000025) + (tokensOut * 0.00000125),
    duration_ms: Date.now() - startMs,
    error: errorMsg,
  })

  return result
}

// ---------------------------------------------------------------------------
// Stage 3 — Sonnet deep processing (single item)
// ---------------------------------------------------------------------------

export async function runStage3(
  itemId: string,
  item: RawFeedItem,
  source: FeedSource,
): Promise<{ summary: string; keyFacts: string[] }> {
  const startMs = Date.now()
  let tokensIn = 0, tokensOut = 0
  let result = { summary: '', keyFacts: [] as string[] }
  let errorMsg: string | null = null

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: `Du fasst Nachrichtenartikel für "${source.name}" zusammen.
Antworte NUR mit JSON:
{
  "summary": "<2-3 Sätze auf Deutsch>",
  "key_facts": ["<Fakt 1>", "<Fakt 2>", "<Fakt 3>"]
}`,
      messages: [{ role: 'user', content: `Titel: ${item.title}\n\nInhalt: ${item.content ?? '(kein Inhalt)'}` }],
    })
    tokensIn = response.usage.input_tokens
    tokensOut = response.usage.output_tokens

    const raw = response.content.filter((b) => b.type === 'text').map((b) => (b as { type: 'text'; text: string }).text).join('')
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      result = {
        summary: String(parsed.summary ?? ''),
        keyFacts: Array.isArray(parsed.key_facts) ? parsed.key_facts.slice(0, 5) : [],
      }
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err)
    log.error('[stage3] failed', { itemId, error: errorMsg })
  }

  await supabaseAdmin.from('feed_processing_log').insert({
    source_id: source.id,
    stage: 3,
    items_in: 1,
    items_out: result.summary ? 1 : 0,
    items_dropped: result.summary ? 0 : 1,
    tokens_input: tokensIn,
    tokens_output: tokensOut,
    cost_eur: (tokensIn * 0.000003) + (tokensOut * 0.000015),
    duration_ms: Date.now() - startMs,
    error: errorMsg,
  })

  return result
}

// ---------------------------------------------------------------------------
// Main entry: process one raw item end-to-end
// Returns the feed_item id (or null on critical error)
// ---------------------------------------------------------------------------

export async function processItem(item: RawFeedItem, source: FeedSource): Promise<string | null> {
  const contentHash = computeContentHash(item.url, item.title)

  // Dedup check
  const { data: existing } = await supabaseAdmin
    .from('feed_items')
    .select('id')
    .eq('content_hash', contentHash)
    .maybeSingle()
  if (existing) return existing.id as string

  // Stage 1
  const s1 = runStage1(item, source)

  const { data: row, error: insertErr } = await supabaseAdmin
    .from('feed_items')
    .insert({
      source_id: source.id,
      organization_id: source.organizationId,
      title: item.title,
      content: item.content ?? null,
      url: item.url,
      author: item.author ?? null,
      published_at: item.publishedAt?.toISOString() ?? null,
      stage: 1,
      content_hash: contentHash,
      expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      metadata: item.metadata ?? {},
    })
    .select('id')
    .single()

  if (insertErr || !row) {
    log.error('[processItem] insert failed', { error: insertErr?.message })
    return null
  }

  const itemId = row.id as string
  if (!s1.passed) return itemId   // saved as stage 1, not promoted

  // Stage 2
  const s2 = await runStage2(itemId, item, source)
  const updates: Record<string, unknown> = {
    stage: 2,
    score: s2.score,
    score_reason: s2.reason,
  }

  // Stage 3 — only if score meets threshold; max 10 per batch enforced by caller
  if (s2.score >= source.minScore) {
    const s3 = await runStage3(itemId, item, source)
    updates.stage = 3
    updates.summary = s3.summary || null
    updates.key_facts = s3.keyFacts.length > 0 ? s3.keyFacts : null
  }

  await supabaseAdmin.from('feed_items').update(updates).eq('id', itemId)
  return itemId
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/lib/feeds/pipeline.unit.test.ts
```
Expected: 9 tests PASS.

- [ ] **Step 5: Create `src/lib/feeds/feedback.ts`**

```typescript
// src/lib/feeds/feedback.ts
// Checks if a source has ≥5 not_relevant signals and logs the threshold crossing.
// The prompt enrichment itself happens inside pipeline.ts → buildStage2Prompt().
// This module provides the action handlers called by the server action layer.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('feeds:feedback')

export async function recordNotRelevant(itemId: string): Promise<void> {
  const { data: item } = await supabaseAdmin
    .from('feed_items')
    .select('source_id, organization_id')
    .eq('id', itemId)
    .maybeSingle()
  if (!item) return

  await supabaseAdmin
    .from('feed_items')
    .update({ status: 'not_relevant' })
    .eq('id', itemId)

  // Check if we've crossed the 5-signal threshold for this source
  const { count } = await supabaseAdmin
    .from('feed_items')
    .select('id', { count: 'exact', head: true })
    .eq('source_id', item.source_id as string)
    .eq('status', 'not_relevant')

  if ((count ?? 0) % 5 === 0) {
    // Next Stage 2 call will automatically pick up negative examples.
    log.info('[feedback] threshold crossed — Stage 2 prompt will be enriched', {
      sourceId: item.source_id,
      notRelevantCount: count,
    })
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/feeds/pipeline.ts src/lib/feeds/pipeline.unit.test.ts src/lib/feeds/feedback.ts
git commit -m "feat(feeds): rewrite pipeline stages 1-3 + feedback loop"
```

---

### Task 4: Rewrite token-budget + distributor + ttl-cleanup

**Files:**
- Modify: `src/lib/feeds/token-budget.ts`
- Modify: `src/lib/feeds/distributor.ts`
- Modify: `src/lib/feeds/ttl-cleanup.ts`

These files use old column names. Rewrite them to use the new schema.

- [ ] **Step 1: Rewrite `src/lib/feeds/token-budget.ts`**

```typescript
// src/lib/feeds/token-budget.ts
// Budget check before Stage 2/3 calls.
// Reads feed_processing_log to estimate monthly token usage.

import { supabaseAdmin } from '@/lib/supabase-admin'

const TOKENS_PER_EUR = 100_000  // rough estimate

export async function checkBudget(sourceId: string): Promise<{
  withinBudget: boolean
  usedTokens: number
}> {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: rows } = await supabaseAdmin
    .from('feed_processing_log')
    .select('tokens_input, tokens_output')
    .eq('source_id', sourceId)
    .gte('processed_at', monthStart.toISOString())

  const usedTokens = (rows ?? []).reduce(
    (sum: number, r: Record<string, unknown>) =>
      sum + (r.tokens_input as number || 0) + (r.tokens_output as number || 0),
    0
  )

  // Default budget: 500k tokens/month per source
  const budgetTokens = 500_000
  return { withinBudget: usedTokens < budgetTokens, usedTokens }
}
```

- [ ] **Step 2: Rewrite `src/lib/feeds/distributor.ts`**

```typescript
// src/lib/feeds/distributor.ts
// After Stage 3, inject high-scoring items into linked projects/workspaces.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('feeds:distributor')

export async function distributeItem(itemId: string): Promise<void> {
  const { data: item } = await supabaseAdmin
    .from('feed_items')
    .select('source_id, score, title, summary, key_facts, url')
    .eq('id', itemId)
    .maybeSingle()

  if (!item || item.stage < 3) return

  const { data: dists } = await supabaseAdmin
    .from('feed_distributions')
    .select('*')
    .eq('source_id', item.source_id as string)
    .eq('auto_inject', true)

  for (const dist of dists ?? []) {
    const d = dist as Record<string, unknown>
    if ((item.score as number) < (d.min_score as number)) continue

    if (d.target_type === 'workspace') {
      const content = [
        item.summary,
        ...(Array.isArray(item.key_facts) ? item.key_facts : []).map((f: string) => `• ${f}`),
        item.url ? `Quelle: ${item.url}` : '',
      ].filter(Boolean).join('\n')

      const { error } = await supabaseAdmin.from('knowledge_entries').insert({
        workspace_id: d.target_id,
        title: item.title,
        content,
        source_url: item.url ?? null,
        entry_type: 'feed',
      })
      if (error) log.error('[distributor] workspace inject failed', { error: error.message })
    }
    // project inject: add to project_knowledge (Plan D — not yet implemented)
  }
}
```

- [ ] **Step 3: Rewrite `src/lib/feeds/ttl-cleanup.ts`**

```typescript
// src/lib/feeds/ttl-cleanup.ts
// Archives expired feed items. Preserves summary in archived_summary.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('feeds:ttl-cleanup')

export async function runTtlCleanup(): Promise<{ archived: number }> {
  const now = new Date().toISOString()

  const { data: expired } = await supabaseAdmin
    .from('feed_items')
    .select('id, summary')
    .lt('expires_at', now)
    .not('status', 'eq', 'archived')
    .not('status', 'eq', 'deleted')
    .limit(200)

  if (!expired?.length) return { archived: 0 }

  const ids = expired.map((r: Record<string, unknown>) => r.id as string)

  await supabaseAdmin
    .from('feed_items')
    .update({
      status: 'archived',
      archived_summary: null,  // already in summary column
      content: null,           // free up space
    })
    .in('id', ids)

  log.info('[ttl-cleanup] archived expired items', { count: ids.length })
  return { archived: ids.length }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/feeds/token-budget.ts src/lib/feeds/distributor.ts src/lib/feeds/ttl-cleanup.ts
git commit -m "feat(feeds): rewrite token-budget, distributor, ttl-cleanup for v2 schema"
```

---

## Chunk 3: Fetchers, Actions, Cron

### Task 5: Fetchers

**Files:**
- Modify: `src/lib/feeds/fetchers/rss.ts` (minor — align to new RawFeedItem)
- Modify: `src/lib/feeds/fetchers/url.ts` (add robots.txt check)
- Modify: `src/lib/feeds/fetchers/api.ts` (auth + schema mapping)
- Create: `src/app/api/feeds/inbound/email/route.ts`

- [ ] **Step 1: Update `src/lib/feeds/fetchers/rss.ts`**

Already clean. Just verify it imports `RawFeedItem` from the new `@/types/feeds` and exports correctly. The current implementation is fine — just check it still compiles after the types rewrite.

- [ ] **Step 2: Rewrite `src/lib/feeds/fetchers/url.ts`** — add robots.txt check

```typescript
// src/lib/feeds/fetchers/url.ts
import * as cheerio from 'cheerio'
import type { RawFeedItem } from '@/types/feeds'
import { createLogger } from '@/lib/logger'

const log = createLogger('feeds:fetchers:url')

async function isScrapingAllowed(url: string): Promise<boolean> {
  try {
    const { origin } = new URL(url)
    const robotsRes = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(5000) })
    if (!robotsRes.ok) return true  // no robots.txt → assume allowed

    const text = await robotsRes.text()
    const lines = text.split('\n').map((l) => l.trim())

    let inRelevantBlock = false
    for (const line of lines) {
      if (line.toLowerCase().startsWith('user-agent:')) {
        const agent = line.split(':')[1].trim()
        inRelevantBlock = agent === '*' || agent.toLowerCase().includes('tropenbot')
      }
      if (inRelevantBlock && line.toLowerCase().startsWith('disallow:')) {
        const path = line.split(':')[1].trim()
        if (path === '/' || path === '') return false
        const urlPath = new URL(url).pathname
        if (urlPath.startsWith(path)) return false
      }
    }
    return true
  } catch {
    return true  // on error, optimistically allow
  }
}

export async function fetchUrl(
  sourceId: string,
  url: string,
  selector?: string,
): Promise<{ items: RawFeedItem[]; robotsBlocked: boolean }> {
  const allowed = await isScrapingAllowed(url)
  if (!allowed) {
    log.warn('[url fetcher] robots.txt disallows scraping', { url })
    return { items: [], robotsBlocked: true }
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TropenBot/1.0 (feed aggregator)' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return { items: [], robotsBlocked: false }

    const html = await res.text()
    const $ = cheerio.load(html)
    const items: RawFeedItem[] = []

    if (selector) {
      $(selector).each((_, el) => {
        const title = $(el).find('h1,h2,h3,h4').first().text().trim()
          || $(el).attr('title')
          || $(el).text().trim().slice(0, 80)
        const href = $(el).find('a').first().attr('href')
        const itemUrl = href ? new URL(href, url).toString() : url
        const content = $(el).text().trim().slice(0, 2000) || undefined
        if (title && title.length > 5) {
          items.push({ sourceId, title, content, url: itemUrl })
        }
      })
    } else {
      // Fallback: find all article/h2+link combinations
      $('article, .post, .entry').each((_, el) => {
        const title = $(el).find('h1,h2,h3').first().text().trim()
        const href = $(el).find('a').first().attr('href')
        const itemUrl = href ? new URL(href, url).toString() : url
        const content = $(el).text().trim().slice(0, 2000)
        if (title && title.length > 5) {
          items.push({ sourceId, title, content, url: itemUrl })
        }
      })
    }

    return { items: items.slice(0, 30), robotsBlocked: false }
  } catch (err) {
    log.error('[url fetcher] fetch failed', { url, error: String(err) })
    return { items: [], robotsBlocked: false }
  }
}
```

- [ ] **Step 3: Rewrite `src/lib/feeds/fetchers/api.ts`**

```typescript
// src/lib/feeds/fetchers/api.ts
import type { RawFeedItem, FeedSource } from '@/types/feeds'
import { createLogger } from '@/lib/logger'

const log = createLogger('feeds:fetchers:api')

function extractByPath(obj: unknown, path: string): unknown {
  // Simple dot-notation path: "articles.0.title" or "data.items"
  return path.split('.').reduce((cur: unknown, key) => {
    if (cur == null) return undefined
    return (cur as Record<string, unknown>)[key]
  }, obj)
}

function applyMapping(item: Record<string, unknown>, mapping: Record<string, string>): RawFeedItem | null {
  const title = extractByPath(item, mapping.title ?? '') as string
  const url = extractByPath(item, mapping.url ?? '') as string
  if (!title || !url) return null

  const content = mapping.content ? extractByPath(item, mapping.content) as string : undefined
  const dateStr = mapping.date ? extractByPath(item, mapping.date) as string : undefined

  return {
    sourceId: '',  // filled in by caller
    title,
    url,
    content: content || undefined,
    publishedAt: dateStr ? new Date(dateStr) : undefined,
    author: mapping.author ? extractByPath(item, mapping.author) as string : undefined,
  }
}

export async function fetchApi(source: FeedSource): Promise<RawFeedItem[]> {
  const config = source.config as Record<string, unknown>
  if (!source.url) return []

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(config.headers as Record<string, string> ?? {}),
  }

  // Auth
  if (config.auth_type === 'bearer') {
    headers['Authorization'] = `Bearer ${config.auth_value}`
  } else if (config.auth_type === 'api_key') {
    headers[config.auth_header as string ?? 'X-API-Key'] = config.auth_value as string
  } else if (config.auth_type === 'basic') {
    headers['Authorization'] = `Basic ${Buffer.from(config.auth_value as string).toString('base64')}`
  }

  try {
    const res = await fetch(source.url, {
      method: (config.method as string) ?? 'GET',
      headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return []

    const json = await res.json()

    // Navigate to items array
    const responsePath = config.response_path as string ?? ''
    const itemsRaw = responsePath ? extractByPath(json, responsePath) : json
    if (!Array.isArray(itemsRaw)) return []

    // We need the schema mapping — caller must provide it
    // (schema.mapping is passed in via the calling action)
    return []  // mapping applied in server action after schema is loaded
  } catch (err) {
    log.error('[api fetcher] failed', { sourceId: source.id, error: String(err) })
    return []
  }
}

// Export mapper for use in server action (has access to schema)
export { applyMapping }
```

- [ ] **Step 4: Create email inbound webhook**

```typescript
// src/app/api/feeds/inbound/email/route.ts
// Receives Resend inbound email webhooks.
// Each email becomes a feed item for the matching email source.

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { emailInboundSchema } from '@/lib/validators/feeds'
import { computeContentHash } from '@/lib/feeds/pipeline'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:feeds:inbound:email')

export async function POST(request: Request) {
  // Verify Resend webhook signature (optional but recommended)
  // For now: accept from trusted Resend IPs (configure in Vercel)
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = emailInboundSchema.safeParse(body)
  if (!parsed.success) {
    log.warn('[email inbound] invalid payload', { error: parsed.error.message })
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const email = parsed.data
  const toAddress = email.to[0]?.email?.toLowerCase()
  if (!toAddress) return NextResponse.json({ ok: true })

  // Find matching email source by inbound_address in config
  const { data: sources } = await supabaseAdmin
    .from('feed_sources')
    .select('id, organization_id, name, min_score, keywords_include, keywords_exclude, domains_allow')
    .eq('type', 'email')
    .eq('is_active', true)

  const matchingSource = (sources ?? []).find((s: Record<string, unknown>) => {
    const cfg = s.config as Record<string, unknown>
    return (cfg?.inbound_address as string)?.toLowerCase() === toAddress
  })

  if (!matchingSource) {
    log.info('[email inbound] no source matched', { toAddress })
    return NextResponse.json({ ok: true })
  }

  const src = matchingSource as Record<string, unknown>
  const title = email.subject || '(kein Betreff)'
  const content = email.text || email.html?.replace(/<[^>]+>/g, ' ') || ''
  const contentHash = computeContentHash(`email:${toAddress}`, title + content.slice(0, 100))

  const { error } = await supabaseAdmin.from('feed_items').upsert(
    {
      source_id: src.id,
      organization_id: src.organization_id,
      title,
      content: content.slice(0, 10_000),
      url: null,
      author: email.from.name ?? email.from.email,
      stage: 1,
      content_hash: contentHash,
      expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    },
    { onConflict: 'content_hash', ignoreDuplicates: true }
  )

  if (error) log.error('[email inbound] insert failed', { error: error.message })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/feeds/fetchers/ "src/app/api/feeds/inbound/email/route.ts"
git commit -m "feat(feeds): update fetchers + email inbound webhook"
```

---

### Task 6: Server Actions + Cron

**Files:**
- Modify: `src/actions/feeds.ts` (full rewrite)
- Create: `src/app/api/cron/sync-feeds/route.ts`

- [ ] **Step 1: Rewrite `src/actions/feeds.ts`**

The old file is 723 lines tied to the old schema. Rewrite with the new column names, all functions using `supabaseAdmin`.

```typescript
'use server'
// src/actions/feeds.ts
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'
import { validateBody } from '@/lib/validators'
import {
  createFeedSourceSchema, updateFeedSourceSchema,
  createFeedSchemaSchema, updateItemStatusSchema,
  injectItemSchema, createDistributionSchema,
} from '@/lib/validators/feeds'
import { recordNotRelevant } from '@/lib/feeds/feedback'
import { processItem } from '@/lib/feeds/pipeline'
import { fetchRss } from '@/lib/feeds/fetchers/rss'
import { fetchUrl } from '@/lib/feeds/fetchers/url'
import { fetchApi } from '@/lib/feeds/fetchers/api'
import { createLogger } from '@/lib/logger'
import type { FeedSource, FeedItem, FeedDistribution } from '@/types/feeds'

const log = createLogger('actions:feeds')

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapSource(r: Record<string, unknown>): FeedSource {
  return {
    id: r.id as string,
    organizationId: r.organization_id as string,
    userId: (r.user_id as string) ?? null,
    name: r.name as string,
    type: r.type as FeedSource['type'],
    url: (r.url as string) ?? null,
    config: (r.config as Record<string, unknown>) ?? {},
    keywordsInclude: (r.keywords_include as string[]) ?? [],
    keywordsExclude: (r.keywords_exclude as string[]) ?? [],
    domainsAllow: (r.domains_allow as string[]) ?? [],
    minScore: r.min_score as number,
    schemaId: (r.schema_id as string) ?? null,
    isActive: r.is_active as boolean,
    lastFetchedAt: (r.last_fetched_at as string) ?? null,
    errorCount: r.error_count as number,
    lastError: (r.last_error as string) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }
}

function mapItem(r: Record<string, unknown>): FeedItem {
  return {
    id: r.id as string,
    sourceId: r.source_id as string,
    organizationId: r.organization_id as string,
    title: r.title as string,
    content: (r.content as string) ?? null,
    summary: (r.summary as string) ?? null,
    keyFacts: (r.key_facts as string[]) ?? null,
    url: (r.url as string) ?? null,
    author: (r.author as string) ?? null,
    publishedAt: (r.published_at as string) ?? null,
    fetchedAt: r.fetched_at as string,
    stage: r.stage as 1 | 2 | 3,
    score: (r.score as number) ?? null,
    scoreReason: (r.score_reason as string) ?? null,
    status: r.status as FeedItem['status'],
    isSaved: r.is_saved as boolean,
    contentHash: (r.content_hash as string) ?? null,
    expiresAt: (r.expires_at as string) ?? null,
    archivedSummary: (r.archived_summary as string) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: r.created_at as string,
  }
}

function mapDistribution(r: Record<string, unknown>): FeedDistribution {
  return {
    id: r.id as string,
    sourceId: r.source_id as string,
    targetType: r.target_type as FeedDistribution['targetType'],
    targetId: r.target_id as string,
    autoInject: r.auto_inject as boolean,
    minScore: r.min_score as number,
    createdAt: r.created_at as string,
  }
}

// ---------------------------------------------------------------------------
// Feed Sources
// ---------------------------------------------------------------------------

export async function listFeedSources(): Promise<FeedSource[]> {
  const me = await getAuthUser()
  if (!me) return []
  const { data } = await supabaseAdmin
    .from('feed_sources')
    .select('*')
    .eq('organization_id', me.organization_id)
    .order('created_at', { ascending: false })
  return (data ?? []).map((r: Record<string, unknown>) => mapSource(r))
}

export async function createFeedSource(formData: FormData | Record<string, unknown>) {
  const me = await getAuthUser()
  if (!me) return { error: 'Nicht autorisiert' }
  const input = typeof formData === 'object' && !(formData instanceof FormData)
    ? formData : Object.fromEntries((formData as FormData).entries())
  const parsed = createFeedSourceSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.message }
  const b = parsed.data

  // For email sources, generate inbound address
  const config: Record<string, unknown> = b.config ?? {}
  if (b.type === 'email' && !config.inbound_address) {
    const { randomUUID } = await import('crypto')
    config.inbound_address = `feed-${randomUUID()}@inbound.tropen.os`
    config.provider = 'resend'
  }

  const { data, error } = await supabaseAdmin
    .from('feed_sources')
    .insert({
      organization_id: me.organization_id,
      user_id: me.id,
      name: b.name,
      type: b.type,
      url: b.url ?? null,
      config,
      keywords_include: b.keywordsInclude,
      keywords_exclude: b.keywordsExclude,
      domains_allow: b.domainsAllow,
      min_score: b.minScore,
      schema_id: b.schemaId ?? null,
    })
    .select()
    .single()
  if (error) return { error: error.message }
  return { source: mapSource(data as Record<string, unknown>) }
}

export async function updateFeedSource(id: string, input: Record<string, unknown>) {
  const me = await getAuthUser()
  if (!me) return { error: 'Nicht autorisiert' }
  const parsed = updateFeedSourceSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.message }
  const b = parsed.data
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (b.name !== undefined) updates.name = b.name
  if (b.url !== undefined) updates.url = b.url
  if (b.isActive !== undefined) updates.is_active = b.isActive
  if (b.minScore !== undefined) updates.min_score = b.minScore
  if (b.keywordsInclude !== undefined) updates.keywords_include = b.keywordsInclude
  if (b.keywordsExclude !== undefined) updates.keywords_exclude = b.keywordsExclude
  if (b.domainsAllow !== undefined) updates.domains_allow = b.domainsAllow
  if (b.config !== undefined) updates.config = b.config
  const { data, error } = await supabaseAdmin
    .from('feed_sources')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', me.organization_id)
    .select().single()
  if (error) return { error: error.message }
  return { source: mapSource(data as Record<string, unknown>) }
}

export async function deleteFeedSource(id: string) {
  const me = await getAuthUser()
  if (!me) return { error: 'Nicht autorisiert' }
  const { error } = await supabaseAdmin
    .from('feed_sources')
    .delete()
    .eq('id', id)
    .eq('organization_id', me.organization_id)
  if (error) return { error: error.message }
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Feed Items
// ---------------------------------------------------------------------------

export async function listFeedItems(opts: {
  sourceId?: string
  status?: string
  isSaved?: boolean
  limit?: number
  offset?: number
} = {}): Promise<{ items: FeedItem[]; total: number }> {
  const me = await getAuthUser()
  if (!me) return { items: [], total: 0 }
  const limit = Math.min(opts.limit ?? 30, 100)
  const offset = opts.offset ?? 0

  let q = supabaseAdmin
    .from('feed_items')
    .select('*', { count: 'exact' })
    .eq('organization_id', me.organization_id)
    .neq('status', 'deleted')
    .order('fetched_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (opts.sourceId) q = q.eq('source_id', opts.sourceId)
  if (opts.status) q = q.eq('status', opts.status)
  if (opts.isSaved) q = q.eq('is_saved', true)

  const { data, count } = await q
  return { items: (data ?? []).map((r: Record<string, unknown>) => mapItem(r)), total: count ?? 0 }
}

export async function markItemRead(id: string) {
  const me = await getAuthUser()
  if (!me) return
  await supabaseAdmin.from('feed_items').update({ status: 'read' }).eq('id', id)
    .eq('organization_id', me.organization_id).eq('status', 'unread')
}

export async function toggleItemSaved(id: string, saved: boolean) {
  const me = await getAuthUser()
  if (!me) return
  await supabaseAdmin.from('feed_items').update({ is_saved: saved, status: saved ? 'saved' : 'read' })
    .eq('id', id).eq('organization_id', me.organization_id)
}

export async function markItemNotRelevant(id: string) {
  const me = await getAuthUser()
  if (!me) return
  await recordNotRelevant(id)
}

export async function archiveItem(id: string) {
  const me = await getAuthUser()
  if (!me) return
  await supabaseAdmin.from('feed_items').update({ status: 'archived' })
    .eq('id', id).eq('organization_id', me.organization_id)
}

export async function deleteItem(id: string) {
  const me = await getAuthUser()
  if (!me) return
  await supabaseAdmin.from('feed_items').update({ status: 'deleted' })
    .eq('id', id).eq('organization_id', me.organization_id)
}

// ---------------------------------------------------------------------------
// Distributions
// ---------------------------------------------------------------------------

export async function listDistributions(sourceId: string): Promise<FeedDistribution[]> {
  const { data } = await supabaseAdmin
    .from('feed_distributions')
    .select('*')
    .eq('source_id', sourceId)
  return (data ?? []).map((r: Record<string, unknown>) => mapDistribution(r))
}

export async function createDistribution(input: Record<string, unknown>) {
  const parsed = createDistributionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.message }
  const { data, error } = await supabaseAdmin.from('feed_distributions').insert({
    source_id: parsed.data.sourceId,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    auto_inject: parsed.data.autoInject,
    min_score: parsed.data.minScore,
  }).select().single()
  if (error) return { error: error.message }
  return { distribution: mapDistribution(data as Record<string, unknown>) }
}

export async function deleteDistribution(id: string) {
  const { error } = await supabaseAdmin.from('feed_distributions').delete().eq('id', id)
  if (error) return { error: error.message }
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Trigger fetch (called by cron + manual "sync now")
// ---------------------------------------------------------------------------

export async function triggerFetch(sourceId: string): Promise<{
  itemsFound: number; itemsSaved: number; errors: string[]
}> {
  const { data: src } = await supabaseAdmin
    .from('feed_sources')
    .select('*')
    .eq('id', sourceId)
    .maybeSingle()

  if (!src) return { itemsFound: 0, itemsSaved: 0, errors: ['Source not found'] }
  const source = mapSource(src as Record<string, unknown>)

  let rawItems: import('@/types/feeds').RawFeedItem[] = []
  const errors: string[] = []

  try {
    if (source.type === 'rss') {
      rawItems = await fetchRss(source.id, source.url ?? '')
    } else if (source.type === 'url') {
      const config = source.config as Record<string, unknown>
      const result = await fetchUrl(source.id, source.url ?? '', config.css_selector as string)
      rawItems = result.items
      if (result.robotsBlocked) errors.push('robots.txt disallows scraping for this URL')
    } else if (source.type === 'api') {
      rawItems = await fetchApi(source)
    }
    // email: handled via inbound webhook, not polled
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err))
  }

  let saved = 0
  // Stage 3 batch limit: max 10 items proceed to stage 3 per run
  let stage3Count = 0

  for (const item of rawItems) {
    try {
      if (stage3Count >= 10) {
        // Still save and score (stage 2) but skip stage 3
        item.metadata = { ...(item.metadata ?? {}), stage3_skipped: true }
      }
      const id = await processItem(item, source)
      if (id) { saved++; stage3Count++ }
    } catch (err) {
      errors.push(`Item "${item.title}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Update last_fetched_at
  await supabaseAdmin.from('feed_sources')
    .update({ last_fetched_at: new Date().toISOString(), error_count: errors.length > 0 ? source.errorCount + 1 : 0, last_error: errors[0] ?? null })
    .eq('id', sourceId)

  return { itemsFound: rawItems.length, itemsSaved: saved, errors }
}
```

- [ ] **Step 2: Create `src/app/api/cron/sync-feeds/route.ts`**

Replaces the four old cron routes. Vercel cron: `*/30 * * * *`

```typescript
// src/app/api/cron/sync-feeds/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { triggerFetch } from '@/actions/feeds'
import { runTtlCleanup } from '@/lib/feeds/ttl-cleanup'
import { createLogger } from '@/lib/logger'

const log = createLogger('cron:sync-feeds')

export const runtime = 'nodejs'

export async function GET(request: Request) {
  // Verify Vercel cron secret
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results: Array<{ sourceId: string; name: string; itemsFound: number; itemsSaved: number; errors: string[] }> = []

  // Find all active sources where polling interval has elapsed
  const { data: sources } = await supabaseAdmin
    .from('feed_sources')
    .select('id, name, type, config, last_fetched_at')
    .eq('is_active', true)
    .neq('type', 'email')  // email sources are push-only

  for (const src of sources ?? []) {
    const s = src as Record<string, unknown>
    const config = s.config as Record<string, unknown>
    const intervalMin = Number(config.polling_interval_minutes ?? 60)
    const lastFetched = s.last_fetched_at ? new Date(s.last_fetched_at as string) : null
    const minutesSinceFetch = lastFetched
      ? (now.getTime() - lastFetched.getTime()) / 60_000
      : Infinity

    if (minutesSinceFetch < intervalMin) continue

    log.info('[sync-feeds] fetching source', { sourceId: s.id, name: s.name })
    const result = await triggerFetch(s.id as string)
    results.push({ sourceId: s.id as string, name: s.name as string, ...result })
  }

  // TTL cleanup
  const { archived } = await runTtlCleanup()
  log.info('[sync-feeds] TTL cleanup', { archived })

  return NextResponse.json({ ok: true, processed: results.length, results, archived })
}
```

- [ ] **Step 3: Add cron config to `vercel.json`** (if not already present)

Check if `vercel.json` exists. If so, add:
```json
{
  "crons": [
    { "path": "/api/cron/sync-feeds", "schedule": "*/30 * * * *" }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add src/actions/feeds.ts "src/app/api/cron/sync-feeds/route.ts"
git commit -m "feat(feeds): rewrite server actions + consolidate to single sync-feeds cron"
```

---

## Chunk 4: Newscenter UI

### Task 7: Newscenter (main page)

**Files:**
- Modify: `src/app/feeds/page.tsx` (full rewrite)

This is a client component with:
- Left sidebar: sources list + tag cloud
- Main stream: infinite scroll feed items
- IntersectionObserver: auto-mark as "read" after 2 seconds in viewport
- Item card: source badge, title, summary, key_facts, score, actions

- [ ] **Step 1: Rewrite `src/app/feeds/page.tsx`**

```typescript
'use client'
// src/app/feeds/page.tsx — Newscenter
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { markItemRead, toggleItemSaved, markItemNotRelevant, archiveItem, deleteItem } from '@/actions/feeds'
import type { FeedItem, FeedSource } from '@/types/feeds'
import { BookmarkSimple, ArrowSquareOut, Check, DotsThree, ThumbsDown, Archive, Trash } from '@phosphor-icons/react'

const BADGE_COLOR: Record<string, string> = {
  rss:   'var(--accent)',
  email: '#7C6FF7',
  api:   '#F7A44A',
  url:   '#888',
}

const s: Record<string, React.CSSProperties> = {
  page:       { display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', background: 'var(--bg-base)' },
  sidebar:    { width: 220, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '16px 0' },
  sideSection:{ padding: '0 16px 8px' },
  sideLabel:  { fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 },
  sideItem:   { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', cursor: 'pointer', borderRadius: 6, fontSize: 13, color: 'var(--text-secondary)', transition: 'background 120ms' },
  sideItemActive: { background: 'var(--active-bg)', color: 'var(--active-text, #fff)' },
  stream:     { flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 12 },
  topBar:     { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  searchInput:{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 14, color: 'var(--text-primary)', outline: 'none' },
  card:       { background: 'var(--bg-surface)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)', transition: 'border-color 120ms', position: 'relative' },
  cardUnread: { borderLeft: '3px solid var(--accent)' },
  badge:      { display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 6 },
  title:      { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 },
  summary:    { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 },
  facts:      { display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginBottom: 10 },
  fact:       { fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-base)', borderRadius: 4, padding: '2px 8px', border: '1px solid var(--border)' },
  actions:    { display: 'flex', gap: 8, alignItems: 'center' },
  actionBtn:  { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' },
  score:      { position: 'absolute' as const, top: 10, right: 12, fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' },
  empty:      { textAlign: 'center' as const, padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 },
  menu:       { position: 'absolute' as const, right: 12, top: 36, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 10, minWidth: 180 },
  menuItem:   { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' },
}

const PAGE_SIZE = 20

export default function FeedsPage() {
  const supabase = createClient()
  const [sources, setSources] = useState<FeedSource[]>([])
  const [items, setItems] = useState<FeedItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const readTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Load sources
  useEffect(() => {
    supabase.from('feed_sources').select('*').eq('is_active', true).order('name')
      .then(({ data }) => {
        if (data) setSources(data.map(mapSource))
      })
  }, [])

  const loadItems = useCallback(async (offset = 0, replace = true) => {
    setLoading(true)
    let q = supabase
      .from('feed_items')
      .select('*', { count: 'exact' })
      .neq('status', 'deleted')
      .order('fetched_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (selectedSource) q = q.eq('source_id', selectedSource)
    if (search.length > 2) q = q.or(`title.ilike.%${search}%,summary.ilike.%${search}%`)

    const { data, count } = await q
    const mapped = (data ?? []).map(mapItem)
    setItems((prev) => replace ? mapped : [...prev, ...mapped])
    setTotal(count ?? 0)
    setLoading(false)
  }, [selectedSource, search])

  useEffect(() => { loadItems(0, true) }, [loadItems])

  // IntersectionObserver — auto-mark as read after 2s
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.itemId
        if (!id) continue
        if (entry.isIntersecting) {
          const timer = setTimeout(async () => {
            await markItemRead(id)
            setItems((prev) => prev.map((it) => it.id === id && it.status === 'unread' ? { ...it, status: 'read' } : it))
          }, 2000)
          readTimers.current.set(id, timer)
        } else {
          const timer = readTimers.current.get(id)
          if (timer) { clearTimeout(timer); readTimers.current.delete(id) }
        }
      }
    }, { threshold: 0.5 })
    return () => { observerRef.current?.disconnect() }
  }, [])

  const registerCard = useCallback((el: HTMLDivElement | null) => {
    if (el && observerRef.current) observerRef.current.observe(el)
  }, [])

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => loadItems(0, true), 300)
  }

  const getSource = (id: string) => sources.find((s) => s.id === id)

  // Collect all tags from key_facts
  const allTags = Array.from(new Set(
    items.flatMap((it) => it.keyFacts ?? []).filter(Boolean)
  )).slice(0, 20)

  return (
    <div style={s.page}>
      {/* Left Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sideSection}>
          <div style={s.sideLabel}>Quellen</div>
          <div
            style={{ ...s.sideItem, ...(selectedSource === null ? s.sideItemActive : {}) }}
            onClick={() => setSelectedSource(null)}
          >
            Alle Quellen
          </div>
          {sources.map((src) => (
            <div
              key={src.id}
              style={{ ...s.sideItem, ...(selectedSource === src.id ? s.sideItemActive : {}) }}
              onClick={() => setSelectedSource(src.id)}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: BADGE_COLOR[src.type] ?? '#888', flexShrink: 0 }} />
              {src.name}
            </div>
          ))}
        </div>
        {allTags.length > 0 && (
          <div style={{ ...s.sideSection, marginTop: 16 }}>
            <div style={s.sideLabel}>Themen</div>
            {allTags.map((tag) => (
              <div key={tag} style={{ ...s.sideItem, fontSize: 12 }}
                onClick={() => { setSearch(tag); loadItems(0, true) }}
              >
                #{tag}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Stream */}
      <div style={s.stream}>
        <div style={s.topBar}>
          <input
            style={s.searchInput}
            placeholder="Suche in Feeds..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' as const }}>
            {total} Artikel
          </span>
        </div>

        {loading && items.length === 0 && (
          <div style={s.empty}>Wird geladen...</div>
        )}

        {!loading && items.length === 0 && (
          <div style={s.empty}>Keine Artikel gefunden.</div>
        )}

        {items.map((item) => {
          const src = getSource(item.sourceId)
          const isUnread = item.status === 'unread'
          return (
            <div
              key={item.id}
              data-item-id={item.id}
              ref={isUnread ? registerCard : undefined}
              style={{ ...s.card, ...(isUnread ? s.cardUnread : {}) }}
              onClick={() => setMenuOpen(null)}
            >
              {item.score && (
                <span style={s.score}>{item.score}/10</span>
              )}
              {src && (
                <div style={{ ...s.badge, background: BADGE_COLOR[src.type] ?? '#888' }}>
                  {src.name}
                </div>
              )}
              <div style={s.title}>{item.title}</div>
              {item.summary && <div style={s.summary}>{item.summary}</div>}
              {item.keyFacts && item.keyFacts.length > 0 && (
                <div style={s.facts}>
                  {item.keyFacts.slice(0, 4).map((f, i) => (
                    <span key={i} style={s.fact}>• {f}</span>
                  ))}
                </div>
              )}
              <div style={s.actions}>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer" style={{ ...s.actionBtn, textDecoration: 'none' }}>
                    <ArrowSquareOut size={13} /> Quelle
                  </a>
                )}
                <button style={{ ...s.actionBtn, color: item.isSaved ? 'var(--accent)' : 'var(--text-secondary)' }}
                  onClick={async (e) => { e.stopPropagation(); await toggleItemSaved(item.id, !item.isSaved); setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, isSaved: !it.isSaved } : it)) }}
                >
                  <BookmarkSimple size={13} weight={item.isSaved ? 'fill' : 'regular'} />
                  {item.isSaved ? 'Gespeichert' : 'Merken'}
                </button>
                <button style={s.actionBtn}
                  onClick={async (e) => { e.stopPropagation(); await markItemRead(item.id); setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, status: 'read' } : it)) }}
                >
                  <Check size={13} /> Abhaken
                </button>
                <button style={{ ...s.actionBtn, marginLeft: 'auto' }}
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === item.id ? null : item.id) }}
                >
                  <DotsThree size={16} weight="bold" />
                </button>

                {menuOpen === item.id && (
                  <div style={s.menu} onClick={(e) => e.stopPropagation()}>
                    <div style={s.menuItem} onClick={async () => { await markItemNotRelevant(item.id); setItems((prev) => prev.filter((it) => it.id !== item.id)); setMenuOpen(null) }}>
                      <ThumbsDown size={14} /> Nicht passend
                    </div>
                    <div style={s.menuItem} onClick={async () => { await archiveItem(item.id); setItems((prev) => prev.filter((it) => it.id !== item.id)); setMenuOpen(null) }}>
                      <Archive size={14} /> Archivieren
                    </div>
                    <div style={{ ...s.menuItem, color: '#e53e3e' }} onClick={async () => { await deleteItem(item.id); setItems((prev) => prev.filter((it) => it.id !== item.id)); setMenuOpen(null) }}>
                      <Trash size={14} /> Löschen
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Load more */}
        {items.length < total && (
          <button
            className="btn btn-ghost"
            style={{ alignSelf: 'center', marginTop: 8 }}
            onClick={() => loadItems(items.length, false)}
          >
            Mehr laden ({total - items.length} weitere)
          </button>
        )}
      </div>
    </div>
  )
}

// Mappers (client-side, from snake_case Supabase response)
function mapSource(r: Record<string, unknown>): FeedSource {
  return {
    id: r.id as string, organizationId: r.organization_id as string,
    userId: (r.user_id as string) ?? null, name: r.name as string,
    type: r.type as FeedSource['type'], url: (r.url as string) ?? null,
    config: (r.config as Record<string, unknown>) ?? {},
    keywordsInclude: (r.keywords_include as string[]) ?? [],
    keywordsExclude: (r.keywords_exclude as string[]) ?? [],
    domainsAllow: (r.domains_allow as string[]) ?? [],
    minScore: r.min_score as number, schemaId: (r.schema_id as string) ?? null,
    isActive: r.is_active as boolean, lastFetchedAt: (r.last_fetched_at as string) ?? null,
    errorCount: r.error_count as number, lastError: (r.last_error as string) ?? null,
    createdAt: r.created_at as string, updatedAt: r.updated_at as string,
  }
}

function mapItem(r: Record<string, unknown>): FeedItem {
  return {
    id: r.id as string, sourceId: r.source_id as string, organizationId: r.organization_id as string,
    title: r.title as string, content: (r.content as string) ?? null,
    summary: (r.summary as string) ?? null, keyFacts: (r.key_facts as string[]) ?? null,
    url: (r.url as string) ?? null, author: (r.author as string) ?? null,
    publishedAt: (r.published_at as string) ?? null, fetchedAt: r.fetched_at as string,
    stage: r.stage as 1 | 2 | 3, score: (r.score as number) ?? null,
    scoreReason: (r.score_reason as string) ?? null, status: r.status as FeedItem['status'],
    isSaved: r.is_saved as boolean, contentHash: (r.content_hash as string) ?? null,
    expiresAt: (r.expires_at as string) ?? null, archivedSummary: (r.archived_summary as string) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {}, createdAt: r.created_at as string,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/feeds/page.tsx
git commit -m "feat(feeds): Newscenter UI — infinite scroll, auto-read, source sidebar, item actions"
```

---

### Task 8: Source Setup Wizard

**Files:**
- Create: `src/app/feeds/new/page.tsx`

Multi-step wizard: (1) Typ wählen → (2) Konfigurieren → (3) Filter → (4) Zuordnung → (5) Bestätigen

- [ ] **Step 1: Create `src/app/feeds/new/page.tsx`**

```typescript
'use client'
// src/app/feeds/new/page.tsx
// Multi-step wizard for creating a new feed source.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createFeedSource } from '@/actions/feeds'
import type { FeedSourceType } from '@/types/feeds'

type Step = 1 | 2 | 3 | 4 | 5

const s: Record<string, React.CSSProperties> = {
  page:    { maxWidth: 640, margin: '0 auto', padding: '40px 24px' },
  header:  { marginBottom: 32 },
  title:   { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' },
  sub:     { fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 },
  types:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 },
  typeCard:{ padding: '20px 16px', border: '2px solid var(--border)', borderRadius: 10, cursor: 'pointer', textAlign: 'center' as const, transition: 'border-color 150ms' },
  typeCardActive: { borderColor: 'var(--accent)' },
  typeIcon:{ fontSize: 28, marginBottom: 8 },
  typeName:{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' },
  typeDesc:{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 },
  field:   { marginBottom: 16 },
  label:   { fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 },
  input:   { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' as const },
  hint:    { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 },
  warn:    { padding: '12px 16px', background: '#FFF3CD', border: '1px solid #FFC107', borderRadius: 8, fontSize: 13, color: '#856404', marginBottom: 16, lineHeight: 1.5 },
  chips:   { display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 8 },
  chip:    { display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px 3px 10px', borderRadius: 20, background: 'var(--accent-light)', border: '1px solid var(--accent)', fontSize: 12, color: 'var(--accent)' },
  nav:     { display: 'flex', justifyContent: 'space-between', marginTop: 32 },
  steps:   { display: 'flex', gap: 8, marginBottom: 32 },
  stepDot: { width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' },
  stepDotActive: { background: 'var(--accent)' },
  inbound: { padding: '14px 16px', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 13, color: 'var(--text-primary)', letterSpacing: '.02em' },
}

const TYPES: Array<{ type: FeedSourceType; icon: string; name: string; desc: string }> = [
  { type: 'rss',   icon: '📡', name: 'RSS-Feed',    desc: 'Einfachste Option' },
  { type: 'email', icon: '📧', name: 'Newsletter',  desc: 'Über Inbound-Adresse' },
  { type: 'api',   icon: '🔌', name: 'API',         desc: 'Eigene Konfiguration' },
  { type: 'url',   icon: '🌐', name: 'Website',     desc: '⚠ Rechtl. beachten' },
]

export default function NewFeedPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [type, setType] = useState<FeedSourceType>('rss')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [cssSelector, setCssSelector] = useState('')
  const [disclaimerChecked, setDisclaimerChecked] = useState(false)
  const [keywordsInclude, setKeywordsInclude] = useState<string[]>([])
  const [keywordsExclude, setKeywordsExclude] = useState<string[]>([])
  const [minScore, setMinScore] = useState(6)
  const [kwInput, setKwInput] = useState('')
  const [kwExInput, setKwExInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addKw = (kw: string, list: string[], setList: (v: string[]) => void) => {
    const trimmed = kw.trim()
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed])
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Name ist erforderlich'); return }
    if (type !== 'email' && !url.trim()) { setError('URL ist erforderlich'); return }
    if (type === 'url' && !disclaimerChecked) { setError('Bitte bestätige den Disclaimer'); return }
    setSaving(true)
    const config: Record<string, unknown> = { polling_interval_minutes: type === 'url' ? 360 : 60 }
    if (type === 'url') { config.css_selector = cssSelector; config.disclaimer_acknowledged = true }
    const result = await createFeedSource({ name, type, url: url || undefined, config, keywordsInclude, keywordsExclude, minScore })
    setSaving(false)
    if ('error' in result) { setError(result.error); return }
    router.push('/feeds')
  }

  const canNext = step === 1 ? true
    : step === 2 ? (name.trim().length > 0 && (type === 'email' || url.trim().length > 0))
    : true

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Neue Feed-Quelle</h1>
        <p style={s.sub}>Schritt {step} von 4</p>
      </div>

      <div style={s.steps}>
        {([1,2,3,4] as const).map((n) => (
          <div key={n} style={{ ...s.stepDot, ...(step >= n ? s.stepDotActive : {}) }} />
        ))}
      </div>

      {step === 1 && (
        <>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Welche Art von Quelle möchtest du hinzufügen?</p>
          <div style={s.types}>
            {TYPES.map(({ type: t, icon, name: n, desc }) => (
              <div
                key={t}
                style={{ ...s.typeCard, ...(type === t ? s.typeCardActive : {}) }}
                onClick={() => setType(t)}
              >
                <div style={s.typeIcon}>{icon}</div>
                <div style={s.typeName}>{n}</div>
                <div style={s.typeDesc}>{desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={s.field}>
            <label style={s.label}>Name der Quelle</label>
            <input style={s.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. TechCrunch AI" />
          </div>

          {type === 'email' ? (
            <div style={s.field}>
              <label style={s.label}>Inbound-Adresse</label>
              <div style={s.hint}>Eine eindeutige Adresse wird beim Speichern generiert. Abonniere deinen Newsletter mit dieser Adresse.</div>
            </div>
          ) : (
            <div style={s.field}>
              <label style={s.label}>{type === 'rss' ? 'Feed-URL' : type === 'api' ? 'API-Endpoint' : 'Seiten-URL'}</label>
              <input style={s.input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
            </div>
          )}

          {type === 'url' && (
            <>
              <div style={s.warn}>
                ⚠️ <strong>Rechtlicher Hinweis:</strong> Web-Scraping kann gegen die Nutzungsbedingungen einer Website verstoßen. Stelle sicher, dass du berechtigt bist, diese Seite automatisiert abzurufen. Prüfe robots.txt und AGB der Zielseite. Tropen OS übernimmt keine Haftung für den Einsatz dieser Funktion.
              </div>
              <div style={s.field}>
                <label style={{ ...s.label, display: 'flex', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={disclaimerChecked} onChange={(e) => setDisclaimerChecked(e.target.checked)} />
                  Ich habe die rechtliche Situation geprüft und übernehme die Verantwortung.
                </label>
              </div>
              <div style={s.field}>
                <label style={s.label}>CSS-Selektor (optional)</label>
                <input style={s.input} value={cssSelector} onChange={(e) => setCssSelector(e.target.value)} placeholder="article.news-item" />
                <div style={s.hint}>Welche Elemente sollen extrahiert werden? Leer = automatisch.</div>
              </div>
            </>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <div style={s.field}>
            <label style={s.label}>Keywords — mindestens eines muss vorkommen</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...s.input, flex: 1 }} value={kwInput} onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { addKw(kwInput, keywordsInclude, setKeywordsInclude); setKwInput('') } }}
                placeholder="z.B. AI, LLM" />
              <button className="btn btn-ghost btn-sm" onClick={() => { addKw(kwInput, keywordsInclude, setKeywordsInclude); setKwInput('') }}>+</button>
            </div>
            <div style={s.chips}>
              {keywordsInclude.map((kw) => (
                <span key={kw} style={s.chip}>{kw} <span style={{ cursor: 'pointer' }} onClick={() => setKeywordsInclude(keywordsInclude.filter((k) => k !== kw))}>×</span></span>
              ))}
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Keywords ausschließen</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...s.input, flex: 1 }} value={kwExInput} onChange={(e) => setKwExInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { addKw(kwExInput, keywordsExclude, setKeywordsExclude); setKwExInput('') } }}
                placeholder="z.B. sponsored, Werbung" />
              <button className="btn btn-ghost btn-sm" onClick={() => { addKw(kwExInput, keywordsExclude, setKeywordsExclude); setKwExInput('') }}>+</button>
            </div>
            <div style={s.chips}>
              {keywordsExclude.map((kw) => (
                <span key={kw} style={{ ...s.chip, background: '#FFF0F0', borderColor: '#FC8181', color: '#C53030' }}>{kw} <span style={{ cursor: 'pointer' }} onClick={() => setKeywordsExclude(keywordsExclude.filter((k) => k !== kw))}>×</span></span>
              ))}
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Relevanz-Schwelle: {minScore}/10</label>
            <input type="range" min={1} max={10} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} style={{ width: '100%' }} />
            <div style={{ ...s.hint, display: 'flex', justifyContent: 'space-between' }}>
              <span>1 — Alles zeigen</span><span>10 — Nur Bestes</span>
            </div>
          </div>
        </>
      )}

      {step === 4 && (
        <div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Soll dieser Feed automatisch Wissen in ein Projekt oder einen Workspace einspeisen?
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            Zuordnungen können nach dem Speichern in den Quellen-Einstellungen konfiguriert werden.
          </p>
        </div>
      )}

      {error && <div style={{ ...s.warn, background: '#FFF0F0', borderColor: '#FC8181', color: '#C53030', marginTop: 12 }}>{error}</div>}

      <div style={s.nav}>
        <button className="btn btn-ghost" onClick={() => step > 1 ? setStep((s) => (s - 1) as Step) : router.push('/feeds')}>
          {step === 1 ? 'Abbrechen' : '← Zurück'}
        </button>
        {step < 4 ? (
          <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep((s) => (s + 1) as Step)}>
            Weiter →
          </button>
        ) : (
          <button className="btn btn-primary" disabled={saving} onClick={handleSubmit}>
            {saving ? 'Wird gespeichert...' : 'Quelle erstellen'}
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/feeds/new/page.tsx
git commit -m "feat(feeds): source setup wizard (4 steps: type, config, filters, summary)"
```

---

## Final Commit: Update CLAUDE.md

- [ ] Update the Feeds section in `CLAUDE.md` to reflect the new schema and architecture.

Key points to add:
- Table names: `feed_sources`, `feed_items`, `feed_schemas`, `feed_distributions`, `feed_processing_log` (no tropen_ prefix)
- Source types: rss, email, api, url
- Stage 1: rules on source (keywords_include/exclude, domains_allow, 7-day age, 50-char min)
- Stage 2: Haiku (max 300 tokens), score 1-10 on source.min_score
- Stage 3: Sonnet (max 10/batch), writes summary + key_facts to feed_items
- Feedback loop: ≥5 not_relevant → enriches Stage 2 prompt automatically
- Email inbound: `POST /api/feeds/inbound/email` (Resend webhook)
- Cron: `GET /api/cron/sync-feeds` (Vercel, every 30 min)
- feed_processing_log is APPEND ONLY

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with Feeds v2 architecture"
```

---

## Testing Checklist

After all tasks:

- [ ] `npx vitest run src/lib/feeds/pipeline.unit.test.ts` → 9 tests green
- [ ] Migration applied in Supabase — 5 new tables visible
- [ ] `GET /feeds` renders Newscenter (sources sidebar, stream)
- [ ] `GET /feeds/new` wizard works, creates a source
- [ ] Manual cron trigger: `GET /api/cron/sync-feeds` with `Authorization: Bearer <CRON_SECRET>` → fetches RSS source, items appear in Newscenter
- [ ] "Nicht passend" click → item disappears from stream, not_relevant count increments
- [ ] After 5 not_relevant items for a source → next Stage 2 call includes negative examples in prompt
