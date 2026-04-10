'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Clock, Lock } from '@phosphor-icons/react'

interface MCPPolicy {
  mcp_id: string
  mcp_name: string
  mcp_icon: string | null
  status: 'available' | 'on_request' | 'blocked'
}

interface MCPConnection {
  mcp_id: string
  status: 'connected' | 'pending_approval' | 'disconnected'
  connected_at: string | null
  requested_at: string | null
}

interface ConnectionsData {
  policies: MCPPolicy[]
  connections: MCPConnection[]
}

export function ConnectionsSection() {
  const [data, setData] = useState<ConnectionsData>({ policies: [], connections: [] })
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/settings/connections')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function doAction(mcp_id: string, action: 'connect' | 'disconnect' | 'request') {
    setPending(mcp_id)
    await fetch('/api/settings/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mcp_id, action }),
    })
    await load()
    setPending(null)
  }

  const connectionMap = new Map(data.connections.map(c => [c.mcp_id, c]))

  const connected = data.policies.filter(p => connectionMap.get(p.mcp_id)?.status === 'connected')
  const pendingApproval = data.policies.filter(p => connectionMap.get(p.mcp_id)?.status === 'pending_approval')
  const available = data.policies.filter(p => {
    const conn = connectionMap.get(p.mcp_id)
    return p.status === 'available' && (!conn || conn.status === 'disconnected')
  })
  const onRequest = data.policies.filter(p => p.status === 'on_request' && !connectionMap.get(p.mcp_id))
  const blocked = data.policies.filter(p => p.status === 'blocked')

  if (loading) return (
    <div className="card">
      <div className="card-body" style={{ padding: '16px 18px' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Lade…</p>
      </div>
    </div>
  )

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-label">Verbindungen</span>
      </div>
      <div className="card-body" style={{ padding: '12px 18px' }}>
        {connected.length === 0 && available.length === 0 && onRequest.length === 0 && blocked.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Keine Verbindungen konfiguriert.
          </p>
        ) : (
          <>
            {connected.length > 0 && (
              <div className="connections-group">
                <span className="connections-group-label">Verbunden</span>
                {connected.map(p => (
                  <div key={p.mcp_id} className="connection-item">
                    <span className="connection-icon">{p.mcp_icon ?? '🔌'}</span>
                    <span className="connection-name">{p.mcp_name}</span>
                    <CheckCircle size={14} weight="fill" style={{ color: 'var(--accent)', flexShrink: 0 }} aria-hidden="true" />
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => doAction(p.mcp_id, 'disconnect')}
                      disabled={pending === p.mcp_id}
                    >
                      {pending === p.mcp_id ? 'Warte…' : 'Trennen'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pendingApproval.length > 0 && (
              <div className="connections-group">
                <span className="connections-group-label">Ausstehend</span>
                {pendingApproval.map(p => (
                  <div key={p.mcp_id} className="connection-item">
                    <span className="connection-icon">{p.mcp_icon ?? '🔌'}</span>
                    <span className="connection-name">{p.mcp_name}</span>
                    <Clock size={14} weight="bold" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} aria-hidden="true" />
                    <span className="connection-status-text">Anfrage läuft</span>
                  </div>
                ))}
              </div>
            )}

            {available.length > 0 && (
              <div className="connections-group">
                <span className="connections-group-label">Verfügbar</span>
                {available.map(p => (
                  <div key={p.mcp_id} className="connection-item">
                    <span className="connection-icon">{p.mcp_icon ?? '🔌'}</span>
                    <span className="connection-name">{p.mcp_name}</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => doAction(p.mcp_id, 'connect')}
                      disabled={pending === p.mcp_id}
                    >
                      {pending === p.mcp_id ? 'Verbinde…' : 'Verbinden'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {onRequest.length > 0 && (
              <div className="connections-group">
                <span className="connections-group-label">Auf Anfrage</span>
                {onRequest.map(p => (
                  <div key={p.mcp_id} className="connection-item">
                    <span className="connection-icon">{p.mcp_icon ?? '🔌'}</span>
                    <span className="connection-name">{p.mcp_name}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => doAction(p.mcp_id, 'request')}
                      disabled={pending === p.mcp_id}
                    >
                      {pending === p.mcp_id ? 'Warte…' : 'Beantragen'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {blocked.length > 0 && (
              <div className="connections-group">
                <span className="connections-group-label">Nicht verfügbar</span>
                {blocked.map(p => (
                  <div key={p.mcp_id} className="connection-item">
                    <span className="connection-icon">{p.mcp_icon ?? '🔌'}</span>
                    <span className="connection-name">{p.mcp_name}</span>
                    <Lock size={14} weight="bold" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} aria-hidden="true" />
                    <span className="connection-status-text">Von Org gesperrt</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
