'use client'

import React, { useState, useEffect } from 'react'
import {
  Robot, Users, BookOpen, Lock,
  Plus, Trash, FloppyDisk,
  LightbulbFilament,
} from '@phosphor-icons/react'
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
  width: '100%', background: '#fff', border: '1px solid var(--border-medium)',
  borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
  fontSize: 13, boxSizing: 'border-box', outline: 'none',
  fontFamily: 'var(--font-sans, system-ui)',
}
const textarea: React.CSSProperties = { ...inp, minHeight: 80, resize: 'vertical' as const }

export default function HubPage() {
  const [tab, setTab] = useState<Tab>('agents')

  // Agents tab state
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agentForm, setAgentForm] = useState<{ name: string; description: string; system_prompt: string; visibility: AgentVisibility }>(EMPTY_AGENT_FORM)
  const [agentSaving, setAgentSaving] = useState(false)
  const [agentDeleteConfirm, setAgentDeleteConfirm] = useState(false)
  const [creatingAgent, setCreatingAgent] = useState(false)

  // Agents tab
  useEffect(() => {
    if (tab !== 'agents') return
    setAgentsLoading(true)
    fetch('/api/agents')
      .then(r => r.ok ? r.json() : [])
      .then(data => setAgents(Array.isArray(data) ? data : []))
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
    tabs: { display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 },
    tab: { padding: '8px 16px', borderRadius: '8px 8px 0 0', fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none', color: 'var(--text-secondary)' },
    tabActive: { padding: '8px 16px', borderRadius: '8px 8px 0 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', borderBottom: '2px solid var(--accent)' },
    layout: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 },
    sidebar: { display: 'flex', flexDirection: 'column', gap: 8 },
    item: { padding: '10px 14px', borderRadius: 8, cursor: 'pointer', border: '1px solid transparent', background: 'none', textAlign: 'left' as const, width: '100%' },
    itemActive: { padding: '10px 14px', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-surface)', textAlign: 'left' as const, width: '100%' },
    itemTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
    itemSub: { fontSize: 12, color: 'var(--text-tertiary)', margin: 0, marginTop: 2 },
    addBtn: { padding: '8px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
    card: { background: 'var(--bg-surface)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' },
    label: { fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6, display: 'block' },
    row: { marginBottom: 16 },
    actions: { display: 'flex', gap: 8, marginTop: 20 },
    saveBtn: { padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
    cancelBtn: { padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
    deleteBtn: { padding: '8px 16px', background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginLeft: 'auto' },
    confirmDelete: { padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginLeft: 'auto' },
    empty: { color: 'var(--text-tertiary)', fontSize: 13, padding: '40px 0', textAlign: 'center' as const },
    comingSoon: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12, padding: '48px 0', color: 'var(--text-tertiary)' },
    tplGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
    tplCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer' },
    tplTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
    tplSub: { fontSize: 12, color: 'var(--text-tertiary)', margin: 0, marginTop: 4 },
    badge: { background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, marginLeft: 8 },
  }

  return (
    <div className="content-max">
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div className="page-header-text">
            <h1 className="page-header-title">Hub</h1>
            <p className="page-header-sub">Agenten, Vorlagen und Community</p>
          </div>
        </div>

        <div style={s.tabs}>
          {(['agents', 'community', 'templates'] as Tab[]).map(t => (
            <button key={t} style={tab === t ? s.tabActive : s.tab} onClick={() => setTab(t)}>
              {t === 'agents' ? <Robot size={14} style={{ marginRight: 6 }} weight="bold" /> : null}
              {t === 'community' ? <Users size={14} style={{ marginRight: 6 }} weight="bold" /> : null}
              {t === 'templates' ? <BookOpen size={14} style={{ marginRight: 6 }} weight="bold" /> : null}
              {t === 'agents' ? 'Meine Agenten' : t === 'community' ? 'Community' : 'Vorlagen'}
            </button>
          ))}
        </div>

        {tab === 'agents' && (
          <div style={s.layout}>
            <div style={s.sidebar}>
              <button style={s.addBtn} onClick={() => { setCreatingAgent(true); setSelectedAgent(null); setAgentForm(EMPTY_AGENT_FORM) }}>
                <Plus size={14} weight="bold" /> Neuer Agent
              </button>
              {agentsLoading ? (
                <p style={s.empty}>Lade Agenten…</p>
              ) : agents.length === 0 ? (
                <p style={s.empty}>Noch keine Agenten</p>
              ) : (
                agents.map(a => (
                  <button key={a.id} style={selectedAgent?.id === a.id ? s.itemActive : s.item} onClick={() => selectAgent(a)}>
                    <p style={s.itemTitle}>{a.name}</p>
                    {a.description && <p style={s.itemSub}>{a.description}</p>}
                  </button>
                ))
              )}
            </div>
            <div>
              {(selectedAgent || creatingAgent) ? (
                <div style={s.card}>
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
                    <button style={s.saveBtn} onClick={handleAgentSave} disabled={agentSaving || !agentForm.name.trim()}>
                      <FloppyDisk size={14} weight="bold" /> {agentSaving ? 'Speichere…' : 'Speichern'}
                    </button>
                    {selectedAgent && (
                      agentDeleteConfirm ? (
                        <>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center' }}>Sicher löschen?</span>
                          <button style={s.confirmDelete} onClick={handleAgentDelete}>Ja, löschen</button>
                          <button style={s.cancelBtn} onClick={() => setAgentDeleteConfirm(false)}>Abbrechen</button>
                        </>
                      ) : (
                        <button style={s.deleteBtn} onClick={() => setAgentDeleteConfirm(true)}>
                          <Trash size={14} weight="bold" /> Löschen
                        </button>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div style={s.empty}>
                  <Robot size={40} color="var(--text-tertiary)" weight="bold" />
                  <p>Wähle einen Agenten aus oder erstelle einen neuen</p>
                </div>
              )}
            </div>
          </div>
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
              <LightbulbFilament size={16} color="var(--accent)" weight="fill" />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Vorlagen helfen dir, schnell mit einem neuen Projekt zu starten.</span>
            </div>
            <div style={s.tplGrid}>
              {TEMPLATES.map(tpl => (
                <div key={tpl.id} style={s.tplCard}>
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
    </div>
  )
}

