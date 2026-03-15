-- Add members_see_models flag to organization_settings
ALTER TABLE organization_settings
  ADD COLUMN IF NOT EXISTS members_see_models BOOLEAN NOT NULL DEFAULT FALSE;
