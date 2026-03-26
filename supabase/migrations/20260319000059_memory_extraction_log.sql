-- 20260319000059_memory_extraction_log.sql
-- Protokoll für automatische Gedächtnis-Extraktion aus Konversationen.
-- APPEND ONLY — kein UPDATE oder DELETE.

CREATE TABLE IF NOT EXISTS public.memory_extraction_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  content_hash     TEXT NOT NULL,           -- SHA-256 der Konversation (verhindert Doppel-Extraktion)
  memories_extracted INT NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'skip', 'error')),
  error_message    TEXT,
  model_used       TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
  tokens_input     INT,
  tokens_output    INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index: schnelle Lookup per Konversation
CREATE INDEX IF NOT EXISTS idx_memory_extraction_conv
  ON public.memory_extraction_log(conversation_id, status);

-- Index: Lookup per content_hash (Duplikat-Prüfung)
CREATE INDEX IF NOT EXISTS idx_memory_extraction_hash
  ON public.memory_extraction_log(content_hash);

-- RLS: nur Service Role schreibt (supabaseAdmin), kein direkter Client-Zugriff
ALTER TABLE public.memory_extraction_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON public.memory_extraction_log
  FOR ALL
  USING (false);
