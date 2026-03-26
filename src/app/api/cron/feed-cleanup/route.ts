import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { runTtlCleanup } from '@/lib/feeds/ttl-cleanup'

export async function GET() {
  const h = await headers()
  const auth = h.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runTtlCleanup()
    return NextResponse.json({ archived: result.archived }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
