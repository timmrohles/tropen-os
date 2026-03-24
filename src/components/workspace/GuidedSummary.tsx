'use client'

import React from 'react'
import { PencilSimple } from '@phosphor-icons/react'
import type { GuidedAnswer } from '@/lib/workspace-types'

interface GuidedSummaryProps {
  answers: GuidedAnswer[]
  onConfirm: () => void
  onEdit: (stepIndex: number) => void
}

export default function GuidedSummary({ answers, onConfirm, onEdit }: GuidedSummaryProps) {
  return (
    <div className="guided-summary">
      <p className="guided-summary-title">Hier ist, was ich verstanden habe:</p>

      <ul className="guided-summary-list" aria-label="Zusammenfassung deiner Angaben">
        {answers.map((item, i) => (
          <li key={item.stepId} className="guided-summary-item">
            <span className="guided-summary-label">{item.question}</span>
            <span className="guided-summary-value">{item.answer}</span>
            <button
              className="guided-summary-edit"
              onClick={() => onEdit(i)}
              aria-label={`${item.question} ändern`}
              title="Antwort ändern"
            >
              <PencilSimple size={13} weight="bold" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <div className="guided-summary-actions">
        <button className="btn btn-primary" onClick={onConfirm}>
          Stimmt so — loslegen
        </button>
      </div>
    </div>
  )
}
