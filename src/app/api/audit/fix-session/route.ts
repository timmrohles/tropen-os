// src/app/api/audit/fix-session/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildFixPrompt } from '@/lib/audit/prompt-export'
import type { PromptFinding } from '@/lib/audit/prompt-export/types'
import { getFixType } from '@/lib/audit/rule-registry'
import { createLogger } from '@/lib/logger'
import { withAuth } from '@/lib/auth/route-guards'

const log = createLogger('fix-session')

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

type DbFinding = {
  id: string
  rule_id: string | null
  message: string | null
  severity: string | null
  file_path: string | null
  agent_source: string | null
  suggestion: string | null
  affected_files: unknown
  fix_hint: unknown
}

function effortMinutes(ruleId: string): number {
  const ft = getFixType(ruleId)
  if (ft === 'code-gen') return 10
  if (ft === 'code-fix') return 15
  if (ft === 'refactoring') return 45
  return 60
}

function toPromptFinding(f: DbFinding): PromptFinding {
  const ruleId = String(f.rule_id ?? '').split('::')[0]
  return {
    ruleId,
    severity: String(f.severity ?? 'medium'),
    message: String(f.message ?? ''),
    filePath: f.file_path ?? null,
    agentSource: f.agent_source ?? null,
    fixType: getFixType(ruleId),
    affectedFiles: Array.isArray(f.affected_files) ? f.affected_files as string[] : [],
    fixHint: (f.fix_hint as string | null) ?? null,
    suggestion: f.suggestion ?? null,
  }
}

function buildFindingBlock(f: DbFinding, fileIndex: number, idx: number): string {
  const pf = toPromptFinding(f)
  const generated = buildFixPrompt(pf, 'generic')
  return `### Finding ${fileIndex}.${idx + 1} — ${generated.title}\n\n${generated.content}`
}

function buildFileSection(
  filePath: string,
  findings: DbFinding[],
  fileIndex: number,
  totalFiles: number
): string {
  const isNoFile = filePath === '__no_file__'
  const sorted = [...findings].sort((a, b) => (SEV_ORDER[a.severity ?? ''] ?? 5) - (SEV_ORDER[b.severity ?? ''] ?? 5))
  const fileLabel = isNoFile
    ? `Datei ${fileIndex}/${totalFiles + 1}: — (kein Datei-Bezug, globaler Fix)`
    : `Datei ${fileIndex}/${totalFiles}: ${filePath}`
  const findingBlocks = sorted.map((f, idx) => buildFindingBlock(f, fileIndex, idx))
  return `## ${fileLabel}\n\n${findingBlocks.join('\n\n---\n\n')}`
}

function groupFindingsByFile(findings: DbFinding[]): Map<string, DbFinding[]> {
  const byFile = new Map<string, DbFinding[]>()
  for (const f of findings) {
    const key = f.file_path ?? '__no_file__'
    if (!byFile.has(key)) byFile.set(key, [])
    byFile.get(key)!.push(f)
  }
  return byFile
}

function sortFileEntries(entries: [string, DbFinding[]][]): [string, DbFinding[]][] {
  return entries.sort((a, b) => {
    if (a[0] === '__no_file__') return 1
    if (b[0] === '__no_file__') return -1
    return b[1].length - a[1].length
  })
}

function buildSessionHeader(totalFindings: number, totalFiles: number, roundedMinutes: number): string {
  const findingWord = totalFindings === 1 ? 'Finding' : 'Findings'
  const fileWord = totalFiles === 1 ? 'Datei' : 'Dateien'
  return `# Fix-Session — ${totalFindings} ${findingWord} aus ${totalFiles} ${fileWord}

Bearbeite die folgenden ${totalFindings} Findings in dieser Reihenfolge.
Geschätzte Zeit: ~${roundedMinutes} Minuten.

Die Findings sind nach Datei sortiert — bearbeite jede Datei komplett bevor du zur nächsten wechselst.

---`
}

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json().catch(() => null) as { findingIds?: string[] } | null
    if (!body?.findingIds?.length) {
      return NextResponse.json({ error: 'findingIds required' }, { status: 400 })
    }

    const { data: dbFindings, error } = await supabaseAdmin
      .from('audit_findings')
      .select('id, rule_id, message, severity, file_path, agent_source, suggestion, affected_files, fix_hint')
      .in('id', body.findingIds)

    if (error || !dbFindings) {
      return NextResponse.json({ error: 'Failed to fetch findings' }, { status: 500 })
    }

    const byFile = groupFindingsByFile(dbFindings as unknown as DbFinding[])
    const sortedEntries = sortFileEntries([...byFile.entries()])
    const totalFiles = sortedEntries.filter(([k]) => k !== '__no_file__').length

    const sections = sortedEntries.map(([filePath, findings], idx) =>
      buildFileSection(filePath, findings, idx + 1, totalFiles)
    )

    const totalFindings = dbFindings.length
    const totalMinutes = (dbFindings as unknown as DbFinding[]).reduce((sum, f) => {
      return sum + effortMinutes(String(f.rule_id ?? '').split('::')[0])
    }, 0)
    const roundedMinutes = Math.round(totalMinutes / 5) * 5

    const header = buildSessionHeader(totalFindings, totalFiles, roundedMinutes)
    const prompt = `${header}\n\n${sections.join('\n\n---\n\n')}`

    return NextResponse.json({ prompt, fileCount: totalFiles, estimatedMinutes: roundedMinutes })
  } catch (err) {
    log.error('fix-session failed', { err })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
