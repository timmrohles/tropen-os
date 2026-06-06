-- 20260605000002_preflight_projects.sql
-- Pre-Flight Projekt-Fläche: benannter Container (1:n zu preflight_runs).
-- Schreibzugriff ausschließlich Service-Role (API) — daher keine INSERT/UPDATE-Policy.

CREATE TABLE preflight_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pivots JSONB NOT NULL,
  red_count INTEGER NOT NULL DEFAULT 0,
  latest_run_id UUID,            -- FK wird nach preflight_runs.project_id ergänzt
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- runs an Projekt hängen
ALTER TABLE preflight_runs
  ADD COLUMN project_id UUID REFERENCES preflight_projects(id) ON DELETE CASCADE;

-- jetzt den latest_run_id-FK ergänzen (zirkuläre Beziehung aufgelöst)
ALTER TABLE preflight_projects
  ADD CONSTRAINT preflight_projects_latest_run_fk
  FOREIGN KEY (latest_run_id) REFERENCES preflight_runs(id) ON DELETE SET NULL;

ALTER TABLE preflight_projects ENABLE ROW LEVEL SECURITY;

-- SELECT: eigene Org
CREATE POLICY "preflight_projects_select_own_org" ON preflight_projects
  FOR SELECT USING (organization_id = get_my_organization_id());

-- DELETE: eigener Eintrag (DSGVO-Hygiene; reguläres Löschen = Soft-Delete über API)
CREATE POLICY "preflight_projects_delete_own" ON preflight_projects
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_preflight_projects_org_list
  ON preflight_projects (organization_id, deleted_at, updated_at DESC);
CREATE INDEX idx_preflight_runs_project
  ON preflight_runs (project_id, created_at DESC);
