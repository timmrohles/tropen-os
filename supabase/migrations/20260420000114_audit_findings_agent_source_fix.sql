-- Fix: audit_findings.agent_source CHECK constraint was missing most AgentSource values.
-- Every INSERT with values like 'legal', 'code-style', 'database' etc. silently failed,
-- causing audit runs to show 0 findings despite a non-100% score.

ALTER TABLE audit_findings
  DROP CONSTRAINT IF EXISTS audit_findings_agent_source_check,
  ADD CONSTRAINT audit_findings_agent_source_check CHECK (agent_source IN (
    'core', 'architecture', 'security', 'observability',
    'code-style', 'error-handling', 'database', 'dependencies', 'git-governance',
    'backup-dr', 'testing', 'performance', 'platform', 'api', 'cost-awareness',
    'scalability', 'accessibility', 'design-system', 'content', 'legal',
    'ai-integration', 'analytics',
    'security-scan',
    'dsgvo', 'bfsg', 'ai-act',
    'lighthouse-performance', 'lighthouse-accessibility',
    'lighthouse-best-practices', 'lighthouse-seo',
    'npm-audit',
    'slop',
    'spec'
  ));
