import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { createAgentSchema } from '@/lib/validators/agents'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle()

  const orgId = profile?.organization_id

  let query = supabaseAdmin
    .from('agents')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (orgId) {
    query = query.or(`user_id.eq.${user.id},and(visibility.eq.org,organization_id.eq.${orgId})`)
  } else {
    query = query.eq('user_id', user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: body, error: validationError } = await validateBody(req, createAgentSchema)
  if (validationError) return validationError

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle()

  const { data, error } = await supabaseAdmin
    .from('agents')
    .insert({
      user_id: user.id,
      organization_id: profile?.organization_id ?? null,
      name: body.name,
      description: body.description ?? null,
      system_prompt: body.system_prompt ?? null,
      visibility: body.visibility,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
