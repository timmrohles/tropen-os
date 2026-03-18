// POST /api/feeds/[id]/run — Manueller Feed-Run-Trigger
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { runFeedSource } from '@/lib/feeds/feed-runner'

export const runtime = 'nodejs'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const result = await runFeedSource(id, 'manual')

  return NextResponse.json(result)
}
