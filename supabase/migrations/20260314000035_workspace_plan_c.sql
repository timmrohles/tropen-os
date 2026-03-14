-- Migration: 20260314000035_workspace_plan_c.sql
-- Plan C: Workspace + Card Engine extensions
-- All DDL is idempotent.

BEGIN;

-- ============================================================
-- 1. Alter workspaces — add Plan C columns
-- ============================================================

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','exported','locked')),
  ADD COLUMN IF NOT EXISTS briefing_chat_id UUID, -- intentionally no FK: conversations scope may change during Plan C build-out
  ADD COLUMN IF NOT EXISTS domain TEXT;

CREATE INDEX IF NOT EXISTS idx_workspaces_organization_id
  ON public.workspaces (organization_id);

CREATE INDEX IF NOT EXISTS idx_workspaces_status
  ON public.workspaces (status);

-- ============================================================
-- 2. Alter cards — add Plan C columns
-- ============================================================

-- 2a. Handle content column: rename TEXT → content_legacy, add JSONB content
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'cards'
      AND column_name  = 'content'
      AND data_type    = 'text'
  ) THEN
    ALTER TABLE public.cards RENAME COLUMN content TO content_legacy;
  END IF;
END;
$$;

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS content JSONB;

-- 2b. Handle status column: drop non-TEXT status, add TEXT status
-- Defensive guard: handles dev DBs where card_status enum was created manually.
-- In standard migration history (031→present), cards.status is already TEXT.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'cards'
      AND column_name  = 'status'
      AND data_type   <> 'text'
  ) THEN
    ALTER TABLE public.cards DROP COLUMN status;
  END IF;
END;
$$;

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','ready','stale','processing','error'));

-- 2c. Remaining Plan C columns
ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS role TEXT
    CHECK (role IN ('input','process','output')),
  ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text'
    CHECK (content_type IN ('text','table','chart','list','code','map','mindmap','kanban','timeline','image','embed')),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS chart_config JSONB,
  ADD COLUMN IF NOT EXISTS stale_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stale_reason TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_cards_status
  ON public.cards (status);

CREATE INDEX IF NOT EXISTS idx_cards_sort_order
  ON public.cards (sort_order);

-- ============================================================
-- 3. Alter card_history — add Plan C columns
-- ============================================================

ALTER TABLE public.card_history
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS snapshot JSONB,
  ADD COLUMN IF NOT EXISTS change_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_card_history_workspace_id
  ON public.card_history (workspace_id);

CREATE INDEX IF NOT EXISTS idx_card_history_created_at
  ON public.card_history (created_at);

-- ============================================================
-- 4. Rename connections columns
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'connections'
      AND column_name  = 'from_card_id'
  ) THEN
    ALTER TABLE public.connections RENAME COLUMN from_card_id TO source_card_id;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'connections'
      AND column_name  = 'to_card_id'
  ) THEN
    ALTER TABLE public.connections RENAME COLUMN to_card_id TO target_card_id;
  END IF;
END;
$$;

-- Rename UNIQUE constraint to match new column names (if still using old name)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'connections_from_card_id_to_card_id_key'
  ) THEN
    ALTER TABLE public.connections
      RENAME CONSTRAINT connections_from_card_id_to_card_id_key
      TO connections_source_card_id_target_card_id_key;
  END IF;
END;
$$;

-- ============================================================
-- 5. Create new tables
-- ============================================================

-- workspace_assets
CREATE TABLE IF NOT EXISTS public.workspace_assets (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  card_id      UUID        REFERENCES public.cards(id) ON DELETE SET NULL,
  type         TEXT        NOT NULL CHECK (type IN ('image','chart','link','upload','video')),
  name         TEXT        NOT NULL,
  url          TEXT        NOT NULL,
  size         INTEGER,
  meta         JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_assets_workspace_id
  ON public.workspace_assets (workspace_id);

CREATE INDEX IF NOT EXISTS idx_workspace_assets_card_id
  ON public.workspace_assets (card_id);

-- workspace_exports
-- Note: status updates (pending→processing→ready) use supabaseAdmin (service_role), not user auth.
-- No UPDATE policy needed for client-side access.
CREATE TABLE IF NOT EXISTS public.workspace_exports (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  format       TEXT        NOT NULL CHECK (format IN ('chat','word','pdf','markdown','presentation')),
  status       TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','ready','error')),
  file_url     TEXT,
  is_stale     BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_exports_workspace_id
  ON public.workspace_exports (workspace_id);

-- workspace_messages
CREATE TABLE IF NOT EXISTS public.workspace_messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  card_id          UUID        REFERENCES public.cards(id) ON DELETE SET NULL,
  role             TEXT        NOT NULL CHECK (role IN ('user','assistant')),
  content          TEXT        NOT NULL,
  context_snapshot JSONB,
  token_usage      JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index covers single-column workspace_id lookups and sorted queries by created_at
CREATE INDEX IF NOT EXISTS idx_workspace_messages_workspace_created
  ON public.workspace_messages (workspace_id, created_at);

CREATE INDEX IF NOT EXISTS idx_workspace_messages_card_id
  ON public.workspace_messages (card_id);

-- ============================================================
-- 5b. Convert workspace_participants.role from enum to TEXT
-- ============================================================
-- The Drizzle schema created participant_role enum with (owner, editor, reviewer, viewer).
-- Plan C uses 'admin' | 'member' | 'viewer' — simpler to store as TEXT.
-- USING role::TEXT preserves existing stored values as-is.

ALTER TABLE public.workspace_participants
  ALTER COLUMN role TYPE TEXT USING role::TEXT;

-- ============================================================
-- 6. RLS for new tables
-- ============================================================

ALTER TABLE public.workspace_assets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_exports  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_messages ENABLE ROW LEVEL SECURITY;

-- ---- workspace_assets ----
-- Note: DROP POLICY IF EXISTS before CREATE POLICY (PG < 16.2 has no CREATE POLICY IF NOT EXISTS)

DROP POLICY IF EXISTS "workspace_assets_select"  ON public.workspace_assets;
CREATE POLICY "workspace_assets_select"
  ON public.workspace_assets FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_assets_insert"  ON public.workspace_assets;
CREATE POLICY "workspace_assets_insert"
  ON public.workspace_assets FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_assets_delete"  ON public.workspace_assets;
CREATE POLICY "workspace_assets_delete"
  ON public.workspace_assets FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- ---- workspace_exports ----

DROP POLICY IF EXISTS "workspace_exports_select" ON public.workspace_exports;
CREATE POLICY "workspace_exports_select"
  ON public.workspace_exports FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_exports_insert" ON public.workspace_exports;
CREATE POLICY "workspace_exports_insert"
  ON public.workspace_exports FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid()
        AND role IN ('admin','member')
    )
  );

-- ---- workspace_messages ----

DROP POLICY IF EXISTS "workspace_messages_select" ON public.workspace_messages;
CREATE POLICY "workspace_messages_select"
  ON public.workspace_messages FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_messages_insert" ON public.workspace_messages;
CREATE POLICY "workspace_messages_insert"
  ON public.workspace_messages FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_participants
      WHERE user_id = auth.uid()
        AND role IN ('admin','member')
    )
  );

COMMIT;
