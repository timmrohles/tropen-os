'use client'

import React from 'react'
import { PROFILE_LABELS, GEO_SCOPE_LABELS } from '@/lib/audit/project-profiles-shared'
import type { ScanProjectProfile } from '@/lib/audit/project-profiles-shared'

// ── ProfileDisplayBar ──────────────────────────────────────────────────────────

export function ProfileDisplayBar({ profile, onEdit }: { profile: ScanProjectProfile; onEdit: () => void }) {
  const profileLabel = PROFILE_LABELS[profile.profile_type]
  const geoLabel = GEO_SCOPE_LABELS[profile.geo_scope]

  const summaryParts: string[] = [
    geoLabel.flag + ' ' + geoLabel.label,
    profile.has_user_data ? 'Sammelt User-Daten' : 'Keine User-Daten',
    profile.has_ai === true ? 'Mit KI' : profile.has_ai === false ? 'Ohne KI' : null,
    profile.has_ecommerce === true ? 'Mit Verkauf' : profile.has_ecommerce === false ? 'Ohne Verkauf' : null,
  ].filter(Boolean) as string[]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      padding: '8px 12px', borderRadius: 8,
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>PROFIL</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {profileLabel.name}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {summaryParts.join(' · ')}
        </span>
      </div>
      <button
        onClick={onEdit}
        style={{
          fontSize: 11, color: 'var(--teal)', background: 'none', border: '1px solid var(--teal)',
          borderRadius: 4, padding: '3px 10px', cursor: 'pointer',
        }}
      >
        Profil ändern
      </button>
    </div>
  )
}
