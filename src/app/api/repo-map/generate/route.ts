// POST /api/repo-map/generate — generates a repo map for the Tropen OS codebase
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import path from 'path'
import { getAuthUser } from '@/lib/api/projects'
import { validateBody } from '@/lib/validators'
import { generateRepoMap } from '@/lib/repo-map'
import { createLogger } from '@/lib/logger'

export const runtime = 'nodejs'

const log = createLogger('api/repo-map/generate')

// Server-side constant — callers cannot supply arbitrary paths
const REPO_ROOT = path.resolve(process.cwd())

const requestSchema = z.object({
  tokenBudget: z.number().int().min(256).max(32768).optional(),
  ignorePatterns: z.array(z.string()).max(50).optional(),
  languages: z.array(z.enum(['typescript', 'javascript'])).optional(),
})

export async function POST(request: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await validateBody(request, requestSchema)
  if (error) return error

  try {
    const repoMap = await generateRepoMap({
      rootPath: REPO_ROOT,
      tokenBudget: data.tokenBudget,
      ignorePatterns: data.ignorePatterns,
      languages: data.languages,
    })

    return NextResponse.json({
      stats: repoMap.stats,
      compressedMap: repoMap.compressedMap,
      topSymbols: repoMap.rankedSymbols.slice(0, 20).map((s) => ({
        id: s.id,
        name: s.name,
        kind: s.kind,
        filePath: s.filePath,
        referenceCount: s.referenceCount,
        rankScore: s.rankScore,
      })),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
    log.error('generateRepoMap failed', { error: msg })
    return NextResponse.json({ error: 'Repo-Map-Generierung fehlgeschlagen', details: msg }, { status: 500 })
  }
}
