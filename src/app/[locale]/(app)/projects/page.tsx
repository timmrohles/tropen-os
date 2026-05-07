'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { FolderOpen, Plus } from '@phosphor-icons/react'
import WorkspacePicker from '@/components/workspaces/WorkspacePicker'
import { createLogger } from '@/lib/logger'
import { type Project, type ProjectTab } from './_components/types'
import { IconPicker } from './_components/IconPicker'
import { ProjectCard } from './_components/ProjectCard'
import { OverviewTab } from './_components/OverviewTab'
import { ChatsTab } from './_components/ChatsTab'
import { DocumentsTab } from './_components/DocumentsTab'
import { MemoryTab } from './_components/MemoryTab'

const log = createLogger('projects/page')

// ─── CreateForm ───────────────────────────────────────────────────────────────

interface CreateFormProps {
  newTitle: string
  newEmoji: string
  saving: boolean
  onTitleChange: (v: string) => void
  onEmojiChange: (v: string) => void
  onCreate: () => void
  onCancel: () => void
  inp: React.CSSProperties
  t: (key: string) => string
  tc: (key: string) => string
}

function CreateForm({ newTitle, newEmoji, saving, onTitleChange, onEmojiChange, onCreate, onCancel, inp, t, tc }: CreateFormProps) {
  return (
    <div className="card" style={{ padding: 14, marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <IconPicker value={newEmoji} onChange={onEmojiChange} />
        <input
          autoFocus
          placeholder={t('titlePlaceholder')}
          value={newTitle}
          style={inp}
          onChange={e => onTitleChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onCreate(); if (e.key === 'Escape') { onCancel(); onTitleChange('') } }}
        />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-primary btn-sm" onClick={onCreate} disabled={saving || !newTitle.trim()}>{t('createProject')}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { onCancel(); onTitleChange('') }}>{tc('cancel')}</button>
      </div>
    </div>
  )
}

// ─── ProjectDetailPanel ───────────────────────────────────────────────────────

interface ProjectDetailPanelProps {
  selected: Project
  activeTab: ProjectTab
  memCount: number
  allProjects: Project[]
  onTabChange: (tab: ProjectTab) => void
  onSaved: (updated: Project) => void
  onDeleted: () => void
  onArchived: (updated: Project) => void
  onNewChat: () => void
  t: (key: string) => string
}

function ProjectDetailPanel({ selected, activeTab, memCount, allProjects, onTabChange, onSaved, onDeleted, onArchived, onNewChat, t }: ProjectDetailPanelProps) {
  const tabs: React.CSSProperties = { display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={tabs}>
        <button className={`chip${activeTab === 'uebersicht'  ? ' chip--active' : ''}`} onClick={() => onTabChange('uebersicht')}>{t('tabs.overview')}</button>
        <button className={`chip${activeTab === 'chats'       ? ' chip--active' : ''}`} onClick={() => onTabChange('chats')}>{t('tabs.chats')}</button>
        <button className={`chip${activeTab === 'dokumente'   ? ' chip--active' : ''}`} onClick={() => onTabChange('dokumente')}>{t('tabs.documents')}</button>
        <button className={`chip${activeTab === 'gedaechtnis' ? ' chip--active' : ''}`} onClick={() => onTabChange('gedaechtnis')}>
          {t('tabs.memory')}{memCount > 0 ? ` (${memCount})` : ''}
        </button>
      </div>

      {activeTab === 'uebersicht' && (
        <OverviewTab
          project={selected}
          allProjects={allProjects}
          onSaved={onSaved}
          onDeleted={onDeleted}
          onArchived={onArchived}
        />
      )}
      {activeTab === 'chats' && (
        <ChatsTab projectId={selected.id} onNewChat={onNewChat} />
      )}
      {activeTab === 'dokumente' && (
        <DocumentsTab projectId={selected.id} />
      )}
      {activeTab === 'gedaechtnis' && (
        <MemoryTab projectId={selected.id} memCount={memCount} />
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const t = useTranslations('projects')
  const tc = useTranslations('common')
  const router = useRouter()
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<Project | null>(null)
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [workspacePicker, setWorkspacePicker] = useState<Project | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newEmoji, setNewEmoji] = useState('FolderSimple')
  const [saving, setSaving]     = useState(false)
  const [activeTab, setActiveTab] = useState<ProjectTab>('uebersicht')
  const [showArchived, setShowArchived] = useState(false)

  const loadProjects = useCallback(async (deptId: string) => {
    const res = await fetch(`/api/projects?department_id=${deptId}`)
    if (res.ok) {
      const json = await res.json()
      setProjects(Array.isArray(json) ? json : (json.data ?? []))
    }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        const { data: membership } = await supabase
          .from('department_members').select('workspace_id').eq('user_id', user.id).limit(1).single()
        const deptId = membership?.workspace_id ?? null
        setDepartmentId(deptId)
        if (deptId) await loadProjects(deptId)
      } catch (err) {
        log.error('[projects] init error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [loadProjects, router])

  function selectProject(p: Project) {
    setSelected(p)
    setActiveTab('uebersicht')
    setCreating(false)
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
      if (!res.ok) return
      const created: Project = await res.json()
      if (newEmoji !== 'FolderSimple') {
        await fetch(`/api/projects/${created.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji: newEmoji }),
        })
        created.emoji = newEmoji
      }
      const withMem = { ...created, project_memory: null }
      setProjects(prev => [withMem, ...prev])
      setSelected(withMem)
      setCreating(false)
      setNewTitle('')
      setNewEmoji('FolderSimple')
      setActiveTab('uebersicht')
    } finally {
      setSaving(false)
    }
  }

  const memCount = selected?.project_memory?.[0]?.count ?? 0
  const visibleProjects = projects.filter(p => showArchived ? !!p.archived_at : !p.archived_at)
  const archivedCount = projects.filter(p => !!p.archived_at).length

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)',
    borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
    fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit',
  }

  function renderProjectGrid() {
    if (loading) return <p style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>{t('loading')}</p>
    if (visibleProjects.length === 0 && !creating) {
      return <p style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>{showArchived ? t('emptyArchived') : t('emptyActive')}</p>
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 24 }}>
        {visibleProjects.map(p => (
          <ProjectCard
            key={p.id}
            project={p}
            isSelected={selected?.id === p.id}
            onClick={() => selectProject(p)}
            onChatStart={() => router.push('/chat/new')}
            onSaveToWorkspace={() => setWorkspacePicker(p)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="content-max" aria-busy={loading}>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <FolderOpen size={22} color="var(--accent)" weight="fill" aria-hidden="true" />
            {t('title')}
          </h1>
          <p className="page-header-sub">{t('subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setCreating(true); setSelected(null) }}>
            <Plus size={14} weight="bold" aria-hidden="true" /> {t('newProject')}
          </button>
        </div>
      </div>

      {/* Archive filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button className={`chip${showArchived ? '' : ' chip--active'}`} onClick={() => { setShowArchived(false); setSelected(null) }}>
          {tc('active')}
        </button>
        <button className={`chip${showArchived ? ' chip--active' : ''}`} onClick={() => { setShowArchived(true); setSelected(null) }}>
          {tc('archived')}{archivedCount > 0 ? ` (${archivedCount})` : ''}
        </button>
      </div>

      {creating && (
        <CreateForm
          newTitle={newTitle}
          newEmoji={newEmoji}
          saving={saving}
          onTitleChange={setNewTitle}
          onEmojiChange={setNewEmoji}
          onCreate={handleCreate}
          onCancel={() => setCreating(false)}
          inp={inp}
          t={t}
          tc={tc}
        />
      )}

      {renderProjectGrid()}

      {selected && (
        <ProjectDetailPanel
          selected={selected}
          activeTab={activeTab}
          memCount={memCount}
          allProjects={projects}
          onTabChange={setActiveTab}
          onSaved={updated => {
            const withMem = { ...updated, project_memory: selected.project_memory }
            setProjects(prev => prev.map(p => p.id === updated.id ? withMem : p))
            setSelected(withMem)
          }}
          onDeleted={() => {
            setProjects(prev => prev.filter(p => p.id !== selected.id))
            setSelected(null)
          }}
          onArchived={updated => {
            const withMem = { ...updated, project_memory: selected.project_memory }
            setProjects(prev => prev.map(p => p.id === updated.id ? withMem : p))
            setSelected(null)
          }}
          onNewChat={() => router.push('/chat/new')}
          t={t}
        />
      )}

      {workspacePicker && (
        <WorkspacePicker
          itemType="project"
          itemId={workspacePicker.id}
          itemTitle={workspacePicker.title}
          onClose={() => setWorkspacePicker(null)}
        />
      )}
    </div>
  )
}
