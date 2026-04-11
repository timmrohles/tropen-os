'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import type { Project } from '@/lib/workspace-types'
import ChatInput from './ChatInput'

type Phase = 'pickProject' | 'pickStart' | 'ready'

interface FocusedFlowProps {
  projects: Project[]
  workspaceId: string
  input: string
  setInput: (v: string) => void
  sending: boolean
  onSubmit: (e: React.FormEvent) => void
  onSetPendingIntention: (v: 'focused' | 'guided') => void
  onSetPendingCurrentProjectId: (id: string | null) => void
}

const MAX_PROJECTS = 5
const STRUCTURE_PROMPT =
  'Hilf mir kurz, mein Vorgehen zu strukturieren. Stelle mir dafür maximal 3 kurze Fragen.'

export default function FocusedFlow({
  projects,
  workspaceId,
  input,
  setInput,
  sending,
  onSubmit,
  onSetPendingIntention,
  onSetPendingCurrentProjectId,
}: FocusedFlowProps) {
  const [phase, setPhase] = useState<Phase>('pickProject')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const shownProjects = projects.slice(0, MAX_PROJECTS)

  function handlePickProject(project: Project) {
    setSelectedProject(project)
    onSetPendingIntention('focused')
    onSetPendingCurrentProjectId(project.id)
    setPhase('pickStart')
  }

  function handleStartFree() {
    setPhase('ready')
  }

  function handleStructure() {
    setInput(STRUCTURE_PROMPT)
    setPhase('ready')
  }

  function handleCardKey(
    e: React.KeyboardEvent,
    action: () => void,
  ) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }

  // ── Phase: ready — ChatInput sichtbar, Intention schon gesetzt ──
  if (phase === 'ready') {
    return (
      <div className="es">
        <p className="es-sub" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          🎯 {selectedProject?.title ?? 'Gezielter Chat'}
        </p>
        <p className="es-sub">Toro ist bereit. Was möchtest du angehen?</p>
        <div className="es-input-wrap">
          <ChatInput
            input={input}
            setInput={setInput}
            sending={sending}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    )
  }

  // ── Phase: pickStart — Start-Modus wählen ──
  if (phase === 'pickStart') {
    return (
      <div className="igate">
        <p className="igate-question">
          <strong>{selectedProject?.title}</strong> — wie möchtest du starten?
        </p>

        <div className="igate-options">
          <div
            className="card igate-card"
            role="button"
            tabIndex={0}
            onClick={handleStartFree}
            onKeyDown={(e) => handleCardKey(e, handleStartFree)}
            onMouseEnter={() => setHovered('free')}
            onMouseLeave={() => setHovered(null)}
            style={{
              cursor: 'pointer',
              borderColor: hovered === 'free' ? 'var(--accent)' : undefined,
            }}
            aria-label="Einfach loslegen"
          >
            <div className="igate-card-icon">💬</div>
            <div className="igate-card-text">
              <strong>Einfach loslegen</strong>
              <span>Toro wartet auf deine erste Nachricht</span>
            </div>
          </div>

          <div
            className="card igate-card"
            role="button"
            tabIndex={0}
            onClick={handleStructure}
            onKeyDown={(e) => handleCardKey(e, handleStructure)}
            onMouseEnter={() => setHovered('structure')}
            onMouseLeave={() => setHovered(null)}
            style={{
              cursor: 'pointer',
              borderColor: hovered === 'structure' ? 'var(--accent)' : undefined,
            }}
            aria-label="Kurz strukturieren"
          >
            <div className="igate-card-icon">🗺️</div>
            <div className="igate-card-text">
              <strong>Kurz strukturieren</strong>
              <span>Toro stellt dir max. 3 Fragen</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Phase: pickProject ──
  return (
    <div className="igate">
      <p className="igate-question">An welchem Projekt arbeitest du?</p>

      <div className="suggestion-pills" style={{ justifyContent: 'center', maxWidth: 480 }}>
        {shownProjects.map((p) => (
          <button
            key={p.id}
            className="suggestion-pill"
            onClick={() => handlePickProject(p)}
          >
            {p.title}
          </button>
        ))}
        {projects.length > MAX_PROJECTS && (
          <Link
            href={`/workspaces/${workspaceId}/projects`}
            className="suggestion-pill"
          >
            Alle Projekte →
          </Link>
        )}
        <Link href="/projects" className="suggestion-pill">
          Neues Projekt →
        </Link>
      </div>
    </div>
  )
}
