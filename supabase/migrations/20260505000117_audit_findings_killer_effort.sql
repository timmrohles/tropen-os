-- ADR-027 Schritt 9a (2026-05-05): is_killer + effort_minutes an audit_findings.
-- Nullable — bestehende Findings bleiben NULL, Renderer fällt auf Heuristik zurück.
-- Backlog: Index auf is_killer nach 30 Tagen wenn Projekt-Listen-Performance leidet.

ALTER TABLE audit_findings
  ADD COLUMN IF NOT EXISTS is_killer BOOLEAN,
  ADD COLUMN IF NOT EXISTS effort_minutes INTEGER;
