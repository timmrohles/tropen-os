-- 20260319000053_library_new_tables.sql
-- Library System: New tables — roles, library_versions, org/user library settings
-- Idempotent: CREATE TABLE IF NOT EXISTS throughout

BEGIN;

-- ============================================================
-- 1. roles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                       TEXT        NOT NULL,
  label                      TEXT        NOT NULL,
  icon                       TEXT,
  description                TEXT,
  scope                      TEXT        NOT NULL
                               CHECK (scope IN ('system','package','org','user','public')),
  organization_id            UUID        REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id                    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  requires_package           TEXT,        -- package slug, e.g. 'marketing'
  source_id                  UUID        REFERENCES public.roles(id) ON DELETE SET NULL,

  -- Core content
  system_prompt              TEXT        NOT NULL,
  domain_keywords            TEXT[]      NOT NULL DEFAULT '{}',
  vocabulary                 TEXT[]      NOT NULL DEFAULT '{}',

  -- Soft recommendations (no FK — just strings for matching)
  preferred_capability_types TEXT[]      NOT NULL DEFAULT '{}',
  preferred_skill_names      TEXT[]      NOT NULL DEFAULT '{}',
  preferred_outcome_types    TEXT[]      NOT NULL DEFAULT '{}',
  recommended_model_class    TEXT        NOT NULL DEFAULT 'deep',

  -- Governance
  is_active                  BOOLEAN     NOT NULL DEFAULT TRUE,
  is_default                 BOOLEAN     NOT NULL DEFAULT FALSE,
  is_public                  BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order                 INTEGER     NOT NULL DEFAULT 0,
  version                    INTEGER     NOT NULL DEFAULT 1,
  created_by_role            TEXT        CHECK (created_by_role IN ('superadmin','org_admin','member')),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at                 TIMESTAMPTZ,

  CONSTRAINT role_scope_org   CHECK (scope != 'org'    OR organization_id IS NOT NULL),
  CONSTRAINT role_scope_user  CHECK (scope != 'user'   OR user_id IS NOT NULL),
  CONSTRAINT role_public_sync CHECK (scope != 'public' OR is_public = TRUE)
);

CREATE INDEX IF NOT EXISTS idx_roles_scope ON public.roles(scope, is_active)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_roles_org ON public.roles(organization_id)
  WHERE organization_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_roles_public ON public.roles(is_public)
  WHERE is_public = TRUE AND is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_roles_keywords ON public.roles USING gin(domain_keywords)
  WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_select" ON public.roles;
CREATE POLICY "roles_select" ON public.roles
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      scope IN ('system','public')
      OR scope = 'package'  -- API layer checks requires_package
      OR (scope = 'org' AND organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      ))
      OR (scope = 'user' AND user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "roles_insert" ON public.roles;
CREATE POLICY "roles_insert" ON public.roles
  FOR INSERT TO authenticated
  WITH CHECK (
    (scope = 'user' AND user_id = auth.uid())
    OR (scope IN ('org','public') AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('owner','admin')
        AND (organization_id = roles.organization_id OR scope = 'public')
    ))
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "roles_update" ON public.roles;
CREATE POLICY "roles_update" ON public.roles
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      (scope = 'user' AND user_id = auth.uid())
      OR (scope = 'org' AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('owner','admin')
          AND organization_id = roles.organization_id
      ))
      OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'
      )
    )
  );

DROP POLICY IF EXISTS "roles_delete" ON public.roles;
CREATE POLICY "roles_delete" ON public.roles
  FOR DELETE TO authenticated
  USING (
    (scope = 'user' AND user_id = auth.uid())
    OR (scope = 'org' AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('owner','admin')
        AND organization_id = roles.organization_id
    ))
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- ============================================================
-- 2. library_versions — APPEND ONLY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.library_versions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT        NOT NULL CHECK (entity_type IN ('capability','outcome','role','skill')),
  entity_id       UUID        NOT NULL,
  organization_id UUID,
  changed_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  change_type     TEXT        NOT NULL CHECK (change_type IN
                                ('create','update','deactivate','reactivate','publish','unpublish')),
  snapshot        JSONB       NOT NULL,
  change_reason   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  -- APPEND ONLY — never UPDATE or DELETE
);

CREATE INDEX IF NOT EXISTS idx_lib_versions_entity  ON public.library_versions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_lib_versions_created ON public.library_versions(created_at DESC);

ALTER TABLE public.library_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "library_versions_select" ON public.library_versions;
CREATE POLICY "library_versions_select" ON public.library_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "library_versions_insert" ON public.library_versions;
CREATE POLICY "library_versions_insert" ON public.library_versions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);  -- API layer enforces; service role bypasses

-- ============================================================
-- 3. org_library_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.org_library_settings (
  organization_id      UUID    NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type          TEXT    NOT NULL CHECK (entity_type IN ('capability','role','skill')),
  entity_id            UUID    NOT NULL,
  is_enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured          BOOLEAN NOT NULL DEFAULT FALSE,
  custom_label         TEXT,
  sort_order_override  INTEGER,
  updated_by           UUID    REFERENCES public.users(id),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_org_lib_settings_org ON public.org_library_settings(organization_id);

ALTER TABLE public.org_library_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_lib_settings_select" ON public.org_library_settings;
CREATE POLICY "org_lib_settings_select" ON public.org_library_settings
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "org_lib_settings_write" ON public.org_library_settings;
CREATE POLICY "org_lib_settings_write" ON public.org_library_settings
  FOR ALL TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.users
    WHERE id = auth.uid() AND role IN ('owner','admin')
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.users
    WHERE id = auth.uid() AND role IN ('owner','admin')
  ));

-- ============================================================
-- 4. user_library_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_library_settings (
  user_id       UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type   TEXT    NOT NULL,
  entity_id     UUID    NOT NULL,
  is_pinned     BOOLEAN NOT NULL DEFAULT FALSE,
  last_used_at  TIMESTAMPTZ,
  use_count     INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_user_lib_settings_user ON public.user_library_settings(user_id);

ALTER TABLE public.user_library_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_lib_settings_own" ON public.user_library_settings;
CREATE POLICY "user_lib_settings_own" ON public.user_library_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
