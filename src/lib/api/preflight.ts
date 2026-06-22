// src/lib/api/preflight.ts
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * True, wenn das Projekt zur Org des Users gehört (oder Superadmin).
 * Liefert das Projekt mit, um eine zweite Query zu sparen.
 */
export async function getPreflightProjectForUser(
  id: string,
  me: { organization_id: string; role: string },
): Promise<{ id: string; organization_id: string; name: string; pivots: unknown; latest_run_id: string | null; decisions?: unknown; conversation_id?: string | null } | null> {
  const { data } = await supabaseAdmin
    .from('preflight_projects')
    .select('id, organization_id, name, pivots, latest_run_id, decisions, conversation_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (!data) return null
  if (me.role !== 'superadmin' && data.organization_id !== me.organization_id) return null
  return data
}

/**
 * Stellt sicher, dass ein Preflight-Projekt eine verknüpfte Pre-Flight-Conversation hat.
 * Idempotent. Gibt die conversation_id zurück.
 */
export async function ensurePreflightConversation(
  project: { id: string; name: string; conversation_id?: string | null },
  userId: string,
): Promise<string> {
  if (project.conversation_id) return project.conversation_id

  const { data: conv, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      user_id: userId,
      workspace_id: null,
      conversation_type: 'preflight',
      title: project.name,
      intention: null, // 'frei' = NULL; Sub-Plan 2 setzt 'guided' beim Schärfen
    })
    .select('id')
    .single()
  if (error || !conv) throw error ?? new Error('Conversation konnte nicht erstellt werden')

  await supabaseAdmin
    .from('preflight_projects')
    .update({ conversation_id: conv.id })
    .eq('id', project.id)

  return conv.id
}
