import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withAuth } from '@/lib/auth/route-guards'

const log = createLogger('api:cockpit:widgets:id')

export const DELETE = withAuth<{ id: string }>(async (_req, { auth, params }) => {
  const { id } = params

  try {
    const { error } = await supabaseAdmin
      .from('cockpit_widgets')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.id) // ownership enforced

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('DELETE widget error', { error: String(err) })
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
})
