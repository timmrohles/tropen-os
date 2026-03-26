-- Migration 081: Add ai_assistant_image_url to organization_settings
-- Allows orgs to upload a custom image for their KI-Assistent (default: Toro)

ALTER TABLE organization_settings
  ADD COLUMN IF NOT EXISTS ai_assistant_image_url TEXT DEFAULT NULL;

COMMENT ON COLUMN organization_settings.ai_assistant_image_url IS
  'URL of custom assistant image in Supabase Storage (org-assets bucket). NULL = use default Toro asset.';
