// src/lib/api/preflight.ts
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * True, wenn das Projekt zur Org des Users gehört (oder Superadmin).
 * Liefert das Projekt mit, um eine zweite Query zu sparen.
 */
export async function getPreflightProjectForUser(
  id: string,
  me: { organization_id: string; role: string },
): Promise<{ id: string; organization_id: string; name: string; pivots: unknown; latest_run_id: string | null } | null> {
  const { data } = await supabaseAdmin
    .from('preflight_projects')
    .select('id, organization_id, name, pivots, latest_run_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (!data) return null
  if (me.role !== 'superadmin' && data.organization_id !== me.organization_id) return null
  return data
}
