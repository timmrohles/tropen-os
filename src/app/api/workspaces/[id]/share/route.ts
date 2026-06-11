import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withWorkspaceAccess } from '@/lib/auth/route-guards'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { apiError } from '@/lib/api-error'

const log = createLogger('api:workspaces:share')

const shareSchema = z.object({
  active: z.boolean(),
  role: z.enum(['viewer', 'commenter']).default('viewer'),
})

export const POST = withWorkspaceAccess<{ id: string }>(async (request, { workspaceId: id }) => {
  // requireWorkspaceAccess lieferte zusätzlich die Workspace-Zeile (für share_token) —
  // nach bestandenem Guard hier eigenständig nachladen.
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
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
    return apiError(error)
  }

  return NextResponse.json(data)
}, { write: true })
