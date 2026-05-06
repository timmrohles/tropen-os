'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle, X } from '@phosphor-icons/react'
import { PROFILE_LABELS, GEO_SCOPE_LABELS, DEFAULT_PROFILE } from '@/lib/audit/project-profiles-shared'
import type { ProfileType, GeoScope, ScanProjectProfile } from '@/lib/audit/project-profiles-shared'

type Step = 'profile' | 'wizard' | 'geo' | 'privacy' | 'ai' | 'ecommerce' | 'submitting'

// Wizard-State: speichert Antworten um zum Profil zu leiten
interface WizardState {
  q1?: boolean  // Öffentlich zugänglich?
  q2?: boolean  // Login?
  q3?: boolean  // Daten über Login hinaus?
  q4?: boolean  // Sensible Daten?
}

interface ProfileDraft {
  profileType: ProfileType | null
  geoScope: GeoScope | null
  hasUserData: boolean | null
  hasAi: boolean | null         // null = geskippt
  hasEcommerce: boolean | null  // null = geskippt
}

interface Props {
  scanProjectId: string
  isExistingProject?: boolean
  initialProfile?: ScanProjectProfile | null
  mode?: 'onboarding' | 'edit'
  onClose: () => void
  onComplete: () => void
}

export function ProfileOnboardingModal({ scanProjectId, isExistingProject, initialProfile, mode = 'onboarding', onClose, onComplete }: Props) {
  const isEdit = mode === 'edit'
  const [step, setStep] = useState<Step>('profile')
  const [wizard, setWizard] = useState<WizardState>({})
  const [draft, setDraft] = useState<ProfileDraft>(() => {
    if (initialProfile) {
      return {
        profileType: initialProfile.profile_type,
        geoScope: initialProfile.geo_scope,
        hasUserData: initialProfile.has_user_data,
        hasAi: initialProfile.has_ai,
        hasEcommerce: initialProfile.has_ecommerce,
      }
    }
    return {
      profileType: isExistingProject ? DEFAULT_PROFILE.profileType : null,
      geoScope: isExistingProject ? DEFAULT_PROFILE.geoScope : null,
      hasUserData: isExistingProject ? DEFAULT_PROFILE.hasUserData : null,
      hasAi: null,
      hasEcommerce: null,
    }
  })
  const [error, setError] = useState<string | null>(null)

  const profileTypes: ProfileType[] = ['solo', 'internal', 'public', 'b2c', 'b2b_regulated']
  const geoScopes: GeoScope[] = ['eu', 'global', 'non_eu', 'none']

  function resolveWizardProfile(w: WizardState): ProfileType | null {
    if (w.q1 === false) {
      if (w.q2 === false) return 'solo'
      if (w.q2 === true) return 'internal'
      return null
    }
    if (w.q1 === true) {
      if (w.q2 === false) return 'public'
      if (w.q2 === true) {
        if (w.q3 === false) return 'public'
        if (w.q3 === true) {
          if (w.q4 === false) return 'b2c'
          if (w.q4 === true) return 'b2b_regulated'
        }
      }
    }
    return null
  }

  function handleWizardAnswer(question: keyof WizardState, answer: boolean) {
    const next = { ...wizard, [question]: answer }
    setWizard(next)
    const resolved = resolveWizardProfile(next)
    if (resolved) {
      setDraft((d) => ({ ...d, profileType: resolved }))
      setStep('profile') // zurück zur Card-View, jetzt vorausgewählt
    }
  }

  async function handleSubmit() {
    if (!draft.profileType || !draft.geoScope || draft.hasUserData === null) return
    setStep('submitting')
    setError(null)
    try {
      const res = await fetch(`/api/projects/${scanProjectId}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileType: draft.profileType,
          geoScope: draft.geoScope,
          hasUserData: draft.hasUserData,
          hasAi: draft.hasAi,
          hasEcommerce: draft.hasEcommerce,
        }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      onComplete()
    } catch {
      setError('Etwas ist schiefgegangen — bitte erneut versuchen.')
      setStep('ecommerce')
    }
  }

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 200, padding: 16 }}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Projekt-Profil ändern' : 'Projekt-Profil einrichten'}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginBottom: 4, letterSpacing: '0.05em' }}>
              {isEdit ? 'PROFIL ÄNDERN' : 'PROFIL EINRICHTEN'}
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {isEdit ? 'Welches Profil passt jetzt?' : (isExistingProject ? 'Profil prüfen' : 'Welche Art App baust du?')}
            </h2>
            {isEdit && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, marginBottom: 0 }}>
                Änderungen speichern wenn Killer-Findings nicht zu eurem Projekt passen.
              </p>
            )}
            {!isEdit && isExistingProject && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, marginBottom: 0 }}>
                Wir haben ein paar Annahmen für dich getroffen. Bitte prüfe, ob das stimmt.
              </p>
            )}
          </div>
          <button className="btn-icon" aria-label="Schließen" onClick={onClose}>
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* STEP: profile */}
        {step === 'profile' && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Das hilft uns einzuschätzen, welche Regeln für dein Projekt wirklich wichtig sind.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {profileTypes.map((pt) => {
                const label = PROFILE_LABELS[pt]
                const isSelected = draft.profileType === pt
                return (
                  <button
                    key={pt}
                    onClick={() => setDraft((d) => ({ ...d, profileType: pt }))}
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
              onClick={() => { setWizard({}); setStep('wizard') }}
              style={{ fontSize: 12, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, padding: 0 }}
            >
              Unsicher? Hilf mir wählen →
            </button>
            <StepNav
              onNext={() => setStep('geo')}
              nextDisabled={!draft.profileType}
              nextLabel="Weiter"
            />
          </div>
        )}

        {/* STEP: wizard */}
        {step === 'wizard' && (
          <WizardView
            wizard={wizard}
            onAnswer={handleWizardAnswer}
            onBack={() => setStep('profile')}
          />
        )}

        {/* STEP: geo */}
        {step === 'geo' && (
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
                const isSelected = draft.geoScope === gs
                return (
                  <button
                    key={gs}
                    onClick={() => setDraft((d) => ({ ...d, geoScope: gs }))}
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
              onBack={() => setStep('profile')}
              onNext={() => setStep('privacy')}
              nextDisabled={!draft.geoScope}
            />
          </div>
        )}

        {/* STEP: privacy */}
        {step === 'privacy' && (
          <YesNoStep
            question="Sammelt ihr Namen, E-Mails oder andere User-Daten?"
            hint="Auch ein Login mit E-Mail zählt — wenn User sich anmelden können, sammelt ihr in der Regel User-Daten."
            value={draft.hasUserData}
            onChange={(v) => setDraft((d) => ({ ...d, hasUserData: v }))}
            onBack={() => setStep('geo')}
            onNext={() => setStep('ai')}
            nextDisabled={draft.hasUserData === null}
          />
        )}

        {/* STEP: ai */}
        {step === 'ai' && (
          <YesNoStep
            question="Nutzt eure App KI? Zum Beispiel einen Chatbot, Bildgenerierung oder Empfehlungen?"
            hint="Auch wenn ihr eine fremde KI-API einbindet (OpenAI, Anthropic, etc.) zählt das."
            value={draft.hasAi}
            onChange={(v) => setDraft((d) => ({ ...d, hasAi: v }))}
            onBack={() => setStep('privacy')}
            onNext={() => setStep('ecommerce')}
            canSkip
            onSkip={() => { setDraft((d) => ({ ...d, hasAi: null })); setStep('ecommerce') }}
          />
        )}

        {/* STEP: ecommerce */}
        {step === 'ecommerce' && (
          <div>
            <YesNoStep
              question="Verkauft eure App etwas? Produkte, Abos, oder digitale Inhalte?"
              hint="Auch ein Stripe-Checkout für ein €5/Monat Abo zählt als Verkauf."
              value={draft.hasEcommerce}
              onChange={(v) => setDraft((d) => ({ ...d, hasEcommerce: v }))}
              onBack={() => setStep('ai')}
              onNext={handleSubmit}
              nextLabel={isEdit ? 'Änderungen speichern' : 'Fertig — Audit starten'}
              nextDisabled={false}
              canSkip
              onSkip={() => { setDraft((d) => ({ ...d, hasEcommerce: null })); void handleSubmit() }}
            />
            {error && (
              <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 8 }}>{error}</p>
            )}
          </div>
        )}

        {/* STEP: submitting */}
        {step === 'submitting' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Profil wird gespeichert…</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Wizard ─────────────────────────────────────────────────────────────────────

function WizardView({
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

function YesNoStep({
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

function StepNav({
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
