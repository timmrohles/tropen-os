// Creates a user-scope copy of a public or system role
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { data: source } = await supabaseAdmin.from('roles')
    .select('*').eq('id', id).is('deleted_at', null).single()
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const s = source as Record<string, unknown>
  if (!['system','public','package'].includes(s.scope as string)) {
    return NextResponse.json({ error: 'Can only import system/public/package roles' }, { status: 422 })
  }

  const { data: copy, error } = await supabaseAdmin.from('roles').insert({
    name: s.name, label: s.label, icon: s.icon, description: s.description,
    scope: 'user', user_id: me.id,
    system_prompt: s.system_prompt, domain_keywords: s.domain_keywords ?? [],
    vocabulary: s.vocabulary ?? [], preferred_capability_types: s.preferred_capability_types ?? [],
    preferred_skill_names: s.preferred_skill_names ?? [],
    preferred_outcome_types: s.preferred_outcome_types ?? [],
    recommended_model_class: s.recommended_model_class ?? 'deep',
    source_id: id, created_by_role: 'member',
  }).select('id').single()

  if (error) return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  return NextResponse.json({ id: copy.id }, { status: 201 })
}
