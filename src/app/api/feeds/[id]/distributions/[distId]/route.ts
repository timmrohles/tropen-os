// DELETE /api/feeds/[id]/distributions/[distId] — remove a distribution
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withOrgAdmin } from '@/lib/auth/route-guards'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

export const DELETE = withOrgAdmin<{ id: string; distId: string }>(async (_req, { auth, params }) => {
  const { id, distId } = params

  // Fetch distribution and verify it belongs to a source in user's org
  // Org filter pushed into query — 404 on wrong org (no unsafe cast needed)
  const { data: dist } = await supabaseAdmin
    .from('feed_distributions')
    .select('id, feed_sources!inner(organization_id)')
    .eq('id', distId)
    .eq('source_id', id)
    .eq('feed_sources.organization_id', auth.organization_id)
    .maybeSingle()

  if (!dist) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('feed_distributions')
    .delete()
    .eq('id', distId)

  if (error) return apiError(error)

  return NextResponse.json({ ok: true })
})
