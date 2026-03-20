'use client'

import React, { useState } from 'react'

interface IntentionGateProps {
  onSelect: (intention: 'focused' | 'open') => void
}

export default function IntentionGate({ onSelect }: IntentionGateProps) {
  const [hovered, setHovered] = useState<'focused' | 'open' | null>(null)

  function handleKey(e: React.KeyboardEvent, intention: 'focused' | 'open') {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(intention)
    }
  }

  return (
    <div className="igate">
      <video
        src="/parrot.webm"
        autoPlay loop muted playsInline
        style={{ width: 56, height: 56, objectFit: 'contain' }}
        onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none' }}
      />
      <p className="igate-question">Was möchtest du heute angehen?</p>

      <div className="igate-options">
        <div
          className="card igate-card"
          role="button"
          tabIndex={0}
          onClick={() => onSelect('focused')}
          onKeyDown={(e) => handleKey(e, 'focused')}
          onMouseEnter={() => setHovered('focused')}
          onMouseLeave={() => setHovered(null)}
          style={{
            cursor: 'pointer',
            borderColor: hovered === 'focused' ? 'var(--accent)' : undefined,
          }}
          aria-label="Gezielt — ich habe ein konkretes Ziel"
        >
          <div className="igate-card-icon">🎯</div>
          <div className="igate-card-text">
            <strong>Gezielt</strong>
            <span>Ich habe ein konkretes Ziel</span>
          </div>
        </div>

        <div
          className="card igate-card"
          role="button"
          tabIndex={0}
          onClick={() => onSelect('open')}
          onKeyDown={(e) => handleKey(e, 'open')}
          onMouseEnter={() => setHovered('open')}
          onMouseLeave={() => setHovered(null)}
          style={{
            cursor: 'pointer',
            borderColor: hovered === 'open' ? 'var(--accent)' : undefined,
          }}
          aria-label="Offen — ich denke nach, schaue was entsteht"
        >
          <div className="igate-card-icon">🔍</div>
          <div className="igate-card-text">
            <strong>Offen</strong>
            <span>Ich denke nach, schaue was entsteht</span>
          </div>
        </div>
      </div>
    </div>
  )
}
