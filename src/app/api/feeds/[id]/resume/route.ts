// POST /api/feeds/[id]/resume
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { resumeFeed } from '@/lib/feeds/feed-pause'

export const runtime = 'nodejs'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const result = await resumeFeed(id)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })

  return NextResponse.json({ ok: true })
}
