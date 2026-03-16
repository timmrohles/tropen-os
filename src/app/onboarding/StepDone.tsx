'use client'

import { ChatCircle, ChartBar, Scales } from '@phosphor-icons/react'
import Parrot from '@/components/Parrot'
import { s } from './onboarding.styles'

interface StepDoneProps {
  isAdmin: boolean
  orgName: string
  userName: string
  guideName: string
  error: string
  saving: boolean
  onFinish: () => void
  onBack: () => void
}

export default function StepDone({
  isAdmin, orgName, userName, guideName,
  error, saving, onFinish, onBack,
}: StepDoneProps) {
  return (
    <div style={{ ...s.step, alignItems: 'center', textAlign: 'center' }}>
      <div style={s.stepLabel}>{isAdmin ? 'Schritt 5 von 5' : 'Schritt 3 von 3'}</div>

      <Parrot size={80} />

      <h1 style={{ ...s.h1, marginTop: 20 }}>
        Willkommen bei {orgName || 'Tropen OS'}
        {userName ? `, ${userName.split(' ')[0]}!` : '!'}
      </h1>
      <p style={s.sub}>
        <strong style={{ color: 'var(--text-primary)' }}>{guideName || 'Toro'}</strong>{' '}
        freut sich darauf, euch durch den Informationsdschungel zu führen.
      </p>

      <div style={s.featureRow}>
        {[
          { icon: <ChatCircle size={26} weight="fill" style={{ color: 'var(--accent)' }} />, title: 'Departments',    sub: 'Team-Chats & Projekte' },
          { icon: <ChartBar size={26} weight="fill" style={{ color: 'var(--accent)' }} />, title: 'Dashboard',      sub: 'Kosten & Nutzung' },
          { icon: <Scales size={26} weight="fill" style={{ color: 'var(--accent)' }} />, title: 'Responsible AI', sub: 'Transparenz & Kontrolle' },
        ].map((f) => (
          <div key={f.title} style={s.featureCard}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.icon}</span>
            <span style={s.featureTitle}>{f.title}</span>
            <span style={s.featureSub}>{f.sub}</span>
          </div>
        ))}
      </div>

      {error && <div style={s.error}>{error}</div>}

      <button
        style={{ ...s.btnPrimary, marginTop: 28, minWidth: 220 }}
        onClick={onFinish}
        disabled={saving}
      >
        {saving ? 'Wird gespeichert…' : 'Ersten Chat starten →'}
      </button>

      <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={onBack}>
        ← Zurück
      </button>
    </div>
  )
}
