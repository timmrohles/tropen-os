// src/app/api/projects/[id]/profile/route.ts
// GET  → aktives Profil für ein Scan-Projekt
// POST → neuen Profil-Eintrag anlegen (Historie-Append, kein Update)
// ADR-027 Schritt 5 (2026-05-05)

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import {
  getActiveScanProjectProfile,
  createScanProjectProfile,
  getScanProjectProfileHistory,
} from '@/lib/audit/project-profiles'

const log = createLogger('api:projects:profile')

const profileInputSchema = z.object({
  profileType: z.enum(['solo', 'internal', 'public', 'b2c', 'b2b_regulated']),
  geoScope: z.enum(['eu', 'non_eu', 'global', 'none']),
  hasUserData: z.boolean(),
  hasAi: z.boolean().nullable(),
  hasEcommerce: z.boolean().nullable(),
})

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function getOrgForScanProject(scanProjectId: string, orgId: string) {
  const { data } = await supabaseAdmin
    .from('scan_projects')
    .select('id')
    .eq('id', scanProjectId)
    .eq('organization_id', orgId)
    .maybeSingle()
  return data
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: scanProjectId } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userRow?.organization_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const project = await getOrgForScanProject(scanProjectId, userRow.organization_id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [active, history] = await Promise.all([
    getActiveScanProjectProfile(scanProjectId),
    getScanProjectProfileHistory(scanProjectId),
  ])

  return NextResponse.json({ active, history })
}

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: scanProjectId } = await params
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userRow?.organization_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const project = await getOrgForScanProject(scanProjectId, userRow.organization_id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: z.infer<typeof profileInputSchema>
  try {
    const raw = await req.json()
    const parsed = profileInputSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const profile = await createScanProjectProfile({
      scanProjectId,
      profileType: body.profileType,
      geoScope: body.geoScope,
      hasUserData: body.hasUserData,
      hasAi: body.hasAi,
      hasEcommerce: body.hasEcommerce,
      changedBy: user.id,
    })

    log.info('Profil gesetzt', { scanProjectId, profileType: body.profileType })
    return NextResponse.json(profile, { status: 201 })
  } catch (err) {
    log.error('Profil konnte nicht gesetzt werden', { error: String(err) })
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}
