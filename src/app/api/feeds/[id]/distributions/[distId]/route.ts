// DELETE /api/feeds/[id]/distributions/[distId] — remove a distribution
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; distId: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, distId } = await params

  // Fetch distribution and verify it belongs to a source in user's org
  // Org filter pushed into query — 404 on wrong org (no unsafe cast needed)
  const { data: dist } = await supabaseAdmin
    .from('feed_distributions')
    .select('id, feed_sources!inner(organization_id)')
    .eq('id', distId)
    .eq('source_id', id)
    .eq('feed_sources.organization_id', user.organization_id)
    .maybeSingle()

  if (!dist) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('feed_distributions')
    .delete()
    .eq('id', distId)

  if (error) return apiError(error)

  return NextResponse.json({ ok: true })
}
