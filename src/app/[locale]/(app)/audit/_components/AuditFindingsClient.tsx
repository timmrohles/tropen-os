'use client'

// AuditFindingsClient — Sprint 6a UI-Pivot (ADR-027 Schritt 6)
// Sprint 6b₁: Compliance-Blöcke + Lighthouse-URL zurück.
// FilterChips: Multi-Select, dynamisch. FindingsSections: Killer / Empfohlen / Polish.

import React, { useState, useMemo } from 'react'
import { Lightning, XCircle, CheckCircle } from '@phosphor-icons/react'
import type { AuditDomain } from '@/lib/audit/types'
import { ComplianceBlock } from './ComplianceBlock'
import { LighthouseUrlBlock } from './LighthouseUrlBlock'
import { ProfileOnboardingModal } from '@/components/audit/ProfileOnboardingModal'
import type { ScanProjectProfile } from '@/lib/audit/project-profiles-shared'
import {
  type EnrichedFinding,
  DOMAIN_ORDER,
  SEV_ORDER,
  bySev,
} from './audit-findings-utils'
import { FindingSection } from './FindingSection'
import { FurtherSection } from './FurtherSection'
import { ProfileDisplayBar } from './ProfileDisplayBar'
import { FilterChipsRow } from './FilterChipsRow'

// Re-export so page.tsx can still import EnrichedFinding from here
export type { EnrichedFinding } from './audit-findings-utils'

// ── Main component ─────────────────────────────────────────────────────────────

interface AuditFindingsClientProps {
  allFindings: EnrichedFinding[]
  runId?: string | null
  projectId?: string | null
  complianceData?: Record<string, unknown>
  initialLighthouseUrl?: string | null
  scanProjectId?: string | null
  activeProfile?: ScanProjectProfile | null
  isCommitteeStale?: boolean
  reviewRunAt?: string | null
}

export function AuditFindingsClient({ allFindings, runId, projectId, complianceData, initialLighthouseUrl, scanProjectId, activeProfile, isCommitteeStale, reviewRunAt }: AuditFindingsClientProps) {
  const [activeCategories, setActiveCategories] = useState<AuditDomain[]>([])

  const [fixedIds, setFixedIds] = useState<Set<string>>(new Set())

  const handleFixed = (ids: string[]) => {
    setFixedIds(prev => new Set([...prev, ...ids]))
  }

  const openFindings = useMemo(
    () => allFindings.filter(f =>
      (f.status === 'open' || f.status === 'acknowledged') && !fixedIds.has(f.id)
    ),
    [allFindings, fixedIds],
  )

  // Dynamische Chip-Liste
  const availableCategories = useMemo<AuditDomain[]>(() => {
    const seen = new Set<AuditDomain>()
    for (const f of openFindings) {
      seen.add(f.domain)
    }
    return DOMAIN_ORDER.filter(d => seen.has(d))
  }, [openFindings])

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<AuditDomain, number>> = {}
    for (const f of openFindings) {
      const d = f.domain
      counts[d] = (counts[d] ?? 0) + 1
    }
    return counts
  }, [openFindings])

  const filteredFindings = useMemo(() => {
    if (activeCategories.length === 0) return openFindings
    return openFindings.filter(f =>
      activeCategories.includes(f.domain),
    )
  }, [openFindings, activeCategories])

  const killerFindings = useMemo(
    () => filteredFindings.filter(f => f.is_killer).sort(bySev),
    [filteredFindings],
  )

  // Top-10-Logik: Severity-Pyramide, bei Gleichstand Quick Wins (niedriger effort) zuerst
  const { recommendedFirst, furtherHigh, furtherMedium, furtherLow } = useMemo(() => {
    const nonKiller = filteredFindings.filter(f => !f.is_killer)
    const sorted = [...nonKiller].sort((a, b) => {
      const sevDiff = (SEV_ORDER[b.severity] ?? 0) - (SEV_ORDER[a.severity] ?? 0)
      if (sevDiff !== 0) return sevDiff
      // avg_confidence als sekundärer Tiebreaker: höhere Konfidenz zuerst
      // Auto-Checker-Findings haben avg_confidence = null → als 100 behandeln
      const confA = (a.avg_confidence as number | null) ?? 100
      const confB = (b.avg_confidence as number | null) ?? 100
      if (confA !== confB) return confB - confA  // höhere Konfidenz zuerst
      return (a.effort_minutes ?? 99) - (b.effort_minutes ?? 99)
    })
    const top10 = sorted.slice(0, 10)
    const top10Set = new Set(top10.map(f => f.id))
    const remaining = nonKiller.filter(f => !top10Set.has(f.id))
    return {
      recommendedFirst: top10,
      furtherHigh:   remaining.filter(f => f.severity === 'high').sort(bySev),
      furtherMedium: remaining.filter(f => f.severity === 'medium').sort(bySev),
      furtherLow:    remaining.filter(f => f.severity === 'low' || f.severity === 'info').sort(bySev),
    }
  }, [filteredFindings])

  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [bundleLoading, setBundleLoading] = useState(false)
  const [bundleSession, setBundleSession] = useState<{ prompt: string; fileCount: number } | null>(null)
  const [bundleError, setBundleError] = useState<string | null>(null)
  const [bundleCopied, setBundleCopied] = useState(false)

  async function handleBundle() {
    if (!recommendedFirst.length) return
    if (bundleSession) return  // already generated
    setBundleLoading(true)
    setBundleError(null)
    try {
      const res = await fetch('/api/audit/fix-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingIds: recommendedFirst.map(f => f.id) }),
      })
      const data = await res.json() as { prompt?: string; fileCount?: number; error?: string }
      if (!res.ok || !data.prompt) { setBundleError(data.error ?? 'Kein Prompt generiert'); return }
      setBundleSession({ prompt: data.prompt, fileCount: data.fileCount ?? 0 })
    } catch {
      setBundleError('Netzwerkfehler')
    } finally {
      setBundleLoading(false)
    }
  }

  function copyBundle() {
    if (!bundleSession?.prompt) return
    void navigator.clipboard.writeText(bundleSession.prompt).then(() => {
      setBundleCopied(true)
      setTimeout(() => setBundleCopied(false), 2000)
    }).catch(() => {})
  }

  // Compliance-Blöcke (DSGVO + KI-Act): immer zeigen — unabhängig von aktivem Filter.
  // Selbst-Auskunft-Fragen haben nichts mit Findings zu tun; sie müssen immer ausgefüllt werden können.
  const showDsgvo = true
  const showKiAct = true
  const showPerf = activeCategories.includes('performance')
    || (activeCategories.length === 0 && (categoryCounts['performance'] ?? 0) > 0)

  function toggleCategory(cat: AuditDomain) {
    setActiveCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>

      {/* Disclaimer-Banner (Section 28.1 Marken-Brief) */}
      <div style={{
        padding: '8px 12px', borderRadius: 8,
        background: '#ffffff',
        border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
        fontSize: 11, color: 'var(--accent)', lineHeight: 1.5, fontWeight: 600,
      }}>
        Tropen OS gibt Empfehlungen, keine Garantien. Findings, Fix-Prompts und Compliance-Hinweise (DSGVO, EU AI Act) sind Anregungen — Verantwortung für eure Veröffentlichung bleibt bei euch. Komitee-Findings (mit ✨) basieren auf KI-Sprachmodellen — Fehler möglich. Bei rechtlichen Fragen fragt einen Datenschutz- oder KI-Rechtsexperten.
      </div>

      {/* Filter-Chips */}
      {availableCategories.length > 0 && (
        <FilterChipsRow
          available={availableCategories}
          active={activeCategories}
          counts={categoryCounts}
          onToggle={toggleCategory}
          onReset={() => setActiveCategories([])}
        />
      )}

      {/* Profil-Anzeige + Ändern-Button (nur für externe Scan-Projekte mit Profil) */}
      {projectId && activeProfile && (
        <ProfileDisplayBar
          profile={activeProfile}
          onEdit={() => setProfileModalOpen(true)}
        />
      )}

      {/* Section 1: Stopper */}
      {killerFindings.length > 0 && (
        <FindingSection
          icon={<XCircle size={14} weight="fill" color="var(--error)" aria-hidden="true" />}
          title="STOPPER"
          subtitle={`${killerFindings.length} Finding${killerFindings.length > 1 ? 's' : ''} · blockieren Veröffentlichung`}
          findings={killerFindings}
          runId={runId}
          variant="killer"
          onFixed={handleFixed}
          isCommitteeStale={isCommitteeStale}
          reviewRunAt={reviewRunAt}
        />
      )}

      {/* Section 2: Empfohlen zuerst (Top 10) + Bundle-Button */}
      {recommendedFirst.length > 0 && (
        <FindingSection
          icon={<Lightning size={14} weight="fill" color="var(--teal)" aria-hidden="true" />}
          title="EMPFOHLEN ZUERST"
          subtitle={`${recommendedFirst.length} Findings · nach Severity + Quick Wins`}
          findings={recommendedFirst}
          runId={runId}
          variant="quick"
          onBundle={handleBundle}
          bundlePrompt={bundleSession?.prompt ?? null}
          bundleLoading={bundleLoading}
          bundleError={bundleError ?? undefined}
          bundleCopied={bundleCopied}
          onCopyBundle={copyBundle}
          onClearBundle={() => { setBundleSession(null); setBundleError(null) }}
          onFixed={handleFixed}
          isCommitteeStale={isCommitteeStale}
          reviewRunAt={reviewRunAt}
        />
      )}


      {/* Section 3: Weitere — mit Severity-Sub-Trennern */}
      {(furtherHigh.length + furtherMedium.length + furtherLow.length) > 0 && (
        <FurtherSection
          furtherHigh={furtherHigh}
          furtherMedium={furtherMedium}
          furtherLow={furtherLow}
          runId={runId}
          onFixed={handleFixed}
          isCommitteeStale={isCommitteeStale}
          reviewRunAt={reviewRunAt}
        />
      )}

      {/* Empty state */}
      {filteredFindings.length === 0 && (
        <div style={{
          padding: '32px 24px', textAlign: 'center',
          background: '#ffffff', border: '1px solid var(--border)', borderRadius: 8,
        }}>
          <CheckCircle size={28} weight="fill" color="var(--teal)" aria-hidden="true" />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 10, marginBottom: 4 }}>
            Keine offenen Findings
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
            {activeCategories.length > 0
              ? 'In den gewählten Kategorien ist alles sauber.'
              : 'Dein Code sieht sauber aus.'}
          </p>
        </div>
      )}

      {/* Profil-Ändern-Modal (Sprint 7) */}
      {profileModalOpen && projectId && (
        <ProfileOnboardingModal
          scanProjectId={projectId}
          initialProfile={activeProfile}
          mode="edit"
          onClose={() => setProfileModalOpen(false)}
          onComplete={() => {
            setProfileModalOpen(false)
            // Re-render: useRouter().refresh() wäre ideal, aber Router-Import würde den Bundle vergrößern.
            // Einfachster Weg: window.location.reload() — akzeptabel für Profil-Änderung (seltene Aktion).
            window.location.reload()
          }}
        />
      )}

      {/* ── Lighthouse-URL: vor Compliance-Blöcken, Performance-kontextuell ── */}
      {showPerf && (
        <LighthouseUrlBlock
          id="lighthouse-url"
          scanProjectId={scanProjectId}
          initialUrl={initialLighthouseUrl}
        />
      )}

      {/* ── Compliance-Hinweise (Sprint 6b₁) ─────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {showDsgvo && (
          <ComplianceBlock
            id="dsgvo-stamm-daten"
            domain="dsgvo"
            projectId={projectId ?? null}
            initialData={complianceData}
          />
        )}
        {showKiAct && (
          <ComplianceBlock
            id="eu-ai-act"
            domain="ki-act"
            projectId={projectId ?? null}
            initialData={complianceData}
          />
        )}
      </div>
    </div>
  )
}

