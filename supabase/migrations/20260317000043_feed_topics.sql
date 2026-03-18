-- Migration: 20260317000043_feed_topics.sql
-- Feed-Themen (user-definierte Kategorien) + Quelle↔Thema Verknüpfungen

CREATE TABLE IF NOT EXISTS public.feed_topics (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id  UUID         NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  color            VARCHAR(7),
  display_order    INTEGER      NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS public.feed_topic_sources (
  topic_id    UUID        NOT NULL REFERENCES public.feed_topics(id) ON DELETE CASCADE,
  source_id   UUID        NOT NULL REFERENCES public.feed_sources(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (topic_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_topics_user_id   ON public.feed_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_topics_org_id    ON public.feed_topics(organization_id);
CREATE INDEX IF NOT EXISTS idx_feed_topic_src_topic  ON public.feed_topic_sources(topic_id);
CREATE INDEX IF NOT EXISTS idx_feed_topic_src_source ON public.feed_topic_sources(source_id);

-- RLS
ALTER TABLE public.feed_topics        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_topic_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_topics_select_own" ON public.feed_topics;
CREATE POLICY "feed_topics_select_own" ON public.feed_topics
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "feed_topics_insert_own" ON public.feed_topics;
CREATE POLICY "feed_topics_insert_own" ON public.feed_topics
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "feed_topics_update_own" ON public.feed_topics;
CREATE POLICY "feed_topics_update_own" ON public.feed_topics
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "feed_topics_delete_own" ON public.feed_topics;
CREATE POLICY "feed_topics_delete_own" ON public.feed_topics
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "feed_topic_sources_select_own" ON public.feed_topic_sources;
CREATE POLICY "feed_topic_sources_select_own" ON public.feed_topic_sources
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.feed_topics t WHERE t.id = topic_id AND t.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "feed_topic_sources_insert_own" ON public.feed_topic_sources;
CREATE POLICY "feed_topic_sources_insert_own" ON public.feed_topic_sources
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.feed_topics t WHERE t.id = topic_id AND t.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "feed_topic_sources_delete_own" ON public.feed_topic_sources;
CREATE POLICY "feed_topic_sources_delete_own" ON public.feed_topic_sources
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.feed_topics t WHERE t.id = topic_id AND t.user_id = auth.uid())
  );
