import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') // 'team' = org-geteilte Vorlagen anderer User

  if (scope === 'team') {
    // Eigene Org ermitteln
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.organization_id) return NextResponse.json([])

    const { data, error } = await supabaseAdmin
      .from('prompt_templates')
      .select('id, name, content, is_shared, created_at, user_id')
      .eq('organization_id', profile.organization_id)
      .eq('is_shared', true)
      .neq('user_id', user.id) // nur fremde (eigene sieht man im "Meine"-Tab)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  }

  // Standard: eigene Vorlagen
  const { data, error } = await supabaseAdmin
    .from('prompt_templates')
    .select('id, name, content, is_shared, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, content, is_shared } = await req.json()
  if (!name?.trim() || !content?.trim())
    return NextResponse.json({ error: 'name und content erforderlich' }, { status: 400 })

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle()

  const { data, error } = await supabaseAdmin
    .from('prompt_templates')
    .insert({
      user_id: user.id,
      organization_id: profile?.organization_id ?? null,
      name: name.trim(),
      content: content.trim(),
      is_shared: is_shared ?? false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
