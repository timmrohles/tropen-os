'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { SquaresFour, Database, ChatCircle, Code, FileText, Rss, File } from '@phosphor-icons/react'
import CommentThread, { type Comment } from '@/components/workspaces/CommentThread'

type SharedWorkspace = {
  id: string
  title: string
  description: string | null
  emoji: string | null
  share_role: string
  created_at: string
}

type SharedItem = {
  id: string
  item_type: string
  item_id: string | null
  title: string
  description: string | null
  meta: Record<string, unknown>
  created_at: string
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  conversation: <ChatCircle size={14} weight="bold" aria-hidden="true" />,
  artifact:     <Code       size={14} weight="bold" aria-hidden="true" />,
  project:      <FileText   size={14} weight="bold" aria-hidden="true" />,
  feed_source:  <Rss        size={14} weight="bold" aria-hidden="true" />,
  note:         <File       size={14} weight="bold" aria-hidden="true" />,
}

const TYPE_LABEL: Record<string, string> = {
  conversation: 'Chat', artifact: 'Artefakt', project: 'Projekt', feed_source: 'Feed', note: 'Notiz',
}

export default function SharedWorkspacePage() {
  const { token } = useParams<{ token: string }>()
  const [workspace, setWorkspace] = useState<SharedWorkspace | null>(null)
  const [items, setItems] = useState<SharedItem[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/shared/${token}`)
      if (!res.ok) { setNotFound(true); setLoading(false); return }
      const data = await res.json()
      setWorkspace(data.workspace)
      setItems(data.items ?? [])
      setComments(data.comments ?? [])
      setLoading(false)
    }
    load()
  }, [token])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
        Lädt…
      </div>
    )
  }

  if (notFound || !workspace) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
        <SquaresFour size={40} color="var(--text-tertiary)" weight="fill" aria-hidden="true" />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Workspace nicht gefunden</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>
          Der Link ist ungültig oder die Freigabe wurde deaktiviert.
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          {workspace.emoji
            ? <span style={{ fontSize: 32, lineHeight: 1 }}>{workspace.emoji}</span>
            : <SquaresFour size={32} color="var(--accent)" weight="fill" aria-hidden="true" />
          }
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
            {workspace.title}
          </h1>
        </div>
        {workspace.description && (
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {workspace.description}
          </p>
        )}
      </div>

      {/* Items */}
      {items.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Database size={16} weight="bold" color="var(--text-secondary)" aria-hidden="true" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Inhalte ({items.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map(item => (
              <div key={item.id} className="ws-item-row">
                <div className="ws-item-icon">
                  {TYPE_ICON[item.item_type] ?? <File size={14} weight="bold" />}
                </div>
                <div className="ws-item-body">
                  <div className="ws-item-title">{item.title}</div>
                  {item.description && <div className="ws-item-desc">{item.description}</div>}
                </div>
                <div className="ws-item-meta">
                  <span className="ws-item-type">{TYPE_LABEL[item.item_type] ?? item.item_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      {workspace.share_role === 'commenter' || comments.length > 0 ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <ChatCircle size={16} weight="bold" color="var(--text-secondary)" aria-hidden="true" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Kommentare
            </span>
          </div>
          <CommentThread
            workspaceId={workspace.id}
            comments={comments}
            currentUserId={null}
            canAdmin={false}
            isGuest={true}
          />
        </div>
      ) : null}

      <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
        Geteilt via Tropen OS
      </div>
    </div>
  )
}
