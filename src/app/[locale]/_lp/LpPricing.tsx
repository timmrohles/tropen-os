import { Link } from '@/i18n/navigation'
import { Check, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { getLpContent } from './lp-content'

function C({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(20px, 5vw, 56px)' }}>{children}</div>
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--accent)', marginBottom: 20, letterSpacing: '0.02em' }}>
      <span style={{ width: 28, height: 1, background: 'rgba(63,74,85,0.3)', flexShrink: 0 }} />
      {children}
    </span>
  )
}

export function LpPricing({ locale }: { locale: string }) {
  const c = getLpContent(locale)
  const { pricing } = c

  return (
    <section id="pricing" style={{ background: 'var(--bg-base)', padding: 'clamp(72px, 10vw, 96px) 0' }}>
      <C>
        <div style={{ maxWidth: 640, marginBottom: 52 }}>
          <Tag>{pricing.tag}</Tag>
          <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 0.95, marginBottom: 16 }}>
            {pricing.h2[0]}<br />
            <span style={{ color: 'var(--text-tertiary)' }}>{pricing.h2[1]}</span>
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{pricing.sub}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{pricing.toggle.monthly}</span>
          <div style={{ width: 48, height: 26, background: 'rgba(26,23,20,0.08)', borderRadius: 13, padding: 3, position: 'relative' }}>
            <div style={{ width: 20, height: 20, background: 'var(--accent)', borderRadius: '50%' }} />
          </div>
          <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
            {pricing.toggle.yearly}{' '}
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)', background: 'var(--accent)', color: '#ffffff', padding: '2px 6px', marginLeft: 6 }}>{pricing.toggle.discount}</span>
          </span>
        </div>

        <div className="lp-pricing-grid">
          {pricing.plans.map((plan, idx) => (
            <div key={plan.id} className={idx === 1 ? 'lp-pricing-cell lp-pricing-cell-pop' : 'lp-pricing-cell'} style={{ position: 'relative' }}>
              {idx === 1 && (
                <span style={{ position: 'absolute', top: -11, left: 24, background: 'var(--secondary)', color: 'var(--text-primary)', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', padding: '3px 12px', letterSpacing: '0.07em' }}>
                  Most Popular
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: idx === 1 ? 'var(--accent)' : 'var(--text-tertiary)' }}>{plan.n}</span>
              <h3 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, marginBottom: 4 }}>{plan.name}</h3>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>{plan.desc}</p>
              <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: idx === 2 ? 36 : 52, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-tertiary)', marginLeft: idx === 2 ? 4 : 0 }}>{plan.unit}</span>
                </div>
              </div>
              <ul style={{ flex: 1, listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: 'var(--text-secondary)' }}>
                    <Check size={14} weight="bold" color="var(--text-primary)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={idx === 1 ? 'lp-cta-accent' : undefined}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 0', border: idx === 1 ? undefined : '1px solid rgba(26,23,20,0.2)', fontSize: 14, color: idx === 1 ? '#ffffff' : 'var(--text-primary)', textDecoration: 'none', fontWeight: idx === 1 ? 600 : 500 }}
              >
                {plan.cta}
                <ArrowRight size={14} weight="bold" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
          {pricing.footnote}
        </p>
      </C>
    </section>
  )
}
