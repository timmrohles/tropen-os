'use client'

import { ArrowLeft, ArrowRight, CheckCircle } from '@phosphor-icons/react'
import { PROFILE_LABELS, GEO_SCOPE_LABELS } from '@/lib/audit/project-profiles-shared'
import type { ProfileType, GeoScope } from '@/lib/audit/project-profiles-shared'

// ── Wizard-State type (mirrored from modal) ────────────────────────────────────

interface WizardState {
  q1?: boolean
  q2?: boolean
  q3?: boolean
  q4?: boolean
}

// ── Step: Profile selection ────────────────────────────────────────────────────

export function ProfileStep({
  profileTypes,
  selectedProfile,
  onSelect,
  onStartWizard,
  onNext,
}: {
  profileTypes: ProfileType[]
  selectedProfile: ProfileType | null
  onSelect: (pt: ProfileType) => void
  onStartWizard: () => void
  onNext: () => void
}) {
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Das hilft uns einzuschätzen, welche Regeln für dein Projekt wirklich wichtig sind.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {profileTypes.map((pt) => {
          const label = PROFILE_LABELS[pt]
          const isSelected = selectedProfile === pt
          return (
            <button
              key={pt}
              onClick={() => onSelect(pt)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                padding: '12px 14px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                border: isSelected ? '2px solid var(--teal)' : '1px solid var(--border)',
                background: isSelected ? 'var(--teal-light)' : 'var(--bg-surface)',
                transition: 'border-color 150ms, background 150ms',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                {label.name}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {label.description}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                Beispiele: {label.examples}
              </span>
            </button>
          )
        })}
      </div>
      <button
        onClick={onStartWizard}
        style={{ fontSize: 12, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, padding: 0 }}
      >
        Unsicher? Hilf mir wählen →
      </button>
      <StepNav
        onNext={onNext}
        nextDisabled={!selectedProfile}
        nextLabel="Weiter"
      />
    </div>
  )
}

// ── Step: Geo scope selection ──────────────────────────────────────────────────

export function GeoStep({
  geoScopes,
  selectedGeo,
  onSelect,
  onBack,
  onNext,
}: {
  geoScopes: GeoScope[]
  selectedGeo: GeoScope | null
  onSelect: (gs: GeoScope) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        Wo werden eure Nutzer hauptsächlich sein?
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Das beeinflusst, welche Datenschutz-Gesetze gelten (DSGVO, CCPA, etc.).
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {geoScopes.map((gs) => {
          const label = GEO_SCOPE_LABELS[gs]
          const isSelected = selectedGeo === gs
          return (
            <button
              key={gs}
              onClick={() => onSelect(gs)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                border: isSelected ? '2px solid var(--teal)' : '1px solid var(--border)',
                background: isSelected ? 'var(--teal-light)' : 'var(--bg-surface)',
                transition: 'border-color 150ms, background 150ms',
              }}
            >
              <span style={{ fontSize: 20 }}>{label.flag}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                {label.label}
              </span>
              {isSelected && <CheckCircle size={16} color="var(--teal)" weight="fill" style={{ marginLeft: 'auto' }} aria-hidden="true" />}
            </button>
          )
        })}
      </div>
      <StepNav
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!selectedGeo}
      />
    </div>
  )
}

// ── Wizard ─────────────────────────────────────────────────────────────────────

export function WizardView({
  wizard,
  onAnswer,
  onBack,
}: {
  wizard: WizardState
  onAnswer: (q: keyof WizardState, a: boolean) => void
  onBack: () => void
}) {
  const q = wizard.q1 === undefined ? 'q1'
    : wizard.q1 === false && wizard.q2 === undefined ? 'q2a'
    : wizard.q1 === true && wizard.q2 === undefined ? 'q2b'
    : wizard.q1 === true && wizard.q2 === true && wizard.q3 === undefined ? 'q3'
    : wizard.q1 === true && wizard.q2 === true && wizard.q3 === true && wizard.q4 === undefined ? 'q4'
    : 'done'

  const QUESTIONS: Record<string, string> = {
    q1: 'Können sich beliebige Personen aus dem Internet bei eurer App anmelden oder sie nutzen?',
    q2a: 'Hat die App ein User-Login?',
    q2b: 'Hat die App ein User-Login?',
    q3: 'Speichert die App User-Daten über das Login hinaus — zum Beispiel Bilder, Posts oder Profile?',
    q4: 'Verarbeitet ihr besonders sensible Daten? Zum Beispiel Gesundheit, Finanzen oder Kinder.',
  }

  const question = QUESTIONS[q] ?? 'Profil wird ermittelt…'

  return (
    <div>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
        {question}
      </p>
      {q !== 'done' && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={() => onAnswer(
              q === 'q2a' || q === 'q2b' ? 'q2' : q === 'q3' ? 'q3' : q === 'q4' ? 'q4' : 'q1',
              true,
            )}
            style={{ flex: 1, fontSize: 14 }}
          >
            Ja
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => onAnswer(
              q === 'q2a' || q === 'q2b' ? 'q2' : q === 'q3' ? 'q3' : q === 'q4' ? 'q4' : 'q1',
              false,
            )}
            style={{ flex: 1, fontSize: 14 }}
          >
            Nein
          </button>
        </div>
      )}
      <button
        onClick={onBack}
        style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <ArrowLeft size={12} weight="bold" /> Zurück zur Auswahl
      </button>
    </div>
  )
}

// ── Shared: Ja/Nein-Step ───────────────────────────────────────────────────────

export function YesNoStep({
  question, hint, value, onChange, onBack, onNext, nextLabel,
  nextDisabled, canSkip, onSkip,
}: {
  question: string
  hint?: string
  value: boolean | null
  onChange: (v: boolean) => void
  onBack: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  canSkip?: boolean
  onSkip?: () => void
}) {
  return (
    <div>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        {question}
      </p>
      {hint && (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
          {hint}
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          className="btn"
          onClick={() => onChange(true)}
          style={{
            flex: 1, fontSize: 14,
            border: value === true ? '2px solid var(--teal)' : '1px solid var(--border)',
            background: value === true ? 'var(--teal-light)' : 'var(--bg-surface)',
            borderRadius: 8,
          }}
        >
          Ja
        </button>
        <button
          className="btn"
          onClick={() => onChange(false)}
          style={{
            flex: 1, fontSize: 14,
            border: value === false ? '2px solid var(--teal)' : '1px solid var(--border)',
            background: value === false ? 'var(--teal-light)' : 'var(--bg-surface)',
            borderRadius: 8,
          }}
        >
          Nein
        </button>
      </div>
      <StepNav
        onBack={onBack}
        onNext={onNext}
        nextDisabled={nextDisabled ?? value === null}
        nextLabel={nextLabel}
      />
      {canSkip && onSkip && (
        <button
          onClick={onSkip}
          style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, padding: 0 }}
        >
          Überspringen — bin unsicher
        </button>
      )}
    </div>
  )
}

// ── Shared: Step-Navigation ────────────────────────────────────────────────────

export function StepNav({
  onBack, onNext, nextDisabled, nextLabel,
}: {
  onBack?: () => void
  onNext: () => void
  nextDisabled?: boolean
  nextLabel?: string
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, gap: 10 }}>
      {onBack ? (
        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          <ArrowLeft size={14} weight="bold" aria-hidden="true" /> Zurück
        </button>
      ) : <span />}
      <button
        className="btn btn-primary"
        onClick={onNext}
        disabled={nextDisabled}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: nextDisabled ? 0.5 : 1 }}
      >
        {nextLabel ?? 'Weiter'} <ArrowRight size={14} weight="bold" aria-hidden="true" />
      </button>
    </div>
  )
}
