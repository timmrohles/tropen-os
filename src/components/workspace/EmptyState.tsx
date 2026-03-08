'use client'

import React from 'react'
import ChatInput from './ChatInput'

interface EmptyStateProps {
  onNewConversation: () => void
  input: string
  setInput: (v: string) => void
  sending: boolean
  onSubmit: (e: React.FormEvent) => void
}

const CHIPS = [
  { label: 'Dokument', type: 'create' },
  { label: 'Research', type: 'research' },
  { label: 'Erstellen', type: 'create' },
  { label: 'Analysieren', type: 'extract' },
  { label: 'Chat', type: 'chat' },
]

export default function EmptyState({ onNewConversation, input, setInput, sending, onSubmit }: EmptyStateProps) {
  return (
    <div className="es">
      <video
        src="/parrot.webm"
        autoPlay loop muted playsInline
        style={{ width: 80, height: 80, objectFit: 'contain' }}
        onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none' }}
      />
      <h1 className="es-title">TROPEN OS</h1>
      <p className="es-sub">Was möchtest du heute erkunden?</p>
      <div className="es-chip-row">
        {CHIPS.map((chip) => (
          <button key={chip.label} className="es-chip" onClick={onNewConversation}>
            {chip.label}
          </button>
        ))}
      </div>
      <div className="es-input-wrap">
        <ChatInput input={input} setInput={setInput} sending={sending} onSubmit={onSubmit} />
      </div>
    </div>
  )
}
