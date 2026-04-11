-- Migration: audit_tasks
-- Task list generated from audit findings — tracks which findings have been turned into actionable to-dos

CREATE TABLE IF NOT EXISTS audit_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scan_project_id   UUID REFERENCES scan_projects(id) ON DELETE SET NULL,
  finding_id        UUID REFERENCES audit_findings(id) ON DELETE SET NULL,
  audit_run_id      UUID REFERENCES audit_runs(id) ON DELETE SET NULL,

  -- Snapshot of finding at task creation time (finding may be updated later)
  title             TEXT NOT NULL,
  agent_source      TEXT,
  rule_id           TEXT,
  severity          TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  file_path         TEXT,
  description       TEXT,
  suggestion        TEXT,

  -- Task state
  completed         BOOLEAN NOT NULL DEFAULT false,
  completed_at      TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fetching org tasks quickly
CREATE INDEX IF NOT EXISTS idx_audit_tasks_org ON audit_tasks(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_tasks_finding ON audit_tasks(finding_id) WHERE finding_id IS NOT NULL;

-- RLS
ALTER TABLE audit_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_tasks_own ON audit_tasks
  USING (organization_id = get_my_organization_id())
  WITH CHECK (organization_id = get_my_organization_id());
