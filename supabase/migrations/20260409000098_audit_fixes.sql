-- Erstellt audit_fixes Tabelle für den Fix-Engine (Sprint 7)
-- Status: pending → applied | rejected (nicht APPEND ONLY)

CREATE TABLE IF NOT EXISTS audit_fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  finding_id UUID NOT NULL REFERENCES audit_findings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,

  -- Generierter Inhalt
  explanation TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  diffs JSONB NOT NULL DEFAULT '[]',

  -- Status-Lifecycle
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),

  -- Metadaten
  model TEXT NOT NULL,
  cost_eur NUMERIC(10, 6) NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  applied_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE audit_fixes ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_fixes_org ON audit_fixes
  FOR ALL USING (organization_id = get_my_organization_id());

-- Index für schnellen Lookup per finding
CREATE INDEX idx_audit_fixes_finding ON audit_fixes(finding_id);
CREATE INDEX idx_audit_fixes_run ON audit_fixes(run_id);
