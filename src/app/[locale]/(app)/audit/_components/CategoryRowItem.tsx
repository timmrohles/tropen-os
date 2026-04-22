'use client'

import { useState } from 'react'
import { Info, CaretRight, CaretDown } from '@phosphor-icons/react'
import type { AgentSource } from '@/lib/audit/types'
import { CATEGORY_DESCRIPTIONS } from './category-descriptions'
import { useTranslations } from 'next-intl'

interface DbCategoryScore {
  id: string
  category_id: number
  category_name: string
  category_weight: number
  score: number
  max_score: number
  automated_rule_count: number
  manual_rule_count: number
}

/** Category IDs where live DB checks would improve coverage */
const LIVE_CHECK_CATEGORIES = new Set([3, 5])

export interface CategoryRowItemProps {
  cat: DbCategoryScore
  openCount: number
  isHighlighted: boolean
  isExpanded: boolean
  agentSource: AgentSource | undefined
  agentInfo: { label: string; color: string } | undefined
  onToggleExpand: () => void
  onCategoryClick: () => void
  hasFindings: boolean
  /** When true, shows a "Live-Check fehlt" hint on DB + Security categories */
  showLiveCheckHint?: boolean
  /** Number of rules in this category that require external tools (Lighthouse, depcruise, etc.) */
  externalToolRuleCount?: number
  /** False when no Lighthouse findings were found — indicates external tools didn't run */
  hasExternalTools?: boolean
}

function scoreColor(score: number): string {
  const pct = (score / 5) * 100
  if (pct >= 80) return 'var(--status-production)'
  if (pct >= 60) return 'var(--status-stable)'
  if (pct >= 30) return 'var(--status-risky)'
  return 'var(--status-prototype)'
}

const AGENT_FULL_LABELS: Partial<Record<AgentSource, string>> = {
  architecture:     'Architecture Agent',
  security:         'Security Agent',
  observability:    'Observability Agent',
  testing:          'Testing Agent',
  database:         'Database Agent',
  dependencies:     'Dependencies Agent',
  performance:      'Performance Agent',
  'security-scan':  'Security Scan',
  'ai-integration': 'AI Integration Agent',
  'git-governance': 'Git Governance Agent',
  'backup-dr':      'Backup & DR Agent',
  platform:         'Platform/CI Agent',
  api:              'API Agent',
  dsgvo:            'DSGVO Agent',
  bfsg:             'BFSG Agent',
  'ai-act':         'AI Act Agent',
}

function ExternalToolHint({ count }: { count: number }) {
  const t = useTranslations('audit')
  const [visible, setVisible] = useState(false)
  return (
    <span
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{ marginLeft: 4, color: 'var(--text-tertiary)', flexShrink: 0, cursor: 'help', display: 'flex', position: 'relative' }}
      aria-label={t('categoryExternalHint', { count })}
    >
      <Info size={12} weight="bold" aria-hidden="true" />
      {visible && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 20,
          marginTop: 4, padding: '8px 12px',
          background: 'var(--bg-tooltip)',
          border: '1px solid var(--border)',
          borderRadius: 8, fontSize: 12,
          color: 'var(--text-secondary)', lineHeight: 1.5,
          width: 220, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          pointerEvents: 'none',
        }}>
          {t('categoryExternalHint', { count })}
        </div>
      )}
    </span>
  )
}

function InfoTooltip({ description, isManualOnly }: { description: string; isManualOnly: boolean }) {
  const [visible, setVisible] = useState(false)
  return (
    <span
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{ marginLeft: 4, color: 'var(--text-tertiary)', flexShrink: 0, cursor: 'help', display: 'flex', position: 'relative' }}
    >
      <Info size={12} weight="bold" aria-hidden="true" />
      {visible && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 20,
          marginTop: 4, padding: '8px 12px',
          background: 'var(--bg-tooltip)',
          border: '1px solid var(--border)',
          borderRadius: 8, fontSize: 12,
          color: 'var(--text-secondary)', lineHeight: 1.5,
          width: 240, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          pointerEvents: 'none',
        }}>
          {description}
          {isManualOnly && (
            <p style={{ marginTop: 6, fontSize: 11, color: 'var(--accent)' }}>
              → Starte einen Deep Review für eine KI-Bewertung
            </p>
          )}
        </div>
      )}
    </span>
  )
}

export default function CategoryRowItem({
  cat, openCount, isHighlighted, isExpanded,
  agentSource, agentInfo,
  onToggleExpand, onCategoryClick, hasFindings,
  showLiveCheckHint = false,
  externalToolRuleCount = 0,
  hasExternalTools,
}: CategoryRowItemProps) {
  const pct = (cat.score / (cat.max_score || 5)) * 100
  const color = scoreColor(cat.score)
  const isManualOnly = cat.automated_rule_count === 0
  const hasAgent = agentSource !== undefined
  const cols = hasFindings ? '180px 1fr 70px 80px' : '180px 1fr 70px'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Expand toggle */}
        <button
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'Zuklappen' : 'Aufklappen'}
          aria-expanded={isExpanded}
          style={{
            width: 24, height: 24, flexShrink: 0,
            background: 'none', border: 'none',
            cursor: hasAgent ? 'pointer' : 'default',
            color: hasAgent ? 'var(--text-tertiary)' : 'transparent',
            padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {hasAgent && (isExpanded
            ? <CaretDown size={10} weight="bold" aria-hidden="true" />
            : <CaretRight size={10} weight="bold" aria-hidden="true" />)}
        </button>

        {/* Main row button */}
        <button
          onClick={onCategoryClick}
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: cols,
            alignItems: 'center',
            minHeight: 40,
            gap: 10, padding: '4px 8px',
            borderRadius: 6,
            border: `1px solid ${isHighlighted ? color : 'transparent'}`,
            background: isHighlighted ? 'var(--bg-surface)' : 'transparent',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          {/* Label */}
          <div style={{
            fontSize: 12, color: 'var(--text-primary)',
            fontWeight: cat.category_weight === 3 ? 700 : 400,
            display: 'flex', alignItems: 'center',
            position: 'relative', overflow: 'visible',
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
              {cat.category_name}
            </span>
            {cat.category_weight >= 3 && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                background: 'var(--error-bg)', color: 'var(--error)',
                marginLeft: 4, letterSpacing: '0.02em', flexShrink: 0,
              }}>
                ×{cat.category_weight}
              </span>
            )}
            {agentInfo && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, marginLeft: 4,
                background: `color-mix(in srgb, ${agentInfo.color} 15%, transparent)`,
                color: agentInfo.color, letterSpacing: '0.03em', flexShrink: 0,
              }}>
                {agentInfo.label}
              </span>
            )}
            {CATEGORY_DESCRIPTIONS[cat.category_name] && (
              <InfoTooltip
                description={CATEGORY_DESCRIPTIONS[cat.category_name]}
                isManualOnly={isManualOnly}
              />
            )}
            {showLiveCheckHint && LIVE_CHECK_CATEGORIES.has(cat.category_id) && (
              <span
                title="Live-DB-Check fehlt — Score basiert nur auf Code-Analyse"
                style={{
                  fontSize: 9, marginLeft: 4, flexShrink: 0,
                  color: 'var(--status-risky)',
                  cursor: 'help',
                }}
                aria-label="Live-Check fehlt"
              >
                ⚠
              </span>
            )}
            {!hasExternalTools && externalToolRuleCount > 0 && (
              <ExternalToolHint count={externalToolRuleCount} />
            )}
          </div>

          {/* Score bar — capped at 120px so it doesn't dominate */}
          <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden', maxWidth: 120 }}>
            {!isManualOnly && (
              <div style={{
                height: '100%', width: `${Math.min(100, pct)}%`,
                background: color, borderRadius: 2, transition: 'width 0.4s ease',
              }} />
            )}
          </div>

          {/* Score label */}
          {isManualOnly ? (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right', lineHeight: 1.3 }}>
              Nicht auto-<br />prüfbar
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 600, color, textAlign: 'right' }}>
              {cat.score.toFixed(1)} / {cat.max_score.toFixed(0)}
            </span>
          )}

          {/* Open findings — always tertiary, no color signal here */}
          {hasFindings && (
            openCount > 0 ? (
              <span style={{
                fontSize: 11, color: 'var(--text-tertiary)',
                textAlign: 'right', fontVariantNumeric: 'tabular-nums',
              }}>
                {openCount} offen →
              </span>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right' }}>
                —
              </span>
            )
          )}
        </button>
      </div>

      {/* Sub-agent detail row */}
      {isExpanded && hasAgent && agentSource && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 80px 90px 50px',
          alignItems: 'center', gap: 8,
          padding: '4px 8px 4px 28px', marginLeft: 20,
          borderLeft: `2px solid ${agentInfo?.color ?? 'var(--border)'}`,
          opacity: 0.85,
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {AGENT_FULL_LABELS[agentSource] ?? agentSource}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'right' }}>
            {cat.automated_rule_count} Regeln
          </span>
          <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden', maxWidth: 100 }}>
            {!isManualOnly && (
              <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 2 }} />
            )}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color, textAlign: 'right' }}>
            {isManualOnly ? '—' : cat.score.toFixed(1)}
          </span>
        </div>
      )}
      {isExpanded && !hasAgent && (
        <p style={{ paddingLeft: 28, fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 4px' }}>
          Nur durch Deep Review bewertbar.
        </p>
      )}
    </div>
  )
}
