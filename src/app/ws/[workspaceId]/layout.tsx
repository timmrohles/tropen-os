import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getWorkspace } from '@/actions/workspaces'
import Link from 'next/link'

const MONO = "'DM Mono', 'Courier New', monospace"

const s: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#080808',
    fontFamily: MONO,
    color: '#e0e0e0',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 20px',
    height: 48,
    background: '#0e0e0e',
    borderBottom: '1px solid #1e1e1e',
    flexShrink: 0,
  },
  backLink: {
    color: '#444444',
    textDecoration: 'none',
    fontSize: 13,
    fontFamily: MONO,
    letterSpacing: '0.01em',
  },
  sep: {
    color: '#1e1e1e',
    fontSize: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: 500,
    color: '#e0e0e0',
    fontFamily: MONO,
    letterSpacing: '0.02em',
  },
  domain: {
    fontSize: 11,
    color: '#444444',
    background: '#1e1e1e',
    padding: '2px 8px',
    borderRadius: 3,
    fontFamily: MONO,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  navLinks: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  navLink: {
    fontSize: 12,
    color: '#444444',
    textDecoration: 'none',
    padding: '4px 10px',
    borderRadius: 4,
    fontFamily: MONO,
    letterSpacing: '0.02em',
    transition: 'color 0.15s',
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

  let workspace
  try {
    workspace = await getWorkspace(workspaceId)
  } catch {
    redirect('/workspaces')
  }

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
        {workspace.department && (
          <span style={{ ...s.domain, background: 'transparent', color: '#444444' }}>
            {workspace.department.name}
          </span>
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
