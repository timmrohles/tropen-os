'use client'

import React, { useState } from 'react'
import ChatInput from './ChatInput'
import TemplateDrawer from './TemplateDrawer'
import { TEMPLATES } from '@/lib/prompt-templates'

interface EmptyStateProps {
  onNewConversation?: () => void
  input: string
  setInput: (v: string) => void
  sending: boolean
  onSubmit: (e: React.FormEvent) => void
}

export default function EmptyState({ input, setInput, sending, onSubmit }: EmptyStateProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeTemplate = TEMPLATES.find((t) => t.id === activeId) ?? null

  function handlePill(id: string) {
    setActiveId((prev) => (prev === id ? null : id))
  }

  function handleAccept(prompt: string) {
    setInput(prompt)
    setActiveId(null)
  }

  return (
    <div className="es">
      <video
        src="/parrot.webm"
        autoPlay loop muted playsInline
        style={{ width: 64, height: 64, objectFit: 'contain' }}
        onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none' }}
      />
      <h1 className="es-title">TROPEN OS</h1>
      <p className="es-sub">Was möchtest du heute erkunden?</p>

      <div className="es-input-wrap">
        <ChatInput input={input} setInput={setInput} sending={sending} onSubmit={onSubmit} activeAgentId={null} onSetActiveAgentId={null} activeCapabilityId={null} onSetActiveCapabilityId={null} activeOutcomeId={null} onSetActiveOutcomeId={null} />
      </div>

      {activeTemplate && (
        <TemplateDrawer
          template={activeTemplate}
          onClose={() => setActiveId(null)}
          onAccept={handleAccept}
        />
      )}

      <div className="es-pills">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            className={`es-pill${activeId === t.id ? ' es-pill--active' : ''}`}
            onClick={() => handlePill(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="es-footer">
        Toro wählt immer das sparsamste Modell das deine Aufgabe erfüllt. Ab der zweiten Nachricht erkennt er den Kontext automatisch – du musst nichts mehr auswählen.
      </p>
    </div>
  )
}
