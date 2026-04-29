'use client'

import { useState } from 'react'
import { Leaf } from '@phosphor-icons/react'

interface Co2CardProps {
  co2Min: number
  co2Max: number
  periodLabel: string
}

function formatG(g: number): string {
  if (g < 1) return `${(g * 1000).toFixed(0)} mg`
  return `${g.toFixed(2)} g`
}

export default function Co2Card({ co2Min, co2Max, periodLabel }: Co2CardProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false)

  return (
    <div
      className="card"
      style={{
        padding: '16px 20px',
        position: 'relative',
      }}
    >
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontWeight: 500 }}>
        Geschätzter CO₂-Verbrauch
      </p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {formatG(co2Min)}
        </span>
        <span style={{ fontSize: 18, color: 'var(--text-tertiary)' }}>–</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
          {formatG(co2Max)}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 2 }}>CO₂</span>

        <div style={{ position: 'relative', marginLeft: 4 }}>
          <button
            style={{
              background: 'none',
              border: '1px solid var(--border-medium)',
              borderRadius: '50%',
              width: 16, height: 16, fontSize: 10,
              color: 'var(--text-tertiary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1, padding: 0,
            }}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            onFocus={() => setTooltipVisible(true)}
            onBlur={() => setTooltipVisible(false)}
            aria-label="Hinweis zur Berechnung"
          >
            i
          </button>
          {tooltipVisible && (
            <div
              style={{
                position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '10px 12px', width: 240, zIndex: 50,
                fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
                boxShadow: '0 8px 24px rgba(26,23,20,0.12)',
              }}
            >
              Eine präzise Berechnung ist heute noch nicht möglich. Diese Schätzung basiert auf
              veröffentlichten Richtwerten je Modellklasse. Wir arbeiten an einem genaueren Framework.
              <div
                style={{
                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                  width: 0, height: 0,
                  borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                  borderTop: '5px solid var(--border)',
                }}
              />
            </div>
          )}
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>
        {periodLabel} · basierend auf Modellklasse
      </p>

      <Leaf
        size={18}
        weight="fill"
        style={{ position: 'absolute', top: 16, right: 16, opacity: 0.3, color: 'var(--accent)' }}
      />
    </div>
  )
}
