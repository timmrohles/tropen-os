'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, Check } from '@phosphor-icons/react'

interface ProfileOnboardingProps {
  onComplete: (profile: {
    app_type: string
    user_location: string
    features: string[]
  }) => void
  detectedFeatures?: string[]
}

const APP_TYPES = ['portfolio', 'saas', 'ecommerce', 'blog', 'mobile'] as const
const LOCATIONS = ['de', 'eu', 'global', 'internal'] as const
const FEATURES = ['login', 'payment', 'ai', 'affiliate', 'ugc'] as const

type AppType = (typeof APP_TYPES)[number]
type Location = (typeof LOCATIONS)[number]
type Feature = (typeof FEATURES)[number]

const APP_TYPE_KEYS: Record<AppType, string> = {
  portfolio: 'profileOptPortfolio',
  saas: 'profileOptSaas',
  ecommerce: 'profileOptEcommerce',
  blog: 'profileOptBlog',
  mobile: 'profileOptMobile',
}
const LOCATION_KEYS: Record<Location, string> = {
  de: 'profileOptDE',
  eu: 'profileOptEU',
  global: 'profileOptGlobal',
  internal: 'profileOptInternal',
}
const FEATURE_KEYS: Record<Feature, string> = {
  login: 'profileOptLogin',
  payment: 'profileOptPayment',
  ai: 'profileOptAI',
  affiliate: 'profileOptAffiliate',
  ugc: 'profileOptUGC',
}

export default function ProfileOnboarding({ onComplete, detectedFeatures }: ProfileOnboardingProps) {
  const t = useTranslations('audit')

  const [step, setStep] = useState(1)
  const [appType, setAppType] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [features, setFeatures] = useState<string[]>(() =>
    detectedFeatures?.filter((f) => FEATURES.includes(f as Feature)) ?? []
  )

  const toggleFeature = useCallback((f: string) => {
    setFeatures((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f])
  }, [])

  const handleNext = () => {
    if (step < 3) { setStep(step + 1); return }
    onComplete({ app_type: appType, user_location: location, features })
  }

  const titles = [t('profileStep1Title'), t('profileStep2Title'), t('profileStep3Title')]
  const canProceed = step === 1 ? appType !== '' : step === 2 ? location !== '' : features.length > 0

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Step indicator */}
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'block', marginBottom: 16 }}>
        {t('profileStepOf', { current: step, total: 3 })}
      </span>

      {/* Question */}
      <h3 style={{
        fontSize: 16, fontWeight: 600, color: 'var(--text-primary)',
        margin: '0 0 16px',
      }}>
        {titles[step - 1]}
      </h3>

      {/* Step 1: App type */}
      {step === 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {APP_TYPES.map((key) => (
            <button
              key={key}
              className={`chip${appType === key ? ' chip--active' : ''}`}
              onClick={() => setAppType(key)}
            >
              {t(APP_TYPE_KEYS[key])}
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Location */}
      {step === 2 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {LOCATIONS.map((key) => (
            <button
              key={key}
              className={`chip${location === key ? ' chip--active' : ''}`}
              onClick={() => setLocation(key)}
            >
              {t(LOCATION_KEYS[key])}
            </button>
          ))}
        </div>
      )}

      {/* Step 3: Features (multi-select) */}
      {step === 3 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FEATURES.map((key) => (
            <button
              key={key}
              className={`chip${features.includes(key) ? ' chip--active' : ''}`}
              onClick={() => toggleFeature(key)}
            >
              {t(FEATURE_KEYS[key])}
            </button>
          ))}
        </div>
      )}

      {/* Next / Done button */}
      <div style={{ marginTop: 20 }}>
        <button
          className="btn btn-primary"
          disabled={!canProceed}
          onClick={handleNext}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {step < 3 ? (
            <>{t('profileNext')} <ArrowRight size={14} weight="bold" aria-hidden="true" /></>
          ) : (
            <>{t('profileDone')} <Check size={14} weight="bold" aria-hidden="true" /></>
          )}
        </button>
      </div>
    </div>
  )
}
