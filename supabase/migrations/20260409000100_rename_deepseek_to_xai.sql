-- Migration 100: rename provider slot 'deepseek' → 'xai' in review history
-- The xAI/Grok provider reused the 'deepseek' id for DB compatibility.
-- Now that the rename is intentional, update existing rows.

UPDATE audit_runs
SET models_used = array_replace(models_used, 'deepseek', 'xai')
WHERE 'deepseek' = ANY(models_used);
