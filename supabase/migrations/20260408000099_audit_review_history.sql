-- Track each Deep Review run separately (audit_runs is audit runs, this is review runs)
CREATE TABLE IF NOT EXISTS audit_review_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  findings_count  INTEGER NOT NULL DEFAULT 0,
  cost_eur        NUMERIC(10,4),
  models_used     TEXT[],
  quorum_met      BOOLEAN DEFAULT false,
  judge_model     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_review_runs_run_id ON audit_review_runs(run_id);
CREATE INDEX IF NOT EXISTS idx_audit_review_runs_org ON audit_review_runs(organization_id, created_at DESC);

ALTER TABLE audit_review_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members can read review runs"
  ON audit_review_runs FOR SELECT
  USING (organization_id = get_my_organization_id());
