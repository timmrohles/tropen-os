import { apiError } from '@/lib/api-error'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withAuth } from '@/lib/auth/route-guards'

export const GET = withAuth(async (_req: NextRequest, { auth }) => {
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('full_name, email, salutation, role')
    .eq('id', auth.id)
    .maybeSingle()

  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('language, chat_style, model_preference, toro_address, language_style')
    .eq('user_id', auth.id)
    .maybeSingle()

  return NextResponse.json({ ...profile, prefs: prefs ?? {} })
})

export const PATCH = withAuth(async (req: NextRequest, { auth }) => {
  try {
    const body = await req.json() as Record<string, string>

    await supabaseAdmin
      .from('users')
      .update({
        ...(body.full_name !== undefined && { full_name: body.full_name }),
        ...(body.salutation !== undefined && { salutation: body.salutation }),
      })
      .eq('id', auth.id)

    const prefsUpdate: Record<string, string> = {}
    if (body.language !== undefined)       prefsUpdate.language = body.language
    if (body.chat_style !== undefined)     prefsUpdate.chat_style = body.chat_style
    if (body.toro_address !== undefined)   prefsUpdate.toro_address = body.toro_address
    if (body.language_style !== undefined) prefsUpdate.language_style = body.language_style

    if (Object.keys(prefsUpdate).length > 0) {
      await supabaseAdmin
        .from('user_preferences')
        .upsert({
          user_id: auth.id,
          ...prefsUpdate,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
})
