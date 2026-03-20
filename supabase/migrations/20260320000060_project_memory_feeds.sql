-- 20260320000060_project_memory_feeds.sql
-- Extend project_memory for feed distribution
-- Add organization_id, memory_type, source_url, metadata columns
-- Deprecate type, source_conversation_id, importance, tags in favor of standardized fields

-- Add new columns to project_memory
ALTER TABLE public.project_memory
  ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN memory_type TEXT NOT NULL DEFAULT 'manual' CHECK (memory_type IN ('manual', 'feed_item', 'extraction')),
  ADD COLUMN source_url TEXT,
  ADD COLUMN metadata JSONB DEFAULT '{}';

-- Create index on memory_type for filtering
CREATE INDEX project_memory_memory_type_idx ON public.project_memory(project_id, memory_type);

-- Backfill organization_id from project's department
UPDATE public.project_memory pm
SET organization_id = d.organization_id
FROM public.projects p
JOIN public.departments d ON p.department_id = d.id
WHERE pm.project_id = p.id AND pm.organization_id IS NULL;

-- Make organization_id NOT NULL after backfill
ALTER TABLE public.project_memory
  ALTER COLUMN organization_id SET NOT NULL;
