export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'

// GET — load active announcements for current user (max 5)
// Returns: tropen-wide (source='tropen', org IS NULL) + org-specific
// Filter: is_active=true AND (expires_at IS NULL OR expires_at > NOW())
// Sort: tropen first, then org, each by published_at DESC
// Max: 5 total
export async function GET(_request: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = user.organization_id ?? null
  const now = new Date().toISOString()

  // Tropen-wide announcements (organization_id IS NULL, source='tropen')
  const { data: tropenAnn } = await supabaseAdmin
    .from('announcements')
    .select('id, title, body, url, url_label, type, source, published_at')
    .is('organization_id', null)
    .eq('source', 'tropen')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('published_at', { ascending: false })
    .limit(5)

  // Org-specific announcements
  let orgAnn: typeof tropenAnn = []
  if (orgId) {
    const { data } = await supabaseAdmin
      .from('announcements')
      .select('id, title, body, url, url_label, type, source, published_at')
      .eq('organization_id', orgId)
      .eq('source', 'org')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('published_at', { ascending: false })
      .limit(5)
    orgAnn = data ?? []
  }

  // Combine: tropen first, then org, max 5 total
  const combined = [...(tropenAnn ?? []), ...orgAnn].slice(0, 5)
  return NextResponse.json(combined)
}

// POST — create announcement (org_admin/owner for org-scoped, superadmin for tropen-wide)
// Body: { title, body?, url?, url_label?, type?, expires_at?, organization_id? }
// organization_id=null means tropen-wide (superadmin only)
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.role ?? null
  const userOrgId = user.organization_id ?? null

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 }) }
  const { title, body: annBody, url, url_label, type, expires_at, organization_id } = body as {
    title?: string; body?: string; url?: string; url_label?: string; type?: string;
    expires_at?: string; organization_id?: string | null
  }

  if (!title?.trim()) return NextResponse.json({ error: 'Titel fehlt' }, { status: 400 })

  // Tropen-wide: superadmin only, organization_id stays null
  // Org-scoped: org_admin/owner/superadmin, organization_id must be user's org (or specified org for superadmin)
  let targetOrgId: string | null = null
  let source: 'tropen' | 'org' = 'org'

  if (organization_id === null || organization_id === undefined) {
    // Tropen-wide
    if (role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    targetOrgId = null
    source = 'tropen'
  } else {
    // Org-scoped
    if (!['org_admin', 'owner', 'superadmin'].includes(role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    // Superadmin can specify any org, others only their own
    if (role === 'superadmin') {
      targetOrgId = organization_id
    } else {
      if (organization_id !== userOrgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      targetOrgId = userOrgId
    }
    source = 'org'
  }

  const { data: ann, error: insertError } = await supabaseAdmin
    .from('announcements')
    .insert({
      organization_id: targetOrgId,
      title: title.trim(),
      body: annBody?.trim() || null,
      url: url?.trim() || null,
      url_label: url_label?.trim() || null,
      type: type ?? 'info',
      source,
      created_by: user.id,
      expires_at: expires_at || null,
    })
    .select()
    .single()

  if (insertError) return apiError(insertError)
  return NextResponse.json(ann, { status: 201 })
}
