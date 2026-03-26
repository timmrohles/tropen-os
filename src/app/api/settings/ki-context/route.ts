import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('user_preferences')
    .select('ki_context, ki_role, communication_style')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json(data ?? {})
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Record<string, string>

  await supabaseAdmin
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      ...(body.ki_context !== undefined && { ki_context: body.ki_context }),
      ...(body.ki_role !== undefined && { ki_role: body.ki_role }),
      ...(body.communication_style !== undefined && { communication_style: body.communication_style }),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  return NextResponse.json({ ok: true })
}
