-- Sprint 8: Add regulatory deep agents to audit_findings.agent_source constraint
-- New agent sources: 'dsgvo', 'bfsg', 'ai-act'

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
      'analytics',
      'security-scan',
      'dsgvo',
      'bfsg',
      'ai-act'
    ));
