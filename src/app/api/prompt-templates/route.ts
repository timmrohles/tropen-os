import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { createPromptTemplateSchema } from '@/lib/validators/prompt-templates'
import { apiError } from '@/lib/api-error'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') // 'team' = org-geteilte Vorlagen anderer User
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

  if (scope === 'team') {
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.organization_id) return NextResponse.json({ data: [], total: 0, limit, offset })

    const { data, error, count } = await supabaseAdmin
      .from('prompt_templates')
      .select('id, name, content, is_shared, created_at, user_id', { count: 'exact' })
      .eq('organization_id', profile.organization_id)
      .eq('is_shared', true)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return apiError(error)
    return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset })
  }

  // Standard: eigene Vorlagen
  const { data, error, count } = await supabaseAdmin
    .from('prompt_templates')
    .select('id, name, content, is_shared, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return apiError(error)
  return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: body, error: validationError } = await validateBody(req, createPromptTemplateSchema)
  if (validationError) return validationError

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
      name: body.name,
      content: body.content,
      is_shared: body.is_shared,
    })
    .select()
    .single()

  if (error) return apiError(error)
  return NextResponse.json(data, { status: 201 })
}
