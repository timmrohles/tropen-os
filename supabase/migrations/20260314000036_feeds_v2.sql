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
