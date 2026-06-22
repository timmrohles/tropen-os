'use client'

import { useState, useEffect, useCallback } from 'react'
import { Compass, Plus, ChatCircle } from '@phosphor-icons/react'
import { useRouter } from '@/i18n/navigation'
import type { PreflightPivots, PreflightProjectListItem } from '@/lib/preflight/types'
import { IntakePanel, DEFAULT_PIVOTS } from './_components/IntakePanel'
import { EmptyStateIntro } from './_components/EmptyStateIntro'
import { ProjectGrid } from './_components/ProjectGrid'

export default function PreflightPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<PreflightProjectListItem[] | null>(null)
  const [showIntake, setShowIntake] = useState(false)

  const [name, setName] = useState('')
  const [pivots, setPivots] = useState<PreflightPivots>(DEFAULT_PIVOTS)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/preflight/projects')
      if (!res.ok) { setProjects([]); return }
      const json = await res.json() as { data: PreflightProjectListItem[] }
      setProjects(json.data)
    } catch { setProjects([]) }
  }, [])

  useEffect(() => { void loadProjects() }, [loadProjects])

  const submit = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/preflight/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed, pivots, name: name.trim() || undefined }),
      })
      const json = await res.json() as { error?: string; projectId?: string }
      if (!res.ok || !json.projectId) { setError(json.error ?? 'Ein Fehler ist aufgetreten.'); setLoading(false); return }
      router.push(`/preflight/${json.projectId}`)
    } catch { setError('Netzwerkfehler — bitte erneut versuchen.'); setLoading(false) }
  }, [input, pivots, name, loading, router])

  const startChat = useCallback(async () => {
    if (starting) return
    setStarting(true); setError(null)
    try {
      const res = await fetch('/api/preflight/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      })
      const json = await res.json() as { error?: string; projectId?: string }
      if (!res.ok || !json.projectId) { setError(json.error ?? 'Gespräch konnte nicht gestartet werden.'); setStarting(false); return }
      router.push(`/preflight/${json.projectId}/chat`)
    } catch { setError('Netzwerkfehler — bitte erneut versuchen.'); setStarting(false) }
  }, [starting, router])

  const renameProject = useCallback(async (id: string, newName: string) => {
    const res = await fetch(`/api/preflight/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) })
    if (!res.ok) return
    setProjects(prev => prev?.map(p => p.id === id ? { ...p, name: newName } : p) ?? null)
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    const res = await fetch(`/api/preflight/projects/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setProjects(prev => prev?.filter(p => p.id !== id) ?? null)
  }, [])

  const hasProjects = (projects?.length ?? 0) > 0
  const intakeNode = (
    <IntakePanel name={name} onNameChange={setName} pivots={pivots} onPivotsChange={setPivots}
      input={input} onInputChange={setInput} onSubmit={submit} isLoading={loading}
      error={error} onClearError={() => setError(null)} />
  )

  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Compass size={30} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Pre-Flight
          </h1>
          <p className="page-header-sub">Repo-Fundamente für sorgenfreies Bauen — kein Drift, wartbar, sicher.</p>
        </div>
        {hasProjects && (
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={startChat} disabled={starting}>
              <ChatCircle size={16} weight="bold" aria-hidden="true" /> {starting ? 'Starte…' : 'Mit Toro besprechen'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowIntake(s => !s)}>
              <Plus size={16} weight="bold" aria-hidden="true" /> Specs einfügen
            </button>
          </div>
        )}
      </div>

      {/* Leerzustand: chat-first — Chat primär, Specs sekundär ("Hab ich schon") */}
      {projects !== null && !hasProjects && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28, alignItems: 'start' }}>
          <EmptyStateIntro />
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>Noch keine Specs? Starte im Gespräch.</strong>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                Toro hilft dir Schritt für Schritt, die Idee zu schärfen — bis ein tragfähiges Konzept steht.
              </p>
              <button className="btn btn-primary" onClick={startChat} disabled={starting} style={{ alignSelf: 'flex-start' }}>
                <ChatCircle size={16} weight="bold" aria-hidden="true" /> {starting ? 'Starte…' : 'Mit Toro besprechen'}
              </button>
            </div>
            <div className="card-divider" style={{ margin: '20px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>Du hast schon ein Konzept, README oder PRD?</strong>
              {intakeNode}
            </div>
          </div>
        </div>
      )}

      {/* Liste */}
      {hasProjects && (
        <>
          {showIntake && (
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>{intakeNode}</div>
          )}
          <ProjectGrid projects={projects!} onRename={renameProject} onDelete={deleteProject} />
        </>
      )}
    </div>
  )
}
