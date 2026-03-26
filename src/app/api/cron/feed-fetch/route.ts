import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { triggerFetch } from '@/actions/feeds'

export async function GET() {
  const h = await headers()
  const auth = h.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
        const result = await triggerFetch(source.id)
        totalItemsFound += result.itemsFound ?? 0
        totalItemsSaved += result.itemsSaved ?? 0
        if (result.errors?.length) {
          errors.push(...result.errors.map((e: string) => `[${source.id}] ${e}`))
        }
      } catch (err: unknown) {
        errors.push(`[${source.id}] ${err instanceof Error ? err.message : 'Unknown error'}`)
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
