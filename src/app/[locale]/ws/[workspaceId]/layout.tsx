import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

const s: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'var(--bg-base)',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 20px',
    height: 44,
    background: 'var(--bg-nav)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  backLink: {
    color: 'var(--text-tertiary)',
    textDecoration: 'none',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  sep: {
    color: 'var(--border)',
    fontSize: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  domain: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    padding: '1px 8px',
    borderRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  navLinks: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  navLink: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    padding: '4px 10px',
    borderRadius: 6,
    transition: 'color 0.15s, background 0.15s',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
}

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, title, domain, status')
    .eq('id', workspaceId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!workspace) redirect('/workspaces')

  return (
    <div style={s.root}>
      <div style={s.topBar}>
        <Link href="/workspaces" style={s.backLink} aria-label="Zurück zur Übersicht">
          ←
        </Link>
        <span style={s.sep}>/</span>
        <span style={s.title}>{workspace.title}</span>
        {workspace.domain && workspace.domain !== 'custom' && (
          <span style={s.domain}>{workspace.domain}</span>
        )}
        <nav style={s.navLinks} aria-label="Workspace Navigation">
          <Link href={`/ws/${workspaceId}/canvas`} style={s.navLink}>
            Canvas
          </Link>
          <Link href={`/ws/${workspaceId}/settings`} style={s.navLink}>
            Einstellungen
          </Link>
        </nav>
      </div>
      <main style={s.content}>{children}</main>
    </div>
  )
}
