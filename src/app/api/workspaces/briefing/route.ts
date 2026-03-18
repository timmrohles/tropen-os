import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { generateCardSuggestions } from '@/lib/workspace/briefing'
import type { BriefingInput } from '@/lib/workspace/briefing'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:workspaces:briefing')

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: BriefingInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.goal?.trim()) {
    return NextResponse.json({ error: 'goal is required' }, { status: 400 })
  }

  try {
    const suggestions = await generateCardSuggestions(body)
    return NextResponse.json(suggestions)
  } catch (err) {
    log.error('[briefing] generateCardSuggestions error:', err)
    return NextResponse.json({ error: 'Fehler beim Generieren' }, { status: 500 })
  }
}
