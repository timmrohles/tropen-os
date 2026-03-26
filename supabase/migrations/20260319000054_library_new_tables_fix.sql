-- Migration 053b: Fix issues found in migration 053 (library_new_tables)
-- DO NOT MODIFY 053 — these fixes are applied here instead.

BEGIN;

-- Fix 1: roles_insert policy — remove 'public' from org admin branch
-- Org admins can only create scope='org', not scope='public'.
-- Publishing must go through /api/library/roles/[id]/publish (service role, bypasses RLS).
DROP POLICY IF EXISTS "roles_insert" ON public.roles;
CREATE POLICY "roles_insert" ON public.roles
  FOR INSERT TO authenticated
  WITH CHECK (
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

-- Fix 2: Unique index on roles.name (only among non-deleted rows)
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_name_active
  ON public.roles(name) WHERE deleted_at IS NULL;

-- Fix 3: Index on library_versions.organization_id
CREATE INDEX IF NOT EXISTS idx_lib_versions_org
  ON public.library_versions(organization_id)
  WHERE organization_id IS NOT NULL;

-- Fix 4: CHECK constraint on user_library_settings.entity_type
ALTER TABLE public.user_library_settings
  DROP CONSTRAINT IF EXISTS user_lib_settings_entity_type_check;
ALTER TABLE public.user_library_settings
  ADD CONSTRAINT user_lib_settings_entity_type_check
  CHECK (entity_type IN ('capability','role','skill'));

COMMIT;
