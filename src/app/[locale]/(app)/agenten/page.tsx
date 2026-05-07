'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
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
type AgentForm = { name: string; description: string; system_prompt: string; visibility: AgentVisibility }

const EMPTY_AGENT_FORM: AgentForm = {
  name: '', description: '', system_prompt: '', visibility: 'private',
}

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-medium)',
  borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
  fontSize: 13, boxSizing: 'border-box', outline: 'none',
  fontFamily: 'var(--font-sans, system-ui)',
}
const textarea: React.CSSProperties = { ...inp, minHeight: 80, resize: 'vertical' as const }

// ─── AgentEditCard ─────────────────────────────────────────────────────────────

interface AgentEditCardProps {
  form: AgentForm
  onFormChange: (form: AgentForm) => void
  onSave: () => void
  onDelete: () => void
  onDeleteConfirmToggle: () => void
  onWorkspacePicker: () => void
  onCancelDelete: () => void
  deleteConfirm: boolean
  saving: boolean
  isEditing: boolean
  t: (key: string) => string
  tc: (key: string) => string
}

function AgentEditCard({
  form, onFormChange, onSave, onDelete, onDeleteConfirmToggle,
  onWorkspacePicker, onCancelDelete, deleteConfirm, saving, isEditing, t, tc,
}: AgentEditCardProps) {
  const s: Record<string, React.CSSProperties> = {
    editCard: { padding: 24 },
    label: { fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6, display: 'block' },
    row: { marginBottom: 16 },
    actions: { display: 'flex', gap: 8, marginTop: 20 },
  }

  return (
    <div className="card" style={s.editCard}>
      <div style={s.row}>
        <label style={s.label}>{t('nameLabel')}</label>
        <input style={inp} value={form.name} onChange={e => onFormChange({ ...form, name: e.target.value })} placeholder={t('namePlaceholder')} />
      </div>
      <div style={s.row}>
        <label style={s.label}>{t('descriptionLabel')}</label>
        <input style={inp} value={form.description} onChange={e => onFormChange({ ...form, description: e.target.value })} placeholder={t('descriptionPlaceholder')} />
      </div>
      <div style={s.row}>
        <label style={s.label}>{t('systemPromptLabel')}</label>
        <textarea style={{ ...textarea, minHeight: 120 }} value={form.system_prompt} onChange={e => onFormChange({ ...form, system_prompt: e.target.value })} placeholder={t('systemPromptPlaceholder')} />
      </div>
      <div style={s.row}>
        <label style={s.label}>{t('visibilityLabel')}</label>
        <select style={inp} value={form.visibility} onChange={e => onFormChange({ ...form, visibility: e.target.value as AgentVisibility })}>
          <option value="private">{t('visibilityPrivate')}</option>
          <option value="org">{t('visibilityOrg')}</option>
        </select>
      </div>
      <div style={s.actions}>
        <button className="btn btn-primary" onClick={onSave} disabled={saving || !form.name.trim()}>
          <FloppyDisk size={14} weight="bold" /> {saving ? tc('saving') : tc('save')}
        </button>
        {isEditing && (
          <button className="btn btn-ghost" onClick={onWorkspacePicker}>
            <ShareNetwork size={14} weight="bold" /> {t('saveToWorkspace')}
          </button>
        )}
        {isEditing && (
          deleteConfirm ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center' }}>{t('deleteConfirm')}</span>
              <button className="btn btn-danger" style={{ marginLeft: 'auto' }} onClick={onDelete}>{t('deleteConfirmYes')}</button>
              <button className="btn btn-ghost" onClick={onCancelDelete}>{tc('cancel')}</button>
            </>
          ) : (
            <button className="btn btn-danger" style={{ marginLeft: 'auto' }} onClick={onDeleteConfirmToggle}>
              <Trash size={14} weight="bold" /> {tc('delete')}
            </button>
          )
        )}
      </div>
    </div>
  )
}

// ─── AgentsTab ─────────────────────────────────────────────────────────────────

interface AgentsTabProps {
  agents: Agent[]
  loading: boolean
  selectedAgent: Agent | null
  creatingAgent: boolean
  agentForm: AgentForm
  agentSaving: boolean
  agentDeleteConfirm: boolean
  onSelect: (a: Agent) => void
  onFormChange: (form: AgentForm) => void
  onSave: () => void
  onDelete: () => void
  onDeleteConfirmToggle: () => void
  onCancelDelete: () => void
  onWorkspacePicker: () => void
  onCreateNew: () => void
  t: (key: string) => string
  tc: (key: string) => string
}

function AgentsTab({
  agents, loading, selectedAgent, creatingAgent, agentForm, agentSaving,
  agentDeleteConfirm, onSelect, onFormChange, onSave, onDelete,
  onDeleteConfirmToggle, onCancelDelete, onWorkspacePicker, onCreateNew, t, tc,
}: AgentsTabProps) {
  const s: Record<string, React.CSSProperties> = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 24 },
    cardItem: { padding: '16px 18px', cursor: 'pointer', textAlign: 'left' as const, width: '100%' },
    cardItemActive: { padding: '16px 18px', cursor: 'pointer', textAlign: 'left' as const, outline: '2px solid var(--accent)', outlineOffset: -2, width: '100%' },
    itemTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
    itemSub: { fontSize: 12, color: 'var(--text-tertiary)', margin: '4px 0 0' },
    empty: { color: 'var(--text-tertiary)', fontSize: 13, padding: '40px 0', textAlign: 'center' as const },
  }

  if (loading) return <p style={s.empty}>{t('loading')}</p>

  const showEmptyState = agents.length === 0 && !creatingAgent
  const showGrid = agents.length > 0

  return (
    <>
      {showEmptyState && (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Robot size={32} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '12px 0 6px' }}>
            {t('emptyTitle')}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 16px', lineHeight: 1.5 }}>
            {t('emptyText')}
          </p>
          <button className="btn btn-primary" onClick={onCreateNew}>
            <Plus size={14} weight="bold" /> {t('createFirst')}
          </button>
        </div>
      )}

      {showGrid && (
        <div style={s.grid}>
          {agents.map(a => (
            <button key={a.id} className="card" style={selectedAgent?.id === a.id ? s.cardItemActive : s.cardItem} onClick={() => onSelect(a)}>
              <p style={s.itemTitle}>{a.name}</p>
              {a.description && <p style={s.itemSub}>{a.description}</p>}
            </button>
          ))}
        </div>
      )}

      {(selectedAgent || creatingAgent) && (
        <AgentEditCard
          form={agentForm}
          onFormChange={onFormChange}
          onSave={onSave}
          onDelete={onDelete}
          onDeleteConfirmToggle={onDeleteConfirmToggle}
          onWorkspacePicker={onWorkspacePicker}
          onCancelDelete={onCancelDelete}
          deleteConfirm={agentDeleteConfirm}
          saving={agentSaving}
          isEditing={!!selectedAgent}
          t={t}
          tc={tc}
        />
      )}
    </>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AgentenPage() {
  const t = useTranslations('agenten')
  const tc = useTranslations('common')

  const [tab, setTab] = useState<Tab>('agents')
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agentForm, setAgentForm] = useState<AgentForm>(EMPTY_AGENT_FORM)
  const [agentSaving, setAgentSaving] = useState(false)
  const [agentDeleteConfirm, setAgentDeleteConfirm] = useState(false)
  const [creatingAgent, setCreatingAgent] = useState(false)
  const [workspacePicker, setWorkspacePicker] = useState(false)

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

  function handleCreateNew() {
    setCreatingAgent(true)
    setSelectedAgent(null)
    setAgentForm(EMPTY_AGENT_FORM)
  }

  async function handleAgentSave() {
    if (!agentForm.name.trim()) return
    setAgentSaving(true)
    try {
      if (selectedAgent) {
        await saveExistingAgent(selectedAgent.id)
      } else {
        await saveNewAgent()
      }
    } finally {
      setAgentSaving(false)
    }
  }

  async function saveExistingAgent(id: string) {
    const res = await fetch(`/api/agents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentForm),
    })
    if (!res.ok) return
    const updated = await res.json()
    setAgents(prev => prev.map(a => a.id === updated.id ? updated : a))
    setSelectedAgent(updated)
  }

  async function saveNewAgent() {
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentForm),
    })
    if (!res.ok) return
    const created = await res.json()
    setAgents(prev => [created, ...prev])
    setSelectedAgent(created)
    setCreatingAgent(false)
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
            <Robot size={22} color="var(--accent)" weight="fill" aria-hidden="true" />
            {t('title')}
          </h1>
          <p className="page-header-sub">{t('subtitle')}</p>
        </div>
        <div className="page-header-actions">
          {tab === 'agents' && (
            <button className="btn btn-primary" onClick={handleCreateNew}>
              <Plus size={14} weight="bold" /> {t('newAgent')}
            </button>
          )}
        </div>
      </div>

      <div style={s.chips}>
        <button className={tab === 'agents'    ? 'chip chip--active' : 'chip'} onClick={() => setTab('agents')}>{t('tabMyAgents')}</button>
        <button className={tab === 'community' ? 'chip chip--active' : 'chip'} onClick={() => setTab('community')}>{t('tabCommunity')}</button>
        <button className={tab === 'templates' ? 'chip chip--active' : 'chip'} onClick={() => setTab('templates')}>{t('tabTemplates')}</button>
      </div>

      {tab === 'agents' && (
        <AgentsTab
          agents={agents}
          loading={agentsLoading}
          selectedAgent={selectedAgent}
          creatingAgent={creatingAgent}
          agentForm={agentForm}
          agentSaving={agentSaving}
          agentDeleteConfirm={agentDeleteConfirm}
          onSelect={selectAgent}
          onFormChange={setAgentForm}
          onSave={handleAgentSave}
          onDelete={handleAgentDelete}
          onDeleteConfirmToggle={() => setAgentDeleteConfirm(true)}
          onCancelDelete={() => setAgentDeleteConfirm(false)}
          onWorkspacePicker={() => setWorkspacePicker(true)}
          onCreateNew={handleCreateNew}
          t={t}
          tc={tc}
        />
      )}

      {tab === 'community' && (
        <div style={s.comingSoon}>
          <Lock size={36} weight="bold" />
          <p style={{ margin: 0, fontWeight: 600 }}>{t('communityTitle')}</p>
          <p style={{ margin: 0, fontSize: 12 }}>{t('communityText')}</p>
        </div>
      )}

      {tab === 'templates' && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Robot size={16} color="var(--accent)" weight="fill" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('templatesIntro')}</span>
          </div>
          <div style={s.tplGrid}>
            {TEMPLATES.map(tpl => (
              <div key={tpl.id} className="card" style={s.tplCard}>
                <p style={s.tplTitle}>
                  {tpl.label}
                  <span style={s.badge}>{tpl.taskType}</span>
                </p>
                <p style={s.tplSub}>{t('templateFields', { count: tpl.fields.length })}</p>
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
