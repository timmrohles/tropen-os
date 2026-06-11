import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { generateCardSuggestions } from '@/lib/workspace/briefing'
import type { BriefingInput } from '@/lib/workspace/briefing'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:workspaces:briefing')

export const POST = withAuth(async (req) => {
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
})
