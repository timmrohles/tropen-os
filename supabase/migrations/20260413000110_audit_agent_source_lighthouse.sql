-- Sprint 9: Add Lighthouse-specific agent sources to audit_findings.agent_source constraint
-- New agent sources: 'lighthouse-performance', 'lighthouse-accessibility',
--                   'lighthouse-best-practices', 'lighthouse-seo'

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
      'ai-act',
      'lighthouse-performance',
      'lighthouse-accessibility',
      'lighthouse-best-practices',
      'lighthouse-seo'
    ));
