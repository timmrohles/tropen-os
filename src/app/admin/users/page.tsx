'use client'

import { useEffect, useState } from 'react'
import type { User } from '@/lib/types'

type OrgUser = Pick<User, 'id' | 'email' | 'full_name' | 'role' | 'is_active' | 'created_at'>

const ROLES = ['member', 'viewer', 'admin'] as const

export default function UsersPage() {
  const [users, setUsers] = useState<OrgUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer' | 'admin'>('member')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState('')

  async function load() {
    const res = await fetch('/api/admin/users')
    setUsers(await res.json())
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
      setFeedback(`Einladung an ${inviteEmail} gesendet.`)
      setInviteEmail('')
      setInviteRole('member')
    }
    setSending(false)
  }

  return (
    <div className="content-max">
      <div style={s.header}>
        <h1 style={s.h1}>User-Verwaltung</h1>
        <button
          style={s.btn}
          onClick={() => {
            setShowInvite((v) => !v)
            setFeedback('')
          }}
        >
          {showInvite ? 'Abbrechen' : '+ User einladen'}
        </button>
      </div>

      {showInvite && (
        <div style={s.inviteBox}>
          <h3 style={s.inviteTitle}>User einladen</h3>
          <form onSubmit={invite} style={s.inviteForm}>
            <input
              style={s.input}
              type="email"
              placeholder="Email-Adresse"
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
            <button style={s.btn} type="submit" disabled={sending}>
              {sending ? 'Sende…' : 'Einladung senden'}
            </button>
          </form>
          {feedback && (
            <div
              style={{
                ...s.feedback,
                color: feedback.startsWith('Einladung') ? '#22c55e' : '#ef4444'
              }}
            >
              {feedback}
            </div>
          )}
          <p style={s.hint}>
            Der User erhält eine E-Mail mit einem Magic Link. Beim ersten Login gibt er seinen Namen
            ein.
          </p>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#555' }}>Lade…</p>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Name</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Rolle</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={s.td}>{u.full_name ?? <span style={{ color: '#444' }}>—</span>}</td>
                <td style={s.td}>{u.email}</td>
                <td style={s.td}>
                  <span style={{ ...s.badge, ...roleBadgeStyle(u.role) }}>{u.role}</span>
                </td>
                <td style={s.td}>
                  <span
                    style={{
                      ...s.badge,
                      background: u.is_active ? '#1a3a1a' : '#2a1a1a',
                      color: u.is_active ? '#22c55e' : '#ef4444'
                    }}
                  >
                    {u.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td style={s.td}>{new Date(u.created_at).toLocaleDateString('de-DE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function roleBadgeStyle(role: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    owner: { background: '#2a1a3a', color: '#a855f7' },
    admin: { background: '#1a2a3a', color: '#60a5fa' },
    member: { background: '#2a2a2a', color: '#888' },
    viewer: { background: '#1a1a1a', color: '#555' }
  }
  return map[role] ?? map.member
}

const s: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  h1: { fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 },
  btn: {
    background: '#2a2a2a',
    border: '1px solid #3a3a3a',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13
  },
  inviteBox: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    padding: 24,
    marginBottom: 28
  },
  inviteTitle: { margin: '0 0 16px', color: '#fff', fontSize: 15, fontWeight: 600 },
  inviteForm: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  input: {
    background: '#111',
    border: '1px solid #2a2a2a',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none'
  },
  feedback: { marginTop: 12, fontSize: 13 },
  hint: { margin: '12px 0 0', fontSize: 12, color: '#444' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    fontSize: 12,
    color: '#666',
    padding: '6px 10px',
    borderBottom: '1px solid #2a2a2a'
  },
  td: {
    fontSize: 13,
    color: '#ccc',
    padding: '10px 10px',
    borderBottom: '1px solid #1e1e1e',
    verticalAlign: 'middle'
  },
  badge: { fontSize: 11, padding: '3px 8px', borderRadius: 4 }
}
