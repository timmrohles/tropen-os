'use client'

import { useState } from 'react'
import { ArrowLeft, Target, Compass } from '@phosphor-icons/react'
import { ConceptForm } from './ConceptForm'

interface Props {
  projectId: string
  seed: string
  onDone: (result: unknown) => void
}

export function ConceptTour({ projectId, seed, onDone }: Props) {
  const [mode, setMode] = useState<null | 'form'>(null)

  if (mode === 'form') {
    return (
      <div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode(null)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <ArrowLeft size={13} weight="bold" aria-hidden="true" /> zurück
        </button>
        <ConceptForm projectId={projectId} seed={seed} onDone={onDone} />
      </div>
    )
  }

  return (
    <div>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Wie sicher bist du dir, was du bauen willst?
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {/* Karte 1 — aktiv */}
        <button type="button" className="card" onClick={() => setMode('form')}
          style={{ textAlign: 'left', padding: 18, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
          <Target size={24} weight="fill" color="var(--teal)" aria-hidden="true" />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Ich weiß ziemlich genau, was ich will
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            Vier Felder ausfüllen, optional mit KI-Vorschlag — danach analysieren wir dein Konzept neu.
          </span>
        </button>

        {/* Karte 2 — kommt bald (2b-2) */}
        <div className="card" aria-disabled="true"
          style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', opacity: 0.55, cursor: 'not-allowed' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <Compass size={24} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
            <span className="chip" style={{ marginLeft: 'auto' }}>kommt bald</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Ich bin noch unsicher
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            Ein geführter Dialog hilft dir, dein Konzept Schritt für Schritt zu schärfen.
          </span>
        </div>
      </div>
    </div>
  )
}
