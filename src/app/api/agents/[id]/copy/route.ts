// POST /api/agents/[id]/copy — Agent als eigene Basis kopieren
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mapAgent } from '@/types/agents'
import { createLogger } from '@/lib/logger'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

const log = createLogger('api/agents/[id]/copy')

export const POST = withAuth<{ id: string }>(async (_request, { auth: me, params }) => {
  const { id } = params

  const { data: source } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const row = source as Record<string, unknown>

  const { data, error } = await supabaseAdmin
    .from('agents')
    .insert({
      name:              `${row.name as string} (Kopie)`,
      description:       row.description,
      emoji:             row.emoji,
      scope:             'user',
      organization_id:   me.organization_id,
      user_id:           me.id,
      system_prompt:     row.system_prompt,
      trigger_type:      row.trigger_type,
      trigger_config:    row.trigger_config,
      capability_steps:  row.capability_steps,
      input_sources:     row.input_sources,
      output_targets:    row.output_targets,
      requires_approval: row.requires_approval,
      max_cost_eur:      row.max_cost_eur,
      requires_package:  null,
      created_by_role:   me.role === 'superadmin' ? 'superadmin'
                          : ['owner','admin'].includes(me.role) ? 'org_admin'
                          : 'member',
      source_agent_id:   id,
      is_template:       false,
      is_active:         true,
      display_order:     0,
    })
    .select()
    .single()

  if (error) {
    log.error('POST /api/agents/[id]/copy failed', { id, error: error.message })
    return apiError(error)
  }

  return NextResponse.json({ agent: mapAgent(data as Record<string, unknown>) }, { status: 201 })
})
