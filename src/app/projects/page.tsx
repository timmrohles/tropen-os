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

  const s: Record<string, React.CSSProperties> = {
    page:        { minHeight: '100vh', background: 'var(--bg-base)', padding: '32px 24px' },
    inner:       { maxWidth: 1100, margin: '0 auto' },
    header:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    h1:          { fontSize: 'var(--text-xl)', fontFamily: 'var(--font-display)', margin: 0 },
    tabs:        { display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--color-border)', paddingBottom: 0 },
    tab:         { padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)' },
    tabActive:   { background: 'var(--bg-surface)', borderBottom: '2px solid var(--accent)' },
    tabDisabled: { opacity: 0.5, cursor: 'default' },
    cols:        { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 },
    grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 },
    card:        { background: 'var(--bg-surface)', borderRadius: 10, padding: '16px', border: '1px solid var(--color-border)', cursor: 'pointer' },
    cardActive:  { background: 'var(--bg-surface)', borderRadius: 10, padding: '16px', border: '1px solid var(--accent)', cursor: 'pointer' },
    detail:      { background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--color-border)', padding: 24 },
    fieldWrap:   { marginBottom: 16 },
    label:       { display: 'block', fontSize: 'var(--text-xs)', marginBottom: 6 },
    input:       { width: '100%', background: 'var(--bg-base)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--color-text)', fontSize: 'var(--text-sm)', boxSizing: 'border-box' },
    textarea:    { width: '100%', background: 'var(--bg-base)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--color-text)', fontSize: 'var(--text-sm)', minHeight: 100, resize: 'vertical', boxSizing: 'border-box' },
    select:      { width: '100%', background: 'var(--bg-base)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--color-text)', fontSize: 'var(--text-sm)' },
    hintBox:     { background: 'rgba(163,181,84,0.08)', border: '1px solid rgba(163,181,84,0.25)', borderRadius: 8, padding: '12px 14px', marginBottom: 8, fontSize: 'var(--text-xs)' },
    hintRow:     { display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 },
    actions:     { display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 20 },
    btnPrimary:  { padding: '8px 16px', background: 'var(--accent)', color: '#0d1f16', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6 },
    btnDanger:   { padding: '8px 16px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 6 },
    placeholder: { textAlign: 'center', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
    tplGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
    tplCard:     { background: 'var(--bg-surface)', borderRadius: 10, padding: 20, border: '1px solid var(--color-border)' },
    addBtn:      { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(163,181,84,0.12)', border: '1px solid rgba(163,181,84,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--accent)' },
    chatCount:   { fontSize: 'var(--text-xs)', padding: '2px 8px', background: 'rgba(255,255,255,0.07)', borderRadius: 20, display: 'inline-block' },
    infoBox:     { display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, marginTop: 6, fontSize: 'var(--text-xs)' },
  }

  if (loading) return (
    <div style={s.page}><div style={s.inner}><p className="t-dezent">Lädt…</p></div></div>
  )

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={s.header}>
          <h1 style={s.h1} className="t-primary">Projekte & Vorlagen</h1>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {([
            { id: 'projects',   label: 'Meine Projekte', icon: <FolderOpen size={16} />, active: true  },
            { id: 'agents',     label: 'Meine Agenten',  icon: <Robot size={16} />,      active: false },
            { id: 'community',  label: 'Community',      icon: <Users size={16} />,      active: false },
            { id: 'templates',  label: 'Vorlagen',       icon: <BookOpen size={16} />,   active: true  },
          ] as { id: Tab; label: string; icon: React.ReactNode; active: boolean }[]).map(t => (
            <button
              key={t.id}
              style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}), ...(!t.active ? s.tabDisabled : {}) }}
              className={tab === t.id ? 't-primary' : 't-secondary'}
              onClick={() => t.active && setTab(t.id)}
            >
              {t.icon}
              {t.label}
              {!t.active && <Lock size={12} style={{ marginLeft: 2 }} />}
            </button>
          ))}
        </div>

        {/* Tab: Meine Projekte */}
        {tab === 'projects' && (
          <div style={s.cols}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                {creating ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      autoFocus
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
                      placeholder="Projektname…"
                      style={{ ...s.input, width: 200 }}
                    />
                    <button style={s.btnPrimary} onClick={handleCreate}>Erstellen</button>
                    <button style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }} className="t-dezent" onClick={() => { setCreating(false); setNewName('') }}><X size={16} /></button>
                  </div>
                ) : (
                  <button style={s.addBtn} onClick={() => setCreating(true)}><Plus size={16} /> Neues Projekt</button>
                )}
              </div>

              {projects.length === 0 ? (
                <div style={s.placeholder}>
                  <FolderOpen size={48} weight="thin" color="rgba(255,255,255,0.2)" />
                  <p className="t-dezent">Noch keine Projekte</p>
                  <button style={s.addBtn} onClick={() => setCreating(true)}><Plus size={16} /> Erstes Projekt anlegen</button>
                </div>
              ) : (
                <div style={s.grid}>
                  {projects.map(p => {
                    const count = p.conversations?.[0]?.count ?? 0
                    return (
                      <div key={p.id} style={selected?.id === p.id ? s.cardActive : s.card} onClick={() => selectProject(p)}>
                        <p className="t-primary" style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{p.name}</p>
                        {p.description && (
                          <p className="t-secondary" style={{ margin: '0 0 8px', fontSize: 'var(--text-xs)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {p.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {p.tone && <span className="chip">{TONE_LABELS[p.tone] ?? p.tone}</span>}
                          <span style={s.chatCount} className="t-dezent">{count} Chats</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Detail-Panel */}
            {selected ? (
              <div style={s.detail}>
                <p className="t-primary" style={{ margin: '0 0 20px', fontWeight: 600, fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PencilSimple size={16} />Projekt bearbeiten
                </p>

                <div style={s.fieldWrap}>
                  <label style={s.label} className="t-dezent">Name</label>
                  <input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>

                <div style={s.fieldWrap}>
                  <label style={s.label} className="t-dezent">Beschreibung</label>
                  <input style={s.input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Kurze Beschreibung…" />
                </div>

                <div style={s.fieldWrap}>
                  <label style={s.label} className="t-dezent">Projekt-Kontext für Toro</label>
                  <div style={s.hintBox}>
                    <div style={s.hintRow}>
                      <LightbulbFilament size={16} color="var(--accent)" weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span className="t-secondary">Schreib hier alles, was Toro über dieses Projekt wissen soll – Hintergrund, Ziele, Einschränkungen, wichtige Begriffe.</span>
                    </div>
                    <p className="t-dezent" style={{ margin: '6px 0 0 24px', fontStyle: 'italic' }}>
                      Beispiel: „Dieses Projekt ist für den Launch unserer App ‚Waldpfad'. Zielgruppe: 30–50 jährige Outdoor-Enthusiasten. Budget: 50.000 €. Launch: 15. Mai 2026."
                    </p>
                  </div>
                  <textarea style={s.textarea} value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} placeholder="Kontext für Toro…" />
                  <div style={s.infoBox}>
                    <Info size={14} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span className="t-dezent">Auto-Extraktion (Toro liest Chats und ergänzt den Kontext automatisch) kommt in Phase 3.</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div>
                    <label style={s.label} className="t-dezent">Ton</label>
                    <select style={s.select} value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
                      {Object.entries(TONE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label} className="t-dezent">Sprache</label>
                    <select style={s.select} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                      {Object.entries(LANG_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label} className="t-dezent">Zielgruppe</label>
                    <select style={s.select} value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}>
                      {Object.entries(AUD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {saveError && (
                  <p style={{ margin: '0 0 12px', fontSize: 'var(--text-xs)', color: '#ef4444' }}>{saveError}</p>
                )}
                <div style={s.actions}>
                  {deleteConfirm ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="t-secondary" style={{ fontSize: 'var(--text-xs)' }}>Wirklich löschen?</span>
                      <button style={{ ...s.btnDanger, padding: '6px 12px' }} onClick={handleDelete}>Ja</button>
                      <button style={{ padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer' }} className="t-dezent" onClick={() => setDeleteConfirm(false)}>Nein</button>
                    </div>
                  ) : (
                    <button style={{ ...s.btnDanger, padding: '8px 12px' }} onClick={() => setDeleteConfirm(true)}><Trash size={15} /></button>
                  )}
                  <button style={s.btnPrimary} onClick={handleSave} disabled={saving}>
                    <FloppyDisk size={15} />{saving ? 'Speichert…' : 'Speichern'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ ...s.detail, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="t-dezent" style={{ textAlign: 'center', fontSize: 'var(--text-sm)' }}>Projekt auswählen oder neu anlegen</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Meine Agenten (Platzhalter) */}
        {tab === 'agents' && (
          <div style={s.placeholder}>
            <Lock size={48} weight="thin" color="rgba(255,255,255,0.2)" />
            <p className="t-primary" style={{ margin: 0, fontWeight: 600 }}>Kommt in Phase 3</p>
            <p className="t-secondary" style={{ maxWidth: 420, textAlign: 'center', margin: 0 }}>
              Erstelle eigene Agenten, weise sie Projekten zu und teile sie mit deinem Team. Agenten bauen auf System-Agenten auf und können mit eigenem System-Prompt erweitert werden.
            </p>
            <a href="mailto:hello@tropen-os.de?subject=Interesse: Agenten-System" style={{ color: 'var(--accent)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
              Interesse melden →
            </a>
          </div>
        )}

        {/* Tab: Community (Platzhalter) */}
        {tab === 'community' && (
          <div style={s.placeholder}>
            <Lock size={48} weight="thin" color="rgba(255,255,255,0.2)" />
            <p className="t-primary" style={{ margin: 0, fontWeight: 600 }}>Kommt in Phase 4</p>
            <p className="t-secondary" style={{ maxWidth: 420, textAlign: 'center', margin: 0 }}>
              Entdecke öffentliche Agenten, teile deine eigenen und baue auf dem Wissen der Community auf. Mit Bewertungen, Nutzungszahlen und kuratierten Featured Agents.
            </p>
            <a href="mailto:hello@tropen-os.de?subject=Interesse: Community" style={{ color: 'var(--accent)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
              Interesse melden →
            </a>
          </div>
        )}

        {/* Tab: Vorlagen */}
        {tab === 'templates' && (
          <div>
            <p className="t-secondary" style={{ marginBottom: 24, fontSize: 'var(--text-sm)' }}>
              Starte einen Chat mit einer strukturierten Vorlage.
            </p>
            <div style={s.tplGrid}>
              {TEMPLATES.map(t => (
                <div key={t.id} style={s.tplCard}>
                  <p className="t-primary" style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{t.label}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                    {t.fields.map(f => <span key={f.id} className="chip t-dezent">{f.label}</span>)}
                  </div>
                  <a
                    href={workspaceId ? `/workspaces/${workspaceId}?template=${t.id}` : '/workspaces'}
                    style={{ ...s.addBtn, textDecoration: 'none', display: 'inline-flex' }}
                  >
                    Im Workspace öffnen
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
