'use client'

import {
  Lightning, ListBullets, Article,
  Globe, Robot,
} from '@phosphor-icons/react'
import type { ChatStyle, ModelPref, IconNode } from './onboarding.types'
import { s } from './onboarding.styles'

interface StepPersonalStyleProps {
  isAdmin: boolean
  guideName: string
  userName: string
  setUserName: (v: string) => void
  chatStyle: ChatStyle
  setChatStyle: (v: ChatStyle) => void
  modelPref: ModelPref
  setModelPref: (v: ModelPref) => void
  error: string
  onBack: () => void
  onNext: () => void
}

export default function StepPersonalStyle({
  isAdmin, guideName,
  userName, setUserName,
  chatStyle, setChatStyle,
  modelPref, setModelPref,
  error, onBack, onNext,
}: StepPersonalStyleProps) {
  return (
    <div style={s.step}>
      <div style={s.stepLabel}>{isAdmin ? 'Schritt 3 von 5' : 'Schritt 1 von 3'}</div>
      <h1 style={s.h1}>Wie soll {guideName || 'Toro'} mit dir sprechen?</h1>
      <p style={s.sub}>Personalisiere deinen KI-Assistenten.</p>

      <div style={s.field}>
        <label style={s.label}>Wie heißt du? *</label>
        <input
          style={s.input}
          placeholder="Vorname Nachname"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          autoFocus={!isAdmin}
        />
      </div>

      <div style={{ ...s.field, marginTop: 28 }}>
        <label style={s.label}>Antwortstil</label>
        <div style={s.cardRow}>
          {([
            { value: 'clear',      icon: <Lightning size={24} weight="fill" />, title: 'Klar & Direkt',  sub: 'Kurze, präzise Antworten. Kein Overhead.' },
            { value: 'structured', icon: <ListBullets size={24} weight="fill" />, title: 'Strukturiert',   sub: 'Abschnitte, Listen, klare Übersichten.' },
            { value: 'detailed',   icon: <Article size={24} weight="fill" />, title: 'Ausführlich',     sub: 'Tiefe Analysen, viel Kontext, vollständige Erklärungen.' },
          ] as { value: ChatStyle; icon: IconNode; title: string; sub: string }[]).map((opt) => (
            <button
              key={opt.value}
              style={{ ...s.card, ...(chatStyle === opt.value ? s.cardActive : {}) }}
              onClick={() => setChatStyle(opt.value)}
            >
              <span style={s.cardEmoji}>{opt.icon}</span>
              <span style={s.cardTitle}>{opt.title}</span>
              <span style={s.cardSub}>{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...s.field, marginTop: 20 }}>
        <label style={s.label}>Modell-Präferenz</label>
        <div style={s.chipRow}>
          {([
            { value: 'cheapest', icon: <Lightning size={13} weight="fill" />, label: 'Immer günstigstes Modell' },
            { value: 'eu_only',  icon: <Globe size={13} weight="fill" />, label: 'Nur europäische Modelle' },
            { value: 'auto',     icon: <Robot size={13} weight="fill" />, label: 'Automatisch (empfohlen)' },
          ] as { value: ModelPref; icon: IconNode; label: string }[]).map((opt) => (
            <button
              key={opt.value}
              style={{ ...s.chip, ...(modelPref === opt.value ? s.chipActive : {}) }}
              onClick={() => setModelPref(opt.value)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {opt.icon}{opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.btnRow}>
        {isAdmin && (
          <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={onBack}>← Zurück</button>
        )}
        <button
          style={{ ...s.btnPrimary, ...(userName.trim() ? {} : s.btnDisabled) }}
          disabled={!userName.trim()}
          onClick={onNext}
        >
          Weiter →
        </button>
      </div>
    </div>
  )
}
