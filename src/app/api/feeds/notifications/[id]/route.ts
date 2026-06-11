// PATCH /api/feeds/notifications/[id] — einzelne Notification als gelesen markieren
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/auth/route-guards'
import { apiError } from '@/lib/api-error'

export const runtime = 'nodejs'

export const PATCH = withAuth<{ id: string }>(async (_request, { auth, params }) => {
  const { id } = params

  const { error } = await supabaseAdmin
    .from('feed_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', auth.id) // ownership guard

  if (error) return apiError(error)

  return NextResponse.json({ ok: true })
})
