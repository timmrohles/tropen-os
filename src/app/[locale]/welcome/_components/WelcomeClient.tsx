'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { ArrowRight, CheckCircle } from '@phosphor-icons/react'

const STEPS = [
  {
    label: 'Was erwartet dich',
    content: <StepOne />,
  },
  {
    label: 'So funktioniert der Scan',
    content: <StepTwo />,
  },
  {
    label: 'Dein Feedback ist Gold',
    content: <StepThree />,
  },
]

export default function WelcomeClient() {
  const [step, setStep] = useState(0)
  const [completing, setCompleting] = useState(false)
  const router = useRouter()
  const isLast = step === STEPS.length - 1

  async function advance() {
    if (!isLast) {
      setStep(s => s + 1)
      return
    }
    setCompleting(true)
    try {
      await fetch('/api/beta/onboarding-complete', { method: 'POST' })
    } catch {
      // Fail-open — proceed anyway
    }
    router.push('/audit/scan')
  }

  return (
    <div style={s.wrap}>
      {/* Logo */}
      <div style={s.logoRow}>
        <span style={s.logoText}>Tropen OS</span>
        <span style={s.betaBadge}>Beta</span>
      </div>

      {/* Step indicators */}
      <div style={s.stepDots} aria-label="Fortschritt">
        {STEPS.map((st, i) => (
          <div
            key={i}
            style={{
              ...s.dot,
              ...(i === step ? s.dotActive : {}),
              ...(i < step ? s.dotDone : {}),
            }}
            aria-current={i === step ? 'step' : undefined}
          >
            {i < step ? <CheckCircle size={14} weight="fill" color="var(--accent)" /> : null}
          </div>
        ))}
      </div>

      {/* Step label */}
      <p style={s.stepLabel}>Schritt {step + 1} von {STEPS.length}</p>

      {/* Step content */}
      <div style={s.card}>
        {STEPS[step].content}
      </div>

      {/* CTA */}
      <button
        onClick={advance}
        disabled={completing}
        className="btn btn-primary"
        style={s.cta}
      >
        {completing ? 'Wird gestartet…' : isLast ? (
          <>Scan starten <ArrowRight size={15} weight="bold" aria-hidden="true" /></>
        ) : (
          <>Verstanden <ArrowRight size={15} weight="bold" aria-hidden="true" /></>
        )}
      </button>
    </div>
  )
}

// ── Step components ───────────────────────────────────────────────────────────

function StepOne() {
  return (
    <>
      <h1 style={s.h1}>Willkommen zur Tropen OS Beta.</h1>
      <p style={s.sub}>Du bekommst gleich einen Scan-Report für dein Projekt. Hier ist was die Zahlen bedeuten:</p>
      <div style={s.scoreGrid}>
        {[
          { color: 'var(--error)',  label: 'Prototype', range: '<60%',  desc: 'Nicht bereit für echte Nutzer' },
          { color: 'var(--status-risky)', label: 'Risky', range: '60–79%', desc: 'Bereit, aber mit bekannten Risiken' },
          { color: 'var(--accent)', label: 'Stable',    range: '80–89%', desc: 'Produktionsreif' },
          { color: 'var(--accent)', label: 'Production', range: '90%+',  desc: 'Industrie-Standard' },
        ].map(item => (
          <div key={item.label} style={s.scoreRow}>
            <div style={{ ...s.scoreDot, background: item.color }} aria-hidden="true" />
            <div>
              <span style={{ ...s.scoreLabel, color: item.color }}>{item.label}</span>
              <span style={s.scoreRange}> ({item.range})</span>
              <p style={s.scoreDesc}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p style={s.note}>
        Die meisten Lovable-Projekte starten bei 78–84%. Das ist normal. Wichtig ist nicht die Zahl —{' '}
        sondern was du als nächstes fixst.
      </p>
    </>
  )
}

function StepTwo() {
  const steps = [
    'Klicke "Audit starten"',
    'Wähle deinen Projekt-Ordner (kein Upload — alles lokal)',
    'Beantworte 4 kurze Fragen zu deinem Projekt',
    'Warte ~20 Sekunden',
    'Sieh deine Quick Wins',
  ]
  return (
    <>
      <h1 style={s.h1}>So funktioniert der Scan</h1>
      <div style={s.stepList}>
        {steps.map((step, i) => (
          <div key={i} style={s.stepItem}>
            <span style={s.stepNum}>{String(i + 1).padStart(2, '0')}</span>
            <span style={s.stepText}>{step}</span>
          </div>
        ))}
      </div>
      <p style={s.note}>
        Dein Code verlässt deinen Rechner nicht. Der Browser liest die Dateien lokal
        — nichts wird hochgeladen.
      </p>
    </>
  )
}

function StepThree() {
  return (
    <>
      <h1 style={s.h1}>Dein Feedback ist Gold.</h1>
      <p style={s.sub}>Du bist einer von 10 Beta-Testern.</p>
      <div style={s.feedbackList}>
        {[
          'Welche Findings sind für dich relevant?',
          'Welche ergeben keinen Sinn?',
          'Was fehlt?',
        ].map((item, i) => (
          <div key={i} style={s.feedbackItem}>
            <span style={s.feedbackDot} aria-hidden="true">·</span>
            <span style={s.feedbackText}>{item}</span>
          </div>
        ))}
      </div>
      <p style={s.note}>
        Nach deinem ersten Scan erscheint ein Feedback-Button unten rechts.
        Bitte nutze ihn — auch für kleine Dinge.
      </p>
    </>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 36,
  },
  logoText: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  betaBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'var(--accent-light)',
    borderRadius: 4,
    padding: '2px 6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  stepDots: {
    display: 'flex',
    gap: 8,
    marginBottom: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: 'var(--border)',
    border: '2px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  dotActive: {
    background: 'var(--accent)',
    borderColor: 'var(--accent)',
    width: 28,
    borderRadius: 5,
  },
  dotDone: {
    background: 'transparent',
    borderColor: 'var(--accent)',
    width: 18,
    height: 18,
  },
  stepLabel: {
    fontSize: 12,
    color: 'var(--text-tertiary)',
    margin: '0 0 20px',
    fontFamily: 'var(--font-mono, monospace)',
  },
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '24px',
    marginBottom: 20,
    flex: 1,
  },
  h1: {
    fontSize: 'clamp(18px, 4vw, 24px)',
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: '0 0 12px',
    lineHeight: 1.3,
  },
  sub: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    margin: '0 0 16px',
    lineHeight: 1.6,
  },
  note: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
    margin: '16px 0 0',
    lineHeight: 1.5,
    borderTop: '1px solid var(--border)',
    paddingTop: 14,
  },
  scoreGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  scoreRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  scoreDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: 4,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: 700,
  },
  scoreRange: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
  },
  scoreDesc: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    margin: '2px 0 0',
  },
  stepList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  stepItem: {
    display: 'flex',
    gap: 14,
    alignItems: 'baseline',
  },
  stepNum: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-tertiary)',
    minWidth: 24,
    flexShrink: 0,
    fontFamily: 'var(--font-mono, monospace)',
  },
  stepText: {
    fontSize: 14,
    color: 'var(--text-primary)',
    lineHeight: 1.5,
  },
  feedbackList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  feedbackItem: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  feedbackDot: {
    fontSize: 18,
    color: 'var(--accent)',
    lineHeight: 1.3,
    flexShrink: 0,
  },
  feedbackText: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  cta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
}
