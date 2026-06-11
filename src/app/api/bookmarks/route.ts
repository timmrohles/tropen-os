import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import { BOOKMARK_FIELDS } from '@/lib/db/fields'
import { withAuth } from '@/lib/auth/route-guards'

export const GET = withAuth(async (req, { auth }) => {
  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get('conversationId')

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (conversationId && !uuidPattern.test(conversationId)) {
    return NextResponse.json([])
  }

  let query = supabaseAdmin
    .from('bookmarks')
    .select(BOOKMARK_FIELDS)
    .eq('user_id', auth.id)
    .order('created_at', { ascending: false })

  if (conversationId) {
    query = query.eq('conversation_id', conversationId)
  }

  const { data, error } = await query

  if (error) return apiError(error)

  return NextResponse.json(data ?? [])
})

export const POST = withAuth(async (req, { auth }) => {
  try {
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
          user_id: auth.id,
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
})

export const DELETE = withAuth(async (req, { auth }) => {
  try {
    const body = await req.json()
    const { messageId } = body
  
    if (!messageId) {
      return NextResponse.json({ error: 'messageId required' }, { status: 400 })
    }
  
    const { error } = await supabaseAdmin
      .from('bookmarks')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', auth.id)

    if (error) return apiError(error)

    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err)
  }
})
