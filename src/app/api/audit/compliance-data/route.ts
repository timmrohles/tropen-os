import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'
import { apiError } from '@/lib/api-error'

const UpsertSchema = z.object({
  projectId: z.string().uuid(),
  questionKey: z.string().min(1).max(100),
  questionValue: z.unknown(),
  scope: z.enum(['master', 'detail']),
})

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const projectId = req.nextUrl.searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('project_compliance_data')
      .select('question_key, question_value, scope, answered_at')
      .eq('project_id', projectId)

    if (error) return apiError(error)
    return NextResponse.json({ data })
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const parsed = UpsertSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

    const { projectId, questionKey, questionValue, scope } = parsed.data

    const { error } = await supabaseAdmin
      .from('project_compliance_data')
      .upsert({
        project_id: projectId,
        question_key: questionKey,
        question_value: questionValue,
        scope,
        answered_by: user.id,
        answered_at: new Date().toISOString(),
      }, { onConflict: 'project_id,question_key' })

    if (error) return apiError(error)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
