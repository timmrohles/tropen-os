import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function WorkspacesPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Workspaces des Users laden (via workspace_members)
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('role, workspaces(id, name, description, allowed_model_classes)')
    .eq('user_id', user.id)

  const workspaces = (memberships ?? []).map((m) => ({
    ...(m.workspaces as unknown as {
      id: string
      name: string
      description: string | null
      allowed_model_classes: string[]
    }),
    memberRole: m.role
  }))

  return (
    <div className="content-max" style={{ paddingTop: 32, paddingBottom: 32 }}>
      <h1 style={s.h1}>Deine Workspaces</h1>

      {workspaces.length === 0 ? (
        <div style={s.empty}>
          <p>Du bist noch keinem Workspace zugewiesen.</p>
          <p style={{ color: '#444', fontSize: 13 }}>Bitte einen Admin um Zugang.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {workspaces.map((ws) => (
            <Link key={ws.id} href={`/workspaces/${ws.id}`} style={s.card}>
              <div style={s.cardName}>{ws.name}</div>
              {ws.description && <div style={s.cardDesc}>{ws.description}</div>}
              <div style={s.cardMeta}>
                <span style={s.roleBadge}>{ws.memberRole}</span>
                <span style={s.models}>{ws.allowed_model_classes.join(', ')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  h1: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: 20,
    textDecoration: 'none',
    display: 'block',
    transition: 'border-color 0.15s'
  },
  cardName: { fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#555', marginBottom: 14 },
  cardMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  roleBadge: {
    fontSize: 11,
    background: '#2a2a2a',
    color: '#888',
    padding: '2px 8px',
    borderRadius: 4
  },
  models: { fontSize: 11, color: '#444' },
  empty: { color: '#666', fontSize: 15 }
}
