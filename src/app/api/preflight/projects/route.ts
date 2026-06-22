// src/app/api/preflight/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import type { PreflightProjectListItem } from '@/lib/preflight/types'

export const GET = withAuth(async (_req: NextRequest, { auth: me }) => {
  const { data, error } = await supabaseAdmin
    .from('preflight_projects')
    .select('id, name, pivots, red_count, updated_at')
    .eq('organization_id', me.organization_id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) return apiError(error)

  const items: PreflightProjectListItem[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    stack: (r.pivots as { stack?: string })?.stack ?? '',
    redCount: r.red_count ?? 0,
    updatedAt: r.updated_at,
  }))
  return NextResponse.json({ data: items })
})
