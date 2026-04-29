'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Root fallback — fires for paths without a locale segment (e.g. /nonexistent).
// Most real 404s (under /de/* or /en/*) are caught by app/[locale]/not-found.tsx instead.
export default function NotFound() {
  const pathname = usePathname()
  const segment = pathname?.split('/')[1]
  const locale = segment === 'en' ? 'en' : 'de'

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
      <Link href={`/${locale}/dashboard`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
        Zum Dashboard
      </Link>
    </div>
  )
}
