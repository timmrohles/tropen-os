-- 20260320000061_chat_prompt_builder.sql
-- Plan L: Add prompt_builder conversation type

-- Drop existing CHECK constraint and re-add with prompt_builder
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_conversation_type_check;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_conversation_type_check
  CHECK (conversation_type IN (
    'chat',
    'workspace_briefing',
    'workspace_silo',
    'workspace_card',
    'prompt_builder'
  ));
