// GET /api/feeds/[id]/distributions — list distributions for a feed source
// POST /api/feeds/[id]/distributions — create a new distribution
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'
import { createDistributionSchema } from '@/lib/validators/feeds'
import { createLogger } from '@/lib/logger'

export const runtime = 'nodejs'

const log = createLogger('feeds:distributions')

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Ownership check: source must belong to user's org
  const { data: source } = await supabaseAdmin
    .from('feed_sources')
    .select('id, organization_id')
    .eq('id', id)
    .eq('organization_id', user.organization_id)
    .maybeSingle()

  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('feed_distributions')
    .select('*')
    .eq('source_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    log.error('list distributions failed', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Returns snake_case (raw DB row) — DistributionsPanel maps to camelCase client-side
  return NextResponse.json({ distributions: data ?? [] })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Parse + validate body
  // Uses inline safeParse (not validateBody helper) because safeParse returns typed data directly
  let rawBody: unknown
  try { rawBody = await req.json() } catch { rawBody = {} }
  const parsed = createDistributionSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid body' }, { status: 400 })
  }
  const body = parsed.data

  // Ownership check
  const { data: source } = await supabaseAdmin
    .from('feed_sources')
    .select('id, organization_id')
    .eq('id', id)
    .eq('organization_id', user.organization_id)
    .maybeSingle()

  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // For 'notification' target_type, use a sentinel UUID (no real target_id needed)
  const targetId = body.target_type === 'notification'
    ? '00000000-0000-0000-0000-000000000000'
    : body.target_id

  // Duplicate check
  const { data: existing } = await supabaseAdmin
    .from('feed_distributions')
    .select('id')
    .eq('source_id', id)
    .eq('target_type', body.target_type)
    .eq('target_id', targetId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Distribution already exists' }, { status: 409 })
  }

  const { data, error } = await supabaseAdmin
    .from('feed_distributions')
    .insert({
      source_id:   id,
      target_type: body.target_type,
      target_id:   targetId,
      auto_inject: body.auto_inject,
      min_score:   body.min_score,
    })
    .select()
    .single()

  if (error) {
    log.error('create distribution failed', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Returns snake_case (raw DB row) — DistributionsPanel maps to camelCase client-side
  return NextResponse.json({ distribution: data }, { status: 201 })
}
