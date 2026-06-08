-- preflight_projects: strukturiertes Konzept (Scheibe 2b geführte Konzept-Entwicklung)
ALTER TABLE preflight_projects ADD COLUMN IF NOT EXISTS concept JSONB DEFAULT NULL;
