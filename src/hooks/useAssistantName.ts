/* eslint-disable unicorn/filename-case */
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

/**
 * Returns the org's ai_guide_name from organization_settings.
 * Falls back to 'Toro' while loading or if not configured.
 */
export function useAssistantName(): string {
  const [name, setName] = useState('Toro')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()
      if (!profile?.organization_id) return
      const { data: settings } = await supabase
        .from('organization_settings')
        .select('ai_guide_name')
        .eq('organization_id', profile.organization_id)
        .maybeSingle()
      if (settings?.ai_guide_name) setName(settings.ai_guide_name)
    }).catch(() => {})
  }, [])

  return name
}
