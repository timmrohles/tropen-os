-- audit_runs: track when the last deep review completed
ALTER TABLE audit_runs
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ DEFAULT NULL;
