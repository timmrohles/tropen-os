import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'
import { apiError } from '@/lib/api-error'
import { withAuth } from '@/lib/auth/route-guards'

const logger = createLogger('api:perspectives:avatar-detail')

const patchSchema = z.object({
  name:            z.string().min(1).max(80).optional(),
  emoji:           z.string().min(1).max(10).optional(),
  description:     z.string().max(300).nullable().optional(),
  system_prompt:   z.string().min(10).max(3000).optional(),
  model_id:        z.string().optional(),
  context_default: z.enum(['last_5','last_10','last_20','full','none']).optional(),
  is_active:       z.boolean().optional(),
})

async function getAvatar(id: string) {
  const { data, error } = await supabaseAdmin
    .from('perspective_avatars')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  return { avatar: data, error }
}

// PATCH /api/perspectives/avatars/[id]
export const PATCH = withAuth<{ id: string }>(async (req, { auth, params }) => {
  const { id } = params
  const { avatar, error: fetchError } = await getAvatar(id)
  if (fetchError || !avatar) return NextResponse.json({ error: 'Avatar nicht gefunden' }, { status: 404 })

  // Only own user-scoped avatars can be edited
  if ((avatar as { scope: string }).scope !== 'user' || (avatar as { user_id: string }).user_id !== auth.id) {
    return NextResponse.json({ error: 'Nur eigene Avatare können bearbeitet werden' }, { status: 403 })
  }

  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = patchSchema.safeParse(rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })

  const { data: updated, error } = await supabaseAdmin
    .from('perspective_avatars')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('avatar update failed', { id, error: error.message })
    return apiError(error)
  }

  return NextResponse.json({ avatar: updated })
})

// DELETE /api/perspectives/avatars/[id]  (soft delete)
export const DELETE = withAuth<{ id: string }>(async (_req, { auth, params }) => {
  const { id } = params
  const { avatar, error: fetchError } = await getAvatar(id)
  if (fetchError || !avatar) return NextResponse.json({ error: 'Avatar nicht gefunden' }, { status: 404 })

  if ((avatar as { scope: string }).scope === 'system') {
    return NextResponse.json({ error: 'System-Avatare können nicht gelöscht werden' }, { status: 403 })
  }
  if ((avatar as { user_id: string }).user_id !== auth.id) {
    return NextResponse.json({ error: 'Nur eigene Avatare können gelöscht werden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('perspective_avatars')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    logger.error('avatar delete failed', { id, error: error.message })
    return apiError(error)
  }

  logger.info('avatar soft-deleted', { id, userId: auth.id })
  return NextResponse.json({ ok: true })
})
