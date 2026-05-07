// src/app/api/projects/scan/route.ts
// POST — scan external project via File System Access API (browser upload)
export const runtime = 'nodejs'
export const maxDuration = 120

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { apiValidationError } from '@/lib/api-error'
import { apiError } from '@/lib/api-error'
import { buildAuditContextFromFiles, runAudit } from '@/lib/audit'
import { AUDIT_RULES } from '@/lib/audit/rule-registry'
import { deduplicateFindings } from '@/lib/audit/deduplicator'
import { effortMinutesFromFixType } from '@/lib/audit/killer-rule-ids'
import { getActiveScanProjectProfile, getDomainActivation } from '@/lib/audit/project-profiles'
import type { AuditReport, CategoryScore, CheckMode } from '@/lib/audit/types'
import type { EnrichedFinding } from '@/lib/audit/deduplicator'

const log = createLogger('api:projects:scan')

const LIMITS = {
  maxFiles: 2000,
  maxTotalSizeBytes: 10_000_000,
  maxFilePathLength: 500,
}

// External-project skip modes: no local filesystem/CLI/doc access
const EXTERNAL_SKIP_MODES: CheckMode[] = ['cli', 'file-system', 'external-tool', 'documentation']

const fileSchema = z.object({
  path: z.string().max(LIMITS.maxFilePathLength),
  content: z.string(),
  size: z.number().int().min(0).max(500_000),
  language: z.string(),
})

const profileSchema = z.object({
  isPublic: z.boolean(),
  liveUrl: z.string().nullable(),
  isLive: z.boolean(),
  audience: z.enum(['b2b', 'b2c', 'internal', 'unclear']),
  complianceRequirements: z.array(z.string()),
  notApplicableCategories: z.array(z.number()),
  detectedStack: z.record(z.string(), z.unknown()),
}).optional()

const requestSchema = z.object({
  projectName: z.string().min(1).max(200),
  files: z.array(fileSchema).max(LIMITS.maxFiles),
  profile: profileSchema,
})

function isValidPath(p: string): boolean {
  return !p.includes('..') && !p.startsWith('/') && !p.includes('\\')
}

function toDbStatus(status: AuditReport['status']): 'production_grade' | 'stable' | 'risky' | 'prototype' {
  return status.replace(/-/g, '_') as 'production_grade' | 'stable' | 'risky' | 'prototype'
}

function computeScore(cat: CategoryScore): number {
  if (cat.automatedRuleCount === 0) return 0
  return parseFloat(((cat.automatedPercentage ?? 0) / 100 * 5).toFixed(2))
}

function detectStack(files: z.infer<typeof fileSchema>[]): Record<string, string> {
  const paths = files.map((f) => f.path)
  const pkgFile = files.find((f) => f.path === 'package.json')
  let framework = 'unknown'
  let language = 'javascript'

  if (paths.some((p) => p.includes('.ts') || p.includes('.tsx'))) language = 'typescript'
  else if (paths.some((p) => p.includes('.py'))) language = 'python'
  else if (paths.some((p) => p.includes('.go'))) language = 'go'
  else if (paths.some((p) => p.includes('.rs'))) language = 'rust'

  if (!pkgFile) return { framework, language }

  try {
    const pkg = JSON.parse(pkgFile.content) as Record<string, unknown>
    const deps = { ...pkg.dependencies as Record<string, string>, ...pkg.devDependencies as Record<string, string> }
    if ('next' in deps) framework = 'nextjs'
    else if ('nuxt' in deps) framework = 'nuxt'
    else if ('react' in deps) framework = 'react'
    else if ('vue' in deps) framework = 'vue'
    else if ('svelte' in deps) framework = 'svelte'
    else if ('express' in deps || 'fastify' in deps) framework = 'node'
  } catch { /* ignore — package.json may not be parseable */ }

  return { framework, language }
}

async function loadDomainActivation(
  orgId: string,
  projectName: string
): Promise<Record<string, 'active' | 'lazy' | 'inactive'> | undefined> {
  const { data: existingProject } = await supabaseAdmin
    .from('scan_projects')
    .select('id')
    .eq('organization_id', orgId)
    .eq('name', projectName)
    .maybeSingle()

  if (!existingProject?.id) return undefined

  const scanProfile = await getActiveScanProjectProfile(existingProject.id)
  if (!scanProfile) return undefined

  return getDomainActivation(scanProfile) as unknown as Record<string, 'active' | 'lazy' | 'inactive'>
}

function buildProjectUpsertPayload(
  orgId: string,
  projectName: string,
  files: z.infer<typeof fileSchema>[],
  totalSize: number,
  report: AuditReport,
  detectedStack: Record<string, string>,
  profile: z.infer<typeof profileSchema>
) {
  const base = {
    organization_id: orgId,
    name: projectName,
    source: 'file_system',
    file_count: files.length,
    total_size_bytes: totalSize,
    last_scan_at: new Date().toISOString(),
    last_score: report.automatedPercentage,
    detected_stack: detectedStack,
    updated_at: new Date().toISOString(),
  }
  if (!profile) return base
  return {
    ...base,
    profile: profile.detectedStack,
    is_public: profile.isPublic,
    live_url: profile.liveUrl,
    is_live: profile.isLive,
    audience: profile.audience,
    compliance_requirements: profile.complianceRequirements,
    not_applicable_categories: profile.notApplicableCategories,
  }
}

async function upsertOrInsertProject(
  orgId: string,
  projectName: string,
  files: z.infer<typeof fileSchema>[],
  totalSize: number,
  report: AuditReport,
  detectedStack: Record<string, string>,
  profile: z.infer<typeof profileSchema>
): Promise<string | null> {
  const payload = buildProjectUpsertPayload(orgId, projectName, files, totalSize, report, detectedStack, profile)

  const { data: upsertRow, error: projErr } = await supabaseAdmin
    .from('scan_projects')
    .upsert(payload, { onConflict: 'organization_id,name' })
    .select('id')
    .single()

  if (!projErr && upsertRow) return upsertRow.id

  // Fallback: plain insert (first-time or if constraint not yet present)
  log.warn('Upsert failed — falling back to insert', { error: projErr?.message })
  const { data: insertRow, error: insertErr } = await supabaseAdmin
    .from('scan_projects')
    .insert({
      organization_id: orgId,
      name: projectName,
      source: 'file_system',
      file_count: files.length,
      total_size_bytes: totalSize,
      last_scan_at: new Date().toISOString(),
      last_score: report.automatedPercentage,
      detected_stack: detectedStack,
    })
    .select('id')
    .single()

  if (insertErr || !insertRow) {
    log.error('Failed to save project', { upsertErr: projErr?.message, insertErr: insertErr?.message })
    return null
  }
  return insertRow.id
}

async function deduplicateOrFallback(
  enrichedFindings: EnrichedFinding[],
  runId: string,
  orgId: string
): Promise<EnrichedFinding[]> {
  try {
    const result = await deduplicateFindings(enrichedFindings, runId, orgId)
    return result.newFindings
  } catch {
    log.warn('Deduplication failed — proceeding with all findings')
    return enrichedFindings
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgProfile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!orgProfile?.organization_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const raw = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(raw)
  if (!parsed.success) {
    return apiValidationError(parsed.error)
  }

  const { projectName, files, profile } = parsed.data

  const invalidPaths = files.filter((f) => !isValidPath(f.path))
  if (invalidPaths.length > 0) {
    return NextResponse.json({ error: 'Invalid file paths detected' }, { status: 400 })
  }

  const totalSize = files.reduce((s, f) => s + f.size, 0)
  if (totalSize > LIMITS.maxTotalSizeBytes) {
    return NextResponse.json({
      error: `Projekt zu groß: ${(totalSize / 1_000_000).toFixed(1)} MB (max 10 MB)`,
    }, { status: 400 })
  }

  log.info('Scan started', { projectName, fileCount: files.length, totalSize, orgId: orgProfile.organization_id })

  try {
    const ctx = await buildAuditContextFromFiles(files, 4096)
    const domainActivation = await loadDomainActivation(orgProfile.organization_id, projectName)

    const report = await runAudit(ctx, {
      rootPath: '',
      skipModes: EXTERNAL_SKIP_MODES,
      domainActivation,
    })

    const allFindings = report.categories.flatMap((c) =>
      c.ruleResults.flatMap((r) =>
        r.findings.map((f) => ({ ...f, ruleId: r.ruleId, categoryId: c.categoryId }))
      )
    )

    const detectedStack = detectStack(files)

    const projectId = await upsertOrInsertProject(
      orgProfile.organization_id, projectName, files, totalSize, report, detectedStack, profile
    )
    if (!projectId) {
      return NextResponse.json({ error: 'Failed to save project' }, { status: 500 })
    }

    const { data: runRow, error: runErr } = await supabaseAdmin
      .from('audit_runs')
      .insert({
        organization_id: orgProfile.organization_id,
        project_name: projectName,
        triggered_by: user.id,
        trigger_type: 'manual',
        scan_project_id: projectId,
        total_score: report.categories.reduce((s, c) => s + c.weightedScore * c.weight, 0),
        total_max: report.categories.reduce((s, c) => s + c.weightedMax * c.weight, 0),
        percentage: report.automatedPercentage,
        status: toDbStatus(report.status),
        total_rules: report.automatedRuleCount + report.manualRuleCount,
        automated_rules: report.automatedRuleCount,
        manual_rules: report.manualRuleCount,
        total_findings: allFindings.length,
        critical_findings: report.criticalFindings.length,
        full_report: report as unknown as Record<string, unknown>,
      })
      .select('id')
      .single()

    if (runErr || !runRow) {
      log.error('Failed to insert audit_run', { error: runErr?.message })
      return NextResponse.json({ error: 'Failed to save audit run' }, { status: 500 })
    }

    const runId = runRow.id

    const categoryRows = report.categories.map((c) => {
      const score = computeScore(c)
      return {
        run_id: runId,
        category_id: c.categoryId,
        category_name: c.name,
        category_weight: c.weight,
        score,
        max_score: 5.0,
        weighted_score: score * c.weight,
        max_weighted_score: 5.0 * c.weight,
        automated_rule_count: c.automatedRuleCount,
        manual_rule_count: c.manualRuleCount,
      }
    })
    await supabaseAdmin.from('audit_category_scores').insert(categoryRows)

    const enrichedFindings = allFindings as EnrichedFinding[]
    const newFindings = await deduplicateOrFallback(enrichedFindings, runId, orgProfile.organization_id)

    if (newFindings.length > 0) {
      const findingRows = newFindings.map((f) => {
        const rule = AUDIT_RULES.find((r) => r.id === f.ruleId)
        return {
          run_id: runId,
          rule_id: f.ruleId,
          category_id: f.categoryId,
          severity: f.severity,
          message: f.message,
          file_path: f.filePath ?? null,
          line: f.line ?? null,
          suggestion: f.suggestion ?? null,
          agent_source: f.agentSource ?? rule?.agentSource ?? 'core',
          agent_rule_id: rule?.agentRuleId ?? null,
          enforcement: f.enforcement ?? rule?.enforcement ?? null,
          affected_files: f.affectedFiles ?? null,
          fix_hint: f.fixHint ?? null,
          is_killer: (f as { isKiller?: boolean }).isKiller ?? null,
          effort_minutes: effortMinutesFromFixType(rule?.fixType ?? (f as { fixType?: string }).fixType ?? null),
          ...(f.inheritedStatus ? { status: f.inheritedStatus } : {}),
        }
      })
      await supabaseAdmin.from('audit_findings').insert(findingRows)
    }

    log.info('Scan complete', { projectId, runId, score: report.automatedPercentage, findings: newFindings.length })

    return NextResponse.json({
      runId,
      projectId,
      score: report.automatedPercentage,
      findingsCount: newFindings.length,
    })
  } catch (err) {
    log.error('Scan failed', { error: err })
    return apiError(err)
  }
}
