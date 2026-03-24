'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

// Nicht im Workspace/Chat anzeigen — dort ist kein Platz
const HIDE_ON = ['/workspaces/', '/chat']

export default function AppFooter() {
  const pathname = usePathname()
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null

  return (
    <footer
      role="contentinfo"
      style={{
        borderTop: '1px solid var(--border-muted)',
        padding: '16px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        fontSize: 12,
        color: 'var(--text-tertiary)',
      }}
    >
      <span suppressHydrationWarning>© {new Date().getFullYear()} Tropen OS</span>

      <nav aria-label="Rechtliches" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px' }}>
        <Link href="/impressum" style={{ color: 'inherit', textDecoration: 'none' }}>
          Impressum
        </Link>
        <Link href="/datenschutz" style={{ color: 'inherit', textDecoration: 'none' }}>
          Datenschutz
        </Link>
        <Link href="/accessibility" style={{ color: 'inherit', textDecoration: 'none' }}>
          Barrierefreiheit
        </Link>
        <a
          href="mailto:accessibility@tropen.de"
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          Barrierefreiheit melden
        </a>
        <a
          href="https://www.schlichtungsstelle-bgg.de"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          Schlichtungsstelle (BGG)
        </a>
      </nav>
    </footer>
  )
}
