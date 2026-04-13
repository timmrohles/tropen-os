'use client'

import { useState, useEffect } from 'react'

interface Step {
  n: string
  title: string
  desc: string
  file: string
  code: string
}

interface Props {
  steps: Step[]
  badgeRules: string
}

export default function HowItWorksClient({ steps, badgeRules }: Props) {
  const [active, setActive] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActive(p => (p + 1) % steps.length)
      setTick(p => p + 1)
    }, 5000)
    return () => clearInterval(id)
  }, [steps.length])

  const step = steps[active]

  return (
    <div suppressHydrationWarning style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'start' }}>
      {/* Steps */}
      <div>
        {steps.map((s, i) => (
          <button
            key={s.n}
            type="button"
            onClick={() => setActive(i)}
            style={{
              width: '100%', textAlign: 'left',
              padding: '28px 0',
              background: 'transparent', border: 'none',
              borderBottomWidth: 1, borderBottomStyle: 'solid',
              borderBottomColor: 'rgba(255,255,255,0.08)',
              cursor: 'pointer',
              opacity: active === i ? 1 : 0.38,
              transition: 'opacity 400ms',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
              <span style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 28, color: 'rgba(255,255,255,0.15)', lineHeight: 1, flexShrink: 0, paddingTop: 3 }}>
                {s.n}
              </span>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(18px, 2.5vw, 26px)', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', marginBottom: 8 }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>{s.desc}</p>
                {active === i && (
                  <div style={{ marginTop: 16, height: 1, background: 'rgba(26,23,20,0.08)', overflow: 'hidden' }}>
                    <div key={tick} style={{ height: '100%', background: 'var(--accent)', width: 0, animation: 'lp-progress 5s linear forwards' }} />
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Code panel */}
      <div style={{ position: 'sticky', top: 88 }}>
        <div style={{ border: '1px solid rgba(26,23,20,0.15)', borderRadius: 2, overflow: 'hidden', background: 'var(--active-bg)' }}>
          {/* Title bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', gap: 7 }}>
              {[0, 1, 2].map(d => <span key={d} style={{ width: 11, height: 11, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />)}
            </div>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              {step.file}
            </span>
            <span style={{ width: 52 }} />
          </div>
          {/* Code */}
          <pre key={tick} style={{
            margin: 0, padding: '24px 24px 28px',
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            fontSize: 12, lineHeight: 1.85, color: 'rgba(255,255,255,0.72)',
            overflowX: 'auto', whiteSpace: 'pre', minHeight: 200,
          }}>
            {step.code}
          </pre>
          {/* Status bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80' }} />
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Ready</span>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20, background: 'rgba(45,122,80,0.2)', color: 'var(--accent)', border: '1px solid rgba(45,122,80,0.3)' }}>
            {badgeRules}
          </span>
          {['Cursor', 'Claude Code', 'Windsurf'].map(t => (
            <span key={t} style={{ fontSize: 11, padding: '4px 11px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
