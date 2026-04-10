import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { createArtifactSchema } from '@/lib/validators/artifacts'
import { apiError } from '@/lib/api-error'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get('conversationId')
  const organizationId = searchParams.get('organizationId')

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (conversationId && !uuidPattern.test(conversationId)) {
    return NextResponse.json({ data: [], total: 0, limit: 50, offset: 0 })
  }
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

  let query = supabaseAdmin
    .from('artifacts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (conversationId) {
    query = query.eq('conversation_id', conversationId)
  } else if (organizationId) {
    query = query.eq('organization_id', organizationId)
  } else {
    query = query.eq('user_id', user.id)
  }

  const { data, error, count } = await query
  if (error) return apiError(error)

  return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: body, error: validationError } = await validateBody(req, createArtifactSchema)
  if (validationError) return validationError

  // Verify user belongs to the org
  const { data: membership } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .eq('organization_id', body.organizationId)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('artifacts')
    .insert({
      message_id: body.messageId ?? null,
      conversation_id: body.conversationId,
      organization_id: body.organizationId,
      user_id: user.id,
      name: body.name,
      type: body.type,
      language: body.language ?? null,
      content: body.content,
    })
    .select()
    .single()

  if (error) return apiError(error)

  return NextResponse.json(data, { status: 201 })
}
