-- Migration 006: task_type auf conversations
-- Wird beim ersten assistant-Response gesetzt (aus dem routing-Event der Edge Function)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS task_type TEXT
  CHECK (task_type IN ('chat', 'summarize', 'extract', 'research', 'create'));
