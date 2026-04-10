'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, SquaresFour, Database, Users, GearSix } from '@phosphor-icons/react'
import WorkspaceItemsList, { type WorkspaceItemRow } from '@/components/workspaces/WorkspaceItemsList'
import AddItemModal from '@/components/workspaces/AddItemModal'
import MembersList, { type WorkspaceMember } from '@/components/workspaces/MembersList'
import ShareLinkPanel from '@/components/workspaces/ShareLinkPanel'
import WorkspaceSettings from '@/components/workspaces/WorkspaceSettings'
import CommentThread, { type Comment } from '@/components/workspaces/CommentThread'

type Workspace = {
  id: string
  title: string
  description: string | null
  emoji: string | null
  status: string
  share_token: string | null
  share_role: string
  share_active: boolean
  item_count: number
  comment_count: number
  created_at: string
  organization_id: string
}

type Tab = 'items' | 'members' | 'comments' | 'settings'

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [ws, setWs] = useState<Workspace | null>(null)
  const [items, setItems] = useState<WorkspaceItemRow[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('items')
  const [showAddItem, setShowAddItem] = useState(false)
  const [canWrite, setCanWrite] = useState(false)

  useEffect(() => {
    async function load() {
      const [wsRes, itemsRes, membersRes, commentsRes] = await Promise.all([
        fetch(`/api/workspaces/${id}`),
        fetch(`/api/workspaces/${id}/items`),
        fetch(`/api/workspaces/${id}/members`),
        fetch(`/api/workspaces/${id}/comments`),
      ])
      if (!wsRes.ok) { router.push('/workspaces'); return }
      const [wsData, itemsData, membersData, commentsData] = await Promise.all([
        wsRes.json(), itemsRes.json(), membersRes.json(), commentsRes.json(),
      ])
      setWs(wsData)
      setItems(Array.isArray(itemsData) ? itemsData : [])
      setMembers(Array.isArray(membersData) ? membersData : [])
      setComments(Array.isArray(commentsData) ? commentsData : [])
      setCurrentUserId(wsData?.current_user_id ?? null)
      setCanWrite(wsRes.ok)
      setLoading(false)
    }
    load()
  }, [id, router])

  function handleSettingsSaved(data: { title: string; description: string | null; emoji: string | null; status: string }) {
    setWs(prev => prev ? { ...prev, ...data } : prev)
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'items',    label: 'Inhalte',      icon: <Database  size={14} weight="bold" aria-hidden="true" /> },
    { key: 'members',  label: 'Mitglieder',   icon: <Users     size={14} weight="bold" aria-hidden="true" /> },
    { key: 'comments', label: 'Kommentare',   icon: <SquaresFour size={14} weight="bold" aria-hidden="true" /> },
    { key: 'settings', label: 'Einstellungen', icon: <GearSix  size={14} weight="bold" aria-hidden="true" /> },
  ]

  if (loading) {
    return (
      <div className="content-max" style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
        Lädt…
      </div>
    )
  }

  if (!ws) return null

  return (
    <div className="content-max">
      {/* Back */}
      <button
        onClick={() => router.push('/workspaces')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--text-tertiary)', fontSize: 13,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          marginBottom: 20,
        }}
      >
        <ArrowLeft size={14} weight="bold" /> Alle Workspaces
      </button>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            {ws.emoji
              ? <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">{ws.emoji}</span>
              : <SquaresFour size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            }
            {ws.title}
          </h1>
          {ws.description && (
            <p className="page-header-sub">{ws.description}</p>
          )}
        </div>
        <div className="page-header-actions">
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {items.length} Inhalte · {members.length} Mitglieder
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'items' && (
        <>
          <WorkspaceItemsList
            workspaceId={id}
            items={items}
            canWrite={canWrite}
            onAdd={() => setShowAddItem(true)}
            allComments={comments}
            currentUserId={currentUserId}
          />
          {showAddItem && (
            <AddItemModal
              workspaceId={id}
              onClose={() => setShowAddItem(false)}
              onAdded={item => setItems(prev => [item, ...prev])}
            />
          )}
        </>
      )}

      {tab === 'members' && (
        <MembersList
          workspaceId={id}
          members={members}
          canAdmin={canWrite}
        />
      )}

      {tab === 'comments' && (
        <CommentThread
          workspaceId={id}
          comments={comments}
          currentUserId={null}
          canAdmin={canWrite}
        />
      )}

      {tab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <WorkspaceSettings
            workspaceId={id}
            initial={{ title: ws.title, description: ws.description, emoji: ws.emoji, status: ws.status }}
            onSaved={handleSettingsSaved}
          />
          <ShareLinkPanel
            workspaceId={id}
            initial={{ share_token: ws.share_token, share_role: ws.share_role, share_active: ws.share_active }}
          />
        </div>
      )}
    </div>
  )
}
