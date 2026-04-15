'use client'

import { useState } from 'react'
import { Lightning, Copy, CheckCircle, CaretDown } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'
import { findRecommendation } from '@/lib/audit/finding-recommendations'
import { cleanRuleId } from '@/lib/audit/group-findings'

interface QuickWin {
  ruleId: string
  severity: string
  message: string
  suggestion: string | null
  estimatedScoreGain: number
  fixType: string
  filePath?: string | null
}

interface QuickWinsCardProps {
  quickWins: QuickWin[]
}

export default function QuickWinsCard({ quickWins }: QuickWinsCardProps) {
  const t = useTranslations('audit')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  if (quickWins.length === 0) return null

  const visible = showAll ? quickWins : quickWins.slice(0, 3)
  const remaining = quickWins.length - 3

  const handleCopy = async (win: QuickWin) => {
    const text = win.suggestion ?? win.message
    await navigator.clipboard.writeText(text).catch(() => { /* ignore */ })
    setCopiedId(win.ruleId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const sevColor = (sev: string) =>
    sev === 'critical' || sev === 'high' ? 'var(--error)' : 'var(--text-secondary)'

  return (
    <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Lightning size={18} color="var(--accent)" weight="fill" aria-hidden="true" />
        <div>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('quickWinsTitle')}
          </span>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
            {t('quickWinsSub')}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {visible.map((win) => {
          const rec = findRecommendation(cleanRuleId(win.ruleId), win.message)
          return (
            <div key={win.ruleId} style={{ paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              {/* Header: dot + message + score gain */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: sevColor(win.severity) }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>
                  {rec?.title ?? win.message}
                </span>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {t('quickWinsGain', { gain: win.estimatedScoreGain })}
                </span>
              </div>

              {/* Strategy (if recommendation exists) */}
              {rec?.strategy && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px', paddingLeft: 16, lineHeight: 1.5 }}>
                  {rec.strategy}
                </p>
              )}

              {/* First step / suggestion as copyable block */}
              {(rec?.firstStep ?? win.suggestion) && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginLeft: 16, background: 'var(--bg-base)', borderRadius: 6, padding: '8px 10px' }}>
                  <code style={{ fontSize: 12, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)', flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {rec?.firstStep ?? win.suggestion}
                  </code>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleCopy({ ...win, suggestion: rec?.firstStep ?? win.suggestion })}
                    aria-label={t('copyPrompt')}
                    style={{ flexShrink: 0, padding: '4px 6px' }}
                  >
                    {copiedId === win.ruleId
                      ? <CheckCircle size={14} color="var(--accent)" weight="fill" aria-hidden="true" />
                      : <Copy size={14} weight="bold" aria-hidden="true" />}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Show more link */}
      {!showAll && remaining > 0 && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0 0',
            fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {remaining} weitere anzeigen
          <CaretDown size={11} weight="bold" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
