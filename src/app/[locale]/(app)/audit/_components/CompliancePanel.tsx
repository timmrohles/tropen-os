'use client'

import { useTranslations } from 'next-intl'
import { Info } from '@phosphor-icons/react'

export interface ComplianceDomainInfo {
  id: string
  name: string
  emoji: string
  maxFineText: string
  relevant: boolean
  findingsCount: number
  totalRules: number
}

interface CompliancePanelProps {
  domains: ComplianceDomainInfo[]
}

function AmpelDot({ findingsCount, totalRules }: { findingsCount: number; totalRules: number }) {
  const ratio = totalRules > 0 ? findingsCount / totalRules : 0
  let color = 'var(--status-production)'
  if (findingsCount > 0 && ratio < 0.5) color = 'var(--status-risky)'
  if (ratio >= 0.5) color = 'var(--status-prototype)'

  return (
    <span
      style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color, display: 'inline-block', flexShrink: 0,
      }}
      aria-hidden="true"
    />
  )
}

export default function CompliancePanel({ domains }: CompliancePanelProps) {
  const t = useTranslations('audit')

  if (domains.length === 0) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center' }}>
        <Info size={16} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '8px 0 0' }}>
          {t('complianceNoProfile')}
        </p>
      </div>
    )
  }

  return (
    <div>
      <span style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
        color: 'var(--text-tertiary)', textTransform: 'uppercase' as const,
        display: 'block', marginBottom: 12,
      }}>
        {t('complianceTitle')}
      </span>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {domains.map((domain) => (
          <div
            key={domain.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
              borderBottom: '1px solid var(--border)',
              opacity: domain.relevant ? 1 : 0.5,
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0, width: 22, textAlign: 'center' }}>
              {domain.emoji}
            </span>

            <span style={{
              flex: 1, fontSize: 13, color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {domain.name}
            </span>

            {domain.relevant ? (
              <>
                {domain.findingsCount > 0 && (
                  <span style={{
                    fontSize: 11, padding: '1px 6px', borderRadius: 4,
                    border: '1px solid var(--border)', color: 'var(--text-tertiary)',
                    fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                  }}>
                    {domain.findingsCount}
                  </span>
                )}
                <AmpelDot findingsCount={domain.findingsCount} totalRules={domain.totalRules} />
              </>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                {t('complianceNA')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
