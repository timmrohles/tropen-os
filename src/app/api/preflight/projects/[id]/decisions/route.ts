// src/app/api/preflight/projects/[id]/decisions/route.ts
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { decisionBody } from '@/lib/validators/preflight'
import { apiError } from '@/lib/api-error'
import type { DecisionMap } from '@/lib/preflight/types'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await getPreflightProjectForUser(id, me)
  if (!project) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error: validationError } = await validateBody(req, decisionBody)
  if (validationError) return validationError

  const { data: row, error: readErr } = await supabaseAdmin
    .from('preflight_projects').select('decisions').eq('id', id).single()
  if (readErr) return apiError(readErr)

  const decisions: DecisionMap = { ...(row?.decisions ?? {}) }
  decisions[data.nodeId] = data.choice === 'parked'
    ? { choice: 'parked' }
    : { choice: data.choice, value: data.value }

  const { error: updErr } = await supabaseAdmin
    .from('preflight_projects')
    .update({ decisions, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (updErr) return apiError(updErr)

  return NextResponse.json({ decisions })
}
