-- Sprint 4a: Agent attribution fields on audit_findings
-- Adds agent_source, agent_rule_id, enforcement for rule attribution

ALTER TABLE audit_findings
  ADD COLUMN IF NOT EXISTS agent_source TEXT DEFAULT 'core'
    CHECK (agent_source IN ('architecture', 'security', 'observability', 'core')),
  ADD COLUMN IF NOT EXISTS agent_rule_id TEXT,
  ADD COLUMN IF NOT EXISTS enforcement TEXT
    CHECK (enforcement IN ('blocked', 'prevented', 'reviewed', 'advisory'));

-- Back-fill existing rows
UPDATE audit_findings SET agent_source = 'core' WHERE agent_source IS NULL;
