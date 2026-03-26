'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Circle } from '@phosphor-icons/react'

interface OrgStats {
  totalChats: number
  totalProjects: number
  totalFeeds: number
  totalArtifacts: number
  hasContext: boolean
}

const STEPS = [
  {
    id: 'first_chat',
    label: 'Ersten Chat gestartet',
    check: (s: OrgStats) => s.totalChats > 0,
    href: '/chat',
    cta: 'Chat starten',
  },
  {
    id: 'first_project',
    label: 'Erstes Projekt angelegt',
    check: (s: OrgStats) => s.totalProjects > 0,
    href: '/projekte',
    cta: 'Projekt anlegen',
  },
  {
    id: 'first_feed',
    label: 'Ersten Feed eingerichtet',
    check: (s: OrgStats) => s.totalFeeds > 0,
    href: '/feeds',
    cta: 'Feed einrichten',
  },
  {
    id: 'first_artifact',
    label: 'Erstes Artefakt gespeichert',
    check: (s: OrgStats) => s.totalArtifacts > 0,
    href: '/chat',
    cta: 'Artefakt erstellen',
  },
  {
    id: 'toro_context',
    label: 'KI-Kontext hinterlegt',
    check: (s: OrgStats) => s.hasContext,
    href: '/settings#ki-context',
    cta: 'Kontext hinzufügen',
  },
]

export function OrgOnboardingProgress() {
  const [stats, setStats] = useState<OrgStats | null>(null)

  useEffect(() => {
    fetch('/api/home/org-stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
  }, [])

  if (!stats) return null

  const steps = STEPS.map(step => ({ ...step, done: step.check(stats) }))
  const doneCount = steps.filter(s => s.done).length

  // Hide when all done
  if (doneCount === steps.length) return null

  const nextStep = steps.find(s => !s.done)

  return (
    <div style={{
      marginTop: 24,
      padding: 16,
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          Einrichtung
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          {doneCount}/{steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}
        role="progressbar"
        aria-valuenow={doneCount}
        aria-valuemin={0}
        aria-valuemax={steps.length}
      >
        <div style={{
          height: '100%', background: 'var(--accent)', borderRadius: 2,
          width: `${(doneCount / steps.length) * 100}%`,
          transition: 'width 300ms ease',
        }} />
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map(step => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            {step.done ? (
              <CheckCircle size={16} weight="fill" color="var(--accent)" aria-hidden="true" />
            ) : (
              <Circle size={16} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
            )}
            <span style={{
              flex: 1,
              color: step.done ? 'var(--text-tertiary)' : 'var(--text-secondary)',
              textDecoration: step.done ? 'line-through' : 'none',
            }}>
              {step.label}
            </span>
            {!step.done && step === nextStep && (
              <a
                href={step.href}
                style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}
              >
                {step.cta} →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
