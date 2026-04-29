import { Link } from '@/i18n/navigation'
import { HouseSimple } from '@phosphor-icons/react/dist/ssr'

export default function NotFound() {
  return (
    <div className="content-narrow" style={{ textAlign: 'center' }}>
      <p style={{
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 12,
        color: 'var(--accent)',
        marginBottom: 16,
        letterSpacing: '0.05em',
      }}>
        404
      </p>
      <h1 style={{
        fontSize: 20,
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: 8,
      }}>
        Seite nicht gefunden
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <Link href="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
        <HouseSimple size={15} weight="fill" aria-hidden="true" />
        Zum Dashboard
      </Link>
    </div>
  )
}
