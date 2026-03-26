'use client'

import { useMemo } from 'react'
import { Target, Lightning } from '@phosphor-icons/react'
import Link from 'next/link'

interface IntentionGateProps {
  userName?: string
  onFocused: () => void
  onGuided: () => void
}

export default function IntentionGate({ userName, onFocused, onGuided }: IntentionGateProps) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    const name = userName ? `, ${userName}` : ''
    if (hour >= 5 && hour < 12) return `Guten Morgen${name}.`
    if (hour >= 12 && hour < 18) return `Hallo${name}.`
    return `Guten Abend${name}.`
  }, [userName])

  return (
    <div className="intention-gate" role="region" aria-label="Chat-Einstieg">
      <div className="intention-gate-icon" aria-hidden="true">🦜</div>

      <div className="intention-gate-greeting">
        <h2 className="intention-gate-title">{greeting}</h2>
        <p className="intention-gate-subtitle">Was steht heute an?</p>
      </div>

      <div className="intention-gate-cards">
        <Link
          href="/chat"
          className="card intention-gate-card"
          aria-label="Gezielt starten — an einem Chat weiterarbeiten"
        >
          <div className="intention-gate-card-icon">
            <Target size={22} weight="fill" color="var(--accent)" aria-hidden="true" />
          </div>
          <div className="intention-gate-card-text">
            <span className="intention-gate-card-title">Gezielt</span>
            <span className="intention-gate-card-sub">An einem Chat weiterarbeiten</span>
          </div>
        </Link>

        <button
          className="card intention-gate-card"
          onClick={onGuided}
          aria-label="Geführt starten — Toro führt dich Schritt für Schritt"
        >
          <div className="intention-gate-card-icon">
            <Lightning size={22} weight="fill" color="var(--accent)" aria-hidden="true" />
          </div>
          <div className="intention-gate-card-text">
            <span className="intention-gate-card-title">Geführt</span>
            <span className="intention-gate-card-sub">Toro führt dich Schritt für Schritt</span>
          </div>
        </button>
      </div>
    </div>
  )
}
