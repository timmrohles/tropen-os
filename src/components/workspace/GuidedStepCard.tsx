'use client'

import React, { useState } from 'react'
import type { GuidedStep } from '@/lib/workspace-types'

interface GuidedStepCardProps {
  step: GuidedStep
  stepNumber: number
  totalSteps: number
  onAnswer: (value: string, label: string) => void
}

export default function GuidedStepCard({ step, stepNumber, totalSteps, onAnswer }: GuidedStepCardProps) {
  const [customValue, setCustomValue] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const phaseLabel =
    step.phase === 'scout' ? 'Verstehen' :
    step.phase === 'planner' ? 'Planen' : 'Ausführen'

  function handleCustomSubmit() {
    const trimmed = customValue.trim()
    if (trimmed) onAnswer('custom', trimmed)
  }

  return (
    <div className="guided-step" role="group" aria-label={`Schritt ${stepNumber} von ${totalSteps}`}>
      <div className="guided-step-header">
        <span className="guided-step-counter">{stepNumber} / {totalSteps}</span>
        <span className="guided-step-phase">{phaseLabel}</span>
      </div>

      <p className="guided-step-question">{step.question}</p>

      <div className="guided-step-options">
        {step.options.map(option =>
          option.isCustom ? (
            <button
              key={option.value}
              className="guided-step-option guided-step-option--custom"
              onClick={() => setShowCustom(true)}
            >
              {option.label}
            </button>
          ) : (
            <button
              key={option.value}
              className="guided-step-option"
              onClick={() => onAnswer(option.value, option.label)}
            >
              {option.label}
            </button>
          )
        )}
      </div>

      {showCustom && (
        <div className="guided-step-custom">
          <input
            type="text"
            placeholder="Eigene Antwort eingeben..."
            value={customValue}
            onChange={e => setCustomValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCustomSubmit() }}
            autoFocus
            aria-label="Eigene Antwort"
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleCustomSubmit}
            disabled={!customValue.trim()}
          >
            Weiter →
          </button>
        </div>
      )}
    </div>
  )
}
