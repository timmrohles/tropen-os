'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface ToroBirdProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * Shows the org's custom assistant image (from organization_settings.ai_assistant_image_url)
 * or falls back to the default Parrot animation.
 */
export function ToroBird({ size = 80, className, style }: ToroBirdProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
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
        .select('ai_guide_name, ai_assistant_image_url')
        .eq('organization_id', profile.organization_id)
        .maybeSingle()
      if (settings?.ai_guide_name) setName(settings.ai_guide_name)
      if (settings?.ai_assistant_image_url) setImageUrl(settings.ai_assistant_image_url)
    }).catch(() => {})
  }, [])

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'contain', ...style }}
      />
    )
  }

  return (
    <video
      src="/animations/Parrot.webm"
      autoPlay
      loop
      muted
      playsInline
      aria-label={name}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', ...style }}
    />
  )
}
