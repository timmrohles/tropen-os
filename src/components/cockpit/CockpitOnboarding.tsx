'use client'

import { useState } from 'react'
import type { ElementType } from 'react'
import {
  Buildings, Megaphone, Handshake, GearSix, ChartBar, PencilSimple,
} from '@phosphor-icons/react'
import { ToroBird } from '@/components/ui/ToroBird'
import { useAssistantName } from '@/hooks/useAssistantName'
import { ROLE_PRESET_WIDGETS, WIDGET_CATALOG } from '@/lib/cockpit/widgetCatalog'

type RoleKey = 'ceo' | 'marketing' | 'sales' | 'operations' | 'analyst' | 'custom'

const ROLE_DISPLAY: Record<RoleKey, { label: string; icon: ElementType }> = {
  ceo:        { label: 'Geschäftsführung', icon: Buildings    },
  marketing:  { label: 'Marketing',        icon: Megaphone    },
  sales:      { label: 'Vertrieb',         icon: Handshake    },
  operations: { label: 'Operations',       icon: GearSix      },
  analyst:    { label: 'Analyse',          icon: ChartBar     },
  custom:     { label: 'Selbst wählen',    icon: PencilSimple },
}

interface Props {
  onComplete: (role: string) => void
  loading?: boolean
}

export function CockpitOnboarding({ onComplete, loading }: Props) {
  const [step, setStep] = useState<'role' | 'preview'>('role')
  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(null)
  const assistantName = useAssistantName()

  function handleRoleClick(key: RoleKey) {
    setSelectedRole(key)
    if (key === 'custom') {
      onComplete('custom')
    } else {
      setStep('preview')
    }
  }

  const previewWidgets = selectedRole && selectedRole !== 'custom'
    ? (ROLE_PRESET_WIDGETS[selectedRole] ?? []).map(type =>
        WIDGET_CATALOG.find(w => w.type === type)?.label ?? type
      )
    : []

  return (
    <div className="cockpit-onboarding">
      <div className="cockpit-onboarding-toro" aria-hidden="true">
        <ToroBird size={64} />
      </div>

      {step === 'role' && (
        <>
          <h2 className="cockpit-onboarding-title">
            Lass uns dein Cockpit einrichten.
          </h2>
          <p className="cockpit-onboarding-sub">
            Was beschreibt deine Rolle am besten?
          </p>
          <div className="cockpit-role-grid">
            {(Object.keys(ROLE_DISPLAY) as RoleKey[]).map(key => {
              const preset = ROLE_DISPLAY[key]
              const Icon = preset.icon
              return (
                <button
                  key={key}
                  className={`cockpit-role-btn${selectedRole === key ? ' cockpit-role-btn--active' : ''}`}
                  onClick={() => handleRoleClick(key)}
                  disabled={loading}
                >
                  <Icon size={24} weight="bold" aria-hidden="true" />
                  <span>{preset.label}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {step === 'preview' && selectedRole && selectedRole !== 'custom' && (
        <>
          <h2 className="cockpit-onboarding-title">
            Passt das für {ROLE_DISPLAY[selectedRole].label}?
          </h2>
          <p className="cockpit-onboarding-sub">
            {assistantName} empfiehlt diese Widgets:
          </p>
          <div className="cockpit-preview-widgets">
            {previewWidgets.map(label => (
              <span key={label} className="chip">{label}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => onComplete(selectedRole)}
              disabled={loading}
            >
              {loading ? 'Wird eingerichtet…' : 'Cockpit einrichten'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setStep('role')}
              disabled={loading}
            >
              Andere Rolle
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => onComplete('custom')}
              disabled={loading}
            >
              Selbst wählen
            </button>
          </div>
        </>
      )}
    </div>
  )
}
