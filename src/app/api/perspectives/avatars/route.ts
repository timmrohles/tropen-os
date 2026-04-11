import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'
import { apiError } from '@/lib/api-error'

const logger = createLogger('api:perspectives:avatars')

const createSchema = z.object({
  name:            z.string().min(1).max(80),
  emoji:           z.string().min(1).max(10),
  description:     z.string().max(300).optional(),
  system_prompt:   z.string().min(10).max(3000),
  model_id:        z.string().optional(),
  context_default: z.enum(['last_5','last_10','last_20','full','none']).optional(),
  scope:           z.enum(['user','org']).optional().default('user'),
})

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// GET /api/perspectives/avatars
// Returns all visible avatars for the current user (system + org + own)
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabaseAdmin
    .from('users').select('organization_id, role').eq('id', user.id).single()
  if (!userRow) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })

  const { data: avatars, error } = await supabaseAdmin
    .from('perspective_avatars')
    .select('*')
    .is('deleted_at', null)
    .eq('is_active', true)
    .or(
      `scope.eq.system,` +
      `and(scope.eq.org,organization_id.eq.${userRow.organization_id}),` +
      `and(scope.eq.user,user_id.eq.${user.id})`
    )
    .order('sort_order', { ascending: true })

  if (error) {
    logger.error('avatars fetch failed', { error: error.message })
    return apiError(error)
  }

  // Fetch user's pin settings
  const { data: settings } = await supabaseAdmin
    .from('perspective_user_settings')
    .select('avatar_id, is_pinned, sort_order')
    .eq('user_id', user.id)

  const settingsMap = new Map((settings ?? []).map(s => [s.avatar_id as string, s]))

  const result = (avatars ?? []).map(a => ({
    ...a,
    is_pinned: settingsMap.get(a.id as string)?.is_pinned ?? (a.scope === 'system'),
    user_sort_order: settingsMap.get(a.id as string)?.sort_order ?? (a.sort_order as number),
  }))

  return NextResponse.json({ avatars: result })
}

// POST /api/perspectives/avatars
// Create a new avatar (scope='user' or 'org' for org admin)
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabaseAdmin
    .from('users').select('organization_id, role').eq('id', user.id).single()
  if (!userRow) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })

  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = createSchema.safeParse(rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })

  const { name, emoji, description, system_prompt, model_id, context_default, scope } = parsed.data

  // Only org admin can create org-scoped avatars
  if (scope === 'org' && !['admin','owner'].includes(userRow.role as string)) {
    return NextResponse.json({ error: 'Nur Admins können Org-Avatare erstellen' }, { status: 403 })
  }

  const { data: avatar, error } = await supabaseAdmin
    .from('perspective_avatars')
    .insert({
      scope,
      organization_id: scope === 'org' ? userRow.organization_id : null,
      user_id: scope === 'user' ? user.id : null,
      name, emoji,
      description: description ?? null,
      system_prompt,
      model_id: model_id ?? 'claude-sonnet-4-20250514',
      context_default: context_default ?? 'last_10',
    })
    .select()
    .single()

  if (error) {
    logger.error('avatar create failed', { error: error.message })
    return apiError(error)
  }

  logger.info('avatar created', { avatarId: avatar.id, scope })
  return NextResponse.json({ avatar }, { status: 201 })
}
