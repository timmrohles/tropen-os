-- Migration 102: Add affected_files and fix_hint to audit_findings
-- Enables multi-file findings where a rule violation spans multiple files

ALTER TABLE audit_findings
  ADD COLUMN IF NOT EXISTS affected_files TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fix_hint TEXT DEFAULT NULL;

COMMENT ON COLUMN audit_findings.affected_files IS 'All file paths affected by this finding (for multi-file issues)';
COMMENT ON COLUMN audit_findings.fix_hint IS 'Concise hint for what to fix across affected files';
