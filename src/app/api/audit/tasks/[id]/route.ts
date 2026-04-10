// src/app/api/audit/tasks/[id]/route.ts
// PATCH — toggle completed
// DELETE — remove task

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:audit:tasks:id')

async function getOrgId(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('users').select('organization_id').eq('id', userId).single()
  return data?.organization_id ?? null
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(user.id)
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const { id } = await params
  let body: { completed?: boolean }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const updates: Record<string, unknown> = {}
  if (typeof body.completed === 'boolean') {
    updates.completed = body.completed
    updates.completed_at = body.completed ? new Date().toISOString() : null
  }

  const { data, error } = await supabaseAdmin
    .from('audit_tasks')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', orgId)
    .select('id, completed, completed_at')
    .single()

  if (error) {
    log.error('Failed to update task', { id, error })
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(user.id)
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const { id } = await params

  const { error } = await supabaseAdmin
    .from('audit_tasks')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) {
    log.error('Failed to delete task', { id, error })
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
