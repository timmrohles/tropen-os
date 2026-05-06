// src/lib/audit/project-profiles.ts
// ADR-027 Schritt 5 — Compliance-Domänen-Aktivierung per Profil.
// Server-only: uses supabaseAdmin. Pure types/constants → project-profiles-shared.ts

import { supabaseAdmin } from '@/lib/supabase-admin'
import type { ScanProjectProfile, CreateProfileInput } from './project-profiles-shared'

export type {
  ProfileType,
  GeoScope,
  ScanProjectProfile,
  CreateProfileInput,
  ActivationLevel,
  DomainActivation,
} from './project-profiles-shared'
export {
  getDomainActivation,
  PROFILE_LABELS,
  GEO_SCOPE_LABELS,
  DEFAULT_PROFILE,
} from './project-profiles-shared'

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getActiveScanProjectProfile(
  scanProjectId: string,
): Promise<ScanProjectProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('scan_project_profiles')
    .select('*')
    .eq('scan_project_id', scanProjectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data as ScanProjectProfile | null
}

export async function createScanProjectProfile(
  input: CreateProfileInput,
): Promise<ScanProjectProfile> {
  const { data, error } = await supabaseAdmin
    .from('scan_project_profiles')
    .insert({
      scan_project_id: input.scanProjectId,
      profile_type: input.profileType,
      geo_scope: input.geoScope,
      has_user_data: input.hasUserData,
      has_ai: input.hasAi,
      has_ecommerce: input.hasEcommerce,
      changed_by: input.changedBy ?? null,
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create profile')
  return data as ScanProjectProfile
}

export async function getScanProjectProfileHistory(
  scanProjectId: string,
): Promise<ScanProjectProfile[]> {
  const { data } = await supabaseAdmin
    .from('scan_project_profiles')
    .select('*')
    .eq('scan_project_id', scanProjectId)
    .order('created_at', { ascending: true })

  return (data ?? []) as ScanProjectProfile[]
}
