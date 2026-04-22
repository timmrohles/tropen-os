import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import { BOOKMARK_FIELDS } from '@/lib/db/fields'

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

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (conversationId && !uuidPattern.test(conversationId)) {
    return NextResponse.json([])
  }

  let query = supabaseAdmin
    .from('bookmarks')
    .select(BOOKMARK_FIELDS)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (conversationId) {
    query = query.eq('conversation_id', conversationId)
  }

  const { data, error } = await query

  if (error) return apiError(error)

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  try {  
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
    const body = await req.json()
    const { messageId, conversationId, contentPreview } = body
  
    if (!messageId || !conversationId) {
      return NextResponse.json({ error: 'messageId and conversationId required' }, { status: 400 })
    }
  
    const { data, error } = await supabaseAdmin
      .from('bookmarks')
      .upsert(
        {
          message_id: messageId,
          conversation_id: conversationId,
          user_id: user.id,
          content_preview: contentPreview ? contentPreview.slice(0, 200) : null,
        },
        { onConflict: 'message_id,user_id' }
      )
      .select(BOOKMARK_FIELDS)
      .single()

    if (error) return apiError(error)

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(req: NextRequest) {
  try {  
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
    const body = await req.json()
    const { messageId } = body
  
    if (!messageId) {
      return NextResponse.json({ error: 'messageId required' }, { status: 400 })
    }
  
    const { error } = await supabaseAdmin
      .from('bookmarks')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
  
    if (error) return apiError(error)
  
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err)
  }
}
