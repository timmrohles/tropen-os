-- Migration: Add Claude Fable 5 + update deprecated Claude Sonnet 4 → Sonnet 4.6
-- Claude Sonnet 4 (claude-sonnet-4-20250514) retires June 15 2026
-- Claude Fable 5 (claude-fable-5) — GA June 9 2026, $10/$50 per MTok, 1M context, 128k output

-- 1. Update deprecated Sonnet 4 → Sonnet 4.6 in model_catalog
UPDATE model_catalog
SET
  api_model_id      = 'claude-sonnet-4-6',
  name              = 'claude-sonnet-4-6',
  display_name      = 'Claude Sonnet 4.6',
  label             = 'Claude Sonnet 4.6',
  context_window    = 1000000,
  max_output_tokens = 64000
WHERE api_model_id = 'claude-sonnet-4-20250514';

-- 2. Update deprecated model_id references in perspective_avatars
UPDATE perspective_avatars
SET model_id = 'claude-sonnet-4-6'
WHERE model_id = 'claude-sonnet-4-20250514';

-- 3. Insert Claude Fable 5 (skip if name already exists)
INSERT INTO model_catalog (
  name,
  display_name,
  label,
  api_model_id,
  provider,
  model_class,
  flag,
  is_active,
  is_eu_hosted,
  is_open_source,
  cost_per_1k_input,
  cost_per_1k_output,
  cost_input_per_m,
  cost_output_per_m,
  context_window,
  max_output_tokens,
  supports_vision,
  supports_tools,
  supports_streaming,
  capabilities,
  sort_order
) VALUES (
  'claude-fable-5',
  'Claude Fable 5',
  'Claude Fable 5',
  'claude-fable-5',
  'anthropic',
  'deep',
  'frontier',
  true,
  false,
  false,
  0.01000,
  0.05000,
  10.0,
  50.0,
  1000000,
  128000,
  true,
  true,
  true,
  '["general", "coding", "analysis", "research", "writing"]'::jsonb,
  10
)
ON CONFLICT (name) DO UPDATE SET
  api_model_id        = EXCLUDED.api_model_id,
  display_name        = EXCLUDED.display_name,
  is_active           = true,
  cost_per_1k_input   = EXCLUDED.cost_per_1k_input,
  cost_per_1k_output  = EXCLUDED.cost_per_1k_output,
  cost_input_per_m    = EXCLUDED.cost_input_per_m,
  cost_output_per_m   = EXCLUDED.cost_output_per_m,
  context_window      = EXCLUDED.context_window,
  max_output_tokens   = EXCLUDED.max_output_tokens;
