// GET   /api/skills/[id] — einzelner Skill
// PATCH /api/skills/[id] — Skill bearbeiten
// DELETE /api/skills/[id] — Soft Delete (deleted_at)
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapSkill } from '@/types/agents'
import { resolveSkill, canModifySkill } from '@/lib/skill-resolver'
import { createLogger } from '@/lib/logger'

export const runtime = 'nodejs'

const log = createLogger('api/skills/[id]')

// ─── GET /api/skills/[id] ─────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const skill = await resolveSkill(id, me.id, me.organization_id)
  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ skill })
}

// ─── PATCH /api/skills/[id] ───────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const skill = await resolveSkill(id, me.id, me.organization_id)
  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!canModifySkill(skill, me.id, me.organization_id, me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  // Build update object — only allowed fields
  const allowedFields: Record<string, string> = {
    title:                'title',
    description:          'description',
    instructions:         'instructions',
    contextRequirements:  'context_requirements',
    governanceRules:      'governance_rules',
    qualityCriteria:      'quality_criteria',
    inputSchema:          'input_schema',
    outputType:           'output_type',
    triggerKeywords:      'trigger_keywords',
    isActive:             'is_active',
    isTemplate:           'is_template',
    requiresPackage:      'requires_package',
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const [camel, snake] of Object.entries(allowedFields)) {
    if (camel in body) updates[snake] = body[camel]
  }

  const { data, error } = await supabaseAdmin
    .from('skills')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    log.error('PATCH /api/skills/[id] failed', { id, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ skill: mapSkill(data as Record<string, unknown>) })
}

// ─── DELETE /api/skills/[id] — Soft Delete ───────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const skill = await resolveSkill(id, me.id, me.organization_id)
  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!canModifySkill(skill, me.id, me.organization_id, me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('skills')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    log.error('DELETE /api/skills/[id] failed', { id, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
