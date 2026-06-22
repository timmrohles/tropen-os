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

// POST — leeres "Entwurf"-Projekt anlegen für den chat-first Einstieg
// (User ohne Specs → direkt ins Gespräch). Toro/Concept-Extractor benennt es später.
export const POST = withAuth(async (_req: NextRequest, { auth: me }) => {
  const { data, error } = await supabaseAdmin
    .from('preflight_projects')
    .insert({ organization_id: me.organization_id, user_id: me.id, name: 'Entwurf', pivots: {}, red_count: 0 })
    .select('id')
    .single()
  if (error || !data) return apiError(error ?? new Error('insert failed'))
  return NextResponse.json({ projectId: data.id })
})
