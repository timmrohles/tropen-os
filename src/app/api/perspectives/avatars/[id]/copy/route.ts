import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { withAuth } from '@/lib/auth/route-guards'

const logger = createLogger('api:perspectives:avatar-copy')

// POST /api/perspectives/avatars/[id]/copy
// Copies any visible avatar as scope='user' for the current user
export const POST = withAuth<{ id: string }>(async (_req, { auth, params }) => {
  const { id } = params

  const { data: source, error: fetchError } = await supabaseAdmin
    .from('perspective_avatars')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !source) return NextResponse.json({ error: 'Avatar nicht gefunden' }, { status: 404 })

  const { data: copy, error } = await supabaseAdmin
    .from('perspective_avatars')
    .insert({
      scope:           'user',
      user_id:         auth.id,
      organization_id: null,
      name:            `${(source as { name: string }).name} (Kopie)`,
      emoji:           (source as { emoji: string }).emoji,
      description:     (source as { description: string | null }).description,
      system_prompt:   (source as { system_prompt: string }).system_prompt,
      model_id:        (source as { model_id: string }).model_id,
      context_default: (source as { context_default: string }).context_default,
      is_tabula_rasa:  false,
    })
    .select()
    .single()

  if (error) {
    logger.error('avatar copy failed', { sourceId: id, error: error.message })
    return apiError(error)
  }

  logger.info('avatar copied', { sourceId: id, copyId: copy.id, userId: auth.id })
  return NextResponse.json({ avatar: copy }, { status: 201 })
})
