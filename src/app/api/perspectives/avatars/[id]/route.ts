import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'

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

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

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
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { avatar, error: fetchError } = await getAvatar(id)
  if (fetchError || !avatar) return NextResponse.json({ error: 'Avatar nicht gefunden' }, { status: 404 })

  // Only own user-scoped avatars can be edited
  if ((avatar as { scope: string }).scope !== 'user' || (avatar as { user_id: string }).user_id !== user.id) {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ avatar: updated })
}

// DELETE /api/perspectives/avatars/[id]  (soft delete)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { avatar, error: fetchError } = await getAvatar(id)
  if (fetchError || !avatar) return NextResponse.json({ error: 'Avatar nicht gefunden' }, { status: 404 })

  if ((avatar as { scope: string }).scope === 'system') {
    return NextResponse.json({ error: 'System-Avatare können nicht gelöscht werden' }, { status: 403 })
  }
  if ((avatar as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: 'Nur eigene Avatare können gelöscht werden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('perspective_avatars')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    logger.error('avatar delete failed', { id, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  logger.info('avatar soft-deleted', { id, userId: user.id })
  return NextResponse.json({ ok: true })
}
