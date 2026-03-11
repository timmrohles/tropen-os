import type { ReactNode } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function SuperadminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (data?.role !== 'superadmin') redirect('/workspaces')

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="content-wide" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <header role="banner" style={{
          borderBottom: '1px solid var(--border)',
          marginBottom: 24, paddingBottom: 14,
          display: 'flex', alignItems: 'center', gap: 32,
        }}>
          <p style={{
            fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase',
            letterSpacing: '0.08em', margin: 0, fontWeight: 600,
          }}>
            <span aria-hidden="true">🦜</span>{' '}
            Tropen Superadmin
          </p>
          <nav aria-label="Superadmin-Navigation">
            <ul role="list" style={{ display: 'flex', gap: 20, listStyle: 'none', margin: 0, padding: 0 }}>
              {[
                { href: '/superadmin/clients', label: 'Clients' },
                { href: '/admin/todos', label: 'To-Dos & Compliance' },
              ].map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        {children}
      </div>
    </div>
  )
}
