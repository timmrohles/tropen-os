export const maxDuration = 60
import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { getAuthUser } from '@/lib/api/projects'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { analyzeSchema } from '@/lib/validators/transformations'

export async function POST(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const budget = await checkBudget(me.organization_id, 'claude-haiku')
  if (!budget.allowed) return budgetExhaustedResponse()

  const { data: body, error: valErr } = await validateBody(request, analyzeSchema)
  if (valErr) return valErr

  const { source_type, source_id } = body

  let sourceTitle = ''
  let sourceGoal = ''
  let sourceContext = ''

  if (source_type === 'project') {
    const { data } = await supabaseAdmin
      .from('projects')
      .select('title, goal, instructions')
      .eq('id', source_id)
      .is('deleted_at', null)
      .single()
    if (!data) return NextResponse.json({ error: 'Projekt nicht gefunden' }, { status: 404 })
    sourceTitle   = data.title
    sourceGoal    = data.goal ?? ''
    sourceContext = data.instructions ?? ''
  } else {
    const { data } = await supabaseAdmin
      .from('workspaces')
      .select('title, goal, domain')
      .eq('id', source_id)
      .is('deleted_at', null)
      .single()
    if (!data) return NextResponse.json({ error: 'Workspace nicht gefunden' }, { status: 404 })
    sourceTitle   = data.title
    sourceGoal    = data.goal ?? ''
    sourceContext = data.domain ?? ''
  }

  const prompt = `Du analysierst ein ${source_type === 'project' ? 'Projekt' : 'Workspace'} und schlägst sinnvolle Transformationen vor.

Quelle:
- Titel: ${sourceTitle}
- Ziel: ${sourceGoal}
- Kontext: ${sourceContext}

Mögliche Transformationstypen:
- workspace: Erstellt einen Arbeitsbereich mit Karten für tägliche Briefings und Analyse
- feed: Erstellt eine News-Quelle, die relevante Informationen zu diesem Thema sammelt

Antworte NUR mit einem JSON-Array (max. 2 Einträge), keine weiteren Texte:
[
  {
    "target_type": "workspace",
    "title": "Vorgeschlagener Name",
    "rationale": "Kurze Begründung (1 Satz)",
    "config": { "goal": "...", "domain": "..." }
  },
  {
    "target_type": "feed",
    "title": "Vorgeschlagener Name",
    "rationale": "Kurze Begründung (1 Satz)",
    "config": { "search_query": "...", "language": "de" }
  }
]`

  const { text: raw } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    maxOutputTokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  let suggestions: unknown[] = []
  try {
    const parsed = JSON.parse(raw)
    suggestions = Array.isArray(parsed) ? parsed.slice(0, 2) : []
  } catch {
    suggestions = []
  }

  return NextResponse.json({ suggestions, source_type, source_id })
}
