'use client'

import { useState, useMemo } from 'react'
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
  const [isPublic, setIsPublic] = useState(false)
  const [liveUrl, setLiveUrl] = useState('')
  const [isLive, setIsLive] = useState(false)
  const [audience, setAudience] = useState<string>('unclear')
  const [compliance, setCompliance] = useState<string[]>([])

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

  function toggleCompliance(value: string) {
    if (value === 'none') {
      setCompliance([])
      return
    }
    setCompliance((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev.filter((v) => v !== 'none'), value]
    )
  }

  function handleConfirm() {
    onConfirm({
      detectedStack,
      isPublic,
      liveUrl: isPublic && liveUrl.trim() ? liveUrl.trim() : null,
      isLive,
      audience: audience as ProjectProfile['audience'],
      complianceRequirements: compliance,
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

      <div className="card-divider" />

      {/* Interview */}
      <div style={{ marginTop: 20 }}>
        <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 18 }}>
          Ein paar Fragen zum Projekt
        </p>

        {/* Frage 1: Öffentlich */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
            Ist die App öffentlich erreichbar?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`chip${isPublic ? ' chip--active' : ''}`} onClick={() => setIsPublic(true)}>
              Ja
            </button>
            <button className={`chip${!isPublic ? ' chip--active' : ''}`} onClick={() => setIsPublic(false)}>
              Nein, intern / lokal
            </button>
          </div>
          {isPublic && (
            <input
              type="url"
              placeholder="https://..."
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                fontSize: 13,
                background: 'transparent',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          )}
        </div>

        {/* Frage 2: Live */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
            Ist die App schon live mit echten Usern?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`chip${isLive ? ' chip--active' : ''}`} onClick={() => setIsLive(true)}>
              Ja, live
            </button>
            <button className={`chip${!isLive ? ' chip--active' : ''}`} onClick={() => setIsLive(false)}>
              Noch in Entwicklung
            </button>
          </div>
        </div>

        {/* Frage 3: Zielgruppe */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
            Wer nutzt die App?
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { value: 'b2b', label: 'Geschäftskunden (B2B)' },
              { value: 'b2c', label: 'Endnutzer (B2C)' },
              { value: 'internal', label: 'Internes Team' },
              { value: 'unclear', label: 'Noch unklar' },
            ].map((opt) => (
              <button
                key={opt.value}
                className={`chip${audience === opt.value ? ' chip--active' : ''}`}
                onClick={() => setAudience(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Frage 4: Compliance */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
            Besondere Compliance-Anforderungen?
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { value: 'dsgvo', label: 'DSGVO' },
              { value: 'ai-act', label: 'AI Act' },
              { value: 'hipaa', label: 'HIPAA' },
              { value: 'none', label: 'Keine besonderen' },
            ].map((opt) => (
              <button
                key={opt.value}
                className={`chip${compliance.includes(opt.value) || (opt.value === 'none' && compliance.length === 0) ? ' chip--active' : ''}`}
                onClick={() => toggleCompliance(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* N/A-Kategorien */}
      {autoDetectedNa.length > 0 && (
        <div style={{
          padding: '14px 16px',
          background: 'var(--bg-base)',
          borderRadius: 8,
          marginBottom: 20,
        }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Für dein Projekt nicht relevant:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {NA_CANDIDATES.filter((c) => autoDetectedNa.includes(c.categoryId)).map((c) => (
              <label
                key={c.categoryId}
                style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}
              >
                <input
                  type="checkbox"
                  checked={skippedCategories.has(c.categoryId)}
                  onChange={() => toggleSkipped(c.categoryId)}
                  style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--accent)', width: 14, height: 14 }}
                />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {c.title}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                    {c.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10 }}>
            Angehakt = wird im Audit übersprungen. Haken entfernen um die Kategorie zu prüfen.
          </p>
        </div>
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
