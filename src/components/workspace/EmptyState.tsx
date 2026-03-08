'use client'

import React from 'react'
import { Question, BookOpen, PencilSimple, ListBullets, Brain } from '@phosphor-icons/react'
import ChatInput from './ChatInput'

interface EmptyStateProps {
  onNewConversation: () => void
  input: string
  setInput: (v: string) => void
  sending: boolean
  onSubmit: (e: React.FormEvent) => void
}

const OPTIONS = [
  {
    icon: <Question size={22} weight="bold" />,
    title: 'Ich habe eine Frage',
    desc: 'Schnelle, direkte Antwort auf eine konkrete Frage',
    hint: 'Eco · gpt-4o-mini · antwortet sofort',
    type: 'chat',
  },
  {
    icon: <BookOpen size={22} weight="bold" />,
    title: 'Erkläre mir ein Thema',
    desc: 'Toro recherchiert gründlich und erklärt mit Zusammenhängen',
    hint: 'Erweitertes Modell · mit Quellenhinweisen',
    type: 'research',
  },
  {
    icon: <PencilSimple size={22} weight="bold" />,
    title: 'Schreib mir etwas',
    desc: 'Email, Konzept, Post, Zusammenfassung – Toro fragt nach Stil und Zielgruppe',
    hint: 'Erweitertes Modell · Toro stellt kurz Rückfragen',
    type: 'create',
  },
  {
    icon: <ListBullets size={22} weight="bold" />,
    title: 'Fasse das zusammen',
    desc: 'Füge einen Text ein – Toro extrahiert das Wesentliche auf einen Blick',
    hint: 'Eco · gpt-4o-mini · schnell und präzise',
    type: 'summarize',
  },
  {
    icon: <Brain size={22} weight="bold" />,
    title: 'Hilf mir beim Denken',
    desc: 'Brainstorming, Entscheidungen, Strategien – Toro denkt strukturiert mit',
    hint: 'Erweitertes Modell · Toro stellt Gegenfragen',
    type: 'extract',
  },
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
      <div className="es-options">
        {OPTIONS.map((opt) => (
          <button key={opt.type} className="es-option" onClick={onNewConversation}>
            <span className="es-option-icon">{opt.icon}</span>
            <span className="es-option-title">{opt.title}</span>
            <span className="es-option-desc">{opt.desc}</span>
            <span className="es-option-hint">{opt.hint}</span>
          </button>
        ))}
      </div>
      <p className="es-footer">
        Toro wählt immer das sparsamste Modell das deine Aufgabe erfüllt. Ab der zweiten Nachricht erkennt er den Kontext automatisch – du musst nichts mehr auswählen.
      </p>
      <div className="es-input-wrap">
        <ChatInput input={input} setInput={setInput} sending={sending} onSubmit={onSubmit} />
      </div>
    </div>
  )
}
