'use client'

import { useEffect, useState } from 'react'
import { Wallet } from '@phosphor-icons/react'

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

  if (loading) return (
    <div className="content-wide" aria-busy="true">
      <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', paddingTop: 48 }}>Lade…</p>
    </div>
  )

  return (
    <div className="content-wide">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Wallet size={22} color="var(--text-primary)" weight="bold" />
            Budget-Limits
          </h1>
          <p className="page-header-sub">Monatliches Ausgaben-Limit pro Organisation und Department. Leer lassen = kein Limit.</p>
        </div>
      </div>

      <h2 style={s.sectionLabel}>Organisationen</h2>
      <div className="card" style={{ marginBottom: 32 }}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={s.th}>Organisation</th>
                <th style={s.th}>Plan</th>
                <th style={s.th}>Budget / Monat</th>
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
        </div>
      </div>

      <h2 style={s.sectionLabel}>Departments</h2>
      <div className="card">
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={s.th}>Department</th>
                <th style={s.th}>Organisation</th>
                <th style={s.th}>Budget / Monat</th>
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
      </div>
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
  const [val, setVal] = useState(currentLimit == null ? '' : String(currentLimit))

  return (
    <tr>
      <td style={s.td}>
        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
      </td>
      <td style={s.td}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</span>
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
        <button className="btn btn-primary btn-sm" onClick={() => onSave(val)} disabled={saving}>
          {saving ? '…' : 'Speichern'}
        </button>
      </td>
    </tr>
  )
}

const s: Record<string, React.CSSProperties> = {
  sectionLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 12,
  },
  th: {
    textAlign: 'left' as const,
    fontSize: 12,
    color: 'var(--text-tertiary)',
    padding: '10px 14px',
    borderBottom: '1px solid var(--border)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
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
    textAlign: 'center' as const,
  },
  input: {
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)',
    padding: '7px 12px',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
    width: 140,
  },
}
