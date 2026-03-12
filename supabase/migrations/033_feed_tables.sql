-- 033_feed_tables.sql
-- Feed-Pipeline: Drei-Stufen-System (regelbasiert → Haiku → Sonnet)

-- ── Feed-Quellen ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('rss', 'web', 'api')),
  url             TEXT NOT NULL,
  sync_interval   INTEGER NOT NULL DEFAULT 60,  -- Minuten
  last_synced_at  TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  meta            JSONB NOT NULL DEFAULT '{}',
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feed_sources_org_id_idx ON public.feed_sources(organization_id);

-- ── Feed-Schemas (Filter-Regeln) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_schemas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  rules           JSONB NOT NULL DEFAULT '[]',  -- [{field, operator, value}]
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Quelle ↔ Schema Zuordnung ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_source_schemas (
  feed_source_id UUID NOT NULL REFERENCES public.feed_sources(id) ON DELETE CASCADE,
  feed_schema_id UUID NOT NULL REFERENCES public.feed_schemas(id) ON DELETE CASCADE,
  PRIMARY KEY (feed_source_id, feed_schema_id)
);

-- ── Feed-Items ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_source_id UUID NOT NULL REFERENCES public.feed_sources(id) ON DELETE CASCADE,
  external_id    TEXT,  -- original ID/URL für Deduplizierung
  title          TEXT NOT NULL,
  url            TEXT,
  content        TEXT,
  summary        TEXT,         -- Stage 3: AI-generiert
  score          NUMERIC(3,2), -- Stage 2: Haiku-Score 0.00–1.00
  stage          INTEGER NOT NULL DEFAULT 1 CHECK (stage IN (1, 2, 3)),
  published_at   TIMESTAMPTZ,
  fetched_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (feed_source_id, external_id)
);

CREATE INDEX IF NOT EXISTS feed_items_source_id_idx ON public.feed_items(feed_source_id);
CREATE INDEX IF NOT EXISTS feed_items_score_idx ON public.feed_items(score) WHERE score IS NOT NULL;

-- ── Verarbeitungs-Log (APPEND ONLY) ─────────────────────────────────────────
-- NUR via supabaseAdmin schreibbar (Server-Side / Edge Function).
-- Clients können nur lesen (Admins).
CREATE TABLE IF NOT EXISTS public.feed_processing_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_source_id  UUID NOT NULL REFERENCES public.feed_sources(id) ON DELETE CASCADE,
  stage           INTEGER NOT NULL CHECK (stage IN (1, 2, 3)),
  items_processed INTEGER NOT NULL DEFAULT 0,
  tokens_used     INTEGER,
  cost_eur        NUMERIC(8,6),
  status          TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- kein updated_at — APPEND ONLY
);

-- ── Distributionen (Feed → Workspace/Projekt) ────────────────────────────────
-- target_id verweist auf workspace.id oder project.id (polymorphisch — kein DB-FK intentional)
CREATE TABLE IF NOT EXISTS public.feed_distributions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_source_id UUID NOT NULL REFERENCES public.feed_sources(id) ON DELETE CASCADE,
  target_type    TEXT NOT NULL CHECK (target_type IN ('workspace', 'project')),
  target_id      UUID NOT NULL,
  min_score      NUMERIC(3,2) NOT NULL DEFAULT 0.70,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (feed_source_id, target_type, target_id)
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.feed_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_source_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_processing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_sources_select" ON public.feed_sources
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY "feed_sources_write" ON public.feed_sources
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin')
    )
  );
CREATE POLICY "feed_sources_update" ON public.feed_sources
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'superadmin')
    )
  );

CREATE POLICY "feed_schemas_select" ON public.feed_schemas
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "feed_source_schemas_select" ON public.feed_source_schemas
  FOR SELECT USING (TRUE);

CREATE POLICY "feed_items_select" ON public.feed_items
  FOR SELECT USING (
    feed_source_id IN (
      SELECT fs.id FROM public.feed_sources fs
      JOIN public.users u ON u.organization_id = fs.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- feed_processing_log: NUR SELECT für Admins (APPEND ONLY — kein INSERT Policy für Clients)
-- Schreiben ausschließlich via supabaseAdmin in Edge Functions.
CREATE POLICY "feed_processing_log_select" ON public.feed_processing_log
  FOR SELECT USING (
    feed_source_id IN (
      SELECT fs.id FROM public.feed_sources fs
      JOIN public.users u ON u.organization_id = fs.organization_id
      WHERE u.id = auth.uid() AND u.role IN ('owner', 'admin', 'superadmin')
    )
  );
-- KEIN INSERT/UPDATE/DELETE Policy für Clients.

CREATE POLICY "feed_distributions_select" ON public.feed_distributions
  FOR SELECT USING (TRUE);
