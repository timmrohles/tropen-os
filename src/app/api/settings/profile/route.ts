import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('full_name, email, salutation, role')
    .eq('id', user.id)
    .maybeSingle()

  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('language, chat_style, model_preference')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ ...profile, prefs: prefs ?? {} })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Record<string, string>

  await supabaseAdmin
    .from('users')
    .update({
      ...(body.full_name !== undefined && { full_name: body.full_name }),
      ...(body.salutation !== undefined && { salutation: body.salutation }),
    })
    .eq('id', user.id)

  if (body.language !== undefined || body.chat_style !== undefined) {
    await supabaseAdmin
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...(body.language !== undefined && { language: body.language }),
        ...(body.chat_style !== undefined && { chat_style: body.chat_style }),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
  }

  return NextResponse.json({ ok: true })
}
