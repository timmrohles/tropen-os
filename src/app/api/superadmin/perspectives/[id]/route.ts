import { createLogger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'

const log = createLogger('superadmin/perspectives/[id]')

async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (me?.role !== 'superadmin') return null
  return user
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {  
    const user = await requireSuperadmin()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
    const { id } = await params
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
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSuperadmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

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
}
