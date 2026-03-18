-- Add api_model_id to model_catalog
-- The actual API model identifier (may differ from display name)

ALTER TABLE model_catalog
  ADD COLUMN IF NOT EXISTS api_model_id TEXT;

-- Set proper API model IDs for existing rows
UPDATE model_catalog SET api_model_id = 'claude-haiku-4-5-20251001' WHERE name = 'claude-haiku-4-5';
UPDATE model_catalog SET api_model_id = 'claude-sonnet-4-20250514'  WHERE name = 'claude-sonnet-4-5';
UPDATE model_catalog SET api_model_id = 'gpt-4o-mini'               WHERE name = 'gpt-4o-mini';
UPDATE model_catalog SET api_model_id = 'gpt-4o'                    WHERE name = 'gpt-4o';

-- Fallback: where api_model_id still null, use name
UPDATE model_catalog SET api_model_id = name WHERE api_model_id IS NULL;
