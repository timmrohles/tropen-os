'use client'

import React from 'react'

interface GuidedModePickerProps {
  onSelect: (mode: 'guided' | 'direct' | 'open') => void
}

export default function GuidedModePicker({ onSelect }: GuidedModePickerProps) {
  return (
    <div className="guided-mode-picker" role="group" aria-label="Wie möchtest du vorgehen?">
      <p className="guided-mode-question">Wie möchtest du vorgehen?</p>

      <div className="guided-mode-options">
        <button
          className="guided-mode-option"
          onClick={() => onSelect('guided')}
          aria-label="Geführt: Schritt für Schritt mit Fragen"
        >
          <span className="guided-mode-icon" aria-hidden="true">🎯</span>
          <div className="guided-mode-text">
            <strong>Geführt</strong>
            <span>Schritt für Schritt mit Fragen</span>
          </div>
        </button>

        <button
          className="guided-mode-option"
          onClick={() => onSelect('direct')}
          aria-label="Direkt: Toro legt sofort mit einem ersten Entwurf los"
        >
          <span className="guided-mode-icon" aria-hidden="true">⚡</span>
          <div className="guided-mode-text">
            <strong>Direkt</strong>
            <span>Sofort einen ersten Entwurf</span>
          </div>
        </button>

        <button
          className="guided-mode-option"
          onClick={() => onSelect('open')}
          aria-label="Offen: Gemeinsam im Gespräch entwickeln"
        >
          <span className="guided-mode-icon" aria-hidden="true">💬</span>
          <div className="guided-mode-text">
            <strong>Offen</strong>
            <span>Gemeinsam im Gespräch</span>
          </div>
        </button>
      </div>
    </div>
  )
}
