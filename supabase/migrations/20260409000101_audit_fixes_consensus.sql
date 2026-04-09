-- Migration: 20260409000101_audit_fixes_consensus.sql
-- Sprint 7b: Add consensus fix columns to audit_fixes

ALTER TABLE audit_fixes ADD COLUMN IF NOT EXISTS fix_mode VARCHAR(20) NOT NULL DEFAULT 'quick'
  CONSTRAINT audit_fixes_fix_mode_check CHECK (fix_mode IN ('quick', 'consensus'));

ALTER TABLE audit_fixes ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20)
  CONSTRAINT audit_fixes_risk_level_check CHECK (risk_level IN ('safe', 'moderate', 'critical'));

ALTER TABLE audit_fixes ADD COLUMN IF NOT EXISTS risk_details JSONB;

ALTER TABLE audit_fixes ADD COLUMN IF NOT EXISTS drafts JSONB NOT NULL DEFAULT '[]';

ALTER TABLE audit_fixes ADD COLUMN IF NOT EXISTS judge_explanation TEXT;
