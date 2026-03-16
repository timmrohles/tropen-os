'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  FolderOpen,
  Plus, Trash, FloppyDisk,
} from '@phosphor-icons/react'
import type { Project } from '@/hooks/useWorkspaceState'

export default function ProjectsPage() {
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

  const loadProjects = useCallback(async (deptId: string) => {
    const res = await fetch(`/api/projects?department_id=${deptId}`)
    if (res.ok) { const json = await res.json(); setProjects(Array.isArray(json) ? json : (json.data ?? [])) }
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

  function selectProject(p: Project) {
    setSelected(p)
    setForm({ title: p.title, goal: p.goal ?? '', instructions: p.instructions ?? '' })
    setSaveError(null)
    setDeleteConfirm(false)
    setCreating(false)
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

  const inp: React.CSSProperties = {
    width: '100%', background: '#fff', border: '1px solid var(--border-medium)',
    borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
    fontSize: 13, boxSizing: 'border-box', outline: 'none',
    fontFamily: 'var(--font-sans, system-ui)',
  }
  const textarea: React.CSSProperties = { ...inp, minHeight: 80, resize: 'vertical' as const }

  const s: Record<string, React.CSSProperties> = {
    layout: { display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 },
    sidebar: { display: 'flex', flexDirection: 'column', gap: 8 },
    itemTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
    itemSub: { fontSize: 12, color: 'var(--text-tertiary)', margin: 0, marginTop: 2 },
    card: { padding: 24 },
    label: { fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6, display: 'block' },
    row: { marginBottom: 16 },
    actions: { display: 'flex', gap: 8, marginTop: 20 },
    empty: { color: 'var(--text-tertiary)', fontSize: 13, padding: '40px 0', textAlign: 'center' as const },
    newInput: { ...inp, marginBottom: 8 },
    error: { color: '#ef4444', fontSize: 12, marginTop: 8 },
  }

  return (
    <div className="content-max" aria-busy={loading}>
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div className="page-header-text">
            <h1 className="page-header-title">Projekte</h1>
            <p className="page-header-sub">Smarte Projektordner mit Gedächtnis</p>
          </div>
        </div>

        <div style={s.layout}>
          <div style={s.sidebar}>
            <button className="btn btn-primary" onClick={() => { setCreating(true); setSelected(null) }}>
              <Plus size={14} weight="bold" /> Neues Projekt
            </button>

            {creating && (
              <div className="card" style={{ padding: 14 }}>
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
            ) : projects.length === 0 ? (
              <p style={s.empty}>Noch keine Projekte</p>
            ) : (
              projects.map(p => (
                <button key={p.id} className={selected?.id === p.id ? 'list-row list-row--active' : 'list-row'} onClick={() => selectProject(p)}>
                  <p style={s.itemTitle}>{p.title}</p>
                  {p.goal && <p style={s.itemSub}>{p.goal}</p>}
                </button>
              ))
            )}
          </div>

          <div>
            {selected ? (
              <div className="card" style={s.card}>
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
              </div>
            ) : creating ? null : (
              <div style={s.empty}>
                <FolderOpen size={40} color="var(--text-tertiary)" weight="bold" />
                <p>Wähle ein Projekt aus oder erstelle ein neues</p>
              </div>
            )}
          </div>
        </div>
    </div>
  )
}
