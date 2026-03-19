// Creates a user-scope copy of a public or system skill
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/library/skills/[id]/import')

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { data: source } = await supabaseAdmin.from('skills')
    .select('*').eq('id', id).is('deleted_at', null).single()
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const s = source as Record<string, unknown>
  if (!['system','public','package'].includes(s.scope as string)) {
    return NextResponse.json({ error: 'Can only import system/public/package skills' }, { status: 422 })
  }

  const { data: copy, error } = await supabaseAdmin.from('skills').insert({
    name: s.name, title: s.title, icon: s.icon, description: s.description,
    scope: 'user', user_id: me.id,
    instructions: s.instructions, quality_criteria: s.quality_criteria,
    output_type: s.output_type, trigger_keywords: s.trigger_keywords ?? [],
    recommended_role_name: s.recommended_role_name,
    recommended_capability_type: s.recommended_capability_type,
    source_skill_id: id, created_by_role: 'member', is_active: true,
  }).select('id').single()

  if (error) { log.error('import skill', { error }); return NextResponse.json({ error: 'Import failed' }, { status: 500 }) }
  return NextResponse.json({ id: copy.id }, { status: 201 })
}
