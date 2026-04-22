import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { runStage2, runStage3 } from '@/lib/feeds/pipeline'
import { apiError } from '@/lib/api-error'

interface FeedSchemaRow {
  id: string
  department_id: string | null
  user_id: string
  name: string
  description: string | null
  include_keywords: string[]
  exclude_keywords: string[]
  languages: string[]
  max_age_days: number
  scoring_prompt: string
  min_score: number
  extraction_prompt: string
  output_structure: string
  monthly_token_budget: number | null
  created_at: string
  updated_at: string
}

function mapSchemaRow(row: FeedSchemaRow) {
  return {
    id: row.id,
    departmentId: row.department_id ?? null,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? null,
    includeKeywords: row.include_keywords ?? [],
    excludeKeywords: row.exclude_keywords ?? [],
    languages: row.languages ?? [],
    maxAgeDays: row.max_age_days,
    scoringPrompt: row.scoring_prompt,
    minScore: row.min_score,
    extractionPrompt: row.extraction_prompt,
    outputStructure: row.output_structure,
    monthlyTokenBudget: row.monthly_token_budget ?? null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function getImportance(score: number): string {
  if (score >= 8) return 'high'
  if (score >= 5) return 'medium'
  if (score >= 3) return 'low'
  return 'none'
}

export async function GET() {
  const h = await headers()
  const auth = h.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: items, error } = await supabaseAdmin
      .from('feed_items')
      .select('id, feed_source_id, feed_schema_id, raw_title, raw_content, raw_url, raw_published_at')
      .eq('stage1_passed', true)
      .is('stage2_score', null)
      .is('deleted_at', null)
      .limit(50)

    if (error) {
      return apiError(error)
    }

    // Batch-fetch all referenced schemas upfront to avoid N+1 query
    const schemaIds = [...new Set((items ?? []).map(i => i.feed_schema_id).filter(Boolean))]
    const { data: schemaRows } = schemaIds.length > 0
      ? await supabaseAdmin
          .from('feed_schemas')
          .select('id, department_id, user_id, name, description, include_keywords, exclude_keywords, languages, max_age_days, scoring_prompt, min_score, extraction_prompt, output_structure, monthly_token_budget, created_at, updated_at')
          .in('id', schemaIds)
      : { data: [] as FeedSchemaRow[] }

    const schemaMap = new Map<string, ReturnType<typeof mapSchemaRow>>()
    for (const row of schemaRows ?? []) {
      schemaMap.set(row.id, mapSchemaRow(row as unknown as FeedSchemaRow))
    }

    let processed = 0
    let stage2Only = 0
    let stage3Also = 0
    const errors: string[] = []
    const pendingUpdates: Array<{ id: string } & Record<string, unknown>> = []

    for (const item of items ?? []) {
      try {
        const schema = schemaMap.get(item.feed_schema_id)
        if (!schema) continue

        const rawItem = {
          title: item.raw_title ?? '',
          content: item.raw_content ?? undefined,
          url: item.raw_url ?? '',
          publishedAt: item.raw_published_at ? new Date(item.raw_published_at) : undefined,
          sourceId: item.feed_source_id,
        }

        // Schema is mapped from feed_schemas, not feed_sources — type mismatch is structural
        const stage2Result = await runStage2(item.id, rawItem, schema as unknown as Parameters<typeof runStage2>[2])

        const update: Record<string, unknown> = {
          stage2_score: stage2Result.score,
          stage2_reason: stage2Result.reason,
          stage2_processed_at: new Date().toISOString(),
          importance: getImportance(stage2Result.score),
        }

        if (stage2Result.score >= schema.minScore) {
          const stage3Result = await runStage3(item.id, rawItem, schema as unknown as Parameters<typeof runStage3>[2])
          update.stage3_output = stage3Result
          update.stage3_processed_at = new Date().toISOString()
          stage3Also++
        } else {
          stage2Only++
        }

        pendingUpdates.push({ id: item.id, ...update })
        processed++
      } catch (err: unknown) {
        errors.push(`[${item.id}] ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    // Batch-write all scored items in one upsert instead of N individual updates
    if (pendingUpdates.length > 0) {
      const { error } = await supabaseAdmin.from('feed_items').upsert(pendingUpdates)
      if (error) errors.push(`batch_update: ${error.message}`)
    }

    return NextResponse.json({ processed, stage2Only, stage3Also, errors }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return apiError(err)
  }
}
