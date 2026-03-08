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
      style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: 12,
        padding: '16px 20px',
        position: 'relative',
      }}
    >
      {/* Label */}
      <p style={{ fontSize: 11, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontWeight: 500 }}>
        Geschätzter CO₂-Verbrauch
      </p>

      {/* Value + Info icon row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
          {formatG(co2Min)}
        </span>
        <span style={{ fontSize: 18, color: '#52525b' }}>–</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
          {formatG(co2Max)}
        </span>
        <span style={{ fontSize: 12, color: '#71717a', marginLeft: 2 }}>CO₂</span>

        {/* Info-Icon mit Tooltip */}
        <div style={{ position: 'relative', marginLeft: 4 }}>
          <button
            style={{
              background: 'none', border: '1px solid #3f3f46', borderRadius: '50%',
              width: 16, height: 16, fontSize: 10, color: '#71717a',
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
                background: '#27272a', border: '1px solid #3f3f46', borderRadius: 8,
                padding: '10px 12px', width: 240, zIndex: 50,
                fontSize: 11, color: '#a1a1aa', lineHeight: 1.5,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              Eine präzise Berechnung ist heute noch nicht möglich. Diese Schätzung basiert auf
              veröffentlichten Richtwerten je Modellklasse. Wir arbeiten an einem genaueren Framework.
              <div
                style={{
                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                  width: 0, height: 0,
                  borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                  borderTop: '5px solid #3f3f46',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sub-label */}
      <p style={{ fontSize: 11, color: '#52525b', margin: '6px 0 0' }}>
        {periodLabel} · basierend auf Modellklasse
      </p>

      {/* Leaf icon dekorativ */}
      <Leaf size={18} weight="duotone" style={{ position: 'absolute', top: 16, right: 16, opacity: 0.4, color: '#52525b' }} />
    </div>
  )
}
