import Link from 'next/link'

function C({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(20px, 5vw, 56px)' }}>{children}</div>
}

export function LpFooter() {
  return (
    <footer style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border)', padding: 'clamp(48px, 6vw, 72px) 0 28px' }}>
      <C>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 32, marginBottom: 48, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.025em', color: 'var(--text-primary)', display: 'block', marginBottom: 14 }}>
              Tropen OS
            </span>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 240, marginBottom: 20 }}>
              Production Readiness Guide für Vibe-Coders. Gebaut in Brandenburg. EU-Server.
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              {['GitHub', 'Twitter'].map(s => (
                <a key={s} href="#" className="lp-footer-link" style={{ marginBottom: 0 }}>{s}</a>
              ))}
            </div>
          </div>
          {[
            { title: 'Produkt', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'Kategorien', href: '#kategorien' }] },
            { title: 'Entwickler', links: [{ label: '.cursorrules', href: '#' }, { label: 'Dokumentation', href: '#' }] },
            { title: 'Rechtliches', links: [{ label: 'Impressum', href: '/impressum' }, { label: 'Datenschutz', href: '/datenschutz' }, { label: 'Barrierefreiheit', href: '/barrierefreiheit' }] },
          ].map(col => (
            <div key={col.title}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 16 }}>{col.title}</span>
              {col.links.map(l => <Link key={l.label} href={l.href} className="lp-footer-link">{l.label}</Link>)}
            </div>
          ))}
        </div>

        <div style={{ paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>© 2026 Tropen OS. All rights reserved.</p>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-tertiary)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            EU-Server · DSGVO-konform
          </span>
        </div>
      </C>
    </footer>
  )
}
