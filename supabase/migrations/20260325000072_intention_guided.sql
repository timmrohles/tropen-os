-- Migration 072: Replace 'open' with 'guided' in conversations.intention
-- 'open' = no specific intention (now represented by NULL)
-- 'guided' = guided conversation mode (new)

-- Drop old CHECK constraint (auto-generated name from inline column definition)
ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_intention_check;

-- Migrate existing 'open' values → NULL (open mode = no intention = NULL)
UPDATE conversations SET intention = NULL WHERE intention = 'open';

-- Add new CHECK allowing focused + guided
ALTER TABLE conversations
  ADD CONSTRAINT conversations_intention_check
  CHECK (intention IN ('focused', 'guided'));
