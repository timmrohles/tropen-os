'use client'

import { User, Users, Buildings } from '@phosphor-icons/react'
import type { TeamSize, IconNode } from './onboarding.types'
import { s } from './onboarding.styles'

interface StepTeamProps {
  orgName: string
  teamSize: TeamSize | null
  setTeamSize: (v: TeamSize) => void
  inviteEmails: string[]
  setInviteEmails: (v: string[]) => void
  error: string
  onBack: () => void
  onNext: () => void
}

export default function StepTeam({
  orgName, teamSize, setTeamSize,
  inviteEmails, setInviteEmails,
  error, onBack, onNext,
}: StepTeamProps) {
  return (
    <div style={s.step}>
      <div style={s.stepLabel}>Schritt 2 von 5</div>
      <h1 style={s.h1}>Wie nutzt du {orgName || 'das Department'}?</h1>
      <p style={s.sub}>Das hilft uns, das Department optimal einzurichten.</p>

      <div style={s.cardRow}>
        {([
          { value: 'solo',  icon: <User size={24} weight="fill" />, title: 'Nur ich',       sub: 'Solo-Nutzung' },
          { value: 'small', icon: <Users size={24} weight="fill" />, title: 'Kleines Team',   sub: '2–10 Personen' },
          { value: 'large', icon: <Buildings size={24} weight="fill" />, title: 'Größeres Team',  sub: '10+ Personen' },
        ] as { value: TeamSize; icon: IconNode; title: string; sub: string }[]).map((opt) => (
          <button
            key={opt.value}
            style={{ ...s.card, ...(teamSize === opt.value ? s.cardActive : {}) }}
            onClick={() => setTeamSize(opt.value)}
          >
            <span style={s.cardEmoji}>{opt.icon}</span>
            <span style={s.cardTitle}>{opt.title}</span>
            <span style={s.cardSub}>{opt.sub}</span>
          </button>
        ))}
      </div>

      {teamSize && teamSize !== 'solo' && (
        <div style={{ ...s.field, marginTop: 28 }}>
          <label style={s.label}>Erste Teammitglieder einladen (optional)</label>
          {inviteEmails.map((email, i) => (
            <input
              key={i}
              style={{ ...s.input, marginBottom: 8 }}
              placeholder={`Email ${i + 1}`}
              type="email"
              value={email}
              onChange={(e) => {
                const next = [...inviteEmails]
                next[i] = e.target.value
                setInviteEmails(next)
              }}
            />
          ))}
          <span style={s.hint}>Einladungen werden nach Abschluss des Onboardings versendet.</span>
        </div>
      )}

      {error && <div style={s.error}>{error}</div>}

      <div style={s.btnRow}>
        <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={onBack}>← Zurück</button>
        <button
          style={{ ...s.btnPrimary, ...(teamSize === null ? s.btnDisabled : {}) }}
          disabled={teamSize === null}
          onClick={onNext}
        >
          {inviteEmails.some((e) => e.trim() && e.includes('@'))
            ? 'Einladen & Weiter →'
            : 'Weiter →'}
        </button>
      </div>
    </div>
  )
}
