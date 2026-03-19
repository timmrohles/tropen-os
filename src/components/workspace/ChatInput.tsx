'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PaperPlaneRight, UserCircle, X, CaretDown, SquaresFour } from '@phosphor-icons/react'

interface Role {
  id: string
  label: string
  icon: string | null
  description: string | null
  scope: string
  requires_package: string | null
}

interface CapabilityOutcome {
  outcome_id: string
  is_default: boolean
  outcomes: { id: string; label: string; icon: string | null } | null
}

interface Capability {
  id: string
  label: string
  icon: string | null
  valid_outcomes: CapabilityOutcome[]
}

interface ChatInputProps {
  input: string
  setInput: (v: string) => void
  sending: boolean
  onSubmit: (e: React.FormEvent) => void
  activeRoleId: string | null
  onSetActiveRoleId: ((id: string | null) => void) | null
  activeCapabilityId: string | null
  onSetActiveCapabilityId: ((id: string | null) => void) | null
  activeOutcomeId: string | null
  onSetActiveOutcomeId: ((id: string | null) => void) | null
}

export default function ChatInput({
  input, setInput, sending, onSubmit,
  activeRoleId, onSetActiveRoleId,
  activeCapabilityId, onSetActiveCapabilityId,
  activeOutcomeId, onSetActiveOutcomeId,
}: ChatInputProps) {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [dropOpen, setDropOpen] = useState(false)
  const [capDropOpen, setCapDropOpen] = useState(false)
  const [outcomeDropOpen, setOutcomeDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const capDropRef = useRef<HTMLDivElement>(null)
  const outcomeDropRef = useRef<HTMLDivElement>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [wsTitle, setWsTitle] = useState('')
  const [wsCreating, setWsCreating] = useState(false)

  useEffect(() => {
    fetch('/api/library/roles')
      .then(r => r.ok ? r.json() : null)
      .then((d: { roles: Role[] } | null) => {
        if (d) setRoles(d.roles)
      })
      .catch(() => null)
    fetch('/api/capabilities')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCapabilities(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!dropOpen) return
    function onDown(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [dropOpen])

  useEffect(() => {
    if (!capDropOpen) return
    function onDown(e: MouseEvent) {
      if (capDropRef.current && !capDropRef.current.contains(e.target as Node)) setCapDropOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [capDropOpen])

  useEffect(() => {
    if (!outcomeDropOpen) return
    function onDown(e: MouseEvent) {
      if (outcomeDropRef.current && !outcomeDropRef.current.contains(e.target as Node)) setOutcomeDropOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [outcomeDropOpen])

  const activeRole = roles.find(r => r.id === activeRoleId) ?? null

  // Group roles by scope
  const scopeGroups = roles.reduce<Record<string, Role[]>>((acc, r) => {
    if (!acc[r.scope]) acc[r.scope] = []
    acc[r.scope].push(r)
    return acc
  }, {})

  const activeCap = capabilities.find(c => c.id === activeCapabilityId) ?? null
  const validOutcomes = activeCap?.valid_outcomes ?? []
  const activeOutcome = validOutcomes.find(o => o.outcome_id === activeOutcomeId)?.outcomes ?? null

  function handleSelectCapability(capId: string | null) {
    if (!onSetActiveCapabilityId || !onSetActiveOutcomeId) return
    onSetActiveCapabilityId(capId)
    if (!capId) {
      onSetActiveOutcomeId(null)
    } else {
      const cap = capabilities.find(c => c.id === capId)
      const defaultOutcome = cap?.valid_outcomes.find(o => o.is_default) ?? cap?.valid_outcomes[0]
      onSetActiveOutcomeId(defaultOutcome?.outcome_id ?? null)
    }
    setCapDropOpen(false)
  }

  async function handleWsCreate() {
    if (wsCreating || !wsTitle.trim()) return
    setWsCreating(true)
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: wsTitle.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      const ws = await res.json()
      setShowCreate(false)
      setWsTitle('')
      router.push(`/ws/${ws.id}/canvas`)
    } finally {
      setWsCreating(false)
    }
  }

  const scopeLabels: Record<string, string> = {
    system: 'System',
    package: 'Paket',
    org: 'Organisation',
    user: 'Eigene',
  }

  return (
    <div className="cinput-wrap-outer">
      {/* Rolle Bar */}
      {onSetActiveRoleId && (
        <div className="cinput-agent-bar" ref={dropRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={`cinput-agent-btn${activeRole ? ' cinput-agent-btn--active' : ''}`}
            onClick={() => setDropOpen(v => !v)}
            title="Rolle wählen"
          >
            <UserCircle size={13} weight={activeRole ? 'fill' : 'bold'} />
            <span>{activeRole ? activeRole.label : 'Keine Rolle'}</span>
            <CaretDown size={11} weight="bold" style={{ opacity: 0.5 }} />
          </button>

          {activeRole && (
            <button
              type="button"
              className="cinput-agent-clear"
              onClick={() => onSetActiveRoleId(null)}
              title="Rolle entfernen"
            >
              <X size={11} weight="bold" />
            </button>
          )}

          {/* Capability Dropdown */}
          {onSetActiveCapabilityId && capabilities.length > 0 && (
            <div ref={capDropRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className={`cinput-agent-btn${activeCap ? ' cinput-agent-btn--active' : ''}`}
                onClick={() => setCapDropOpen(v => !v)}
                title="Capability wählen"
              >
                {activeCap?.icon && <span>{activeCap.icon}</span>}
                <span>{activeCap ? activeCap.label : 'Modus'}</span>
                <CaretDown size={11} weight="bold" style={{ opacity: 0.5 }} />
              </button>
              {activeCap && (
                <button
                  type="button"
                  className="cinput-agent-clear"
                  onClick={() => handleSelectCapability(null)}
                  title="Modus entfernen"
                >
                  <X size={11} weight="bold" />
                </button>
              )}
              {capDropOpen && (
                <div className="cinput-agent-drop">
                  <div className="cinput-agent-drop-none">
                    <button
                      className={`cinput-agent-option${!activeCap ? ' cinput-agent-option--active' : ''}`}
                      onClick={() => handleSelectCapability(null)}
                    >
                      Kein Modus
                    </button>
                  </div>
                  {capabilities.map(cap => (
                    <button
                      key={cap.id}
                      className={`cinput-agent-option${activeCapabilityId === cap.id ? ' cinput-agent-option--active' : ''}`}
                      onClick={() => handleSelectCapability(cap.id)}
                    >
                      <span className="cinput-agent-option-name">
                        {cap.icon && <span style={{ marginRight: 4 }}>{cap.icon}</span>}
                        {cap.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Outcome Dropdown — only show when capability has multiple outcomes */}
          {activeCap && validOutcomes.length > 1 && onSetActiveOutcomeId && (
            <div ref={outcomeDropRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="cinput-agent-btn cinput-agent-btn--active"
                onClick={() => setOutcomeDropOpen(v => !v)}
                title="Format wählen"
              >
                {activeOutcome?.icon && <span>{activeOutcome.icon}</span>}
                <span>{activeOutcome?.label ?? 'Format'}</span>
                <CaretDown size={11} weight="bold" style={{ opacity: 0.5 }} />
              </button>
              {outcomeDropOpen && (
                <div className="cinput-agent-drop">
                  {validOutcomes.map(vo => (
                    <button
                      key={vo.outcome_id}
                      className={`cinput-agent-option${activeOutcomeId === vo.outcome_id ? ' cinput-agent-option--active' : ''}`}
                      onClick={() => {
                        onSetActiveOutcomeId(vo.outcome_id)
                        setOutcomeDropOpen(false)
                      }}
                    >
                      <span className="cinput-agent-option-name">
                        {vo.outcomes?.icon && <span style={{ marginRight: 4 }}>{vo.outcomes.icon}</span>}
                        {vo.outcomes?.label ?? vo.outcome_id}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="cinput-agent-btn"
            onClick={() => { setShowCreate(v => !v); setWsTitle('') }}
            title="Neuen Workspace erstellen"
            style={{ marginLeft: 'auto' }}
          >
            <SquaresFour size={13} weight="bold" />
            <span>Workspace</span>
          </button>

          {dropOpen && (
            <div className="cinput-agent-drop">
              <div className="cinput-agent-drop-none">
                <button
                  className={`cinput-agent-option${activeRole ? '' : ' cinput-agent-option--active'}`}
                  onClick={() => { onSetActiveRoleId(null); setDropOpen(false) }}
                >
                  Keine Rolle
                </button>
              </div>

              {/* Rollen gruppiert nach Scope */}
              {Object.entries(scopeGroups).map(([scope, scopeRoles]) => (
                <div key={scope} className="cinput-agent-pkg-section">
                  <span className="cinput-agent-pkg-label">
                    {scopeLabels[scope] ?? scope}
                  </span>
                  {scopeRoles.map(r => (
                    <button
                      key={r.id}
                      className={`cinput-agent-option${activeRoleId === r.id ? ' cinput-agent-option--active' : ''}`}
                      onClick={() => { onSetActiveRoleId(r.id); setDropOpen(false) }}
                    >
                      <span className="cinput-agent-option-name">
                        {r.icon && <span style={{ marginRight: 4 }}>{r.icon}</span>}
                        {r.label}
                      </span>
                      {r.description && <span className="cinput-agent-option-desc">{r.description}</span>}
                    </button>
                  ))}
                </div>
              ))}

              {roles.length === 0 && (
                <div className="cinput-agent-empty">Noch keine Rollen verfügbar</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inline Workspace-Erstellen-Formular */}
      {showCreate && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '10px 12px',
          marginTop: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <input
            className="cinput-field"
            placeholder="Workspace-Name"
            autoFocus
            value={wsTitle}
            onChange={(e) => setWsTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); void handleWsCreate() }
              if (e.key === 'Escape') { setShowCreate(false); setWsTitle('') }
            }}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="cinput-agent-btn"
            onClick={() => void handleWsCreate()}
            disabled={wsCreating || !wsTitle.trim()}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              opacity: wsCreating || !wsTitle.trim() ? 0.6 : 1,
              cursor: wsCreating || !wsTitle.trim() ? 'default' : 'pointer',
            }}
          >
            {wsCreating ? 'Erstelle…' : 'Erstellen'}
          </button>
          <button
            type="button"
            className="cinput-agent-btn"
            onClick={() => { setShowCreate(false); setWsTitle('') }}
            style={{ flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="cinput-row">
        <input
          className="cinput-field"
          placeholder={activeRole ? `Nachricht an ${activeRole.label}…` : 'Nachricht eingeben…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          autoFocus
        />
        <button className="cinput-send" type="submit" disabled={sending || !input.trim()} aria-label={sending ? 'Nachricht wird gesendet…' : 'Nachricht senden'}>
          {sending
            ? <span className="cinput-sending">…</span>
            : <PaperPlaneRight size={20} weight="fill" />
          }
        </button>
      </form>
    </div>
  )
}
