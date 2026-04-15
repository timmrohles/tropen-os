-- Migration: Add not_relevant_reason to audit_findings
-- Stores why a finding was marked as "not relevant" (dismissed with reason)
ALTER TABLE audit_findings ADD COLUMN IF NOT EXISTS not_relevant_reason text;
