// src/lib/audit/export-rules.ts
// Generiert .cursorrules und CLAUDE.md Export-Dateien aus den Build-Time-Regeln.

import {
  BUILD_TIME_RULES,
  getApplicableRules,
  getRulesByGroup,
  type BuildTimeRule,
} from './build-time-rules'

export type ExportFormat = 'cursorrules' | 'claude-md'

export interface ExportContext {
  projectName: string
  stack?: string          // z.B. "Next.js 15, Supabase, TypeScript"
  hasAuth?: boolean
  hasAi?: boolean
  hasDb?: boolean
  hasPublicApi?: boolean
  hasUploads?: boolean
  activeAgentIds?: string[]
}

// ── Hauptfunktion ─────────────────────────────────────────────────────────────

/**
 * Generiert den Export-Inhalt als String.
 * @param format 'cursorrules' | 'claude-md'
 * @param ctx Projekt-Kontext für Personalisierung und Filterung
 */
export function generateRulesExport(format: ExportFormat, ctx: ExportContext): string {
  const rules = getApplicableRules({
    hasAuth: ctx.hasAuth,
    hasAi: ctx.hasAi,
    hasDb: ctx.hasDb,
    hasPublicApi: ctx.hasPublicApi,
    hasUploads: ctx.hasUploads,
  })

  // Wenn aktive Agenten angegeben: nur Regeln dieser Agenten
  const filtered = ctx.activeAgentIds
    ? rules.filter((r) => r.agentIds.some((id) => ctx.activeAgentIds!.includes(id)))
    : rules

  const grouped = getRulesByGroup(filtered)
  const generatedAt = new Date().toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  return format === 'cursorrules'
    ? buildCursorRules(grouped, ctx, generatedAt)
    : buildClaudeMd(grouped, ctx, generatedAt)
}

// ── .cursorrules Format ───────────────────────────────────────────────────────

function buildCursorRules(
  grouped: Map<string, BuildTimeRule[]>,
  ctx: ExportContext,
  generatedAt: string,
): string {
  const lines: string[] = []

  lines.push(`# ${ctx.projectName} — Build-Time Quality Rules`)
  lines.push(`# Generiert von Tropen OS am ${generatedAt}`)
  if (ctx.stack) lines.push(`# Stack: ${ctx.stack}`)
  lines.push(`# ${[...grouped.values()].flat().length} Regeln in ${grouped.size} Kategorien`)
  lines.push('')
  lines.push('# Diese Regeln gelten für alle Änderungen in diesem Projekt.')
  lines.push('# Sie sind nach Priorität geordnet: erst Security, dann Qualität.')
  lines.push('')

  for (const [group, rules] of grouped) {
    lines.push(`## ${group.toUpperCase()}`)
    lines.push('')
    for (const rule of rules) {
      const badge = rule.priority === 'critical' ? '[KRITISCH]' : rule.priority === 'high' ? '[WICHTIG]' : '[EMPFOHLEN]'
      lines.push(`### ${badge} ${rule.name}`)
      lines.push(rule.instruction)
      lines.push('')
    }
  }

  lines.push('---')
  lines.push('# Vollständiger Audit (alle 195 Regeln): https://tropen.os/audit')
  lines.push(`# Ziel-Score: 80%+ Stable vor Production. Aktuell: scan starten.`)

  return lines.join('\n')
}

// ── CLAUDE.md Format ──────────────────────────────────────────────────────────

function buildClaudeMd(
  grouped: Map<string, BuildTimeRule[]>,
  ctx: ExportContext,
  generatedAt: string,
): string {
  const totalRules = [...grouped.values()].flat().length
  const lines: string[] = []

  // Header
  lines.push(`# ${ctx.projectName} — Quality Rules`)
  lines.push(`> Generiert von Tropen OS am ${generatedAt}`)
  if (ctx.stack) lines.push(`> Stack: ${ctx.stack}`)
  lines.push(`> ${totalRules} Build-Time-Regeln aktiv`)
  lines.push('')

  // Kurzübersicht
  lines.push('## Überblick')
  lines.push('')
  lines.push('Diese Datei enthält die wichtigsten Qualitätsregeln für dieses Projekt.')
  lines.push('Sie sind in Kategorien geordnet — Security zuerst.')
  lines.push('')
  lines.push('| Priorität | Bedeutung |')
  lines.push('|-----------|-----------|')
  lines.push('| **[KRITISCH]** | Sicherheitslücke oder Datenverlust wenn verletzt |')
  lines.push('| **[WICHTIG]** | Produkt-Qualität leidet wenn verletzt |')
  lines.push('| **[EMPFOHLEN]** | Best Practice, verbessert langfristige Wartbarkeit |')
  lines.push('')

  // Kategorien
  for (const [group, rules] of grouped) {
    lines.push(`## ${group}`)
    lines.push('')
    for (const rule of rules) {
      const badge =
        rule.priority === 'critical'
          ? '**[KRITISCH]**'
          : rule.priority === 'high'
            ? '**[WICHTIG]**'
            : '**[EMPFOHLEN]**'
      lines.push(`### ${badge} ${rule.name}`)
      lines.push('')
      lines.push(rule.instruction)
      lines.push('')
    }
  }

  // Footer
  lines.push('---')
  lines.push('')
  lines.push('## Audit')
  lines.push('')
  lines.push('Diese Regeln sind eine Teilmenge der vollständigen Tropen OS Audit-Regeln (195 Regeln).')
  lines.push('Vollständiger Audit: `/audit` im Tropen OS Dashboard.')
  lines.push('')
  lines.push('**Score-Ziele:**')
  lines.push('- 60%+ Risky → Prototyp, nicht production-ready')
  lines.push('- 80%+ Stable → Launch möglich')
  lines.push('- 90%+ Production Grade → Ziel für etablierte Produkte')

  return lines.join('\n')
}

// ── Dateiname und MIME-Type ────────────────────────────────────────────────────

export function getExportFileName(format: ExportFormat, projectName: string): string {
  if (format === 'cursorrules') return '.cursorrules'
  // CLAUDE.md: projektspezifisch damit es nicht mit dem Tropen-OS-eigenen CLAUDE.md kollidiert
  const safe = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
  return `CLAUDE-${safe}.md`
}

export function getExportMimeType(format: ExportFormat): string {
  return format === 'claude-md' ? 'text/markdown' : 'text/plain'
}

// ── Default-Kontext für Tropen OS internes Projekt ────────────────────────────

export function buildDefaultContext(overrides: Partial<ExportContext> = {}): ExportContext {
  return {
    projectName: 'Mein Projekt',
    hasAuth: true,
    hasAi: false,
    hasDb: true,
    hasPublicApi: false,
    hasUploads: false,
    ...overrides,
  }
}

// ── Kontext aus Scan-Projekt-Profil ableiten ──────────────────────────────────

export interface ScanProjectRecord {
  name: string
  detected_stack?: string | null
  profile?: {
    audience?: string[]
    compliance_requirements?: string[]
    not_applicable_categories?: string[]
  } | null
}

export function contextFromScanProject(project: ScanProjectRecord): ExportContext {
  const profile = project.profile ?? {}
  const naCategories = profile.not_applicable_categories ?? []

  // Features aus Profil und Stack ableiten
  const stack = project.detected_stack ?? ''
  const hasAi =
    stack.toLowerCase().includes('anthropic') ||
    stack.toLowerCase().includes('openai') ||
    stack.toLowerCase().includes('ai sdk')

  // Agenten die aktiv sein sollen (alle außer explizit N/A markierte)
  const allAgentIds = BUILD_TIME_RULES.flatMap((r) => r.agentIds)
  const uniqueAgentIds = [...new Set(allAgentIds)]

  // Grobe Mapping von N/A-Kategorien zu Agenten-IDs
  const naAgentMap: Record<string, string[]> = {
    'dsgvo': ['dsgvo', 'legal'],
    'bfsg': ['accessibility'],
    'ai-act': ['ai-integration', 'ai-act'],
    'backup-dr': ['backup-dr'],
    'testing': ['testing'],
    'git-governance': ['git-governance'],
    'cost-awareness': ['cost-awareness'],
    'analytics': ['analytics'],
    'content': ['content'],
  }

  const naAgentIds = naCategories.flatMap((cat: string) => naAgentMap[cat] ?? [])
  const activeAgentIds = uniqueAgentIds.filter((id) => !naAgentIds.includes(id))

  return {
    projectName: project.name,
    stack: project.detected_stack ?? undefined,
    hasAuth: true,   // Assume auth for external projects
    hasAi,
    hasDb: true,     // Assume DB for most projects
    hasPublicApi: false,
    hasUploads: false,
    activeAgentIds,
  }
}
