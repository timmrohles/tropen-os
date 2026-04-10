-- Migration: 20260408000095_audit_tables.sql
-- Audit Dashboard: audit_runs, audit_category_scores, audit_findings
-- APPEND ONLY: audit_runs + audit_category_scores (never delete/update)
-- audit_findings: status + resolved_* may be updated for finding tracking

-- ─── audit_runs ───────────────────────────────────────────────────────────────
CREATE TABLE audit_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'ci', 'scheduled', 'push')),

  -- Gesamtscore
  total_score NUMERIC(10,2) NOT NULL,
  total_max NUMERIC(10,2) NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('production_grade', 'stable', 'risky', 'prototype')),

  -- Statistiken
  total_rules INTEGER NOT NULL,
  automated_rules INTEGER NOT NULL,
  manual_rules INTEGER NOT NULL,
  total_findings INTEGER NOT NULL,
  critical_findings INTEGER NOT NULL,

  -- Vollständiger Report als JSON (Fallback + Archiv)
  full_report JSONB NOT NULL,

  -- Repo Map Stats (optional)
  repo_stats JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── audit_category_scores ────────────────────────────────────────────────────
CREATE TABLE audit_category_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL,
  category_name TEXT NOT NULL,
  category_weight INTEGER NOT NULL CHECK (category_weight IN (1, 2, 3)),
  score NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 5.0,
  weighted_score NUMERIC(8,2) NOT NULL,
  max_weighted_score NUMERIC(8,2) NOT NULL,
  automated_rule_count INTEGER NOT NULL,
  manual_rule_count INTEGER NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── audit_findings ───────────────────────────────────────────────────────────
CREATE TABLE audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  message TEXT NOT NULL,
  file_path TEXT,
  line INTEGER,
  suggestion TEXT,

  -- Status-Tracking
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'fixed', 'dismissed')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_audit_runs_org ON audit_runs(organization_id);
CREATE INDEX idx_audit_runs_created ON audit_runs(created_at DESC);
CREATE INDEX idx_audit_category_scores_run ON audit_category_scores(run_id);
CREATE INDEX idx_audit_findings_run ON audit_findings(run_id);
CREATE INDEX idx_audit_findings_severity ON audit_findings(severity);
CREATE INDEX idx_audit_findings_status ON audit_findings(status);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE audit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_category_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;

-- audit_runs: org members can read; org members can insert for own org
CREATE POLICY audit_runs_select ON audit_runs
  FOR SELECT USING (organization_id = get_my_organization_id());

CREATE POLICY audit_runs_insert ON audit_runs
  FOR INSERT WITH CHECK (organization_id = get_my_organization_id());

-- audit_category_scores: accessible via run
CREATE POLICY audit_category_scores_select ON audit_category_scores
  FOR SELECT USING (
    run_id IN (
      SELECT id FROM audit_runs WHERE organization_id = get_my_organization_id()
    )
  );

CREATE POLICY audit_category_scores_insert ON audit_category_scores
  FOR INSERT WITH CHECK (
    run_id IN (
      SELECT id FROM audit_runs WHERE organization_id = get_my_organization_id()
    )
  );

-- audit_findings: accessible via run; status can be updated
CREATE POLICY audit_findings_select ON audit_findings
  FOR SELECT USING (
    run_id IN (
      SELECT id FROM audit_runs WHERE organization_id = get_my_organization_id()
    )
  );

CREATE POLICY audit_findings_insert ON audit_findings
  FOR INSERT WITH CHECK (
    run_id IN (
      SELECT id FROM audit_runs WHERE organization_id = get_my_organization_id()
    )
  );

CREATE POLICY audit_findings_update ON audit_findings
  FOR UPDATE USING (
    run_id IN (
      SELECT id FROM audit_runs WHERE organization_id = get_my_organization_id()
    )
  );
