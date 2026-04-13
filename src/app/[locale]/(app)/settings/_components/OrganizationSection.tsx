'use client'

import { useEffect, useState } from 'react'
import { ArrowSquareOut } from '@phosphor-icons/react'
import { Link } from '@/i18n/navigation'

interface MCPPolicy {
  id: string
  mcp_id: string
  mcp_name: string
  mcp_icon: string | null
  status: 'available' | 'on_request' | 'blocked'
}

export function OrganizationSection() {
  const [policies, setPolicies] = useState<MCPPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/settings/connections')
    if (res.ok) {
      const { policies: p } = await res.json()
      setPolicies(p)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(mcp_id: string, status: string) {
    setUpdating(mcp_id)
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    await supabase.from('org_mcp_policies').update({ status }).eq('mcp_id', mcp_id)
    await load()
    setUpdating(null)
  }

  const statusLabel: Record<string, string> = {
    available: 'Verfügbar',
    on_request: 'Auf Anfrage',
    blocked: 'Gesperrt',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-header-label">MCP-Policies</span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Nur Org-Admins</span>
        </div>
        <div className="card-body" style={{ padding: '12px 18px' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Welche Integrationen stehen Mitgliedern zur Verfügung?
          </p>
          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Lade…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {policies.map(p => (
                <div key={p.mcp_id} className="connection-item">
                  <span className="connection-icon">{p.mcp_icon ?? '🔌'}</span>
                  <span className="connection-name">{p.mcp_name}</span>
                  <select
                    className="settings-select"
                    style={{ maxWidth: 150 }}
                    value={p.status}
                    disabled={updating === p.mcp_id}
                    onChange={e => updateStatus(p.mcp_id, e.target.value)}
                  >
                    <option value="available">Verfügbar</option>
                    <option value="on_request">Auf Anfrage</option>
                    <option value="blocked">Gesperrt</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-header-label">Mitglieder</span>
        </div>
        <div className="card-body" style={{ padding: '12px 18px' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
            Mitglieder werden im Admin-Bereich verwaltet.
          </p>
          <Link href="/admin/users" className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <ArrowSquareOut size={14} weight="bold" aria-hidden="true" />
            User-Verwaltung öffnen
          </Link>
        </div>
      </div>
    </div>
  )
}
