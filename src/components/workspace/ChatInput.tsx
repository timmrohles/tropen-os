'use client'

import React, { useEffect, useRef, useState } from 'react'
import { PaperPlaneRight, Robot, X, CaretDown } from '@phosphor-icons/react'

interface Agent {
  id: string
  name: string
  description: string | null
}

interface PackageAgent {
  id: string
  name: string
  description: string | null
  system_prompt: string | null
  quick_chips: string[]
  package_id: string
  packages: { slug: string; name: string; icon: string | null } | null
}

interface ChatInputProps {
  input: string
  setInput: (v: string) => void
  sending: boolean
  onSubmit: (e: React.FormEvent) => void
  activeAgentId: string | null
  onSetActiveAgentId: ((id: string | null) => void) | null
}

export default function ChatInput({ input, setInput, sending, onSubmit, activeAgentId, onSetActiveAgentId }: ChatInputProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [packageAgents, setPackageAgents] = useState<PackageAgent[]>([])
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.ok ? r.json() : [])
      .then(data => setAgents(Array.isArray(data) ? data : []))
      .catch(() => {})
    fetch('/api/packages/agents')
      .then(r => r.ok ? r.json() : [])
      .then(data => setPackageAgents(Array.isArray(data) ? data : []))
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

  const activeAgent = agents.find(a => a.id === activeAgentId) ?? null
  const activePackageAgent = packageAgents.find(a => a.id === activeAgentId) ?? null
  const activeAnyAgent = activeAgent ?? activePackageAgent

  // Group package agents by package
  const packageGroups = packageAgents.reduce<Record<string, { meta: PackageAgent['packages']; agents: PackageAgent[] }>>((acc, a) => {
    if (!acc[a.package_id]) acc[a.package_id] = { meta: a.packages, agents: [] }
    acc[a.package_id].agents.push(a)
    return acc
  }, {})

  return (
    <div className="cinput-wrap-outer">
      {/* Agent Bar */}
      {onSetActiveAgentId && (
        <div className="cinput-agent-bar" ref={dropRef}>
          <button
            type="button"
            className={`cinput-agent-btn${activeAnyAgent ? ' cinput-agent-btn--active' : ''}`}
            onClick={() => setDropOpen(v => !v)}
            title="Agent wählen"
          >
            <Robot size={13} weight={activeAnyAgent ? 'fill' : 'regular'} />
            <span>{activeAnyAgent ? activeAnyAgent.name : 'Kein Agent'}</span>
            <CaretDown size={11} style={{ opacity: 0.5 }} />
          </button>

          {activeAnyAgent && (
            <button
              type="button"
              className="cinput-agent-clear"
              onClick={() => onSetActiveAgentId(null)}
              title="Agent entfernen"
            >
              <X size={11} />
            </button>
          )}

          {dropOpen && (
            <div className="cinput-agent-drop">
              <div className="cinput-agent-drop-none">
                <button
                  className={`cinput-agent-option${!activeAnyAgent ? ' cinput-agent-option--active' : ''}`}
                  onClick={() => { onSetActiveAgentId(null); setDropOpen(false) }}
                >
                  Kein Agent
                </button>
              </div>

              {/* Eigene Agenten */}
              {agents.length > 0 && agents.map(a => (
                <button
                  key={a.id}
                  className={`cinput-agent-option${activeAgentId === a.id ? ' cinput-agent-option--active' : ''}`}
                  onClick={() => { onSetActiveAgentId(a.id); setDropOpen(false) }}
                >
                  <span className="cinput-agent-option-name">{a.name}</span>
                  {a.description && <span className="cinput-agent-option-desc">{a.description}</span>}
                </button>
              ))}

              {/* Package-Agenten */}
              {Object.entries(packageGroups).map(([pkgId, group]) => (
                <div key={pkgId} className="cinput-agent-pkg-section">
                  <span className="cinput-agent-pkg-label">
                    {group.meta?.icon} {group.meta?.name}
                  </span>
                  {group.agents.map(a => (
                    <button
                      key={a.id}
                      className={`cinput-agent-option${activeAgentId === a.id ? ' cinput-agent-option--active' : ''}`}
                      onClick={() => { onSetActiveAgentId(a.id); setDropOpen(false) }}
                    >
                      <span className="cinput-agent-option-name">{a.name}</span>
                      {a.description && <span className="cinput-agent-option-desc">{a.description}</span>}
                    </button>
                  ))}
                </div>
              ))}

              {agents.length === 0 && packageAgents.length === 0 && (
                <div className="cinput-agent-empty">Noch keine Agenten — unter Projekte anlegen</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Schnellstart-Chips */}
      {activePackageAgent && activePackageAgent.quick_chips.length > 0 && (
        <div className="cinput-chips">
          {activePackageAgent.quick_chips.map((chip, i) => (
            <button
              key={i}
              className="cinput-chip"
              type="button"
              onClick={() => setInput(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="cinput-row">
        <input
          className="cinput-field"
          placeholder={activeAnyAgent ? `Nachricht an ${activeAnyAgent.name}…` : 'Nachricht eingeben…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          autoFocus
        />
        <button className="cinput-send" type="submit" disabled={sending || !input.trim()}>
          {sending
            ? <span className="cinput-sending">…</span>
            : <PaperPlaneRight size={20} weight="fill" />
          }
        </button>
      </form>
    </div>
  )
}
