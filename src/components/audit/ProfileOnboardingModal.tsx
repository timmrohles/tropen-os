'use client'

import { useState } from 'react'
import { X } from '@phosphor-icons/react'
import { DEFAULT_PROFILE } from '@/lib/audit/project-profiles-shared'
import type { ProfileType, GeoScope, ScanProjectProfile } from '@/lib/audit/project-profiles-shared'
import {
  ProfileStep,
  GeoStep,
  WizardView,
  YesNoStep,
} from './ProfileOnboardingSteps'

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
          <ProfileStep
            profileTypes={profileTypes}
            selectedProfile={draft.profileType}
            onSelect={(pt) => setDraft((d) => ({ ...d, profileType: pt }))}
            onStartWizard={() => { setWizard({}); setStep('wizard') }}
            onNext={() => setStep('geo')}
          />
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
          <GeoStep
            geoScopes={geoScopes}
            selectedGeo={draft.geoScope}
            onSelect={(gs) => setDraft((d) => ({ ...d, geoScope: gs }))}
            onBack={() => setStep('profile')}
            onNext={() => setStep('privacy')}
          />
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
