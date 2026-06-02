-- Sprint 9-Critical-Killer (2026-05-06)
-- ADR-027 Severity-Coupling: Critical-Severity → automatisch Killer.
-- Alle bestehenden Critical-Findings auf is_killer=true setzen.

UPDATE audit_findings
SET is_killer = true
WHERE severity = 'critical'
  AND (is_killer = false OR is_killer IS NULL);
