'use client'

import { useState } from 'react'
import Parrot from '@/components/Parrot'
import { s } from './onboarding.styles'

interface StepAiActProps {
  isAdmin: boolean
  guideName: string
  aiActAcknowledged: boolean
  setAiActAcknowledged: (v: boolean) => void
  error: string
  onBack: () => void
  onNext: () => void
}

export default function StepAiAct({
  isAdmin, guideName,
  aiActAcknowledged, setAiActAcknowledged,
  error, onBack, onNext,
}: StepAiActProps) {
  const [aiActExpanded, setAiActExpanded] = useState(false)

  return (
    <div style={s.step}>
      <div style={s.stepLabel}>{isAdmin ? 'Schritt 4 von 5' : 'Schritt 2 von 3'}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Parrot size={36} />
        <h1 style={{ ...s.h1, margin: 0, fontSize: 26 }}>Kurz bevor es losgeht.</h1>
      </div>

      <p style={s.aiActPara}>
        Der EU AI Act verpflichtet Unternehmen und ihre Mitarbeitenden dazu, im beruflichen
        Kontext über grundlegende KI-Kompetenzen zu verfügen.
      </p>
      <p style={s.aiActPara}>
        Was das bedeutet: Wer KI beruflich nutzt, sollte verstehen wie sie funktioniert,
        wo ihre Grenzen liegen und wie man verantwortungsvoll mit ihr umgeht.
      </p>
      <p style={{ ...s.aiActPara, marginBottom: 28 }}>
        Tropen OS ist ein Werkzeug – {guideName || 'Toro'} ist dein Guide.
        Aber das Steuer liegt bei dir.
      </p>

      {/* Pflicht-Checkbox */}
      <label style={s.checkboxLabel}>
        <input
          type="checkbox"
          style={s.checkbox}
          checked={aiActAcknowledged}
          onChange={(e) => setAiActAcknowledged(e.target.checked)}
        />
        <span style={s.checkboxText}>
          Ich habe verstanden, dass ich als berufliche/r Nutzer/in verpflichtet bin,
          KI-Grundkompetenzen zu erwerben oder weiterzuentwickeln.
        </span>
      </label>

      {/* Academy Card */}
      <div style={s.academyCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }}>🌿</span>
          <span style={s.academyTitle}>KI-Kompetenzen aufbauen – mit den Tropen</span>
        </div>
        <p style={s.academyText}>
          Tropen bietet Kurse und Zertifizierungen für verantwortungsvolle KI-Nutzung
          im Berufsalltag.
        </p>
        <p style={{ ...s.academyText, marginBottom: 12 }}>
          Unser Einstiegskurs:{' '}
          <strong style={{ color: 'var(--text-primary)' }}>&bdquo;KI-Dschungel Survival Pass&ldquo;</strong>
          {' '}– für alle die KI sicher, effektiv und verantwortungsvoll einsetzen wollen.
        </p>
        <a
          href="https://tropen.de/academy"
          target="_blank"
          rel="noopener noreferrer"
          style={s.academyLink}
        >Mehr erfahren →</a>
      </div>

      {/* EU AI Act Accordion */}
      <div style={s.accordionWrap}>
        <button
          style={s.accordionBtn}
          onClick={() => setAiActExpanded((v) => !v)}
        >
          Was ist der EU AI Act? {aiActExpanded ? '▴' : '▾'}
        </button>
        {aiActExpanded && (
          <div style={s.accordionBody}>
            Der EU AI Act (in Kraft seit 2024) ist die erste umfassende KI-Regulierung
            weltweit. Artikel 4 verpflichtet Unternehmen sicherzustellen, dass ihr Personal
            über ausreichende KI-Kompetenz verfügt.
          </div>
        )}
      </div>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.btnRow}>
        <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={onBack}>← Zurück</button>
        <button
          style={{ ...s.btnPrimary, ...(aiActAcknowledged ? {} : s.btnDisabled) }}
          disabled={!aiActAcknowledged}
          onClick={onNext}
        >
          Weiter →
        </button>
      </div>
    </div>
  )
}
