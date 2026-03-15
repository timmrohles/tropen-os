import { NextResponse } from 'next/server'
import { runTtlCleanup } from '@/lib/feeds/ttl-cleanup'

export async function GET() {
  try {
    const result = await runTtlCleanup()
    return NextResponse.json({ archived: result.archived }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
