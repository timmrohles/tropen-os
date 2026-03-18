-- Migration: 20260318000046_feed_runs.sql
-- Plan J1: Run-Logging, Pause/Resume, Notifications, Distribution-Erweiterung

BEGIN;

-- ============================================================
-- 1. feed_sources — status + pause-Felder
-- ============================================================

ALTER TABLE public.feed_sources
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'error', 'archived')),
  ADD COLUMN IF NOT EXISTS paused_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paused_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pause_reason TEXT;

-- is_active bleibt für Rückwärts-Kompatibilität; status ist die neue Quelle der Wahrheit
-- Sync: aktive Sources haben status='active', inaktive status='paused'
UPDATE public.feed_sources SET status = 'paused' WHERE is_active = false;

CREATE INDEX IF NOT EXISTS idx_feed_sources_status ON public.feed_sources (status);

-- ============================================================
-- 2. feed_runs (APPEND ONLY — kein UPDATE außer finished_at/status am Ende)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feed_runs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id        UUID        NOT NULL REFERENCES public.feed_sources(id) ON DELETE CASCADE,
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at      TIMESTAMPTZ,
  status           TEXT        NOT NULL DEFAULT 'running'
                     CHECK (status IN ('running', 'success', 'partial', 'error')),
  items_found      INTEGER     NOT NULL DEFAULT 0,
  items_scored     INTEGER     NOT NULL DEFAULT 0,
  items_distributed INTEGER   NOT NULL DEFAULT 0,
  errors           JSONB,       -- Array von {step, message, item_id?}
  duration_ms      INTEGER,
  triggered_by     TEXT        NOT NULL DEFAULT 'cron'
                     CHECK (triggered_by IN ('cron', 'manual', 'webhook')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_runs_source     ON public.feed_runs (source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_runs_org        ON public.feed_runs (organization_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_runs_status     ON public.feed_runs (status);

-- ============================================================
-- 3. feed_notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feed_notifications (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          UUID        REFERENCES public.users(id) ON DELETE CASCADE,
  source_id        UUID        REFERENCES public.feed_sources(id) ON DELETE CASCADE,
  item_id          UUID        REFERENCES public.feed_items(id) ON DELETE CASCADE,
  type             TEXT        NOT NULL
                     CHECK (type IN ('new_item', 'run_error', 'threshold_reached')),
  title            TEXT        NOT NULL,
  body             TEXT,
  is_read          BOOLEAN     NOT NULL DEFAULT false,
  read_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_notifications_user    ON public.feed_notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_notifications_org     ON public.feed_notifications (organization_id, created_at DESC);

-- ============================================================
-- 4. feed_distributions — target_type um 'notification' erweitern
-- ============================================================

-- CHECK-Constraint ersetzen (DROP + ADD)
ALTER TABLE public.feed_distributions
  DROP CONSTRAINT IF EXISTS feed_distributions_target_type_check;

ALTER TABLE public.feed_distributions
  ADD CONSTRAINT feed_distributions_target_type_check
    CHECK (target_type IN ('project', 'workspace', 'notification'));

-- ============================================================
-- 5. RLS
-- ============================================================

ALTER TABLE public.feed_runs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_notifications  ENABLE ROW LEVEL SECURITY;

-- feed_runs: org-Member können lesen (service_role schreibt)
CREATE POLICY "feed_runs_select_org" ON public.feed_runs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- feed_notifications: nur eigene Notifications lesen
CREATE POLICY "feed_notifications_select_own" ON public.feed_notifications
  FOR SELECT USING (user_id = auth.uid());

-- feed_notifications: eigene als gelesen markieren
CREATE POLICY "feed_notifications_update_own" ON public.feed_notifications
  FOR UPDATE USING (user_id = auth.uid());

COMMIT;
