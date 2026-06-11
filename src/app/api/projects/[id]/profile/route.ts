// src/app/api/projects/[id]/profile/route.ts
// GET  → aktives Profil für ein Scan-Projekt
// POST → neuen Profil-Eintrag anlegen (Historie-Append, kein Update)
// ADR-027 Schritt 5 (2026-05-05)

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withAuth } from '@/lib/auth/route-guards'
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

export const GET = withAuth<{ id: string }>(async (_req, { params, auth }) => {
  const { id: scanProjectId } = params

  const project = await getOrgForScanProject(scanProjectId, auth.organization_id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [active, history] = await Promise.all([
    getActiveScanProjectProfile(scanProjectId),
    getScanProjectProfileHistory(scanProjectId),
  ])

  return NextResponse.json({ active, history })
})

// ── POST ───────────────────────────────────────────────────────────────────────

export const POST = withAuth<{ id: string }>(async (req, { params, auth }) => {
  const { id: scanProjectId } = params

  const project = await getOrgForScanProject(scanProjectId, auth.organization_id)
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
      changedBy: auth.id,
    })

    log.info('Profil gesetzt', { scanProjectId, profileType: body.profileType })
    return NextResponse.json(profile, { status: 201 })
  } catch (err) {
    log.error('Profil konnte nicht gesetzt werden', { error: String(err) })
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
})
