// src/app/api/audit/tasks/route.ts
// GET — list tasks for org (optionally filtered by scan_project_id)
// POST — create task from finding

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { apiValidationError } from '@/lib/api-error'

const log = createLogger('api:audit:tasks')

const createSchema = z.object({
  finding_id:     z.string().uuid().optional().nullable(),
  audit_run_id:   z.string().uuid().optional(),
  scan_project_id: z.string().uuid().nullable().optional(),
  title:          z.string().min(1).max(400),
  agent_source:   z.string().optional().nullable(),
  rule_id:        z.string().optional().nullable(),
  severity:       z.enum(['critical', 'high', 'medium', 'low', 'info']).optional().nullable(),
  file_path:      z.string().optional().nullable(),
  description:    z.string().optional().nullable(),
  suggestion:     z.string().optional().nullable(),
})

async function getOrgId(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('users').select('organization_id').eq('id', userId).single()
  return data?.organization_id ?? null
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(user.id)
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const url = new URL(request.url)
  const scanProjectId = url.searchParams.get('scan_project_id')

  let query = supabaseAdmin
    .from('audit_tasks')
    .select('id, finding_id, audit_run_id, scan_project_id, title, agent_source, rule_id, severity, file_path, description, suggestion, completed, completed_at, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (scanProjectId === 'null' || scanProjectId === '') {
    query = query.is('scan_project_id', null)
  } else if (scanProjectId) {
    query = query.eq('scan_project_id', scanProjectId)
  }

  const { data, error } = await query
  if (error) {
    log.error('Failed to fetch tasks', { error })
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(user.id)
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiValidationError(parsed.error)

  const d = parsed.data

  // Check if task already exists for this finding (skip for group tasks without a finding_id)
  if (d.finding_id) {
    const { data: existing } = await supabaseAdmin
      .from('audit_tasks')
      .select('id')
      .eq('organization_id', orgId)
      .eq('finding_id', d.finding_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Task already exists', id: existing.id }, { status: 409 })
    }
  }

  const { data, error } = await supabaseAdmin
    .from('audit_tasks')
    .insert({
      organization_id: orgId,
      finding_id:      d.finding_id,
      audit_run_id:    d.audit_run_id ?? null,
      scan_project_id: d.scan_project_id ?? null,
      title:           d.title,
      agent_source:    d.agent_source ?? null,
      rule_id:         d.rule_id ?? null,
      severity:        d.severity ?? null,
      file_path:       d.file_path ?? null,
      description:     d.description ?? null,
      suggestion:      d.suggestion ?? null,
    })
    .select('id, finding_id, title, severity, completed, created_at')
    .single()

  if (error) {
    log.error('Failed to create task', { error })
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
