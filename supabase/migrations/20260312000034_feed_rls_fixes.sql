-- 033b_feed_rls_fixes.sql
-- Fix overly broad SELECT policies on feed join tables

-- feed_source_schemas: scope to user's org via feed_source
DROP POLICY IF EXISTS "feed_source_schemas_select" ON public.feed_source_schemas;
CREATE POLICY "feed_source_schemas_select" ON public.feed_source_schemas
  FOR SELECT USING (
    feed_source_id IN (
      SELECT fs.id FROM public.feed_sources fs
      JOIN public.users u ON u.organization_id = fs.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- feed_distributions: scope to user's org via feed_source
DROP POLICY IF EXISTS "feed_distributions_select" ON public.feed_distributions;
CREATE POLICY "feed_distributions_select" ON public.feed_distributions
  FOR SELECT USING (
    feed_source_id IN (
      SELECT fs.id FROM public.feed_sources fs
      JOIN public.users u ON u.organization_id = fs.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- feed_processing_log: add index for source-based queries
CREATE INDEX IF NOT EXISTS feed_processing_log_source_id_idx
  ON public.feed_processing_log(feed_source_id);
