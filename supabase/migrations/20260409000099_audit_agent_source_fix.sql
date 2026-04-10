-- Extend agent_source CHECK to include all 18 agent types
-- Previous constraint only allowed 4 values; trigger route inserts all 18

ALTER TABLE audit_findings
  DROP CONSTRAINT IF EXISTS audit_findings_agent_source_check;

ALTER TABLE audit_findings
  ADD CONSTRAINT audit_findings_agent_source_check
    CHECK (agent_source IN (
      'core',
      'architecture',
      'security',
      'observability',
      'code-style',
      'error-handling',
      'database',
      'dependencies',
      'git-governance',
      'backup-dr',
      'testing',
      'performance',
      'platform',
      'api',
      'cost-awareness',
      'scalability',
      'accessibility',
      'design-system',
      'content',
      'legal',
      'ai-integration',
      'analytics'
    ));
