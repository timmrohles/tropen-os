'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { ChatCircle, ArrowRight } from '@phosphor-icons/react'
import { type Chat, formatRelDate } from './types'

export function ChatsTab({ projectId, onNewChat }: { projectId: string; onNewChat: () => void }) {
  const [chats, setChats]     = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/chats`)
      .then(r => r.json())
      .then(d => setChats(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [projectId])

  const empty = <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>Noch keine Chats in diesem Projekt.</p>

  return (
    <div className="project-tab-content">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-sm" onClick={onNewChat}>
          <ChatCircle size={14} weight="bold" aria-hidden="true" /> + Neuer Chat
        </button>
      </div>
      {loading ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>Lade Chats…</p>
      ) : chats.length === 0 ? empty : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {chats.map(c => (
            <Link key={c.id} href={`/chat/${c.id}`} className="list-row" style={{ textDecoration: 'none' }}>
              <ChatCircle size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title ?? 'Unbenannter Chat'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatRelDate(c.updated_at)}</div>
              </div>
              <ArrowRight size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
