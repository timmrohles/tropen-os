'use client'

import { useState, useMemo } from 'react'
// Sprint 6b₂: isPublic, isLive, audience, compliance, liveUrl States entfernt (Sprint-5-Modal übernimmt)
import type { DetectedStack } from '@/lib/file-access/stack-detector'

export interface ProjectProfile {
  detectedStack: DetectedStack
  isPublic: boolean
  liveUrl: string | null
  isLive: boolean
  audience: 'b2b' | 'b2c' | 'internal' | 'unclear'
  complianceRequirements: string[]
  notApplicableCategories: number[]
}

const NA_CANDIDATES: Array<{
  categoryId: number
  flag: keyof DetectedStack
  title: string
  description: string
}> = [
  {
    categoryId: 17,
    flag: 'hasI18n',
    title: 'Mehrsprachigkeit (i18n)',
    description: 'Dein Projekt hat keine Übersetzungs-Library. Wird nur geprüft wenn die App mehrsprachig sein soll.',
  },
  {
    categoryId: 21,
    flag: 'hasPwa',
    title: 'Offline-Fähigkeit (PWA)',
    description: 'Dein Projekt hat keine Progressive Web App Konfiguration. Wird nur geprüft wenn die App offline funktionieren soll.',
  },
]

interface Props {
  detectedStack: DetectedStack
  onConfirm: (profile: ProjectProfile) => void
  onBack: () => void
}

export default function ProjectProfileStep({ detectedStack, onConfirm, onBack }: Props) {
  // Sprint 6b₂: Profil-Fragen entfernt (Sprint-5-Modal übernimmt Profil-Erfassung).
  // N/A-Sektion erhalten — Coach-Position-Substanz (Marken-Brief 28.6 LAZY-Detection).

  // Which candidates are auto-detected as N/A for this project
  const autoDetectedNa = useMemo(
    () => NA_CANDIDATES.filter((c) => !detectedStack[c.flag]).map((c) => c.categoryId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // User can uncheck to re-include a category; initialised from auto-detection
  const [skippedCategories, setSkippedCategories] = useState<Set<number>>(
    () => new Set(autoDetectedNa)
  )

  function toggleSkipped(categoryId: number) {
    setSkippedCategories((prev) => {
      const next = new Set(prev)
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId)
      return next
    })
  }

  function handleConfirm() {
    onConfirm({
      detectedStack,
      isPublic: false,
      liveUrl: null,
      isLive: false,
      audience: 'unclear',
      complianceRequirements: [],
      notApplicableCategories: [...skippedCategories],
    })
  }

  const stackChips: { label: string; secondary?: boolean }[] = [
    detectedStack.framework
      ? { label: `${detectedStack.framework}${detectedStack.frameworkVersion ? ` ${detectedStack.frameworkVersion}` : ''}` }
      : null,
    { label: detectedStack.language },
    detectedStack.database ? { label: detectedStack.database } : null,
    detectedStack.auth ? { label: detectedStack.auth } : null,
    detectedStack.styling ? { label: detectedStack.styling } : null,
    detectedStack.testing ? { label: detectedStack.testing, secondary: true } : null,
    detectedStack.errorTracking ? { label: detectedStack.errorTracking, secondary: true } : null,
    detectedStack.deployment ? { label: detectedStack.deployment, secondary: true } : null,
  ].filter(Boolean) as { label: string; secondary?: boolean }[]

  const noPackageJson = !detectedStack.packageName && detectedStack.dependencyCount === 0

  return (
    <div className="card" style={{ padding: 24, textAlign: 'left' }}>
      {/* Auto-Detect Ergebnis */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 10 }}>
          Erkannter Stack
        </p>

        {noPackageJson ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '8px 12px', background: 'var(--bg-base)', borderRadius: 6 }}>
            Kein package.json gefunden — Stack-Erkennung nicht möglich.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {stackChips.map((c) => (
                <span key={c.label} className={c.secondary ? 'chip' : 'chip chip--active'}>
                  {c.label}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
              {detectedStack.packageName && <>{detectedStack.packageName} · </>}
              {detectedStack.dependencyCount} Deps · {detectedStack.devDependencyCount} DevDeps
            </p>
          </>
        )}
      </div>

      {/* Auto-Skip-Info-Block — Marken-Brief 28.6 LAZY-Detection sichtbar machen */}
      {autoDetectedNa.length > 0 && (
        <>
          <div className="card-divider" />
          <div style={{
            marginTop: 20, marginBottom: 20,
            border: '1px solid rgba(229,160,0,0.25)',
            borderRadius: 8, overflow: 'hidden',
            background: 'rgba(255,250,211,0.25)',
          }}>
            {/* Header */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(229,160,0,0.20)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--text-primary)', margin: 0 }}>
                📋 AUS DEM CODE ERKANNT — DIESE CHECKS ÜBERSPRINGEN WIR
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>
                Tropen OS prüft nur was im Code sichtbar ist. Wenn ihr einen Check doch wollt: Haken entfernen.
              </p>
            </div>
            {/* Einträge */}
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {NA_CANDIDATES.filter((c) => autoDetectedNa.includes(c.categoryId)).map((c) => (
                <label
                  key={c.categoryId}
                  style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}
                >
                  <input
                    type="checkbox"
                    checked={skippedCategories.has(c.categoryId)}
                    onChange={() => toggleSkipped(c.categoryId)}
                    style={{ marginTop: 3, flexShrink: 0, accentColor: 'var(--teal)', width: 13, height: 13 }}
                  />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 }}>
                      {c.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5, margin: 0 }}>
                      {c.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={handleConfirm}>
          Audit starten
        </button>
        <button className="btn btn-ghost" onClick={onBack}>
          Zurück
        </button>
      </div>
    </div>
  )
}
