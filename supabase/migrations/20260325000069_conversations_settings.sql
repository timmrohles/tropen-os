-- Conversations: per-conversation settings override (memoryWindow, answerStyle, etc.)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
