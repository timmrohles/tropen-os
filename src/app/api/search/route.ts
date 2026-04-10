import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const workspaceId = searchParams.get('workspaceId')

  if (!q || q.length < 2) return NextResponse.json([])

  // Get conversations the user has access to
  let convQuery = supabaseAdmin
    .from('conversations')
    .select('id')
    .is('deleted_at', null)

  if (workspaceId) {
    convQuery = convQuery.eq('workspace_id', workspaceId)
  } else {
    convQuery = convQuery.eq('user_id', user.id).eq('conversation_type', 'chat')
  }

  const { data: convs } = await convQuery
  if (!convs?.length) return NextResponse.json([])

  const convIds = convs.map(c => c.id)

  // Search messages using full text ilike
  const { data: messages, error } = await supabaseAdmin
    .from('messages')
    .select(`
      id,
      conversation_id,
      content,
      role,
      created_at,
      conversations!inner(title)
    `)
    .in('conversation_id', convIds)
    .ilike('content', `%${q}%`)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return apiError(error)

  const results = (messages ?? []).map((m) => ({
    id: m.id,
    conversation_id: m.conversation_id,
    conversation_title: ((m.conversations as unknown) as { title: string | null } | null)?.title ?? null,
    content: m.content,
    role: m.role,
    created_at: m.created_at,
  }))

  return NextResponse.json(results)
}
