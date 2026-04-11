import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'

function C({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(20px, 5vw, 56px)' }}>{children}</div>
}

export function LpCta() {
  return (
    <section style={{ background: 'var(--active-bg)', padding: 'clamp(60px, 8vw, 80px) 0' }}>
      <C>
        <div className="lp-cta-box-dark" style={{ padding: 'clamp(48px, 6vw, 80px) clamp(32px, 5vw, 64px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.035em', color: '#ffffff', lineHeight: 0.95, marginBottom: 20 }}>
                Scan dein Projekt.<br />Bevor es jemand<br />anderes tut.
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, maxWidth: 420, marginBottom: 36 }}>
                60 Sekunden. Kostenlos. Keine Kreditkarte.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/login" className="lp-cta-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', textDecoration: 'none', fontSize: 15, fontWeight: 600, color: '#ffffff' }}>
                  Jetzt kostenlos scannen
                  <ArrowRight size={15} weight="bold" aria-hidden="true" />
                </Link>
              </div>
              <p style={{ marginTop: 20, fontSize: 13, fontFamily: 'var(--font-mono, monospace)', color: 'rgba(255,255,255,0.35)' }}>
                Keine Kreditkarte erforderlich
              </p>
            </div>
          </div>
        </div>
      </C>
    </section>
  )
}
