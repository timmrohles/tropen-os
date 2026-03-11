import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

  let query = supabaseAdmin
    .from('artifacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (conversationId) {
    query = query.eq('conversation_id', conversationId)
  } else if (organizationId) {
    query = query.eq('organization_id', organizationId)
  } else {
    // Fallback: all artifacts for this user
    query = query.eq('user_id', user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { conversationId, organizationId, name, type, language, content, messageId } = body

  if (!conversationId || !organizationId || !name || !type || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify user belongs to the org
  const { data: membership } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .eq('organization_id', organizationId)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('artifacts')
    .insert({
      message_id: messageId ?? null,
      conversation_id: conversationId,
      organization_id: organizationId,
      user_id: user.id,
      name,
      type,
      language: language ?? null,
      content,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
