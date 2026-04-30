/* eslint-disable unicorn/filename-case */
import { Link } from '@/i18n/navigation'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'

export function FinalCTA({ locale: _locale }: { locale: string }) {
  return (
    <section style={{ background: 'var(--gradient-data)', padding: 'clamp(60px, 8vw, 100px) 0' }}>
      <div className="section-inner--narrow" style={{ textAlign: 'center' }}>
        <h2 style={{
          fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          color: 'var(--text-primary)',
          lineHeight: 1.1,
          marginBottom: 16,
        }}>
          Audit jetzt.
        </h2>
        <p style={{
          fontSize: 17, color: 'var(--text-secondary)',
          lineHeight: 1.65, marginBottom: 32, maxWidth: 440, margin: '0 auto 32px',
        }}>
          60 Sekunden. Score + Top-Findings. Fix-Prompts direkt für Cursor.
        </p>
        <Link
          href="/login"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '14px 32px', fontSize: 16, fontWeight: 600 }}
        >
          Los geht&apos;s
          <ArrowRight size={16} weight="bold" aria-hidden="true" />
        </Link>
        <p style={{ marginTop: 16, fontSize: 13, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-tertiary)' }}>
          Kein Account nötig für den ersten Scan.
        </p>
      </div>
    </section>
  )
}
