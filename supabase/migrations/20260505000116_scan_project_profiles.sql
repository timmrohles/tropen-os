-- ADR-027 Schritt 5 (2026-05-05): Profil-Onboarding für externe Scan-Projekte
-- Profil-Historie: aktives Profil = jüngster Eintrag pro scan_project_id.
--
-- Verknüpft mit scan_projects (externe User-Projekte), NICHT mit organizations.projects (KMU).

CREATE TYPE profile_type_enum AS ENUM (
  'solo',
  'internal',
  'public',
  'b2c',
  'b2b_regulated'
);

CREATE TYPE geo_scope_enum AS ENUM (
  'eu',
  'non_eu',
  'global',
  'none'
);

CREATE TABLE scan_project_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_project_id UUID NOT NULL REFERENCES scan_projects(id) ON DELETE CASCADE,

  profile_type profile_type_enum NOT NULL,
  geo_scope    geo_scope_enum    NOT NULL,
  has_user_data BOOLEAN NOT NULL,

  -- Nullable = User hat geskippt ("weiß nicht") → Detektor verhält sich konservativ
  has_ai        BOOLEAN,
  has_ecommerce BOOLEAN,

  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scan_project_profiles_project_created
  ON scan_project_profiles (scan_project_id, created_at DESC);

ALTER TABLE scan_project_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: eigene Org (via scan_projects.org_id)
CREATE POLICY "scan_project_profiles_select_own_org"
  ON scan_project_profiles FOR SELECT
  USING (
    scan_project_id IN (
      SELECT id FROM scan_projects
      WHERE organization_id = get_my_organization_id()
    )
  );

-- INSERT: eigene Org
CREATE POLICY "scan_project_profiles_insert_own_org"
  ON scan_project_profiles FOR INSERT
  WITH CHECK (
    scan_project_id IN (
      SELECT id FROM scan_projects
      WHERE organization_id = get_my_organization_id()
    )
  );
