'use client'

// SectionLabel — Standard-Pattern für Sektions-Überschriften mit Linien-Marker.
// Visual: kleine horizontale Linie + Mono-Text in --accent.
// Referenz: Dashboard "Deine Projekte", _DESIGN_REFERENCE.tsx Section-Tag.

import React from 'react'

interface SectionLabelProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function SectionLabel({ children, style }: SectionLabelProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 12,
      fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
      color: 'var(--accent)', marginBottom: 20, letterSpacing: '0.02em',
      ...style,
    }}>
      <span style={{ width: 28, height: 1, background: 'rgba(63,74,85,0.3)', flexShrink: 0 }} aria-hidden="true" />
      {children}
    </span>
  )
}
