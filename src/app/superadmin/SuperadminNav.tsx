'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/superadmin/clients', label: 'Clients' },
  { href: '/superadmin/announcements', label: 'Announcements' },
  { href: '/superadmin/perspectives', label: 'Perspectives' },
  { href: '/admin/todos', label: 'To-Dos & Compliance' },
]

export default function SuperadminNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Superadmin-Navigation">
      <ul role="list" style={{ display: 'flex', gap: 20, listStyle: 'none', margin: 0, padding: 0 }}>
        {LINKS.map(link => {
          const active = pathname.startsWith(link.href)
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'color var(--t-fast)',
                }}
              >
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
