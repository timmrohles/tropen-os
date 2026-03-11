import type { ReactNode } from 'react'
import { requireSuperadmin } from '@/lib/auth/guards'
import SuperadminNav from './SuperadminNav'

export default async function SuperadminLayout({ children }: { children: ReactNode }) {
  await requireSuperadmin()

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div className="content-wide" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <header style={{
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
          <SuperadminNav />
        </header>
        {children}
      </div>
    </div>
  )
}
