// src/app/api/audit/export-rules/route.ts
// GET /api/audit/export-rules?format=cursorrules|claude-md&projectId=xxx
// Gibt eine .cursorrules oder CLAUDE.md Datei zum Download zurück.

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import {
  generateRulesExport,
  getExportFileName,
  getExportMimeType,
  buildDefaultContext,
  contextFromScanProject,
  type ExportFormat,
  type ScanProjectRecord,
} from '@/lib/audit/export-rules'

const log = createLogger('api:audit:export-rules')

export async function GET(req: NextRequest) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // ── Parameter ─────────────────────────────────────────────────────────────
    const { searchParams } = req.nextUrl
    const rawFormat = searchParams.get('format') ?? 'cursorrules'
    const projectId = searchParams.get('projectId') ?? null

    if (rawFormat !== 'cursorrules' && rawFormat !== 'claude-md') {
      return NextResponse.json({ error: 'Ungültiges Format. Erlaubt: cursorrules, claude-md' }, { status: 400 })
    }
    const format = rawFormat as ExportFormat

    // ── Kontext aufbauen ──────────────────────────────────────────────────────
    let ctx = buildDefaultContext()

    if (projectId) {
      const { data: project } = await supabaseAdmin
        .from('scan_projects')
        .select('name, detected_stack, profile')
        .eq('id', projectId)
        .single()

      if (project) {
        ctx = contextFromScanProject(project as ScanProjectRecord)
        log.info('Export für Scan-Projekt', { projectId, name: project.name, format })
      }
    } else {
      // Internes Tropen-OS-Projekt: voller Kontext
      ctx = buildDefaultContext({
        projectName: 'Tropen OS',
        stack: 'Next.js 15, Supabase, TypeScript, Tailwind',
        hasAuth: true,
        hasAi: true,
        hasDb: true,
        hasPublicApi: false,
        hasUploads: true,
      })
      log.info('Export für internes Projekt', { format })
    }

    // ── Inhalt generieren ─────────────────────────────────────────────────────
    const content = generateRulesExport(format, ctx)
    const fileName = getExportFileName(format, ctx.projectName)
    const mimeType = getExportMimeType(format)

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': `${mimeType}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    log.error('Export fehlgeschlagen', { err })
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}
