-- Migration 097: Multi-model review fields for audit pipeline
-- audit_runs: review metadata
-- audit_findings: consensus attribution

ALTER TABLE audit_runs
  ADD COLUMN IF NOT EXISTS review_type      TEXT DEFAULT 'automated'
    CHECK (review_type IN ('automated', 'multi_model')),
  ADD COLUMN IF NOT EXISTS models_used      TEXT[],
  ADD COLUMN IF NOT EXISTS judge_model      TEXT,
  ADD COLUMN IF NOT EXISTS review_cost_eur  NUMERIC(10, 4),
  ADD COLUMN IF NOT EXISTS quorum_met       BOOLEAN DEFAULT TRUE;

ALTER TABLE audit_findings
  ADD COLUMN IF NOT EXISTS consensus_level  TEXT
    CHECK (consensus_level IN ('unanimous', 'majority', 'split', 'single')),
  ADD COLUMN IF NOT EXISTS models_flagged   TEXT[],
  ADD COLUMN IF NOT EXISTS avg_confidence   NUMERIC(4, 2);
