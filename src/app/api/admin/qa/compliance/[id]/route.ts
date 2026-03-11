import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { QaComplianceStatus } from '@/types/qa'

async function isSuperadmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'superadmin'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isSuperadmin())) {
      return NextResponse.json({ error: 'Keine Berechtigung', code: 'UNAUTHORIZED' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json() as {
      status?: QaComplianceStatus
      notes?: string
      open_action?: string
      deadline?: string
    }

    const allowed = ['status', 'notes', 'open_action', 'deadline'] as const
    const patch: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) patch[key] = body[key]
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Keine Felder zum Aktualisieren', code: 'EMPTY_PATCH' }, { status: 400 })
    }

    patch.last_checked_at = new Date().toISOString()

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('qa_compliance_checks')
      .update(patch)
      .eq('id', id)
      .select('id, article, label, status, notes, last_checked_at')
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Nicht gefunden', code: 'NOT_FOUND' }, { status: 404 })

    return NextResponse.json(data)
  } catch (err) {
    console.error('[qa/compliance/[id]]', err)
    return NextResponse.json(
      { error: 'Interner Fehler', code: 'QA_COMPLIANCE_PATCH_ERROR' },
      { status: 500 }
    )
  }
}
