import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { buildFixPrompt } from '@/lib/audit/prompt-export'
import type { PromptFinding } from '@/lib/audit/prompt-export/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { ruleId, message, severity, filePath, affectedFiles, agentSource, fixType } = body

  const pf: PromptFinding = {
    ruleId: String(ruleId ?? '').split('::')[0],
    severity: String(severity ?? 'medium'),
    message: String(message ?? ''),
    filePath: filePath ?? null,
    agentSource: agentSource ?? null,
    fixType: fixType ?? null,
    affectedFiles: Array.isArray(affectedFiles) ? affectedFiles : [],
  }

  const generated = buildFixPrompt(pf, 'generic')
  return NextResponse.json({ prompt: generated.content, title: generated.title })
}
