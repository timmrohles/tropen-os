'use client'

// AuditFindingsClient — Sprint 6a UI-Pivot (ADR-027 Schritt 6)
// Sprint 6b₁: Compliance-Blöcke + Lighthouse-URL zurück.
// FilterChips: Multi-Select, dynamisch. FindingsSections: Killer / Empfohlen / Polish.

import React, { useState, useMemo } from 'react'
import { Lightning, XCircle, CheckCircle, ArrowsClockwise } from '@phosphor-icons/react'
import type { AuditDomain } from '@/lib/audit/types'
import { effortLevel } from '@/lib/audit/killer-rule-ids'
import { ComplianceBlock } from './ComplianceBlock'
import { LighthouseUrlBlock } from './LighthouseUrlBlock'
import { ProfileOnboardingModal } from '@/components/audit/ProfileOnboardingModal'
import { PROFILE_LABELS, GEO_SCOPE_LABELS } from '@/lib/audit/project-profiles-shared'
import type { ScanProjectProfile } from '@/lib/audit/project-profiles-shared'

// ── Shared types ───────────────────────────────────────────────────────────────

export interface EnrichedFinding {
  id: string
  rule_id: string
  severity: string
  message: string
  file_path: string | null
  suggestion: string | null
  status: string
  is_killer: boolean
  effort_minutes: number
  domain: AuditDomain
  fix_type: string | null
  _recTitle?: string
  _limitation?: string
  [key: string]: unknown
}

// ── Domain labels ──────────────────────────────────────────────────────────────

const DOMAIN_LABELS: Record<AuditDomain, string> = {
  'code-quality':  'Code-Qualität',
  'performance':   'Performance',
  'security':      'Sicherheit',
  'accessibility': 'Barrierefrei.',
  'dsgvo':         'DSGVO',
  'ki-act':        'KI-Act',
  'documentation': 'Doku',
  'oss':           'OSS-Lizenzen',
  'marketing':     'Tracking',
  'platform':      'App Store',
  'infrastructure':'Infrastruktur',
}

const DOMAIN_ORDER: AuditDomain[] = [
  'security', 'dsgvo', 'code-quality', 'accessibility', 'ki-act', 'performance', 'documentation',
  // Sprint 9b — neue Domänen
  'oss', 'marketing', 'platform', 'infrastructure',
]

const SEV_ORDER: Record<string, number> = {
  critical: 4, high: 3, medium: 2, low: 1, info: 0,
}

const SEV_DOT: Record<string, string> = {
  critical: 'severity-dot--critical',
  high:     'severity-dot--high',
  medium:   'severity-dot--medium',
  low:      'severity-dot--low',
  info:     'severity-dot--info',
}

// ── Main component ─────────────────────────────────────────────────────────────

interface AuditFindingsClientProps {
  allFindings: EnrichedFinding[]
  runId?: string | null
  projectId?: string | null
  complianceData?: Record<string, unknown>
  initialLighthouseUrl?: string | null
  scanProjectId?: string | null
  activeProfile?: ScanProjectProfile | null
}

export function AuditFindingsClient({ allFindings, runId, projectId, complianceData, initialLighthouseUrl, scanProjectId, activeProfile }: AuditFindingsClientProps) {
  const [activeCategories, setActiveCategories] = useState<AuditDomain[]>([])

  const openFindings = useMemo(
    () => allFindings.filter(f => f.status === 'open' || f.status === 'acknowledged'),
    [allFindings],
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
    })
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
        />
      )}


      {/* Section 3: Weitere — mit Severity-Sub-Trennern */}
      {(furtherHigh.length + furtherMedium.length + furtherLow.length) > 0 && (
        <FurtherSection
          furtherHigh={furtherHigh}
          furtherMedium={furtherMedium}
          furtherLow={furtherLow}
          runId={runId}
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

      {/* ── Severity-Legende ──────────────────────────────────────────────── */}
      {filteredFindings.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 4px', flexWrap: 'wrap' }}>
          {([
            { cls: 'severity-dot--critical', label: 'Critical' },
            { cls: 'severity-dot--high',     label: 'High' },
            { cls: 'severity-dot--medium',   label: 'Medium' },
            { cls: 'severity-dot--low',      label: 'Low' },
            { cls: 'severity-dot--info',     label: 'Info' },
          ] as const).map(({ cls, label }) => (
            <span key={cls} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className={`severity-dot ${cls}`} aria-hidden="true" />
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</span>
            </span>
          ))}
        </div>
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

function bySev(a: EnrichedFinding, b: EnrichedFinding) {
  return (SEV_ORDER[b.severity] ?? 0) - (SEV_ORDER[a.severity] ?? 0)
}

// ── FilterChipsRow ─────────────────────────────────────────────────────────────

function FilterChipsRow({
  available, active, counts, onToggle, onReset,
}: {
  available: AuditDomain[]
  active: AuditDomain[]
  counts: Partial<Record<AuditDomain, number>>
  onToggle: (d: AuditDomain) => void
  onReset: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingBottom: 4 }}>
      {available.map(cat => {
        const isActive = active.includes(cat)
        const count = counts[cat] ?? 0
        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 11px', borderRadius: 20, cursor: 'pointer',
              fontSize: 12, fontWeight: isActive ? 600 : 500,
              border: isActive ? '1.5px solid rgba(255,255,255,0.4)' : '1px solid transparent',
              background: isActive ? 'var(--teal)' : 'var(--teal-hover)',
              color: '#ffffff',
              transition: 'border-color 120ms, background 120ms',
            }}
          >
            {DOMAIN_LABELS[cat]}
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
              padding: '1px 5px', borderRadius: 8,
              background: 'rgba(255,255,255,0.20)',
              color: '#ffffff',
            }}>
              {count}
            </span>
          </button>
        )
      })}
      {active.length > 0 && (
        <button
          onClick={onReset}
          style={{
            fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none',
            cursor: 'pointer', padding: '4px 4px', textDecoration: 'underline', textUnderlineOffset: 2,
          }}
        >
          Alle anzeigen
        </button>
      )}
    </div>
  )
}

// ── Pattern-Clustering ─────────────────────────────────────────────────────────

interface FindingCluster {
  ruleId: string
  title: string
  findings: EnrichedFinding[]
  effortLevel: ReturnType<typeof effortLevel>
  severity: string
  totalScoreGain: number
}

function clusterFindings(findings: EnrichedFinding[]): FindingCluster[] {
  const groups = new Map<string, EnrichedFinding[]>()
  for (const f of findings) {
    const key = f.rule_id
    groups.set(key, [...(groups.get(key) ?? []), f])
  }
  return Array.from(groups.values())
    .map(fs => ({
      ruleId: fs[0].rule_id,
      title: (fs[0]._recTitle ?? fs[0].message) as string,
      findings: fs,
      effortLevel: effortLevel(fs[0].effort_minutes),
      severity: fs[0].severity,
      totalScoreGain: fs.reduce((s, f) => s + (SEV_ORDER[f.severity] ?? 1), 0),
    }))
    .sort((a, b) => {
      // Quick Wins zuerst, dann nach Anzahl Dateien
      const effortOrder = { quick: 0, medium: 1, long: 2 }
      const ea = effortOrder[a.effortLevel]
      const eb = effortOrder[b.effortLevel]
      if (ea !== eb) return ea - eb
      return b.findings.length - a.findings.length
    })
}

// ── FindingSection ─────────────────────────────────────────────────────────────

type SectionVariant = 'killer' | 'quick' | 'polish'

// Sprint 9-Polish-2: KI-Optik raus — "quick" nutzt linken Border-Strich statt blauen Hintergrund
const SECTION_STYLES: Record<SectionVariant, React.CSSProperties> = {
  killer: {
    background: '#ffffff',
    border: '1px solid var(--border)',
    borderRadius: 8, overflow: 'hidden',
  },
  quick: {
    background: '#ffffff',
    border: '1px solid var(--border)',
    borderRadius: 8, overflow: 'hidden',
  },
  polish: {
    background: '#ffffff',
    border: '1px solid var(--border)',
    borderRadius: 8, overflow: 'hidden',
  },
}

function FindingSection({
  icon, title, subtitle, findings, runId, variant, onBundle,
  bundlePrompt, bundleLoading, bundleError, bundleCopied, onCopyBundle, onClearBundle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  findings: EnrichedFinding[]
  runId?: string | null
  variant: SectionVariant
  onBundle?: () => void
  bundlePrompt?: string | null
  bundleLoading?: boolean
  bundleError?: string
  bundleCopied?: boolean
  onCopyBundle?: () => void
  onClearBundle?: () => void
}) {
  const [open, setOpen] = useState(true)
  const clusters = clusterFindings(findings)

  return (
    <div style={SECTION_STYLES[variant]}>
      {/* Header als div — Bundle-Button braucht eigenen Klick-Bereich neben dem Toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 14px', background: 'var(--accent-light)',
        borderBottom: open ? '1px solid var(--border)' : 'none',
      }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
          {title}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>
          · {subtitle}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {onBundle && findings.length > 0 && (
            <button
              onClick={onBundle}
              className="btn btn-primary"
              style={{ fontSize: 11, padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Lightning size={11} weight="fill" aria-hidden="true" />
              Fix-Session starten
            </button>
          )}
          <button
            onClick={() => setOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: 'var(--text-tertiary)', padding: '2px 4px' }}
            aria-label={open ? 'Einklappen' : 'Aufklappen'}
          >
            {open ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Inline-Bundle-Prompt */}
      {(bundleLoading || bundleError || bundlePrompt) && (
        <div style={{ borderBottom: open ? '1px solid var(--border)' : 'none' }}>
          {bundleLoading && <p style={{ margin: 0, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>Wird generiert…</p>}
          {bundleError && <p style={{ margin: 0, padding: '10px 14px', fontSize: 12, color: 'var(--error)' }}>⚠ {bundleError}</p>}
          {bundlePrompt && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--active-bg)', overflow: 'hidden' }}>
              <div style={{ color: '#e8e6e1', padding: '10px 14px', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 280, overflow: 'auto' }}>
                {bundlePrompt}
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={onCopyBundle} style={{ fontSize: 11, color: '#ffffff', background: 'var(--teal)', border: '1px solid var(--teal)', borderRadius: 4, cursor: 'pointer', padding: '3px 10px' }}>
                  {bundleCopied ? '✓ Kopiert' : 'Kopieren'}
                </button>
                <button onClick={onClearBundle} style={{ fontSize: 11, color: 'var(--teal)', background: 'transparent', border: '1px solid var(--teal)', borderRadius: 4, cursor: 'pointer', padding: '3px 10px' }}>
                  Verbergen
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {open && clusters.map(cluster => (
        <FindingClusterRow key={cluster.ruleId} cluster={cluster} runId={runId} />
      ))}
    </div>
  )
}

// ── FindingClusterRow ──────────────────────────────────────────────────────────

function FindingClusterRow({ cluster, runId }: { cluster: FindingCluster; runId?: string | null }) {
  const [expanded, setExpanded] = useState(false)
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null)
  const [clusterBundle, setClusterBundle] = useState<string | null>(null)
  const [clusterBundleLoading, setClusterBundleLoading] = useState(false)
  const [clusterBundleCopied, setClusterBundleCopied] = useState(false)
  const isMulti = cluster.findings.length > 1

  function toggleFinding(id: string) {
    setExpandedFindingId(prev => prev === id ? null : id)
  }

  async function loadClusterBundle() {
    if (clusterBundle || clusterBundleLoading) return
    setClusterBundleLoading(true)
    try {
      const res = await fetch('/api/audit/fix-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingIds: cluster.findings.map(f => f.id) }),
      })
      const data = await res.json() as { prompt?: string }
      setClusterBundle(data.prompt ?? null)
    } finally { setClusterBundleLoading(false) }
  }

  function copyClusterBundle() {
    if (!clusterBundle) return
    void navigator.clipboard.writeText(clusterBundle).then(() => {
      setClusterBundleCopied(true)
      setTimeout(() => setClusterBundleCopied(false), 2000)
    })
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Cluster-Header — div statt button damit Bundle-Button rechts passt */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px' }}>
        {/* Klickbarer Bereich links */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{ display: 'contents', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left' }}
          aria-label={expanded ? 'Einklappen' : 'Aufklappen'}
        >
          <span className={`severity-dot ${SEV_DOT[cluster.severity] ?? ''}`} aria-label={cluster.severity} style={{ flexShrink: 0 }} />
        </button>
        <div style={{ minWidth: 0, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(v => !v)}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cluster.title}
          </div>
          {isMulti ? (
            <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
              {cluster.findings.length} Dateien betroffen · {expanded ? '▲ einklappen' : '▼ aufklappen'}
            </div>
          ) : cluster.findings[0].file_path ? (
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cluster.findings[0].file_path}
            </div>
          ) : null}
          {cluster.findings[0]._limitation && !isMulti && (
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.4, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              💡 {cluster.findings[0]._limitation as string}
            </div>
          )}
        </div>
        {/* Bundle-Button rechts — nur bei aufgeklapptem Multi-Cluster */}
        {isMulti && expanded && !clusterBundle && (
          <button
            onClick={loadClusterBundle}
            disabled={clusterBundleLoading}
            className="btn btn-primary"
            style={{ fontSize: 11, padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
          >
            <Lightning size={11} weight="fill" aria-hidden="true" />
            {clusterBundleLoading ? 'Wird generiert…' : `Alle ${cluster.findings.length} auf einmal fixen`}
          </button>
        )}
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          {cluster.severity !== 'info' ? `+${cluster.totalScoreGain}` : ''}
        </span>
      </div>

      {/* Multi-file: Datei-Liste mit je eigenem Fix-Prompt-Bereich darunter */}
      {expanded && isMulti && (
        <div style={{ background: 'rgba(26,23,20,0.02)', borderTop: '1px solid var(--border)' }}>
          {/* Bundle-Prompt wenn generiert */}
          {clusterBundle && (
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--active-bg)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ color: '#e8e6e1', padding: '10px 12px', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 240, overflow: 'auto' }}>
                  {clusterBundle}
                </div>
                <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button onClick={copyClusterBundle} style={{ fontSize: 11, color: '#ffffff', background: 'var(--teal)', border: '1px solid var(--teal)', borderRadius: 4, cursor: 'pointer', padding: '3px 10px' }}>
                    {clusterBundleCopied ? '✓ Kopiert' : 'Kopieren'}
                  </button>
                  <button onClick={() => setClusterBundle(null)} style={{ fontSize: 11, color: 'var(--teal)', background: 'transparent', border: '1px solid var(--teal)', borderRadius: 4, cursor: 'pointer', padding: '3px 10px' }}>
                    Verbergen
                  </button>
                </div>
              </div>
            </div>
          )}
          {cluster.findings.map(f => (
            <div key={f.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px 5px 44px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.file_path ?? '—'}
                </span>
                {f._limitation && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>💡</span>}
                {runId && (
                  <button
                    onClick={() => toggleFinding(f.id)}
                    style={{ fontSize: 11, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2, flexShrink: 0 }}
                  >
                    {expandedFindingId === f.id ? 'Einklappen' : 'Fix-Prompt anzeigen'}
                  </button>
                )}
              </div>
              {expandedFindingId === f.id && runId && (
                <FixPromptInline
                  ruleId={f.rule_id}
                  message={f.message as string}
                  severity={f.severity}
                  filePath={f.file_path}
                  autoLoad
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Single finding: expandierbarer Fix-Prompt */}
      {expanded && !isMulti && (
        <div style={{ padding: '8px 14px 12px', background: 'rgba(26,23,20,0.02)' }}>
          {cluster.findings[0].message && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px', lineHeight: 1.5 }}>
              {cluster.findings[0].message as string}
            </p>
          )}
          {cluster.findings[0].suggestion && cluster.findings[0].suggestion !== cluster.findings[0].message && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
              {cluster.findings[0].suggestion as string}
            </p>
          )}
          {runId && (
            <FixPromptInline
              ruleId={cluster.findings[0].rule_id}
              message={cluster.findings[0].message as string}
              severity={cluster.findings[0].severity}
              filePath={cluster.findings[0].file_path}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── FixPromptInline ────────────────────────────────────────────────────────────

function FixPromptInline({ ruleId, message, severity, filePath, autoLoad }: {
  ruleId: string; message: string; severity: string; filePath: string | null; autoLoad?: boolean
}) {
  const [prompt, setPrompt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  React.useEffect(() => {
    if (autoLoad) void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad])

  async function load() {
    if (prompt || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/audit/fix-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, message, severity, filePath }),
      })
      const data = await res.json() as { prompt?: string }
      setPrompt(data.prompt ?? null)
    } finally { setLoading(false) }
  }

  async function copy() {
    if (!prompt) return
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!prompt && !loading) {
    return (
      <button onClick={load} style={{ fontSize: 11, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}>
        Fix-Prompt anzeigen
      </button>
    )
  }
  if (loading) return <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Lädt…</span>

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--active-bg)', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ color: '#e8e6e1', padding: '10px 12px', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 200, overflow: 'auto' }}>
        {prompt}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={copy} style={{ fontSize: 11, color: '#ffffff', background: 'var(--teal)', border: '1px solid var(--teal)', borderRadius: 4, cursor: 'pointer', padding: '3px 10px' }}>
          {copied ? '✓ Kopiert' : 'Kopieren'}
        </button>
        <button onClick={() => setPrompt(null)} style={{ fontSize: 11, color: 'var(--teal)', background: 'transparent', border: '1px solid var(--teal)', borderRadius: 4, cursor: 'pointer', padding: '3px 10px' }}>
          Verbergen
        </button>
      </div>
    </div>
  )
}

// ── SubSectionLabel — inline (kein import von SectionLabel — RSC-Modul-ID-Konflikt) ──

function SubSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 12,
      fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
      color: 'var(--accent)', marginTop: 12, marginBottom: 8, letterSpacing: '0.02em',
    }}>
      <span style={{ width: 28, height: 1, background: 'rgba(63,74,85,0.3)', flexShrink: 0 }} aria-hidden="true" />
      {children}
    </span>
  )
}

// ── FurtherSection — Weitere Findings mit Severity-Sub-Trennern ───────────────

function FurtherSection({ furtherHigh, furtherMedium, furtherLow, runId }: {
  furtherHigh: EnrichedFinding[]
  furtherMedium: EnrichedFinding[]
  furtherLow: EnrichedFinding[]
  runId?: string | null
}) {
  const total = furtherHigh.length + furtherMedium.length + furtherLow.length
  const [open, setOpen] = useState(true)

  return (
    <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '9px 14px', background: 'var(--accent-light)', border: 'none', cursor: 'pointer', textAlign: 'left',
          borderBottom: open ? '1px solid var(--border)' : 'none',
        }}
      >
        <ArrowsClockwise size={14} weight="bold" color="var(--accent)" aria-hidden="true" />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
          WEITERE FINDINGS
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>
          · {total} Findings
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-tertiary)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <>
          {furtherHigh.length > 0 && (
            <>
              <div style={{ padding: '8px 14px 4px', borderBottom: '1px solid var(--border)' }}>
                <SubSectionLabel>Hohe Severity</SubSectionLabel>
              </div>
              {clusterFindings(furtherHigh).map(cluster => (
                <FindingClusterRow key={cluster.ruleId} cluster={cluster} runId={runId} />
              ))}
            </>
          )}
          {furtherMedium.length > 0 && (
            <>
              <div style={{ padding: '8px 14px 4px', borderBottom: '1px solid var(--border)', borderTop: furtherHigh.length > 0 ? '1px solid var(--border)' : 'none' }}>
                <SubSectionLabel>Mittlere Severity</SubSectionLabel>
              </div>
              {clusterFindings(furtherMedium).map(cluster => (
                <FindingClusterRow key={cluster.ruleId} cluster={cluster} runId={runId} />
              ))}
            </>
          )}
          {furtherLow.length > 0 && (
            <>
              <div style={{ padding: '8px 14px 4px', borderBottom: '1px solid var(--border)', borderTop: (furtherHigh.length + furtherMedium.length) > 0 ? '1px solid var(--border)' : 'none' }}>
                <SubSectionLabel>Niedrige Severity</SubSectionLabel>
              </div>
              {clusterFindings(furtherLow).map(cluster => (
                <FindingClusterRow key={cluster.ruleId} cluster={cluster} runId={runId} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

// ── ProfileDisplayBar ──────────────────────────────────────────────────────────

function ProfileDisplayBar({ profile, onEdit }: { profile: ScanProjectProfile; onEdit: () => void }) {
  const profileLabel = PROFILE_LABELS[profile.profile_type]
  const geoLabel = GEO_SCOPE_LABELS[profile.geo_scope]

  const summaryParts: string[] = [
    geoLabel.flag + ' ' + geoLabel.label,
    profile.has_user_data ? 'Sammelt User-Daten' : 'Keine User-Daten',
    profile.has_ai === true ? 'Mit KI' : profile.has_ai === false ? 'Ohne KI' : null,
    profile.has_ecommerce === true ? 'Mit Verkauf' : profile.has_ecommerce === false ? 'Ohne Verkauf' : null,
  ].filter(Boolean) as string[]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      padding: '8px 12px', borderRadius: 8,
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>PROFIL</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {profileLabel.name}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {summaryParts.join(' · ')}
        </span>
      </div>
      <button
        onClick={onEdit}
        style={{
          fontSize: 11, color: 'var(--teal)', background: 'none', border: '1px solid var(--teal)',
          borderRadius: 4, padding: '3px 10px', cursor: 'pointer',
        }}
      >
        Profil ändern
      </button>
    </div>
  )
}
