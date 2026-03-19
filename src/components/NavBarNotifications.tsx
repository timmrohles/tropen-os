'use client'

import { Bell } from '@phosphor-icons/react'

interface Notification {
  id: string
  title: string
  body: string | null
  createdAt: string
}

interface Props {
  loggedIn: boolean | null
  unreadCount: number
  notifOpen: boolean
  notifs: Notification[]
  onBellClick: () => void
}

export default function NavBarNotifications({ loggedIn, unreadCount, notifOpen, notifs, onBellClick }: Props) {
  if (!loggedIn) return null
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label={unreadCount > 0 ? `${unreadCount} ungelesene Benachrichtigungen` : 'Benachrichtigungen'}
        aria-haspopup="true"
        aria-expanded={notifOpen}
        className="btn-icon"
        onClick={onBellClick}
        style={{ position: 'relative' }}
      >
        <Bell size={18} weight={unreadCount > 0 ? 'fill' : 'bold'} color={unreadCount > 0 ? 'var(--accent)' : 'var(--text-secondary)'} aria-hidden="true" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: 'var(--accent)', color: '#fff',
            borderRadius: '50%', fontSize: 9, fontWeight: 700,
            width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }} aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {notifOpen && (
        <div
          role="dialog"
          aria-label="Benachrichtigungen"
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            width: 320, background: 'var(--bg-surface)',
            border: '1px solid var(--border)', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100,
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Benachrichtigungen
          </div>
          {notifs.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
              Keine neuen Benachrichtigungen
            </div>
          ) : (
            <ul role="list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {notifs.map((n) => (
                <li key={n.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                  {n.body && <div style={{ color: 'var(--text-tertiary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
