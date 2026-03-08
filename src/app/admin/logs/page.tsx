import { supabaseAdmin } from '@/lib/supabase-admin'

export default async function LogsPage() {
  const { data: logs, count } = await supabaseAdmin
    .from('usage_logs')
    .select(
      `
      id, created_at, tokens_input, tokens_output, cost_eur,
      organizations(name),
      users(full_name, email),
      workspaces(name),
      model_catalog(name, provider)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(0, 99)

  return (
    <div>
      <h1 style={s.h1}>Usage Logs</h1>
      <p style={s.meta}>{count ?? 0} Einträge gesamt · Zeige die letzten 100</p>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Zeit</th>
            <th style={s.th}>Organisation</th>
            <th style={s.th}>User</th>
            <th style={s.th}>Workspace</th>
            <th style={s.th}>Modell</th>
            <th style={s.th}>Tokens (in/out)</th>
            <th style={s.th}>Kosten</th>
          </tr>
        </thead>
        <tbody>
          {(logs ?? []).length === 0 && (
            <tr>
              <td colSpan={7} style={s.empty}>
                Noch keine Logs vorhanden
              </td>
            </tr>
          )}
          {(logs ?? []).map((log) => {
            const org = log.organizations as unknown as { name: string } | null
            const user = log.users as unknown as { full_name: string | null; email: string } | null
            const ws = log.workspaces as unknown as { name: string } | null
            const model = log.model_catalog as unknown as { name: string; provider: string } | null
            const time = new Date(log.created_at).toLocaleString('de-DE', {
              dateStyle: 'short',
              timeStyle: 'short'
            })
            return (
              <tr key={log.id}>
                <td style={s.td}>{time}</td>
                <td style={s.td}>{org?.name ?? '—'}</td>
                <td style={s.td}>{user?.full_name ?? user?.email ?? '—'}</td>
                <td style={s.td}>{ws?.name ?? '—'}</td>
                <td style={s.td}>
                  <span
                    style={{
                      ...s.badge,
                      background: model?.provider === 'openai' ? '#1a3a1a' : '#1a2a3a'
                    }}
                  >
                    {model?.name ?? '—'}
                  </span>
                </td>
                <td style={s.td}>
                  {log.tokens_input ?? 0} / {log.tokens_output ?? 0}
                </td>
                <td style={{ ...s.td, color: '#22c55e' }}>€{(log.cost_eur ?? 0).toFixed(4)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  h1: { fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#fff' },
  meta: { fontSize: 13, color: '#555', marginBottom: 24 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    fontSize: 12,
    color: '#666',
    padding: '6px 10px',
    borderBottom: '1px solid #2a2a2a'
  },
  td: { fontSize: 13, color: '#ccc', padding: '8px 10px', borderBottom: '1px solid #1e1e1e' },
  empty: { fontSize: 13, color: '#444', padding: 32, textAlign: 'center' },
  badge: { fontSize: 11, padding: '2px 8px', borderRadius: 4, color: '#aaa' }
}
