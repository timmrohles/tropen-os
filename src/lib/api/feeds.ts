import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Prüft, ob eine Feed-Quelle zur Organisation des Aufrufers gehört.
 * Analog zu verifyProjectAccess (src/lib/api/projects.ts).
 * Superadmin hat Zugriff auf alle Quellen.
 */
export async function verifyFeedSourceAccess(
  sourceId: string,
  me: { organization_id: string; role: string },
): Promise<boolean> {
  if (me.role === 'superadmin') return true
  const { data } = await supabaseAdmin
    .from('feed_sources')
    .select('id')
    .eq('id', sourceId)
    .eq('organization_id', me.organization_id)
    .maybeSingle()
  return !!data
}
