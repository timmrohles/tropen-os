-- Migration: 20260409000103_scan_projects.sql
-- Externe Projekte die über File System Access API verbunden wurden

CREATE TABLE IF NOT EXISTS scan_projects (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    UUID NOT NULL,

  -- Projekt-Info
  name               TEXT NOT NULL,
  source             TEXT NOT NULL DEFAULT 'file_system'
                       CHECK (source IN ('file_system', 'github', 'upload')),

  -- Statistiken vom letzten Scan
  file_count         INTEGER,
  total_size_bytes   INTEGER,
  last_scan_at       TIMESTAMPTZ,
  last_score         NUMERIC(5,2),

  -- Metadaten
  detected_stack     JSONB,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_projects_org ON scan_projects(organization_id);

-- RLS
ALTER TABLE scan_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY scan_projects_org_read ON scan_projects
  FOR SELECT USING (organization_id = get_my_organization_id());

CREATE POLICY scan_projects_org_insert ON scan_projects
  FOR INSERT WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY scan_projects_org_update ON scan_projects
  FOR UPDATE USING (organization_id = get_my_organization_id());

-- audit_runs: scan_project_id FK
ALTER TABLE audit_runs
  ADD COLUMN IF NOT EXISTS scan_project_id UUID REFERENCES scan_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_runs_scan_project ON audit_runs(scan_project_id)
  WHERE scan_project_id IS NOT NULL;
