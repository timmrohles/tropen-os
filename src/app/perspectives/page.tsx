'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Eye, Plus, PencilSimple, Trash, Copy } from '@phosphor-icons/react'
import AvatarFormDrawer from './_components/AvatarFormDrawer'

interface Avatar {
  id: string
  name: string
  emoji: string
  scope: 'system' | 'org' | 'user'
  description: string | null
  system_prompt: string
  model_id: string
  context_default: string
  is_tabula_rasa: boolean
  is_pinned: boolean
}

type Tab = 'system' | 'org' | 'user'

const TAB_LABELS: Record<Tab, string> = {
  system: 'System',
  org:    'Organisation',
  user:   'Meine Avatare',
}

export default function PerspectivesPage() {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('system')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingAvatar, setEditingAvatar] = useState<Avatar | null>(null)
  const [copying, setCopying] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchAvatars = useCallback(async () => {
    try {
      const res = await fetch('/api/perspectives/avatars')
      if (!res.ok) return
      const data = await res.json() as { avatars: Avatar[] }
      setAvatars(data.avatars ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAvatars() }, [fetchAvatars])

  async function handleCopy(avatar: Avatar) {
    setCopying(avatar.id)
    try {
      const res = await fetch(`/api/perspectives/avatars/${avatar.id}/copy`, { method: 'POST' })
      if (res.ok) {
        await fetchAvatars()
        setActiveTab('user')
      }
    } finally {
      setCopying(null)
    }
  }

  async function handleDelete(avatar: Avatar) {
    if (!confirm(`Avatar "${avatar.name}" wirklich löschen?`)) return
    setDeleting(avatar.id)
    try {
      const res = await fetch(`/api/perspectives/avatars/${avatar.id}`, { method: 'DELETE' })
      if (res.ok) await fetchAvatars()
    } finally {
      setDeleting(null)
    }
  }

  function handleEdit(avatar: Avatar) {
    setEditingAvatar(avatar)
    setDrawerOpen(true)
  }

  function handleNewAvatar() {
    setEditingAvatar(null)
    setDrawerOpen(true)
  }

  const displayed = avatars.filter(a => a.scope === activeTab)

  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Eye size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Perspectives
          </h1>
          <p className="page-header-sub">KI-Perspektiven für deine Konversationen</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleNewAvatar}>
            <Plus size={14} weight="bold" aria-hidden="true" />
            Neuer Avatar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(Object.keys(TAB_LABELS) as Tab[]).map(tab => (
          <button
            key={tab}
            className={`chip${activeTab === tab ? ' chip--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
            <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>
              {avatars.filter(a => a.scope === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Avatar Grid */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, paddingTop: 24 }}>Lädt…</div>
      ) : displayed.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, paddingTop: 24 }}>
          {activeTab === 'user'
            ? 'Noch keine eigenen Avatare. Erstelle einen oder kopiere einen System-Avatar.'
            : 'Keine Avatare in dieser Kategorie.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {displayed.map(avatar => (
            <div key={avatar.id} className="card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">
                  {avatar.emoji}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {avatar.name}
                  </div>
                  {avatar.description && (
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                      {avatar.description}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                {avatar.is_tabula_rasa && (
                  <span className="chip" style={{ fontSize: 10 }}>Tabula Rasa</span>
                )}
                <span className="chip" style={{ fontSize: 10 }}>{avatar.context_default}</span>
                <span className="chip" style={{ fontSize: 10 }}>{avatar.model_id.split('-').slice(0, 2).join('-')}</span>
              </div>

              <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleCopy(avatar)}
                  disabled={copying === avatar.id}
                  title="Als eigenen Avatar kopieren"
                  aria-label={`${avatar.name} kopieren`}
                >
                  <Copy size={13} weight="bold" aria-hidden="true" />
                  {copying === avatar.id ? '…' : 'Kopieren'}
                </button>
                {avatar.scope === 'user' && (
                  <>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleEdit(avatar)}
                      title="Bearbeiten"
                      aria-label={`${avatar.name} bearbeiten`}
                    >
                      <PencilSimple size={13} weight="bold" aria-hidden="true" />
                      Bearbeiten
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => handleDelete(avatar)}
                      disabled={deleting === avatar.id}
                      title="Löschen"
                      aria-label={`${avatar.name} löschen`}
                    >
                      <Trash size={13} weight="bold" aria-hidden="true" />
                      {deleting === avatar.id ? '…' : ''}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AvatarFormDrawer
        open={drawerOpen}
        avatar={editingAvatar}
        onClose={() => { setDrawerOpen(false); setEditingAvatar(null) }}
        onSaved={() => { setDrawerOpen(false); setEditingAvatar(null); fetchAvatars() }}
      />
    </div>
  )
}
