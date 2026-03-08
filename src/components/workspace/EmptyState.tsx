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

const s: Record<string, React.CSSProperties> = {
  startScreen: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 20, padding: '0 48px', textAlign: 'center',
  },
  startTitle: {
    fontSize: 56, fontWeight: 800, color: '#fff',
    letterSpacing: '-2px', margin: 0, lineHeight: 1,
  },
  startSub: { fontSize: 18, color: '#71717a', margin: 0 },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 },
  chip: {
    background: 'var(--accent)', border: 'none',
    color: '#000', borderRadius: 8, padding: '9px 20px',
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  startInputWrap: { width: '100%', maxWidth: 680 },
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
    <div style={s.startScreen}>
      <video
        src="/parrot.webm"
        autoPlay
        loop
        muted
        playsInline
        style={{ width: 80, height: 80, objectFit: 'contain' }}
        onError={(e) => {
          const el = e.target as HTMLVideoElement
          el.style.display = 'none'
        }}
      />
      <h1 style={s.startTitle}>TROPEN OS</h1>
      <p style={s.startSub}>Was möchtest du heute erkunden?</p>

      <div style={s.chipRow}>
        {CHIPS.map((chip) => (
          <button key={chip.label} style={s.chip} onClick={onNewConversation}>
            {chip.label}
          </button>
        ))}
      </div>

      <div style={s.startInputWrap}>
        <ChatInput
          input={input}
          setInput={setInput}
          sending={sending}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
