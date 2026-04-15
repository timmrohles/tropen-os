// src/app/api/audit/run/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import path from 'node:path'
import { requireSuperadmin } from '@/lib/auth/guards'
import { createLogger } from '@/lib/logger'
import { apiValidationError } from '@/lib/api-error'
import { buildAuditContext, runAudit, formatReportMarkdown } from '@/lib/audit'
import type { CheckMode } from '@/lib/audit/types'

const logger = createLogger('api/audit/run')

const REPO_ROOT = path.resolve(process.cwd())

const requestSchema = z.object({
  skipModes: z.array(z.enum(['file-system', 'cli', 'repo-map', 'documentation', 'manual'])).optional(),
  tokenBudget: z.number().int().min(1024).max(32768).optional(),
  format: z.enum(['json', 'markdown']).optional().default('json'),
})

export async function POST(request: Request) {
  try {
    await requireSuperadmin()
  } catch {
    return NextResponse.json({ error: 'Superadmin access required', code: 'FORBIDDEN' }, { status: 403 })
  }

  let body: z.infer<typeof requestSchema>
  try {
    const rawBody = await request.json().catch(() => ({}))
    const validation = requestSchema.safeParse(rawBody)
    if (!validation.success) {
      return apiValidationError(validation.error)
    }
    body = validation.data
  } catch {
    body = { format: 'json' }
  }

  const skipModes = body.skipModes as CheckMode[] | undefined

  logger.info('Starting audit run', { skipModes, tokenBudget: body.tokenBudget })

  try {
    const ctx = await buildAuditContext(REPO_ROOT, undefined, body.tokenBudget ?? 8192)
    const report = await runAudit(ctx, { rootPath: REPO_ROOT, skipModes })

    if (body.format === 'markdown') {
      return new Response(formatReportMarkdown(report), {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      })
    }

    logger.info('Audit complete', {
      percentage: report.automatedPercentage,
      status: report.status,
      automatedRules: report.automatedRuleCount,
    })

    return NextResponse.json({ report }, { status: 200 })
  } catch (err) {
    logger.error('Audit run failed', { error: String(err) })
    return NextResponse.json({ error: 'Audit run failed', code: 'AUDIT_ERROR' }, { status: 500 })
  }
}
