'use client'

import { useEffect, useState } from 'react'
import { Users as UsersIcon } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'
import type { User } from '@/lib/types'

type OrgUser = Pick<User, 'id' | 'email' | 'full_name' | 'role' | 'is_active' | 'created_at'>

const ROLES = ['member', 'viewer', 'admin'] as const

export default function UsersPage() {
  const t = useTranslations('adminUsers')

  const [users, setUsers] = useState<OrgUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer' | 'admin'>('member')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState('')

  async function load() {
    const res = await fetch('/api/admin/users')
    const json = await res.json() as { data: OrgUser[] }
    setUsers(json.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setSending(true)
    setFeedback('')

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
    })
    const data = await res.json()

    if (data.error) {
      setFeedback(data.error)
    } else {
      setFeedback(t('inviteSent', { email: inviteEmail }))
      setInviteEmail('')
      setInviteRole('member')
    }
    setSending(false)
  }

  return (
    <div className="content-wide" aria-busy={loading}>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <UsersIcon size={22} color="var(--text-primary)" weight="bold" />
            {t('title')}
          </h1>
          <p className="page-header-sub">{t('subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => { setShowInvite(v => !v); setFeedback('') }}
          >
            {showInvite ? t('inviteCancel') : t('inviteButton')}
          </button>
        </div>
      </div>

      {showInvite && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ padding: '16px 20px' }}>
            <form onSubmit={invite} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <input
                style={s.input}
                type="email"
                placeholder={t('emailPlaceholder')}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                autoFocus
              />
              <select
                style={s.input}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" type="submit" disabled={sending}>
                {sending ? t('inviteSending') : t('inviteSend')}
              </button>
            </form>
            {feedback && <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{feedback}</p>}
            <p style={s.hint}>{t('inviteHint')}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div aria-busy="true">
          <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', paddingTop: 48 }}>{t('loading')}</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={s.th}>{t('colName')}</th>
                  <th style={s.th}>{t('colEmail')}</th>
                  <th style={s.th}>{t('colRole')}</th>
                  <th style={s.th}>{t('colStatus')}</th>
                  <th style={s.th}>{t('colCreated')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={s.td}>{u.full_name ?? <span style={{ color: 'var(--text-tertiary)' }}>---</span>}</td>
                    <td style={s.td}>{u.email}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, ...roleBadgeStyle(u.role) }}>{u.role}</span>
                    </td>
                    <td style={s.td}>
                      <span
                        style={{
                          ...s.badge,
                          background: u.is_active ? 'var(--success-bg)' : 'var(--error-bg)',
                          color: u.is_active ? 'var(--success)' : 'var(--error)'
                        }}
                      >
                        {u.is_active ? t('statusActive') : t('statusInactive')}
                      </span>
                    </td>
                    <td style={s.td}>{new Date(u.created_at).toLocaleDateString('de-DE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function roleBadgeStyle(role: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    owner: { background: 'var(--info-bg)', color: 'var(--info)' },
    admin: { background: 'var(--info-bg)', color: 'var(--info)' },
    member: { background: 'var(--accent-subtle)', color: 'var(--text-secondary)' },
    viewer: { background: 'var(--accent-subtle)', color: 'var(--text-tertiary)' }
  }
  return map[role] ?? map.member
}

const s: Record<string, React.CSSProperties> = {
  input: {
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)',
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none'
  },
  hint: { margin: '12px 0 0', fontSize: 12, color: 'var(--text-tertiary)' },
  th: {
    textAlign: 'left',
    fontSize: 12,
    color: 'var(--text-tertiary)',
    padding: '10px 14px',
    borderBottom: '1px solid var(--border)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em'
  },
  td: {
    fontSize: 13,
    color: 'var(--text-primary)',
    padding: '10px 14px',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle'
  },
  badge: { fontSize: 11, padding: '3px 8px', borderRadius: 4 }
}
