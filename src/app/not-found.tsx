import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="content-narrow" style={{ textAlign: 'center' }}>
      <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
        Seite nicht gefunden
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Die angeforderte Seite existiert nicht.
      </p>
      <Link href="/dashboard" className="btn btn-primary">
        Zum Dashboard
      </Link>
    </div>
  )
}
