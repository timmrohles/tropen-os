import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendDigestNow } from '@/actions/feeds'

export async function GET() {
  const h = await headers()
  const auth = h.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: distributions, error } = await supabaseAdmin
      .from('feed_distributions')
      .select('*')
      .eq('is_active', true)
      .eq('digest_mode', 'scheduled')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let totalSent = 0

    for (const distribution of distributions ?? []) {
      try {
        const result = await sendDigestNow(distribution.id)
        totalSent += result.sent ?? 0
      } catch {
        // swallow per-item errors and continue
      }
    }

    return NextResponse.json(
      {
        processed: distributions?.length ?? 0,
        totalSent,
      },
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
