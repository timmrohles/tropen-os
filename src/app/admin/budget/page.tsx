'use client'

import { useEffect, useState } from 'react'

interface OrgRow {
  id: string
  name: string
  slug: string
  plan: string
  budget_limit: number | null
}
interface WsRow {
  id: string
  name: string
  budget_limit: number | null
  organizations: { name: string } | null
}

export default function BudgetPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [workspaces, setWorkspaces] = useState<WsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/budget')
    const data = await res.json()
    setOrgs(data.organizations ?? [])
    setWorkspaces(data.workspaces ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function setBudget(type: 'organization' | 'workspace', id: string, value: string) {
    setSaving(id)
    const budget_limit = value === '' ? null : parseFloat(value)
    await fetch('/api/admin/budget', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, budget_limit })
    })
    setSaving(null)
    await load()
  }

  if (loading) return <p style={{ color: '#555' }}>Lade…</p>

  return (
    <div className="content-max">
      <h1 style={s.h1}>Budget-Limits</h1>
      <p style={s.sub}>
        Monatliches Ausgaben-Limit pro Organisation und Workspace. Leer lassen = kein Limit.
      </p>

      <h2 style={s.h2}>Organisationen</h2>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Organisation</th>
            <th style={s.th}>Plan</th>
            <th style={s.th}>Budget / Monat (€)</th>
            <th style={s.th}></th>
          </tr>
        </thead>
        <tbody>
          {orgs.length === 0 && (
            <tr>
              <td colSpan={4} style={s.empty}>
                Keine Organisationen
              </td>
            </tr>
          )}
          {orgs.map((org) => (
            <BudgetRow
              key={org.id}
              label={org.name}
              sub={org.plan}
              currentLimit={org.budget_limit}
              saving={saving === org.id}
              onSave={(v) => setBudget('organization', org.id, v)}
            />
          ))}
        </tbody>
      </table>

      <h2 style={{ ...s.h2, marginTop: 36 }}>Workspaces</h2>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Workspace</th>
            <th style={s.th}>Organisation</th>
            <th style={s.th}>Budget / Monat (€)</th>
            <th style={s.th}></th>
          </tr>
        </thead>
        <tbody>
          {workspaces.length === 0 && (
            <tr>
              <td colSpan={4} style={s.empty}>
                Keine Workspaces
              </td>
            </tr>
          )}
          {workspaces.map((ws) => (
            <BudgetRow
              key={ws.id}
              label={ws.name}
              sub={ws.organizations?.name ?? '—'}
              currentLimit={ws.budget_limit}
              saving={saving === ws.id}
              onSave={(v) => setBudget('workspace', ws.id, v)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BudgetRow({
  label,
  sub,
  currentLimit,
  saving,
  onSave
}: {
  label: string
  sub: string
  currentLimit: number | null
  saving: boolean
  onSave: (v: string) => void
}) {
  const [val, setVal] = useState(currentLimit != null ? String(currentLimit) : '')

  return (
    <tr>
      <td style={s.td}>
        <div style={{ color: '#fff', fontWeight: 500 }}>{label}</div>
      </td>
      <td style={s.td}>
        <span style={s.sub2}>{sub}</span>
      </td>
      <td style={s.td}>
        <input
          style={s.input}
          type="number"
          min="0"
          step="10"
          placeholder="Kein Limit"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      </td>
      <td style={s.td}>
        <button style={s.btn} onClick={() => onSave(val)} disabled={saving}>
          {saving ? '…' : 'Speichern'}
        </button>
      </td>
    </tr>
  )
}

const s: Record<string, React.CSSProperties> = {
  h1: { fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 },
  h2: { fontSize: 16, fontWeight: 600, color: '#ccc', marginBottom: 12 },
  sub: { fontSize: 13, color: '#555', marginBottom: 28 },
  sub2: { fontSize: 12, color: '#555' },
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
    padding: '8px 10px',
    borderBottom: '1px solid #1e1e1e',
    verticalAlign: 'middle'
  },
  input: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    color: '#fff',
    padding: '7px 12px',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
    width: 140
  },
  btn: {
    background: '#2a2a2a',
    border: '1px solid #3a3a3a',
    color: '#fff',
    padding: '7px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13
  },
  empty: { fontSize: 13, color: '#444', padding: 24, textAlign: 'center' }
}
