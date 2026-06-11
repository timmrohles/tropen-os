// GET  /api/feeds/notifications — eigene ungelesene Notifications
// PATCH /api/feeds/notifications — alle als gelesen markieren
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/auth/route-guards'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

export const GET = withAuth(async (request, { auth }) => {
  const url = new URL(request.url)
  const unreadOnly = url.searchParams.get('unread') !== 'false'
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 200)

  let query = supabaseAdmin
    .from('feed_notifications')
    .select('*')
    .eq('user_id', auth.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unreadOnly) query = query.eq('is_read', false)

  const { data, error } = await query
  if (error) return apiError(error)

  return NextResponse.json({ notifications: data ?? [] })
})

export const PATCH = withAuth(async (_request, { auth }) => {
  // Mark all unread notifications for this user as read
  const { error } = await supabaseAdmin
    .from('feed_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', auth.id)
    .eq('is_read', false)

  if (error) return apiError(error)

  return NextResponse.json({ ok: true })
})
