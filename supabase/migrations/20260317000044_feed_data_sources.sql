-- API-Datenquellen (strukturierte Daten, keine Artikel)
CREATE TABLE IF NOT EXISTS public.feed_data_sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  description      TEXT,

  -- Verbindung
  url              TEXT NOT NULL,
  method           VARCHAR(10) NOT NULL DEFAULT 'GET',
  auth_type        VARCHAR(20),                     -- none | bearer | api_key | basic
  auth_config      JSONB NOT NULL DEFAULT '{}',     -- { token } | { header, key } | { username, password }

  -- Request
  request_headers  JSONB NOT NULL DEFAULT '{}',
  request_body     TEXT,
  fetch_interval   INTEGER NOT NULL DEFAULT 3600,   -- Sekunden; 0 = manuell

  -- Schema
  schema_path      TEXT,
  schema_preview   JSONB,

  -- Status
  is_active        BOOLEAN NOT NULL DEFAULT true,
  last_fetched_at  TIMESTAMPTZ,
  last_error       TEXT,
  record_count     INTEGER NOT NULL DEFAULT 0,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Abgerufene Datensätze (APPEND ONLY)
CREATE TABLE IF NOT EXISTS public.feed_data_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id        UUID NOT NULL REFERENCES public.feed_data_sources(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  fetched_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data               JSONB NOT NULL,
  record_count       INTEGER,
  fetch_duration_ms  INTEGER,
  http_status        INTEGER,
  error              TEXT,

  -- Phase 2: Verknüpfung
  linked_project_id    UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  linked_workspace_id  UUID REFERENCES public.workspaces(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feed_data_sources_user_id ON public.feed_data_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_data_sources_org_id  ON public.feed_data_sources(organization_id);
CREATE INDEX IF NOT EXISTS idx_feed_data_records_source_id  ON public.feed_data_records(source_id);
CREATE INDEX IF NOT EXISTS idx_feed_data_records_fetched_at ON public.feed_data_records(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_data_records_user_id    ON public.feed_data_records(user_id);

-- RLS
ALTER TABLE public.feed_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_data_records  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_data_sources_select_own" ON public.feed_data_sources
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "feed_data_sources_insert_own" ON public.feed_data_sources
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "feed_data_sources_update_own" ON public.feed_data_sources
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "feed_data_sources_delete_own" ON public.feed_data_sources
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "feed_data_records_select_own" ON public.feed_data_records
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "feed_data_records_insert_own" ON public.feed_data_records
  FOR INSERT WITH CHECK (user_id = auth.uid());
