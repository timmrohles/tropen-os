// src/app/api/preflight/projects/[id]/decisions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withPreflightProjectAccess } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { decisionBody } from '@/lib/validators/preflight'
import { apiError } from '@/lib/api-error'
import type { DecisionMap } from '@/lib/preflight/types'

export const PATCH = withPreflightProjectAccess(async (req: NextRequest, { preflightProject: project }) => {
  const { data, error: validationError } = await validateBody(req, decisionBody)
  if (validationError) return validationError

  const { data: row, error: readErr } = await supabaseAdmin
    .from('preflight_projects').select('decisions').eq('id', project.id).single()
  if (readErr) return apiError(readErr)

  const decisions: DecisionMap = { ...(row?.decisions ?? {}) }
  decisions[data.nodeId] = data.choice === 'parked'
    ? { choice: 'parked' }
    : { choice: data.choice, value: data.value }

  const { error: updErr } = await supabaseAdmin
    .from('preflight_projects')
    .update({ decisions, updated_at: new Date().toISOString() })
    .eq('id', project.id)
  if (updErr) return apiError(updErr)

  return NextResponse.json({ decisions })
})
