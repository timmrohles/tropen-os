-- 20260607000001_preflight_decisions_startpaket.sql
-- Scheibe 2a: Entscheidungen + generiertes Startpaket am Projekt (verzögerte Generierung).
ALTER TABLE preflight_projects ADD COLUMN decisions JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE preflight_projects ADD COLUMN startpaket JSONB;
