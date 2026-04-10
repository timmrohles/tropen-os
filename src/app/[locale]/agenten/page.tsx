'use client'

import React, { useState, useEffect } from 'react'
import {
  Robot, Lock,
  Plus, Trash, FloppyDisk, ShareNetwork,
} from '@phosphor-icons/react'
import WorkspacePicker from '@/components/workspaces/WorkspacePicker'
import { TEMPLATES } from '@/lib/prompt-templates'

type Tab = 'agents' | 'community' | 'templates'

interface Agent {
  id: string
  name: string
  description: string | null
  system_prompt: string | null
  visibility: 'private' | 'org'
  created_at: string
}

type AgentVisibility = 'private' | 'org'
const EMPTY_AGENT_FORM: { name: string; description: string; system_prompt: string; visibility: AgentVisibility } = {
  name: '', description: '', system_prompt: '', visibility: 'private',
}

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-medium)',
  borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
  fontSize: 13, boxSizing: 'border-box', outline: 'none',
  fontFamily: 'var(--font-sans, system-ui)',
}
const textarea: React.CSSProperties = { ...inp, minHeight: 80, resize: 'vertical' as const }

export default function AgentenPage() {
  const [tab, setTab] = useState<Tab>('agents')

  // Agents tab state
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agentForm, setAgentForm] = useState<{ name: string; description: string; system_prompt: string; visibility: AgentVisibility }>(EMPTY_AGENT_FORM)
  const [agentSaving, setAgentSaving] = useState(false)
  const [agentDeleteConfirm, setAgentDeleteConfirm] = useState(false)
  const [creatingAgent, setCreatingAgent] = useState(false)
  const [workspacePicker, setWorkspacePicker] = useState(false)

  // Agents tab
  useEffect(() => {
    if (tab !== 'agents') return
    setAgentsLoading(true)
    fetch('/api/agents')
      .then(r => r.ok ? r.json() : { data: [] })
      .then((json: { data: Agent[] }) => setAgents(json.data ?? []))
      .finally(() => setAgentsLoading(false))
  }, [tab])

  function selectAgent(a: Agent) {
    setSelectedAgent(a)
    setAgentForm({ name: a.name, description: a.description ?? '', system_prompt: a.system_prompt ?? '', visibility: a.visibility })
    setAgentDeleteConfirm(false)
    setCreatingAgent(false)
  }

  async function handleAgentSave() {
    if (!agentForm.name.trim()) return
    setAgentSaving(true)
    try {
      if (selectedAgent) {
        const res = await fetch(`/api/agents/${selectedAgent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agentForm),
        })
        if (res.ok) {
          const updated = await res.json()
          setAgents(prev => prev.map(a => a.id === updated.id ? updated : a))
          setSelectedAgent(updated)
        }
      } else {
        const res = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agentForm),
        })
        if (res.ok) {
          const created = await res.json()
          setAgents(prev => [created, ...prev])
          setSelectedAgent(created)
          setCreatingAgent(false)
        }
      }
    } finally {
      setAgentSaving(false)
    }
  }

  async function handleAgentDelete() {
    if (!selectedAgent) return
    await fetch(`/api/agents/${selectedAgent.id}`, { method: 'DELETE' })
    setAgents(prev => prev.filter(a => a.id !== selectedAgent.id))
    setSelectedAgent(null)
    setAgentDeleteConfirm(false)
  }

  const s: Record<string, React.CSSProperties> = {
    chips: { display: 'flex', gap: 6, marginBottom: 24 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 24 },
    cardItem: { padding: '16px 18px', cursor: 'pointer', textAlign: 'left' as const, width: '100%' },
    cardItemActive: { padding: '16px 18px', cursor: 'pointer', textAlign: 'left' as const, outline: '2px solid var(--accent)', outlineOffset: -2, width: '100%' },
    itemTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
    itemSub: { fontSize: 12, color: 'var(--text-tertiary)', margin: '4px 0 0' },
    editCard: { padding: 24 },
    label: { fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6, display: 'block' },
    row: { marginBottom: 16 },
    actions: { display: 'flex', gap: 8, marginTop: 20 },
    empty: { color: 'var(--text-tertiary)', fontSize: 13, padding: '40px 0', textAlign: 'center' as const },
    comingSoon: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12, padding: '48px 0', color: 'var(--text-tertiary)' },
    tplGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
    tplCard: { padding: '14px 16px', cursor: 'pointer' },
    tplTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
    tplSub: { fontSize: 12, color: 'var(--text-tertiary)', margin: 0, marginTop: 4 },
    badge: { background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, marginLeft: 8 },
  }

  return (
    <div className="content-max">
        <div className="page-header">
          <div className="page-header-text">
            <h1 className="page-header-title">
              <Robot size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
              Agenten
            </h1>
            <p className="page-header-sub">Autonome Toro-Instanzen und Vorlagen</p>
          </div>
          <div className="page-header-actions">
            {tab === 'agents' && (
              <button className="btn btn-primary" onClick={() => { setCreatingAgent(true); setSelectedAgent(null); setAgentForm(EMPTY_AGENT_FORM) }}>
                <Plus size={14} weight="bold" /> Neuer Agent
              </button>
            )}
          </div>
        </div>

        <div style={s.chips}>
          {(['agents', 'community', 'templates'] as Tab[]).map(t => (
            <button key={t} className={tab === t ? 'chip chip--active' : 'chip'} onClick={() => setTab(t)}>
              {t === 'agents' ? 'Meine Agenten' : t === 'community' ? 'Community' : 'Vorlagen'}
            </button>
          ))}
        </div>

        {tab === 'agents' && (
          <>
            {agentsLoading ? (
              <p style={s.empty}>Lade Agenten…</p>
            ) : agents.length === 0 && !creatingAgent ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <Robot size={32} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '12px 0 6px' }}>
                  Noch keine Agenten
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Agenten sind autonome Toro-Instanzen mit eigenem System-Prompt und definierten Aufgaben.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => { setCreatingAgent(true); setSelectedAgent(null); setAgentForm(EMPTY_AGENT_FORM) }}
                >
                  <Plus size={14} weight="bold" /> Ersten Agenten erstellen
                </button>
              </div>
            ) : agents.length > 0 ? (
              <div style={s.grid}>
                {agents.map(a => (
                  <button key={a.id} className="card" style={selectedAgent?.id === a.id ? s.cardItemActive : s.cardItem} onClick={() => selectAgent(a)}>
                    <p style={s.itemTitle}>{a.name}</p>
                    {a.description && <p style={s.itemSub}>{a.description}</p>}
                  </button>
                ))}
              </div>
            ) : null}

            {(selectedAgent || creatingAgent) && (
              <div className="card" style={s.editCard}>
                <div style={s.row}>
                  <label style={s.label}>Name</label>
                  <input style={inp} value={agentForm.name} onChange={e => setAgentForm(f => ({ ...f, name: e.target.value }))} placeholder="Agent-Name" />
                </div>
                <div style={s.row}>
                  <label style={s.label}>Beschreibung</label>
                  <input style={inp} value={agentForm.description} onChange={e => setAgentForm(f => ({ ...f, description: e.target.value }))} placeholder="Kurze Beschreibung" />
                </div>
                <div style={s.row}>
                  <label style={s.label}>System-Prompt</label>
                  <textarea style={{ ...textarea, minHeight: 120 }} value={agentForm.system_prompt} onChange={e => setAgentForm(f => ({ ...f, system_prompt: e.target.value }))} placeholder="Du bist ein hilfreicher Assistent der…" />
                </div>
                <div style={s.row}>
                  <label style={s.label}>Sichtbarkeit</label>
                  <select style={inp} value={agentForm.visibility} onChange={e => setAgentForm(f => ({ ...f, visibility: e.target.value as AgentVisibility }))}>
                    <option value="private">Nur ich</option>
                    <option value="org">Gesamte Organisation</option>
                  </select>
                </div>
                <div style={s.actions}>
                  <button className="btn btn-primary" onClick={handleAgentSave} disabled={agentSaving || !agentForm.name.trim()}>
                    <FloppyDisk size={14} weight="bold" /> {agentSaving ? 'Speichere…' : 'Speichern'}
                  </button>
                  {selectedAgent && (
                    <button className="btn btn-ghost" onClick={() => setWorkspacePicker(true)}>
                      <ShareNetwork size={14} weight="bold" /> In Workspace
                    </button>
                  )}
                  {selectedAgent && (
                    agentDeleteConfirm ? (
                      <>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center' }}>Sicher löschen?</span>
                        <button className="btn btn-danger" style={{ marginLeft: 'auto' }} onClick={handleAgentDelete}>Ja, löschen</button>
                        <button className="btn btn-ghost" onClick={() => setAgentDeleteConfirm(false)}>Abbrechen</button>
                      </>
                    ) : (
                      <button className="btn btn-danger" style={{ marginLeft: 'auto' }} onClick={() => setAgentDeleteConfirm(true)}>
                        <Trash size={14} weight="bold" /> Löschen
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'community' && (
          <div style={s.comingSoon}>
            <Lock size={36} weight="bold" />
            <p style={{ margin: 0, fontWeight: 600 }}>Community-Projekte — bald verfügbar</p>
            <p style={{ margin: 0, fontSize: 12 }}>Teile deine Projekte und entdecke Projekte anderer Teams</p>
          </div>
        )}

        {tab === 'templates' && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Robot size={16} color="var(--accent)" weight="fill" />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Vorlagen helfen dir, schnell mit einem neuen Projekt zu starten.</span>
            </div>
            <div style={s.tplGrid}>
              {TEMPLATES.map(tpl => (
                <div key={tpl.id} className="card" style={s.tplCard}>
                  <p style={s.tplTitle}>
                    {tpl.label}
                    <span style={s.badge}>{tpl.taskType}</span>
                  </p>
                  <p style={s.tplSub}>{tpl.fields.length} Felder</p>
                </div>
              ))}
            </div>
          </div>
        )}

      {workspacePicker && selectedAgent && (
        <WorkspacePicker
          itemType="agent"
          itemId={selectedAgent.id}
          itemTitle={selectedAgent.name}
          onClose={() => setWorkspacePicker(false)}
        />
      )}
    </div>
  )
}

