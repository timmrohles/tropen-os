'use client'
// src/app/feeds/_components/NotificationBadge.tsx
import { useState, useEffect, useCallback } from 'react'
import { Bell, X } from '@phosphor-icons/react'

interface FeedNotification {
  id: string
  title: string
  body: string | null
  type: string
  isRead: boolean
  createdAt: string
}

export default function NotificationBadge() {
  const [notifications, setNotifications] = useState<FeedNotification[]>([])
  const [open, setOpen]                   = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/feeds/notifications?unread=true&limit=10')
    const json = await res.json()
    setNotifications(json.notifications ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  const unreadCount = notifications.filter(n => !n.isRead).length

  async function markAllRead() {
    await fetch('/api/feeds/notifications', { method: 'PATCH' })
    setNotifications([])
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen(o => !o)}
        aria-label={`${unreadCount} ungelesene Notifications`}
        style={{ position: 'relative' }}
      >
        <Bell size={16} weight={unreadCount > 0 ? 'fill' : 'bold'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--accent)', border: '1.5px solid var(--bg-base)',
          }} />
        )}
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', right: 0, top: 36, zIndex: 50,
            width: 320, maxHeight: 400, overflowY: 'auto',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '8px 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px 10px' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Benachrichtigungen
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {unreadCount > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={markAllRead} style={{ fontSize: 11 }}>
                    Alle gelesen
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Schließen">
                  <X size={14} weight="bold" />
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '8px 14px' }}>
                Keine neuen Benachrichtigungen.
              </p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} style={{ padding: '8px 14px', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '0 0 2px' }}>{n.title}</p>
                  {n.body && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{n.body}</p>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                    {new Date(n.createdAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
