import { ClipboardText } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/utils/supabase/server'
import { getTranslations } from 'next-intl/server'

export default async function LogsPage() {
  const t = await getTranslations('adminLogs')

  const supabase = await createClient()
  const { data: logs, count } = await supabase
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
    <div className="content-wide">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <ClipboardText size={22} color="var(--text-primary)" weight="bold" />
            {t('title')}
          </h1>
          <p className="page-header-sub">{t('subtitle', { count: count ?? 0 })}</p>
        </div>
      </div>

      <div className="card">
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={s.th}>{t('colTime')}</th>
                <th style={s.th}>{t('colOrg')}</th>
                <th style={s.th}>{t('colUser')}</th>
                <th style={s.th}>{t('colDept')}</th>
                <th style={s.th}>{t('colModel')}</th>
                <th style={s.th}>{t('colTokens')}</th>
                <th style={s.th}>{t('colCost')}</th>
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} style={s.empty}>
                    {t('noLogs')}
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
                          background: model?.provider === 'openai' ? 'var(--accent-subtle)' : 'rgba(99,102,241,0.12)'
                        }}
                      >
                        {model?.name ?? '—'}
                      </span>
                    </td>
                    <td style={s.td}>
                      {log.tokens_input ?? 0} / {log.tokens_output ?? 0}
                    </td>
                    <td style={{ ...s.td, color: 'var(--accent)' }}>€{(log.cost_eur ?? 0).toFixed(4)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  th: {
    textAlign: 'left',
    fontSize: 12,
    color: 'var(--text-tertiary)',
    padding: '10px 14px',
    borderBottom: '1px solid var(--border)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  td: {
    fontSize: 13,
    color: 'var(--text-primary)',
    padding: '10px 14px',
    borderBottom: '1px solid var(--border)',
  },
  empty: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
    padding: 32,
    textAlign: 'center',
  },
  badge: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 4,
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-medium)',
  },
}
