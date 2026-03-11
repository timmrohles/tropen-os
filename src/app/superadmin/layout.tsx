import type { ReactNode } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function SuperadminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (data?.role !== 'superadmin') redirect('/workspaces')

  return (
    <div style={{ background: 'var(--bg-surface)', minHeight: '100vh' }}>
      <div className="content-wide" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24, paddingBottom: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, fontWeight: 600 }}>
            🦜 Tropen Superadmin
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
