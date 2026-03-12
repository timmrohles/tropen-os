'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  FolderOpen, Robot, Users, BookOpen, Lock,
  Plus, PencilSimple, Trash, FloppyDisk, X,
  LightbulbFilament,
} from '@phosphor-icons/react'
import { TEMPLATES } from '@/lib/prompt-templates'
import type { Project } from '@/hooks/useWorkspaceState'

type Tab = 'projects' | 'agents' | 'community' | 'templates'

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

export default function ProjectsPage() {
  const [tab, setTab] = useState<Tab>('projects')
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ title: '', goal: '', instructions: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  // Agents tab state
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agentForm, setAgentForm] = useState<{ name: string; description: string; system_prompt: string; visibility: AgentVisibility }>(EMPTY_AGENT_FORM)
  const [agentSaving, setAgentSaving] = useState(false)
  const [agentDeleteConfirm, setAgentDeleteConfirm] = useState(false)
  const [creatingAgent, setCreatingAgent] = useState(false)

  const loadProjects = useCallback(async (deptId: string) => {
    const res = await fetch(`/api/projects?department_id=${deptId}`)
    if (res.ok) setProjects(await res.json())
  }, [])

  const loadDepartment = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: membership } = await supabase
        .from('department_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      const deptId = membership?.workspace_id ?? null
      setDepartmentId(deptId)
      if (deptId) await loadProjects(deptId)
    } catch (err) {
      console.error('[projects] loadDepartment error:', err)
    } finally {
      setLoading(false)
    }
  }, [loadProjects])

  useEffect(() => { loadDepartment() }, [loadDepartment])

  // Agents tab
  useEffect(() => {
    if (tab !== 'agents') return
    setAgentsLoading(true)
    fetch('/api/agents')
      .then(r => r.ok ? r.json() : [])
      .then(data => setAgents(Array.isArray(data) ? data : []))
      .finally(() => setAgentsLoading(false))
  }, [tab])

  function selectProject(p: Project) {
    setSelected(p)
    setForm({ title: p.title, goal: p.goal ?? '', instructions: p.instructions ?? '' })
    setSaveError(null)
    setDeleteConfirm(false)
    setCreating(false)
  }

  function selectAgent(a: Agent) {
    setSelectedAgent(a)
    setAgentForm({ name: a.name, description: a.description ?? '', system_prompt: a.system_prompt ?? '', visibility: a.visibility })
    setAgentDeleteConfirm(false)
    setCreatingAgent(false)
  }

  async function handleSave() {
    if (!selected || !form.title.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/projects/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, goal: form.goal || null, instructions: form.instructions || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      const updated: Project = await res.json()
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
      setSelected(updated)
      setForm({ title: updated.title, goal: updated.goal ?? '', instructions: updated.instructions ?? '' })
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selected) return
    try {
      await fetch(`/api/projects/${selected.id}`, { method: 'DELETE' })
      setProjects(prev => prev.filter(p => p.id !== selected.id))
      setSelected(null)
      setDeleteConfirm(false)
    } catch {
      setSaveError('Löschen fehlgeschlagen')
    }
  }

  async function handleCreate() {
    if (!departmentId || !newTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_id: departmentId, title: newTitle.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      const created: Project = await res.json()
      setProjects(prev => [created, ...prev])
      setSelected(created)
      setForm({ title: created.title, goal: '', instructions: '' })
      setCreating(false)
      setNewTitle('')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
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
    page: { minHeight: '100vh', background: 'var(--bg-base)' },
    inner: { maxWidth: 1200, margin: '0 auto', padding: '32px 48px 48px' },
    header: { marginBottom: 24 },
    h1: { fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' },
    sub: { fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 },
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
    newInput: { ...inp, marginBottom: 8 },
    error: { color: '#ef4444', fontSize: 12, marginTop: 8 },
    comingSoon: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12, padding: '48px 0', color: 'var(--text-tertiary)' },
    tplGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
    tplCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer' },
    tplTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
    tplSub: { fontSize: 12, color: 'var(--text-tertiary)', margin: 0, marginTop: 4 },
    badge: { background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, marginLeft: 8 },
  }

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={s.header}>
          <h1 style={s.h1}>Projekte</h1>
          <p style={s.sub}>Smarte Projektordner mit Gedächtnis</p>
        </div>

        <div style={s.tabs}>
          {(['projects', 'agents', 'community', 'templates'] as Tab[]).map(t => (
            <button key={t} style={tab === t ? s.tabActive : s.tab} onClick={() => setTab(t)}>
              {t === 'projects' ? <FolderOpen size={14} style={{ marginRight: 6 }} weight="bold" /> : null}
              {t === 'agents' ? <Robot size={14} style={{ marginRight: 6 }} weight="bold" /> : null}
              {t === 'community' ? <Users size={14} style={{ marginRight: 6 }} weight="bold" /> : null}
              {t === 'templates' ? <BookOpen size={14} style={{ marginRight: 6 }} weight="bold" /> : null}
              {t === 'projects' ? 'Meine Projekte' : t === 'agents' ? 'Meine Agenten' : t === 'community' ? 'Community' : 'Vorlagen'}
            </button>
          ))}
        </div>

        {tab === 'projects' && (
          <div style={s.layout}>
            <div style={s.sidebar}>
              <button style={s.addBtn} onClick={() => { setCreating(true); setSelected(null) }}>
                <Plus size={14} weight="bold" /> Neues Projekt
              </button>

              {creating && (
                <div style={{ ...s.card, padding: 14 }}>
                  <input
                    autoFocus
                    placeholder="Projekttitel"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewTitle('') } }}
                    style={s.newInput}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={s.saveBtn} onClick={handleCreate} disabled={saving || !newTitle.trim()}>Erstellen</button>
                    <button style={s.cancelBtn} onClick={() => { setCreating(false); setNewTitle('') }}>Abbrechen</button>
                  </div>
                </div>
              )}

              {loading ? (
                <p style={s.empty}>Lade Projekte…</p>
              ) : projects.length === 0 ? (
                <p style={s.empty}>Noch keine Projekte</p>
              ) : (
                projects.map(p => (
                  <button key={p.id} style={selected?.id === p.id ? s.itemActive : s.item} onClick={() => selectProject(p)}>
                    <p style={s.itemTitle}>{p.title}</p>
                    {p.goal && <p style={s.itemSub}>{p.goal}</p>}
                  </button>
                ))
              )}
            </div>

            <div>
              {selected ? (
                <div style={s.card}>
                  <div style={s.row}>
                    <label style={s.label}>Titel</label>
                    <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div style={s.row}>
                    <label style={s.label}>Ziel (optional)</label>
                    <input style={inp} value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} placeholder="Worum geht es in diesem Projekt?" />
                  </div>
                  <div style={s.row}>
                    <label style={s.label}>Anweisungen für Toro (optional)</label>
                    <textarea style={textarea} value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Wie soll Toro in diesem Projekt antworten?" />
                  </div>
                  {saveError && <p style={s.error}>{saveError}</p>}
                  <div style={s.actions}>
                    <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                      <FloppyDisk size={14} weight="bold" /> {saving ? 'Speichere…' : 'Speichern'}
                    </button>
                    {deleteConfirm ? (
                      <>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center' }}>Sicher löschen?</span>
                        <button style={s.confirmDelete} onClick={handleDelete}>Ja, löschen</button>
                        <button style={s.cancelBtn} onClick={() => setDeleteConfirm(false)}>Abbrechen</button>
                      </>
                    ) : (
                      <button style={s.deleteBtn} onClick={() => setDeleteConfirm(true)}>
                        <Trash size={14} weight="bold" /> Löschen
                      </button>
                    )}
                  </div>
                </div>
              ) : !creating ? (
                <div style={s.empty}>
                  <FolderOpen size={40} color="var(--text-tertiary)" weight="thin" />
                  <p>Wähle ein Projekt aus oder erstelle ein neues</p>
                </div>
              ) : null}
            </div>
          </div>
        )}

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
                  <Robot size={40} color="var(--text-tertiary)" weight="thin" />
                  <p>Wähle einen Agenten aus oder erstelle einen neuen</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'community' && (
          <div style={s.comingSoon}>
            <Lock size={36} weight="thin" />
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
    </div>
  )
}
