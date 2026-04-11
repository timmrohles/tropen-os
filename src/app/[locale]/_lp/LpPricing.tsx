import Link from 'next/link'
import { Check, ArrowRight } from '@phosphor-icons/react/dist/ssr'

function C({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(20px, 5vw, 56px)' }}>{children}</div>
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--accent)', marginBottom: 20, letterSpacing: '0.02em' }}>
      <span style={{ width: 28, height: 1, background: 'rgba(45,122,80,0.3)', flexShrink: 0 }} />
      {children}
    </span>
  )
}

export function LpPricing() {
  return (
    <section id="pricing" style={{ background: 'var(--bg-base)', padding: 'clamp(72px, 10vw, 96px) 0' }}>
      <C>
        <div style={{ maxWidth: 640, marginBottom: 52 }}>
          <Tag>Pricing</Tag>
          <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 0.95, marginBottom: 16 }}>
            Einfache Preise.<br />
            <span style={{ color: 'var(--text-tertiary)' }}>Keine Überraschungen.</span>
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Start free und scale wenn du bereit bist.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>Monatlich</span>
          <div style={{ width: 48, height: 26, background: 'rgba(26,23,20,0.08)', borderRadius: 13, padding: 3, position: 'relative' }}>
            <div style={{ width: 20, height: 20, background: 'var(--accent)', borderRadius: '50%' }} />
          </div>
          <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
            Jährlich{' '}
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)', background: 'var(--accent)', color: '#ffffff', padding: '2px 6px', marginLeft: 6 }}>−17%</span>
          </span>
        </div>

        <div className="lp-pricing-grid">
          <div className="lp-pricing-cell">
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: 'var(--text-tertiary)' }}>01</span>
            <h3 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, marginBottom: 4 }}>Free</h3>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Für Hobby-Projekte</p>
            <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 52, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>€0</span>
                <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>/Monat</span>
              </div>
            </div>
            <ul style={{ flex: 1, listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['1 Projekt', '10 Scans / Monat', 'Top 5 Findings', 'Score-Tracking', '.cursorrules Export'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: 'var(--text-secondary)' }}>
                  <Check size={14} weight="bold" color="var(--text-primary)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 0', border: '1px solid rgba(26,23,20,0.2)', fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none', transition: 'border-color 200ms', fontWeight: 500 }}>
              Kostenlos starten
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </Link>
          </div>

          <div className="lp-pricing-cell lp-pricing-cell-pop">
            <span style={{ position: 'absolute', top: -11, left: 24, background: '#E5A000', color: '#ffffff', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', padding: '3px 12px', letterSpacing: '0.07em' }}>
              Most Popular
            </span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: 'var(--accent)' }}>02</span>
            <h3 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, marginBottom: 4 }}>Pro</h3>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Für Gründer die launchen wollen</p>
            <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 52, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>€39</span>
                <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>/Monat</span>
              </div>
            </div>
            <ul style={{ flex: 1, listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['3 Projekte', 'Unbegrenzte Scans', 'Deep Review (4 KI-Modelle)', 'EU-Compliance (DSGVO, BFSG, AI Act)', 'Prompt-Export', 'Aufgabenliste', 'Score-Verlauf'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: 'var(--text-secondary)' }}>
                  <Check size={14} weight="bold" color="var(--text-primary)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/login" className="lp-cta-accent" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 0', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
              14 Tage kostenlos
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </Link>
          </div>

          <div className="lp-pricing-cell">
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: 'var(--text-tertiary)' }}>03</span>
            <h3 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, marginBottom: 4 }}>Agency</h3>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Für Teams und Freelancer</p>
            <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>€199</span>
              <span style={{ fontSize: 14, color: 'var(--text-tertiary)', marginLeft: 4 }}>/Monat</span>
            </div>
            <ul style={{ flex: 1, listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Unlimitierte Projekte', 'API-Zugang', 'Compliance-Reports', 'Priority Support', 'Team-Verwaltung'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: 'var(--text-secondary)' }}>
                  <Check size={14} weight="bold" color="var(--text-primary)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 0', border: '1px solid rgba(26,23,20,0.2)', fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
              Kontakt aufnehmen
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
          Alle Pläne inklusive .cursorrules Export, HTTPS und automatische Updates.
        </p>
      </C>
    </section>
  )
}
