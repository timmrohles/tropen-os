// DELETE /api/feeds/[id]/distributions/[distId] — remove a distribution
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'

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
  const { data: dist } = await supabaseAdmin
    .from('feed_distributions')
    .select('id, source_id, feed_sources!inner(organization_id)')
    .eq('id', distId)
    .eq('source_id', id)
    .maybeSingle()

  if (!dist) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const distRow = dist as Record<string, unknown>
  const feedSrc = distRow.feed_sources as Record<string, unknown>
  if (feedSrc.organization_id !== user.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('feed_distributions')
    .delete()
    .eq('id', distId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
