import { Link } from '@/i18n/navigation'
import { getLpContent } from './lp-content'

function C({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(20px, 5vw, 56px)' }}>{children}</div>
}

export function LpFooter({ locale }: { locale: string }) {
  const { footer } = getLpContent(locale)

  return (
    <footer style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border)', padding: 'clamp(48px, 6vw, 72px) 0 28px' }}>
      <C>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 32, marginBottom: 48, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.025em', color: 'var(--text-primary)', display: 'block', marginBottom: 14 }}>
              {footer.brand}
            </span>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 240, marginBottom: 20 }}>
              {footer.brandSub}
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              {footer.socials.map(s => (
                <a key={s} href="#" className="lp-footer-link" style={{ marginBottom: 0 }}>{s}</a>
              ))}
            </div>
          </div>
          {footer.cols.map(col => (
            <div key={col.title}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 16 }}>{col.title}</span>
              {col.links.map(l => <Link key={l.label} href={l.href} className="lp-footer-link">{l.label}</Link>)}
            </div>
          ))}
        </div>

        <div style={{ paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{footer.copy}</p>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-tertiary)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            {footer.badge}
          </span>
        </div>
      </C>
    </footer>
  )
}
