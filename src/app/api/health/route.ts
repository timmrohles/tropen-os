import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  // DB ping
  const { error } = await supabaseAdmin.from('users').select('id').limit(1).maybeSingle()
  const dbOk = !error
  const latencyMs = Date.now() - start

  const status = dbOk ? 'ok' : 'degraded'
  const httpStatus = dbOk ? 200 : 503

  return NextResponse.json(
    {
      status,
      db: dbOk ? 'ok' : 'error',
      latency_ms: latencyMs,
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',
      timestamp: new Date().toISOString(),
    },
    { status: httpStatus }
  )
}
