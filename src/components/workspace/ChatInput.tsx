'use client'

import React from 'react'
import { PaperPlaneRight } from '@phosphor-icons/react'

interface ChatInputProps {
  input: string
  setInput: (v: string) => void
  sending: boolean
  onSubmit: (e: React.FormEvent) => void
}

export default function ChatInput({ input, setInput, sending, onSubmit }: ChatInputProps) {
  return (
    <div className="cinput-wrap-outer">
      <form onSubmit={onSubmit} className="cinput-row">
        <input
          className="cinput-field"
          placeholder="Nachricht eingeben…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          autoFocus
        />
        <button
          className="cinput-send"
          type="submit"
          disabled={sending || !input.trim()}
          aria-label={sending ? 'Nachricht wird gesendet…' : 'Nachricht senden'}
        >
          {sending
            ? <span className="cinput-sending">…</span>
            : <PaperPlaneRight size={20} weight="fill" />
          }
        </button>
      </form>
    </div>
  )
}
