'use client'

import React from 'react'
import { PaperPlaneRight } from '@phosphor-icons/react'

interface ChatInputProps {
  input: string
  setInput: (v: string) => void
  sending: boolean
  onSubmit: (e: React.FormEvent) => void
}

const s: Record<string, React.CSSProperties> = {
  inputRow: { display: 'flex', gap: 8, alignItems: 'center' },
  textInput: {
    flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', padding: '14px 16px',
    borderRadius: 16, fontSize: 15, outline: 'none',
  },
  sendBtn: {
    background: 'var(--accent)', color: '#0d1f16', border: 'none',
    width: 44, height: 44, borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
}

export default function ChatInput({ input, setInput, sending, onSubmit }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} style={s.inputRow}>
      <input
        style={s.textInput}
        placeholder="Nachricht eingeben…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={sending}
        autoFocus
      />
      <button style={s.sendBtn} type="submit" disabled={sending || !input.trim()}>
        {sending
          ? <span style={{ fontSize: 16, opacity: 0.6 }}>…</span>
          : <PaperPlaneRight size={20} weight="fill" />
        }
      </button>
    </form>
  )
}
