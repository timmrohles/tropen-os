'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  FolderOpen, Plus, Trash, FloppyDisk, Brain,
} from '@phosphor-icons/react'

type ProjectWithMemory = {
  id:             string
  title:          string
  goal:           string | null
  instructions:   string | null
  department_id:  string
  meta:           Record<string, unknown> | null
  created_at:     string
  updated_at:     string
  project_memory: { count: number }[] | null
}

type MemoryEntry = {
  id:                      string
  type:                    string
  content:                 string
  importance:              number | null
  frozen:                  boolean
  created_at:              string
}

export default function ProjectsPage() {
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectWithMemory[]>([])
  const [selected, setSelected] = useState<ProjectWithMemory | null>(null)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ title: '', goal: '', instructions: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const [activeTab, setActiveTab] = useState<'edit' | 'memory'>('edit')
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [memoriesLoading, setMemoriesLoading] = useState(false)

  const loadProjects = useCallback(async (deptId: string) => {
    const res = await fetch(`/api/projects?department_id=${deptId}`)
    if (res.ok) {
      const json = await res.json()
      setProjects(Array.isArray(json) ? json : (json.data ?? []))
    }
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

  async function loadMemories(projectId: string) {
    setMemoriesLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/memory`)
      if (res.ok) {
        const json = await res.json()
        setMemories(Array.isArray(json) ? json : [])
      }
    } finally {
      setMemoriesLoading(false)
    }
  }

  function selectProject(p: ProjectWithMemory) {
    setSelected(p)
    setForm({ title: p.title, goal: p.goal ?? '', instructions: p.instructions ?? '' })
    setSaveError(null)
    setDeleteConfirm(false)
    setCreating(false)
    setActiveTab('edit')
    setMemories([])
  }

  function handleTabChange(tab: 'edit' | 'memory') {
    setActiveTab(tab)
    if (tab === 'memory' && selected && memories.length === 0 && !memoriesLoading) {
      loadMemories(selected.id)
    }
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
      const updated: ProjectWithMemory = await res.json()
      // preserve project_memory count from local state
      const withMemory: ProjectWithMemory = { ...updated, project_memory: selected.project_memory }
      setProjects(prev => prev.map(p => p.id === updated.id ? withMemory : p))
      setSelected(withMemory)
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
      const created: ProjectWithMemory = await res.json()
      setProjects(prev => [{ ...created, project_memory: null }, ...prev])
      setSelected({ ...created, project_memory: null })
      setForm({ title: created.title, goal: '', instructions: '' })
      setCreating(false)
      setNewTitle('')
      setActiveTab('edit')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#fff', border: '1px solid var(--border-medium)',
    borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
    fontSize: 13, boxSizing: 'border-box', outline: 'none',
    fontFamily: 'var(--font-sans, system-ui)',
  }
  const textarea: React.CSSProperties = { ...inp, minHeight: 80, resize: 'vertical' as const }

  const s: Record<string, React.CSSProperties> = {
    grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 24 },
    cardItem:     { padding: '16px 18px', cursor: 'pointer', textAlign: 'left' as const, width: '100%' },
    cardItemActive: { padding: '16px 18px', cursor: 'pointer', textAlign: 'left' as const, outline: '2px solid var(--accent)', outlineOffset: -2, width: '100%' },
    itemTitle:    { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
    itemSub:      { fontSize: 12, color: 'var(--text-tertiary)', margin: '4px 0 0' },
    memBadge:     { marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-tertiary)' },
    editCard:     { padding: 24 },
    label:        { fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6, display: 'block' },
    row:          { marginBottom: 16 },
    actions:      { display: 'flex', gap: 8, marginTop: 20 },
    empty:        { color: 'var(--text-tertiary)', fontSize: 13, padding: '40px 0', textAlign: 'center' as const },
    newInput:     { ...inp, marginBottom: 8 },
    error:        { color: '#ef4444', fontSize: 12, marginTop: 8 },
    tabs:         { display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 10 },
    memEntry:     { padding: '10px 14px' },
    memType:      { fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, color: 'var(--accent)', letterSpacing: '0.05em' },
    memContent:   { margin: '4px 0 0', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 },
    memDate:      { margin: '4px 0 0', fontSize: 11, color: 'var(--text-tertiary)' },
  }

  return (
    <div className="content-max" aria-busy={loading}>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <FolderOpen size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Projekte
          </h1>
          <p className="page-header-sub">Smarte Projektordner mit Gedächtnis</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setCreating(true); setSelected(null) }}>
            <Plus size={14} weight="bold" /> Neues Projekt
          </button>
        </div>
      </div>

      {creating && (
        <div className="card" style={{ padding: 14, marginBottom: 16 }}>
          <input
            autoFocus
            placeholder="Projekttitel"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewTitle('') } }}
            style={s.newInput}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving || !newTitle.trim()}>Erstellen</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setCreating(false); setNewTitle('') }}>Abbrechen</button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={s.empty}>Lade Projekte…</p>
      ) : projects.length === 0 && !creating ? (
        <p style={s.empty}>Noch keine Projekte — erstelle dein erstes.</p>
      ) : projects.length > 0 ? (
        <div style={s.grid}>
          {projects.map(p => {
            const memCount = p.project_memory?.[0]?.count ?? 0
            return (
              <button key={p.id} className="card" style={selected?.id === p.id ? s.cardItemActive : s.cardItem} onClick={() => selectProject(p)}>
                <p style={s.itemTitle}>{p.title}</p>
                {p.goal && <p style={s.itemSub}>{p.goal}</p>}
                {memCount > 0 && (
                  <span style={s.memBadge}>
                    <Brain size={12} weight="fill" aria-hidden="true" />
                    {memCount} {memCount === 1 ? 'Erinnerung' : 'Erinnerungen'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ) : null}

      {selected && (
        <div className="card" style={s.editCard}>
          <div style={s.tabs}>
            <button className={`chip ${activeTab === 'edit' ? 'chip--active' : ''}`} onClick={() => handleTabChange('edit')}>Bearbeiten</button>
            <button className={`chip ${activeTab === 'memory' ? 'chip--active' : ''}`} onClick={() => handleTabChange('memory')}>
              Gedächtnis{(selected.project_memory?.[0]?.count ?? 0) > 0 ? ` (${selected.project_memory![0].count})` : ''}
            </button>
          </div>

          {activeTab === 'edit' && (
            <>
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
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  <FloppyDisk size={14} weight="bold" /> {saving ? 'Speichere…' : 'Speichern'}
                </button>
                {deleteConfirm ? (
                  <>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center' }}>Sicher löschen?</span>
                    <button className="btn btn-danger" style={{ marginLeft: 'auto' }} onClick={handleDelete}>Ja, löschen</button>
                    <button className="btn btn-ghost" onClick={() => setDeleteConfirm(false)}>Abbrechen</button>
                  </>
                ) : (
                  <button className="btn btn-danger" style={{ marginLeft: 'auto' }} onClick={() => setDeleteConfirm(true)}>
                    <Trash size={14} weight="bold" /> Löschen
                  </button>
                )}
              </div>
            </>
          )}

          {activeTab === 'memory' && (
            <div>
              {memoriesLoading ? (
                <p style={s.empty}>Lade Erinnerungen…</p>
              ) : memories.length === 0 ? (
                <p style={s.empty}>Noch keine Erinnerungen gespeichert.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {memories.map(m => (
                    <div key={m.id} className="card" style={s.memEntry}>
                      <span style={s.memType}>{m.type}</span>
                      <p style={s.memContent}>{m.content}</p>
                      <p style={s.memDate}>
                        {new Date(m.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        {m.frozen && <span style={{ marginLeft: 6, color: 'var(--accent)' }}>● gespeichert</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
