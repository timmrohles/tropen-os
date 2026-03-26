import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { runStage2, runStage3 } from '@/lib/feeds/pipeline'

function mapSchemaRow(row: any) {
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let processed = 0
    let stage2Only = 0
    let stage3Also = 0
    const errors: string[] = []

    for (const item of items ?? []) {
      try {
        const { data: schemaRow, error: schemaError } = await supabaseAdmin
          .from('feed_schemas')
          .select('*')
          .eq('id', item.feed_schema_id)
          .maybeSingle()

        if (schemaError || !schemaRow) {
          continue
        }

        const schema = mapSchemaRow(schemaRow)

        const rawItem = {
          title: item.raw_title ?? '',
          content: item.raw_content ?? undefined,
          url: item.raw_url ?? '',
          publishedAt: item.raw_published_at ? new Date(item.raw_published_at) : undefined,
          sourceId: item.feed_source_id,
        }

        const stage2Result = await runStage2(item.id, rawItem, schema as any)

        const update: Record<string, unknown> = {
          stage2_score: stage2Result.score,
          stage2_reason: stage2Result.reason,
          stage2_processed_at: new Date().toISOString(),
          importance: getImportance(stage2Result.score),
        }

        if (stage2Result.score >= schema.minScore) {
          const stage3Result = await runStage3(item.id, rawItem, schema as any)
          update.stage3_output = stage3Result
          update.stage3_processed_at = new Date().toISOString()
          stage3Also++
        } else {
          stage2Only++
        }

        await supabaseAdmin.from('feed_items').update(update).eq('id', item.id)

        processed++
      } catch (err: unknown) {
        errors.push(`[${item.id}] ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({ processed, stage2Only, stage3Also, errors }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
