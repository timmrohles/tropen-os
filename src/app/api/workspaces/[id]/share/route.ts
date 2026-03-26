import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { getAuthUser, requireWorkspaceAccess, canWriteWorkspace } from '@/lib/api/workspaces'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const log = createLogger('api:workspaces:share')
type Params = { params: Promise<{ id: string }> }

const shareSchema = z.object({
  active: z.boolean(),
  role: z.enum(['viewer', 'commenter']).default('viewer'),
})

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  let body: z.infer<typeof shareSchema>
  try {
    body = shareSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    share_active: body.active,
    share_role: body.role,
  }

  // Generate token on first activation
  const ws = workspace as unknown as { share_token?: string | null }
  if (body.active && !ws.share_token) {
    updates.share_token = randomBytes(24).toString('hex')
  }

  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .select('id, share_token, share_role, share_active')
    .single()

  if (error) {
    log.error('[share] POST failed', { error: error.message, workspaceId: id })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
