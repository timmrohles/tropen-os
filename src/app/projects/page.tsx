'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  FolderOpen, Robot, Users, BookOpen, Lock,
  Plus, PencilSimple, Trash, FloppyDisk, X,
  LightbulbFilament, Info,
} from '@phosphor-icons/react'
import { TEMPLATES } from '@/lib/prompt-templates'
import type { Project } from '@/hooks/useWorkspaceState'

type Tab = 'projects' | 'agents' | 'community' | 'templates'

const TONE_LABELS: Record<string, string> = {
  formal: 'Formell', casual: 'Locker', technical: 'Technisch', creative: 'Kreativ'
}
const LANG_LABELS: Record<string, string> = { de: 'Deutsch', en: 'Englisch', auto: 'Auto' }
const AUD_LABELS: Record<string, string> = {
  internal: 'Intern', customers: 'Kunden', public: 'Öffentlichkeit'
}

interface Agent {
  id: string
  name: string
  description: string | null
  system_prompt: string | null
  visibility: 'private' | 'org'
  created_at: string
}

type AgentVisibility = 'private' | 'org'
const EMPTY_AGENT_FORM: { name: string; description: string; system_prompt: string; visibility: AgentVisibility } = { name: '', description: '', system_prompt: '', visibility: 'private' }

const inp: React.CSSProperties = {
  width: '100%', background: '#fff', border: '1px solid var(--border-medium)',
  borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
  fontSize: 13, boxSizing: 'border-box', outline: 'none',
  fontFamily: 'var(--font-sans, system-ui)',
}
const textarea: React.CSSProperties = { ...inp, minHeight: 96, resize: 'vertical' as const }
const sel: React.CSSProperties = { ...inp }

export default function ProjectsPage() {
  const [tab, setTab] = useState<Tab>('projects')
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ name: '', description: '', context: '', tone: 'casual', language: 'auto', target_audience: 'internal' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const [agents, setAgents] = useState<Agent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agentForm, setAgentForm] = useState<{ name: string; description: string; system_prompt: string; visibility: AgentVisibility }>(EMPTY_AGENT_FORM)
  const [agentSaving, setAgentSaving] = useState(false)
  const [agentDeleteConfirm, setAgentDeleteConfirm] = useState(false)
  const [creatingAgent, setCreatingAgent] = useState(false)

  const loadProjects = useCallback(async (wsId: string) => {
    const res = await fetch(`/api/projects?workspace_id=${wsId}`)
    if (res.ok) setProjects(await res.json())
  }, [])

  const loadWorkspace = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      const wsId = membership?.workspace_id ?? null
      setWorkspaceId(wsId)
      if (wsId) await loadProjects(wsId)
    } catch (err) {
      console.error('[projects] loadWorkspace error:', err)
    } finally {
      setLoading(false)
    }
  }, [loadProjects])

  useEffect(() => { loadWorkspace() }, [loadWorkspace])

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
    setAgentSaving(true)
    try {
      const res = await fetch(`/api/agents/${selectedAgent.id}`, { method: 'DELETE' })
      if (res.ok) {
        setAgents(prev => prev.filter(a => a.id !== selectedAgent.id))
        setSelectedAgent(null)
        setAgentDeleteConfirm(false)
        setAgentForm(EMPTY_AGENT_FORM)
      }
    } finally {
      setAgentSaving(false)
    }
  }

  function selectProject(p: Project) {
    setSelected(p)
    setForm({
      name: p.name,
      description: p.description ?? '',
      context: p.context ?? '',
      tone: p.tone ?? 'casual',
      language: p.language ?? 'auto',
      target_audience: p.target_audience ?? 'internal',
    })
    setDeleteConfirm(false)
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    setSaveError(null)
    const res = await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, ...form }),
    })
    if (res.ok) {
      const updated = await res.json()
      setProjects(ps => ps.map(p => p.id === updated.id ? updated : p))
      setSelected(updated)
    } else {
      setSaveError('Speichern fehlgeschlagen. Bitte versuche es erneut.')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!selected || saving) return
    setSaving(true)
    setSaveError(null)
    const res = await fetch('/api/projects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id }),
    })
    if (res.ok) {
      setProjects(ps => ps.filter(p => p.id !== selected.id))
      setSelected(null)
      setDeleteConfirm(false)
    } else {
      setSaveError('Löschen fehlgeschlagen. Bitte versuche es erneut.')
    }
    setSaving(false)
  }

  async function handleCreate() {
    if (!newName.trim() || !workspaceId) return
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: workspaceId, name: newName.trim() }),
    })
    if (res.ok) {
      const created = await res.json()
      setProjects(ps => [...ps, created])
      setCreating(false)
      setNewName('')
      selectProject(created)
    }
  }

  if (loading) return (
    <div className="content-max" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Lädt…</p>
    </div>
  )

  const TABS: { id: Tab; label: string; icon: React.ReactNode; active: boolean }[] = [
    { id: 'projects',   label: 'Meine Workspaces', icon: <FolderOpen size={15} weight="bold" />, active: true },
    { id: 'agents',     label: 'Meine Agenten',    icon: <Robot size={15} weight="bold" />,      active: true },
    { id: 'community',  label: 'Community',         icon: <Users size={15} weight="bold" />,      active: false },
    { id: 'templates',  label: 'Vorlagen',          icon: <BookOpen size={15} weight="bold" />,   active: true },
  ]

  return (
    <div className="content-max" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <style>{`
        @media (max-width: 900px) {
          .projects-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">Workspaces</h1>
          <p className="page-header-sub">Organisiere deine Chats, Agenten und Vorlagen</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => t.active && setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              cursor: t.active ? 'pointer' : 'default',
              fontSize: 13,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              opacity: t.active ? 1 : 0.5,
              borderRadius: '6px 6px 0 0',
              transition: 'all var(--t-fast)',
              fontFamily: 'var(--font-sans, system-ui)',
            }}
          >
            {t.icon}
            {t.label}
            {!t.active && <Lock size={11} style={{ marginLeft: 2 }} />}
          </button>
        ))}
      </div>

      {/* Tab: Meine Workspaces */}
      {tab === 'projects' && (
        <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: 20, alignItems: 'start' }}>
          {/* List */}
          <div className="card">
            <div className="card-header">
              <span className="card-header-label">Workspaces</span>
              {creating ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
                    placeholder="Workspace-Name…"
                    style={{ ...inp, width: 180, padding: '5px 10px' }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleCreate}>Erstellen</button>
                  <button className="btn-icon" onClick={() => { setCreating(false); setNewName('') }} style={{ color: 'var(--text-tertiary)' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
                  <Plus size={14} weight="bold" /> Neu
                </button>
              )}
            </div>
            <div className="card-body" style={{ padding: '4px' }}>
              {projects.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <FolderOpen size={40} weight="thin" style={{ color: 'var(--text-tertiary)' }} />
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>Noch keine Workspaces</p>
                  <button className="btn btn-ghost btn-sm" onClick={() => setCreating(true)}>
                    <Plus size={14} weight="bold" /> Ersten Workspace anlegen
                  </button>
                </div>
              ) : (
                projects.map(p => {
                  const count = p.conversations?.[0]?.count ?? 0
                  const active = selected?.id === p.id
                  return (
                    <button
                      key={p.id}
                      className={`list-row${active ? ' list-row--active' : ''}`}
                      onClick={() => selectProject(p)}
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <FolderOpen size={16} weight="fill" style={{ flexShrink: 0, color: active ? 'var(--active-text)' : 'var(--accent)' }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                        {p.description && (
                          <span style={{ fontSize: 12, color: active ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const }}>
                            {p.description}
                          </span>
                        )}
                      </span>
                      <span className="badge" style={active ? { background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' } : {}}>
                        {count} Chats
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Detail Panel */}
          {selected ? (
            <div className="card">
              <div className="card-header">
                <span className="card-header-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PencilSimple size={13} /> Workspace bearbeiten
                </span>
              </div>
              <div className="card-body" style={{ padding: '16px' }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>Name</label>
                  <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>Beschreibung</label>
                  <input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Kurze Beschreibung…" />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>Kontext für Toro</label>
                  <div style={{ background: 'var(--accent-light)', border: '1px solid rgba(45,122,80,0.25)', borderRadius: 8, padding: '10px 12px', marginBottom: 8, display: 'flex', gap: 8 }}>
                    <LightbulbFilament size={15} weight="fill" style={{ flexShrink: 0, marginTop: 1, color: 'var(--accent)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Was soll Toro über diesen Workspace wissen? Hintergrund, Ziele, Einschränkungen, wichtige Begriffe.</span>
                  </div>
                  <textarea style={textarea} value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} placeholder="Kontext für Toro…" />
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '8px 10px', background: 'var(--bg-surface-2)', borderRadius: 6, marginTop: 6 }}>
                    <Info size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--text-tertiary)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Auto-Extraktion kommt in Phase 3.</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Ton', key: 'tone', opts: TONE_LABELS, val: form.tone },
                    { label: 'Sprache', key: 'language', opts: LANG_LABELS, val: form.language },
                    { label: 'Zielgruppe', key: 'target_audience', opts: AUD_LABELS, val: form.target_audience },
                  ].map(({ label, key, opts, val }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>{label}</label>
                      <select style={sel} value={val} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
                        {Object.entries(opts).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {saveError && (
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: '#ef4444' }}>{saveError}</p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  {deleteConfirm ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Wirklich löschen?</span>
                      <button className="btn btn-danger btn-sm" onClick={handleDelete}>Ja</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(false)}>Nein</button>
                    </div>
                  ) : (
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(true)}>
                      <Trash size={14} />
                    </button>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                    <FloppyDisk size={14} weight="bold" />{saving ? 'Speichert…' : 'Speichern'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>Workspace auswählen oder neu anlegen</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Meine Agenten */}
      {tab === 'agents' && (
        <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: 20, alignItems: 'start' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-header-label">Agenten</span>
              <button className="btn btn-primary btn-sm" onClick={() => { setSelectedAgent(null); setAgentForm(EMPTY_AGENT_FORM); setCreatingAgent(true) }}>
                <Plus size={14} weight="bold" /> Neu
              </button>
            </div>
            <div className="card-body" style={{ padding: '4px' }}>
              {agentsLoading ? (
                <p style={{ padding: '20px', fontSize: 13, color: 'var(--text-tertiary)' }}>Lädt…</p>
              ) : agents.length === 0 && !creatingAgent ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <Robot size={40} weight="thin" style={{ color: 'var(--text-tertiary)' }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Noch keine Agenten</p>
                  <p style={{ maxWidth: 320, textAlign: 'center', margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                    Erstelle Agenten mit individuellem System-Prompt und weise sie Workspaces zu.
                  </p>
                  <button className="btn btn-ghost btn-sm" onClick={() => setCreatingAgent(true)}>
                    <Plus size={14} weight="bold" /> Ersten Agenten anlegen
                  </button>
                </div>
              ) : (
                agents.map(a => {
                  const active = selectedAgent?.id === a.id
                  return (
                    <button
                      key={a.id}
                      className={`list-row${active ? ' list-row--active' : ''}`}
                      onClick={() => selectAgent(a)}
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <Robot size={16} weight="fill" style={{ flexShrink: 0, color: active ? 'var(--active-text)' : 'var(--accent)' }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                        {a.description && (
                          <span style={{ fontSize: 12, color: active ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const }}>
                            {a.description}
                          </span>
                        )}
                      </span>
                      <span className="badge" style={active ? { background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' } : {}}>
                        {a.visibility === 'org' ? 'Team' : 'Privat'}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {(selectedAgent || creatingAgent) ? (
            <div className="card">
              <div className="card-header">
                <span className="card-header-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Robot size={13} /> {creatingAgent && !selectedAgent ? 'Neuer Agent' : 'Agent bearbeiten'}
                </span>
              </div>
              <div className="card-body" style={{ padding: '16px' }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>Name</label>
                  <input style={inp} value={agentForm.name} onChange={e => setAgentForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Marketing-Texter" />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>Beschreibung</label>
                  <input style={inp} value={agentForm.description} onChange={e => setAgentForm(f => ({ ...f, description: e.target.value }))} placeholder="Kurze Beschreibung…" />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>System-Prompt</label>
                  <div style={{ background: 'var(--accent-light)', border: '1px solid rgba(45,122,80,0.25)', borderRadius: 8, padding: '10px 12px', marginBottom: 8, display: 'flex', gap: 8 }}>
                    <LightbulbFilament size={15} weight="fill" style={{ flexShrink: 0, marginTop: 1, color: 'var(--accent)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Erkläre dem Agenten seine Rolle, seinen Ton und seine Aufgaben. Wird bei jedem Chat mitgeschickt.</span>
                  </div>
                  <textarea
                    style={{ ...textarea, minHeight: 140 }}
                    value={agentForm.system_prompt}
                    onChange={e => setAgentForm(f => ({ ...f, system_prompt: e.target.value }))}
                    placeholder="Du bist ein erfahrener Marketing-Texter…"
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>Sichtbarkeit</label>
                  <select style={sel} value={agentForm.visibility} onChange={e => setAgentForm(f => ({ ...f, visibility: e.target.value as AgentVisibility }))}>
                    <option value="private">Nur ich</option>
                    <option value="org">Ganzes Team</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  {selectedAgent && (
                    agentDeleteConfirm ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Wirklich löschen?</span>
                        <button className="btn btn-danger btn-sm" onClick={handleAgentDelete}>Ja</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setAgentDeleteConfirm(false)}>Nein</button>
                      </div>
                    ) : (
                      <button className="btn btn-danger btn-sm" onClick={() => setAgentDeleteConfirm(true)}>
                        <Trash size={14} />
                      </button>
                    )
                  )}
                  {!selectedAgent && (
                    <button className="btn btn-ghost btn-sm" onClick={() => { setCreatingAgent(false); setAgentForm(EMPTY_AGENT_FORM) }}>
                      <X size={13} /> Abbrechen
                    </button>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={handleAgentSave} disabled={agentSaving || !agentForm.name.trim()}>
                    <FloppyDisk size={14} weight="bold" />{agentSaving ? 'Speichert…' : 'Speichern'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>Agenten auswählen oder neu anlegen</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Community */}
      {tab === 'community' && (
        <div className="card" style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <Lock size={40} weight="thin" style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ margin: 0, fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>Kommt in Phase 4</p>
          <p style={{ maxWidth: 420, textAlign: 'center', margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Entdecke öffentliche Agenten, teile deine eigenen und baue auf dem Wissen der Community auf.
          </p>
          <a href="mailto:hello@tropen-os.de?subject=Interesse: Community" style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
            Interesse melden →
          </a>
        </div>
      )}

      {/* Tab: Vorlagen */}
      {tab === 'templates' && (
        <div>
          <p style={{ marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            Starte einen Chat mit einer strukturierten Vorlage.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {TEMPLATES.map(t => (
              <div key={t.id} className="card">
                <div className="card-header">
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{t.label}</span>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                    {t.fields.map(f => <span key={f.id} className="chip">{f.label}</span>)}
                  </div>
                  <a
                    href={workspaceId ? `/workspaces/${workspaceId}?template=${t.id}` : '/chat'}
                    className="btn btn-ghost btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex' }}
                  >
                    Im Department öffnen
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
