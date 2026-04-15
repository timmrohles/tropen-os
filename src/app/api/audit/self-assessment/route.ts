import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:self-assessment')

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as {
      scanProjectId: string
      answers: Record<string, boolean>
      startedAt: string
    }

    if (!body.scanProjectId || !body.answers) {
      return NextResponse.json({ error: 'Missing scanProjectId or answers' }, { status: 400 })
    }

    // Anti-gaming: check if completed too fast
    const completedAt = new Date().toISOString()
    const durationMs = Date.now() - new Date(body.startedAt).getTime()
    const allTrue = Object.values(body.answers).every(v => v === true)
    const tooFast = durationMs < 10000 && allTrue

    // Merge into existing profile JSONB
    const { data: project } = await supabaseAdmin
      .from('scan_projects')
      .select('profile')
      .eq('id', body.scanProjectId)
      .single()

    const existingProfile = (project?.profile as Record<string, unknown>) ?? {}

    const { error } = await supabaseAdmin
      .from('scan_projects')
      .update({
        profile: {
          ...existingProfile,
          selfAssessment: {
            ...body.answers,
            completedAt,
            durationMs,
            suspicious: tooFast,
          },
        },
      })
      .eq('id', body.scanProjectId)

    if (error) {
      log.error('Failed to save self-assessment', { error: error.message })
      return apiError(error)
    }

    return NextResponse.json({
      saved: true,
      suspicious: tooFast,
    })
  } catch (err) {
    return apiError(err)
  }
}
