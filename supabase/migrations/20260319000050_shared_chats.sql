-- 20260319000050_shared_chats.sql
-- Plan K: Geteilte Chats — share_token + Team-Antwort-Referenz

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS share_token    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS shared_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS share_scope    TEXT CHECK (share_scope IN ('org')) DEFAULT 'org',
  ADD COLUMN IF NOT EXISTS shared_from_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

-- Schneller Lookup via Token
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_share_token
  ON public.conversations(share_token)
  WHERE share_token IS NOT NULL;

-- Antwort-Ketten finden
CREATE INDEX IF NOT EXISTS idx_conversations_shared_from
  ON public.conversations(shared_from_id)
  WHERE shared_from_id IS NOT NULL;
