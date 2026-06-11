import { createLogger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import { withSuperadmin } from '@/lib/auth/route-guards'

const log = createLogger('superadmin/perspectives/[id]')

export const PATCH = withSuperadmin<{ id: string }>(async (req: NextRequest, { params }) => {
  try {
    const { id } = params
    const body = await req.json()
  
    const allowed = ['name', 'emoji', 'description', 'system_prompt', 'model_id',
      'context_default', 'is_tabula_rasa', 'is_active', 'sort_order']
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }
  
    const { data, error } = await supabaseAdmin
      .from('perspective_avatars')
      .update(updates)
      .eq('id', id)
      .eq('scope', 'system')
      .select()
      .single()
  
    if (error) {
      log.error('PATCH perspective failed', { id, error })
      return apiError(error)
    }
    return NextResponse.json({ avatar: data })
  } catch (err) {
    return apiError(err)
  }
})

export const DELETE = withSuperadmin<{ id: string }>(async (_req: NextRequest, { params }) => {
  const { id } = params

  const { error } = await supabaseAdmin
    .from('perspective_avatars')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('scope', 'system')

  if (error) {
    log.error('DELETE perspective failed', { id, error })
    return apiError(error)
  }
  return NextResponse.json({ ok: true })
})
