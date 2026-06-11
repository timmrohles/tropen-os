import { createLogger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import { withSuperadmin } from '@/lib/auth/route-guards'

const log = createLogger('superadmin/perspectives')

export const GET = withSuperadmin(async () => {
  const { data, error } = await supabaseAdmin
    .from('perspective_avatars')
    .select('*')
    .eq('scope', 'system')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  if (error) {
    log.error('GET perspectives failed', { error })
    return apiError(error)
  }
  return NextResponse.json({ avatars: data })
})

export const POST = withSuperadmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { name, emoji, description, system_prompt, model_id, context_default, is_tabula_rasa, is_active, sort_order } = body
  
    if (!name || !system_prompt) {
      return NextResponse.json({ error: 'name und system_prompt sind Pflichtfelder' }, { status: 400 })
    }
  
    const { data, error } = await supabaseAdmin
      .from('perspective_avatars')
      .insert({
        scope: 'system',
        name,
        emoji: emoji || '🤖',
        description: description || null,
        system_prompt,
        model_id: model_id || 'claude-haiku-4-5-20251001',
        context_default: context_default || 'last_10',
        is_tabula_rasa: is_tabula_rasa ?? false,
        is_active: is_active ?? true,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single()
  
    if (error) {
      log.error('POST perspectives failed', { error })
      return apiError(error)
    }
    return NextResponse.json({ avatar: data }, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
})
