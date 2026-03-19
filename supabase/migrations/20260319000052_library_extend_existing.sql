-- 20260319000052_library_extend_existing.sql
-- Library System: Extend existing tables for roles/skills integration
-- Idempotent: ADD COLUMN IF NOT EXISTS guards throughout
--
-- NOTE on skills table: migration 047 already created:
--   name, version, created_by_role, source_skill_id, deleted_at
-- We only add the truly missing columns: icon, source_id (alias), is_public,
-- sort_order, recommended_role_name, recommended_capability_type

BEGIN;

-- ============================================================
-- 1. capabilities — add missing columns for library system
-- ============================================================
ALTER TABLE public.capabilities
  ADD COLUMN IF NOT EXISTS name                TEXT,
  ADD COLUMN IF NOT EXISTS package_slug        TEXT,
  ADD COLUMN IF NOT EXISTS source_id           UUID REFERENCES public.capabilities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version             INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_by_role     TEXT CHECK (created_by_role IN ('superadmin','org_admin','member')),
  ADD COLUMN IF NOT EXISTS deleted_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_eu_only          BOOLEAN NOT NULL DEFAULT FALSE;

-- Extend scope to include 'package' and 'public'
-- Drop and recreate the scope check constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'capabilities'
      AND tc.constraint_type = 'CHECK'
      AND tc.constraint_name LIKE '%scope%'
  ) THEN
    ALTER TABLE public.capabilities DROP CONSTRAINT IF EXISTS capabilities_scope_check;
  END IF;
END;
$$;

ALTER TABLE public.capabilities
  ADD CONSTRAINT capabilities_scope_check
  CHECK (scope IN ('system','package','org','user','public'));

-- Backfill name from label (slugified) for existing rows
UPDATE public.capabilities
SET
  name = lower(regexp_replace(label, '[^a-zA-Z0-9]+', '_', 'g')),
  created_by_role = 'superadmin'
WHERE name IS NULL;

-- Add UNIQUE on name where deleted_at IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_capabilities_name_active
  ON public.capabilities(name) WHERE deleted_at IS NULL;

-- ============================================================
-- 2. outcomes — add name column
-- ============================================================
ALTER TABLE public.outcomes
  ADD COLUMN IF NOT EXISTS name TEXT;

-- Backfill name from output_type
UPDATE public.outcomes SET name = output_type WHERE name IS NULL;

-- ============================================================
-- 3. skills — add only the columns NOT present from migration 047
-- ============================================================
-- Existing from 047: name, version, created_by_role, source_skill_id, deleted_at
-- scope constraint in 047: CHECK (scope IN ('system','package','org','user'))
-- We need to extend scope to include 'public'

DO $$
BEGIN
  ALTER TABLE public.skills DROP CONSTRAINT IF EXISTS skills_scope_check;
EXCEPTION WHEN undefined_object THEN NULL;
END;
$$;

-- Also drop any inline CHECK constraint that may have been named differently
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'skills'
      AND table_schema = 'public'
      AND constraint_type = 'CHECK'
      AND constraint_name LIKE '%scope%'
  LOOP
    EXECUTE 'ALTER TABLE public.skills DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
  END LOOP;
END;
$$;

ALTER TABLE public.skills
  ADD CONSTRAINT skills_scope_check
  CHECK (scope IN ('system','package','org','user','public'));

-- Add the truly missing columns (all are new — not in migration 047)
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS icon                        TEXT,
  ADD COLUMN IF NOT EXISTS source_id                   UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_public                   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sort_order                  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommended_role_name       TEXT,
  ADD COLUMN IF NOT EXISTS recommended_capability_type TEXT;

-- Add constraint: public skills must have is_public = true
ALTER TABLE public.skills
  DROP CONSTRAINT IF EXISTS skill_public_sync;
ALTER TABLE public.skills
  ADD CONSTRAINT skill_public_sync CHECK (scope != 'public' OR is_public = TRUE);

-- Add index for public skills
CREATE INDEX IF NOT EXISTS idx_skills_public ON public.skills(is_public)
  WHERE is_public = TRUE AND is_active = TRUE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_skills_keywords_gin ON public.skills USING gin(trigger_keywords)
  WHERE deleted_at IS NULL;

COMMIT;
