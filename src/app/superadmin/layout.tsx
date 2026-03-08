import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (data?.role !== 'superadmin') redirect('/workspaces')

  const wrapper: React.CSSProperties = {
    maxWidth: 960,
    margin: '0 auto',
    padding: '32px 24px',
  }

  const header: React.CSSProperties = {
    borderBottom: '1px solid #1e1e1e',
    marginBottom: 24,
    paddingBottom: 16,
  }

  const headerText: React.CSSProperties = {
    fontSize: 11,
    color: '#444',
    textTransform: 'uppercase',
    margin: 0,
  }

  return (
    <div style={wrapper}>
      <div style={header}>
        <p style={headerText}>🦜 Tropen Superadmin</p>
      </div>
      {children}
    </div>
  )
}
