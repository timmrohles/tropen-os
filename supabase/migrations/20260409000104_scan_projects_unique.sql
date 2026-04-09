-- Migration: 20260409000104_scan_projects_unique.sql
-- Fügt UNIQUE-Constraint für upsert hinzu (onConflict: organization_id,name)
ALTER TABLE scan_projects
  ADD CONSTRAINT scan_projects_org_name_unique
  UNIQUE (organization_id, name);
