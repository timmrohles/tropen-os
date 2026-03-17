// src/lib/project-context.ts
// Reusable Node.js helper for loading project instructions + memory into system prompts.
// Used by chat/stream and future routes. All queries use supabaseAdmin.
import { supabaseAdmin } from '@/lib/supabase-admin'

export interface ProjectMemorySection {
  instructions:  string | null
  memoryEntries: string | null
  tokenEstimate: number   // approximate token count (chars / 4)
}

/**
 * Load project instructions + recent memory entries for a given project.
 * Returns formatted strings ready for system prompt injection.
 * Both queries run in parallel.
 */
export async function loadProjectContext(
  projectId: string
): Promise<ProjectMemorySection> {
  const [{ data: project }, { data: memRows }] = await Promise.all([
    supabaseAdmin
      .from('projects')
      .select('instructions')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single(),
    supabaseAdmin
      .from('project_memory')
      .select('type, content')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const instructions = project?.instructions ?? null
  const memoryEntries = memRows?.length
    ? (memRows as { type: string; content: string }[])
        .map(m => `[${m.type}] ${m.content}`)
        .join('\n')
    : null

  const tokenEstimate = Math.ceil(
    ((instructions?.length ?? 0) + (memoryEntries?.length ?? 0)) / 4
  )

  return { instructions, memoryEntries, tokenEstimate }
}
