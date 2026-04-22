'use client'

import React, { useState } from 'react'
import {
  CaretDown, CaretRight, Copy, CheckCircle, X, ClipboardText, Check, CaretUp, SealCheck, Brain,
} from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'
import type { FindingRecommendation } from '@/lib/audit/finding-recommendations'
import { FIX_APPROACH_LABEL } from '@/lib/audit/finding-recommendations'
import FixPromptDrawer from './FixPromptDrawer'
import DeepFixButton from './DeepFixButton'
import { cleanRuleId, type FindingGroup } from '@/lib/audit/group-findings'

/** @deprecated Import FindingGroup from '@/lib/audit/group-findings' instead */
export type FindingGroupInfo = FindingGroup

interface RecommendationCardProps {
  group: FindingGroup
  recommendation: FindingRecommendation | null
  isExternalProject: boolean
  onMarkFixed: (group: FindingGroup) => void
  onMarkNotRelevant: (group: FindingGroup, reason: string) => void
  /** @deprecated kept for backward compat — unused */
  groupTaskExists?: boolean
  groupTaskToggling?: boolean
  onAddGroupTask?: (group: FindingGroup) => void
  onDismissGroup?: (group: FindingGroup) => void
  onAcknowledgeGroup?: (group: FindingGroup) => void
  onCopyGroupPrompt?: (group: FindingGroup) => void
  runId?: string
  deepReview?: { level: string; count: number }
}

const NOT_RELEVANT_REASONS = [
  { id: 'no-eu', label_en: 'No EU market / no German users', label_de: 'Kein EU-Markt / keine deutschen Nutzer' },
  { id: 'internal', label_en: 'Internal tool, not public', label_de: 'Internes Tool, nicht oeffentlich' },
  { id: 'external', label_en: 'Already solved externally (e.g. hosting provider)', label_de: 'Bereits extern geloest (z.B. Hosting-Provider)' },
  { id: 'accepted', label_en: 'Conscious decision with known risk', label_de: 'Bewusste Entscheidung mit bekanntem Risiko' },
]

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--error)',
  high:     'var(--error)',
  medium:   'var(--text-secondary)',
  low:      'var(--text-tertiary)',
  info:     'var(--text-tertiary)',
}

const AGENT_LABEL: Record<string, string> = {
  core: 'Core', architecture: 'Arch', security: 'Sec', observability: 'Obs',
  'code-style': 'Style', 'error-handling': 'Err', database: 'DB',
  dependencies: 'Deps', 'git-governance': 'Git', 'backup-dr': 'DR',
  testing: 'Test', performance: 'Perf', platform: 'CI/CD', api: 'API',
  'cost-awareness': 'Cost', scalability: 'Scale', accessibility: 'A11y',
  'design-system': 'DS', content: 'i18n', legal: 'Legal',
  'ai-integration': 'AI', analytics: 'Track', 'security-scan': 'SecScan',
  dsgvo: 'DSGVO', bfsg: 'BFSG', 'ai-act': 'AI Act',
  'lighthouse-performance': 'LH Perf', 'lighthouse-accessibility': 'LH A11y',
  'lighthouse-best-practices': 'LH Best', 'lighthouse-seo': 'LH SEO',
  'npm-audit': 'npm audit',
}

const SEV_LABEL: Record<string, string> = {
  critical: 'Kritisch', high: 'Hoch', medium: 'Mittel', low: 'Niedrig', info: 'Info',
}

const FIX_TYPE_STYLE: Record<string, React.CSSProperties> = {
  'code-fix':    { background: 'var(--accent)', color: '#ffffff' },
  'code-gen':    { background: 'var(--accent-light)', color: 'var(--text-primary)' },
  'refactoring': { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
  'manual':      { background: 'var(--bg-base)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' },
}

function DeepReviewBadge({ level, count }: { level?: string | null; count: number }) {
  if (!level) return null
  const isStrong = level === 'unanimous' || level === 'majority'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 11, fontWeight: 500, padding: '1px 6px', borderRadius: 3,
      flexShrink: 0, whiteSpace: 'nowrap',
      background: isStrong ? 'var(--accent-light)' : 'var(--bg-base)',
      color: isStrong ? 'var(--accent)' : 'var(--text-tertiary)',
      border: `1px solid ${isStrong ? 'var(--accent-light)' : 'var(--border)'}`,
    }}>
      <Brain size={10} weight="fill" aria-hidden="true" />
      {count > 0 ? `${count} Modelle` : 'Deep Review'}
    </span>
  )
}

export default function RecommendationCard({
  group, recommendation, isExternalProject,
  onMarkFixed, onMarkNotRelevant,
  runId, deepReview,
}: RecommendationCardProps) {
  const t = useTranslations('audit')
  const [filesExpanded, setFilesExpanded] = useState(false)
  const [contentExpanded, setContentExpanded] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showNotRelevant, setShowNotRelevant] = useState(false)
  const [justFixed, setJustFixed] = useState(false)

  const filePaths = group.findings.map((f) => f.file_path).filter(Boolean) as string[]
  const uniqueFiles = [...new Set(filePaths)]

  function handleFixed() {
    onMarkFixed(group)
    setJustFixed(true)
    setTimeout(() => setJustFixed(false), 5000)
  }

  return (
    <>
      <div style={{ marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        {/* Header row */}
        <div
          style={{
            display: 'flex', alignItems: 'center',
            padding: '10px 14px', cursor: 'pointer', userSelect: 'none',
            borderBottom: contentExpanded ? '1px solid var(--border)' : 'none',
            gap: 8,
          }}
          onClick={() => setContentExpanded((v) => !v)}
        >
          {/* Expand chevron */}
          <span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
            {contentExpanded
              ? <CaretDown size={12} weight="bold" aria-hidden="true" />
              : <CaretRight size={12} weight="bold" aria-hidden="true" />}
          </span>

          {/* Severity dot */}
          <span style={{
            display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
            background: SEV_COLOR[group.severity], flexShrink: 0,
          }} aria-hidden="true" />

          {/* Agent badge */}
          {group.agentSource && group.agentSource !== 'core' && (
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '1px 5px', borderRadius: 3,
              border: '1px solid var(--border)', color: 'var(--text-tertiary)',
              flexShrink: 0, whiteSpace: 'nowrap',
            }}>
              {AGENT_LABEL[group.agentSource] ?? group.agentSource}
            </span>
          )}

          <DeepReviewBadge level={deepReview?.level} count={deepReview?.count ?? 0} />

          {/* Title */}
          <span style={{
            flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
          }}>
            {recommendation?.title ?? group.baseMessage}
          </span>

          {/* Rule ID — hidden, kept as data attribute for debugging */}

          {/* Count */}
          <span style={{
            fontSize: 11, padding: '1px 6px', borderRadius: 4, flexShrink: 0,
            border: '1px solid var(--border)', color: 'var(--text-tertiary)',
          }}>
            {t('filesCount', { count: group.count })}
          </span>

          {/* fixType badge */}
          <span style={{
            fontSize: 11, fontWeight: 500, padding: '1px 6px', borderRadius: 4, flexShrink: 0,
            ...FIX_TYPE_STYLE[group.fixType],
          }}>
            {t(`fixTypeBadge${group.fixType === 'code-fix' ? 'CodeFix' : group.fixType === 'code-gen' ? 'CodeGen' : group.fixType === 'refactoring' ? 'Refactoring' : 'Manual'}`)}
          </span>

          {/* Severity badge */}
          <span style={{
            fontSize: 11, fontWeight: 500, padding: '1px 6px', borderRadius: 4, flexShrink: 0,
            color: SEV_COLOR[group.severity],
            border: `1px solid ${SEV_COLOR[group.severity]}`,
          }}>
            {SEV_LABEL[group.severity]}
          </span>
        </div>

        {contentExpanded && (
          <div style={{ padding: '12px 16px 14px' }}>
            {recommendation ? (
              <>
                {/* Fix approach — small plain tag */}
                <div style={{ marginBottom: 10 }}>
                  <span style={{
                    display: 'inline-block', fontSize: 10, fontWeight: 700,
                    padding: '1px 6px', borderRadius: 3,
                    border: '1px solid var(--border)', color: 'var(--text-tertiary)',
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    {FIX_APPROACH_LABEL[recommendation.fixApproach]}
                  </span>
                </div>

                {/* Problem / Impact */}
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 4px' }}>
                    {recommendation.problem}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>{t('impact')} </span>
                    {recommendation.impact}
                  </p>
                </div>

                {/* Strategy */}
                <div style={{ paddingLeft: 16, borderLeft: '2px solid var(--border)', marginBottom: 10 }}>
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: 'var(--text-tertiary)', margin: '0 0 3px',
                  }}>
                    {t('strategy')}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                    {recommendation.strategy}
                  </p>
                </div>

                {/* Manual checklist layout — replaces firstStep monospace block for manual findings */}
                {group.fixType === 'manual' && recommendation.manualSteps ? (
                  <>
                    <div style={{
                      borderRadius: 6, border: '1px solid var(--border)',
                      background: 'var(--bg-base)', marginBottom: 12, overflow: 'hidden',
                    }}>
                      <div style={{
                        padding: '7px 12px', borderBottom: '1px solid var(--border)',
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                        textTransform: 'uppercase', color: 'var(--text-tertiary)',
                      }}>
                        Was du tun musst
                      </div>
                      <ol style={{ margin: 0, padding: '10px 12px 10px 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {recommendation.manualSteps.map((step, i) => (
                          <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '0 12px' }}>
                            <span style={{
                              fontFamily: 'var(--font-mono, monospace)', fontSize: 11,
                              color: 'var(--text-tertiary)', fontWeight: 600,
                              minWidth: 20, flexShrink: 0, paddingTop: 1,
                            }}>
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.55 }}>
                              {step}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Inline code snippets */}
                    {recommendation.codeSnippets?.map((snippet, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <p style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                          color: 'var(--text-tertiary)', margin: '0 0 4px',
                        }}>
                          Kopiere in: {snippet.tool}
                        </p>
                        <pre style={{
                          fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0,
                          fontFamily: 'var(--font-mono, monospace)',
                          background: 'rgba(26,23,20,0.06)', padding: '8px 10px', borderRadius: 4,
                          overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                          {snippet.code}
                        </pre>
                      </div>
                    ))}

                    {/* Verification criterion */}
                    {recommendation.verification && (
                      <div style={{
                        display: 'flex', gap: 8, alignItems: 'flex-start',
                        padding: '8px 10px', borderRadius: 5,
                        background: 'rgba(45,122,80,0.06)', border: '1px solid rgba(45,122,80,0.2)',
                        marginBottom: 12,
                      }}>
                        <SealCheck size={14} weight="fill" color="var(--accent)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Wann du fertig bist: </span>
                          {recommendation.verification}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Prompt-based first step — for code-fix, code-gen, refactoring */
                  <div style={{ paddingLeft: 16, borderLeft: '2px solid var(--border)', marginBottom: 12 }}>
                    <p style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: 'var(--text-tertiary)', margin: '0 0 3px',
                    }}>
                      {t('firstStep')}
                    </p>
                    <p style={{
                      fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0,
                      whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono, monospace)',
                      background: 'var(--border)', padding: '6px 8px', borderRadius: 4,
                    }}>
                      {recommendation.firstStep}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                {group.baseMessage}
              </p>
            )}

            {/* Cross-rule annotation — shows other rule groups that affect the same file(s) */}
            {group.alsoAffectedByRules && group.alsoAffectedByRules.length > 0 && (
              <div style={{
                fontSize: 11,
                color: 'var(--text-tertiary)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexWrap: 'wrap',
              }}>
                <span>betrifft auch:</span>
                {group.alsoAffectedByRules.map((r) => (
                  <span key={r.ruleId} style={{
                    padding: '1px 6px',
                    borderRadius: 3,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    fontSize: 10,
                  }}>
                    {r.label}
                  </span>
                ))}
              </div>
            )}

            {/* Expandable file list */}
            {uniqueFiles.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setFilesExpanded((v) => !v)}
                >
                  {filesExpanded
                    ? <CaretDown size={11} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
                    : <CaretRight size={11} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
                  }
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {filesExpanded ? t('hideFiles') : t('affectedFiles', { count: uniqueFiles.length })}
                  </span>
                </button>
                {filesExpanded && (
                  <div style={{
                    marginTop: 8, padding: '8px 10px', borderRadius: 5,
                    background: 'var(--border)', display: 'flex', flexDirection: 'column', gap: 3,
                  }}>
                    {uniqueFiles.map((fp) => (
                      <code key={fp} style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>
                        {fp}
                      </code>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions: Fix-Prompt (primary) + Erledigt + Nicht relevant */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Fix-Prompt — primary action for non-manual findings */}
              {!(group.fixType === 'manual' && recommendation?.manualSteps) && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setDrawerOpen(true)}
                  style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent)', fontWeight: 600 }}
                >
                  <ClipboardText size={13} weight="bold" aria-hidden="true" /> {t('viewFixPrompt')}
                </button>
              )}

              {/* Erledigt */}
              {justFixed ? (
                <span style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={13} weight="fill" aria-hidden="true" />
                  Erledigt
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setJustFixed(false) }}
                    style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 4 }}
                  >
                    Rückgängig
                  </button>
                </span>
              ) : (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleFixed}
                  style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Check size={13} weight="bold" aria-hidden="true" />
                  Erledigt
                </button>
              )}

              {/* Nicht relevant — expands dropdown */}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowNotRelevant((v) => !v)}
                style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <X size={13} weight="bold" aria-hidden="true" />
                Nicht relevant
                {showNotRelevant
                  ? <CaretUp size={10} weight="bold" aria-hidden="true" />
                  : <CaretDown size={10} weight="bold" aria-hidden="true" />}
              </button>
            </div>

            {/* Deep Fix — only for committee-discovered findings (deepReview set) */}
            {runId && deepReview && !(group.fixType === 'manual' && recommendation?.manualSteps) && (
              <DeepFixButton
                findingId={group.findings[0].id}
                runId={runId}
              />
            )}

            {/* Not-relevant reason dropdown (inline, no modal) */}
            {showNotRelevant && (
              <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '0 0 6px' }}>Warum ist das nicht relevant?</p>
                {NOT_RELEVANT_REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    className="btn btn-ghost btn-sm"
                    onClick={() => { onMarkNotRelevant(group, reason.id); setShowNotRelevant(false) }}
                    style={{ fontSize: 12, display: 'block', width: '100%', textAlign: 'left', padding: '4px 8px', color: 'var(--text-secondary)' }}
                  >
                    {reason.label_de}
                  </button>
                ))}
              </div>
            )}

            {/* Feedback link */}
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <a href="mailto:feedback@tropenresearch.dev" style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'underline' }}>
                {t('feedbackLink')}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Fix-Prompt Drawer */}
      <FixPromptDrawer
        mode="group"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ruleId={cleanRuleId(group.ruleId)}
        baseMessage={group.baseMessage}
        affectedFiles={uniqueFiles}
      />
    </>
  )
}
