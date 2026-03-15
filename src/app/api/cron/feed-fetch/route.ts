import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { triggerFeedFetch } from '@/actions/feeds'

export async function GET() {
  try {
    const { data: sources, error } = await supabaseAdmin
      .from('feed_sources')
      .select('id')
      .eq('is_active', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let totalItemsFound = 0
    let totalItemsSaved = 0
    const errors: string[] = []

    for (const source of sources ?? []) {
      try {
        const result = await triggerFeedFetch(source.id)
        totalItemsFound += result.itemsFound ?? 0
        totalItemsSaved += result.itemsSaved ?? 0
        if (result.errors?.length) {
          errors.push(...result.errors.map((e: string) => `[${source.id}] ${e}`))
        }
      } catch (err: any) {
        errors.push(`[${source.id}] ${err.message}`)
      }
    }

    return NextResponse.json(
      {
        processed: sources?.length ?? 0,
        totalItemsFound,
        totalItemsSaved,
        errors,
      },
      { status: 200 }
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
