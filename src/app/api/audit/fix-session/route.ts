// src/app/api/audit/fix-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildFixPrompt } from '@/lib/audit/prompt-export'
import type { PromptFinding } from '@/lib/audit/prompt-export/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { findingIds?: string[] } | null
  if (!body?.findingIds?.length) {
    return NextResponse.json({ error: 'findingIds required' }, { status: 400 })
  }

  const { data: dbFindings, error } = await supabaseAdmin
    .from('audit_findings')
    .select('id, rule_id, message, severity, file_path, agent_source, fix_type, suggestion, affected_files, fix_hint')
    .in('id', body.findingIds)

  if (error || !dbFindings) {
    return NextResponse.json({ error: 'Failed to fetch findings' }, { status: 500 })
  }

  // Group by filePath
  const byFile = new Map<string, typeof dbFindings>()
  for (const f of dbFindings) {
    const key = f.file_path ?? '__no_file__'
    if (!byFile.has(key)) byFile.set(key, [])
    byFile.get(key)!.push(f)
  }

  // Sort files: most findings first; no-file group last
  const sortedEntries = [...byFile.entries()].sort((a, b) => {
    if (a[0] === '__no_file__') return 1
    if (b[0] === '__no_file__') return -1
    return b[1].length - a[1].length
  })

  const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

  const namedFiles = sortedEntries.filter(([k]) => k !== '__no_file__')
  const totalFiles = namedFiles.length

  const sections: string[] = []
  let fileIndex = 0

  for (const [filePath, findings] of sortedEntries) {
    const isNoFile = filePath === '__no_file__'
    fileIndex++

    findings.sort((a, b) => (SEV_ORDER[a.severity] ?? 5) - (SEV_ORDER[b.severity] ?? 5))

    const fileLabel = isNoFile
      ? `Datei ${fileIndex}/${totalFiles + 1}: — (kein Datei-Bezug, globaler Fix)`
      : `Datei ${fileIndex}/${totalFiles}: ${filePath}`

    const findingBlocks = findings.map((f, idx) => {
      const pf: PromptFinding = {
        ruleId: String(f.rule_id ?? '').split('::')[0],
        severity: String(f.severity ?? 'medium'),
        message: String(f.message ?? ''),
        filePath: f.file_path ?? null,
        agentSource: f.agent_source ?? null,
        fixType: (f.fix_type as PromptFinding['fixType']) ?? null,
        affectedFiles: Array.isArray(f.affected_files) ? f.affected_files as string[] : [],
        fixHint: (f.fix_hint as string | null) ?? null,
        suggestion: f.suggestion ?? null,
      }
      const generated = buildFixPrompt(pf, 'generic')
      return `### Finding ${fileIndex}.${idx + 1} — ${generated.title}\n\n${generated.content}`
    })

    sections.push(`## ${fileLabel}\n\n${findingBlocks.join('\n\n---\n\n')}`)
  }

  const totalFindings = dbFindings.length
  const totalMinutes = dbFindings.reduce((sum, f) => {
    const ft = f.fix_type as string | null
    const effort = ft === 'code-gen' ? 10 : ft === 'code-fix' ? 15 : ft === 'refactoring' ? 45 : 60
    return sum + effort
  }, 0)
  const roundedMinutes = Math.round(totalMinutes / 5) * 5

  const header = `# Fix-Session — ${totalFindings} ${totalFindings === 1 ? 'Finding' : 'Findings'} aus ${totalFiles} ${totalFiles === 1 ? 'Datei' : 'Dateien'}

Bearbeite die folgenden ${totalFindings} Findings in dieser Reihenfolge.
Geschätzte Zeit: ~${roundedMinutes} Minuten.

Die Findings sind nach Datei sortiert — bearbeite jede Datei komplett bevor du zur nächsten wechselst.

---`

  const prompt = `${header}\n\n${sections.join('\n\n---\n\n')}`

  return NextResponse.json({
    prompt,
    fileCount: totalFiles,
    estimatedMinutes: roundedMinutes,
  })
}
