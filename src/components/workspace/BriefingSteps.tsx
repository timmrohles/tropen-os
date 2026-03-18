'use client'

import React from 'react'

export function StepWrapper({ label, question, children }: {
  label: string
  question: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.35 }}>
        {question}
      </p>
      {children}
    </div>
  )
}

export function StepActions({ onBack, onNext, onSkip, nextDisabled, nextLabel }: {
  onBack?: () => void
  onNext?: () => void
  onSkip?: () => void
  nextDisabled?: boolean
  nextLabel?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
      {onBack && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
          Zurück
        </button>
      )}
      {onNext && (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onNext}
          disabled={nextDisabled}
        >
          {nextLabel ?? 'Weiter'}
        </button>
      )}
      {onSkip && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onSkip}
          style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)' }}
        >
          Überspringen
        </button>
      )}
    </div>
  )
}
