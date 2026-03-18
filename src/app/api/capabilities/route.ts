import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api/capabilities')

// GET /api/capabilities
// Returns all active system + org capabilities with valid outcomes, user settings, and org settings.
export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Load all system + org capabilities
  const { data: capabilities, error: capErr } = await supabaseAdmin
    .from('capabilities')
    .select(`
      id, scope, label, icon, description, capability_type,
      system_prompt_injection, tools, is_active, sort_order,
      default_model_id,
      model_catalog:default_model_id (id, label, api_model_id, provider)
    `)
    .in('scope', ['system', 'org'])
    .or(`organization_id.is.null,organization_id.eq.${me.organization_id}`)
    .eq('is_active', true)
    .order('sort_order')

  if (capErr) {
    log.error('capabilities query failed', { error: capErr })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  // Load org settings to filter disabled capabilities
  const { data: orgSettings } = await supabaseAdmin
    .from('capability_org_settings')
    .select('capability_id, is_enabled, allowed_model_ids, default_model_id, user_can_override')
    .eq('organization_id', me.organization_id)

  const disabledIds = new Set(
    (orgSettings ?? [])
      .filter(s => !s.is_enabled)
      .map(s => s.capability_id)
  )

  // Load user settings
  const { data: userSettings } = await supabaseAdmin
    .from('user_capability_settings')
    .select('capability_id, selected_model_id, preferred_outcome_id, is_pinned, sort_order')
    .eq('user_id', me.id)

  const userSettingsMap = new Map(
    (userSettings ?? []).map(s => [s.capability_id, s])
  )

  // Load valid outcomes per capability
  const capIds = (capabilities ?? []).map(c => c.id)
  const { data: combos } = capIds.length > 0
    ? await supabaseAdmin
        .from('capability_outcomes')
        .select('capability_id, outcome_id, is_default, sort_order, outcomes(id, label, icon, output_type, card_type)')
        .in('capability_id', capIds)
        .order('sort_order')
    : { data: [] }

  const combosByCapId = new Map<string, typeof combos>()
  for (const combo of combos ?? []) {
    const arr = combosByCapId.get(combo.capability_id) ?? []
    arr.push(combo)
    combosByCapId.set(combo.capability_id, arr)
  }

  const result = (capabilities ?? [])
    .filter(c => !disabledIds.has(c.id))
    .map(c => {
      const uSettings = userSettingsMap.get(c.id)
      const orgSetting = (orgSettings ?? []).find(s => s.capability_id === c.id)
      return {
        ...c,
        valid_outcomes:         combosByCapId.get(c.id) ?? [],
        user_is_pinned:         uSettings?.is_pinned ?? false,
        user_selected_model_id: uSettings?.selected_model_id ?? null,
        preferred_outcome_id:   uSettings?.preferred_outcome_id ?? null,
        org_default_model_id:   orgSetting?.default_model_id ?? null,
        user_can_override:      orgSetting?.user_can_override ?? true,
      }
    })

  return NextResponse.json(result)
}
