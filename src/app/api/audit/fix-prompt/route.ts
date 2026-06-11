import { NextResponse } from 'next/server'
import { buildFixPrompt } from '@/lib/audit/prompt-export'
import type { PromptFinding } from '@/lib/audit/prompt-export/types'
import { apiError } from '@/lib/api-error'
import { withAuth } from '@/lib/auth/route-guards'

export const POST = withAuth(async (req) => {
  try {
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
  } catch (err) {
    return apiError(err)
  }
})
