'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { AccountRole } from '@/components/AccountSwitcher'
import { Bell, CaretDown, Gear, SignOut } from '@phosphor-icons/react'

const VIEW_AS_KEY = 'tropen_view_as'

interface Notif {
  id: string
  title: string
  body: string | null
  createdAt: string
}

export default function TopBar() {
  const supabase = createClient()
  const router = useRouter()

  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [viewAs, setViewAs] = useState<AccountRole>('superadmin')
  const [userInitial, setUserInitial] = useState('?')
  const [userName, setUserName] = useState('')

  const [unreadCount, setUnreadCount] = useState(0)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const notifBtnRef = useRef<HTMLButtonElement>(null)
  const notifPanelRef = useRef<HTMLDivElement>(null)

  const [accountOpen, setAccountOpen] = useState(false)
  const accountBtnRef = useRef<HTMLButtonElement>(null)
  const accountPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem(VIEW_AS_KEY) as AccountRole | null
    if (stored === ('solo' as string)) {
      sessionStorage.setItem(VIEW_AS_KEY, 'member')
      setViewAs('member')
    } else if (stored === ('org_admin' as string)) {
      sessionStorage.setItem(VIEW_AS_KEY, 'admin')
      setViewAs('admin')
    } else if (stored) {
      setViewAs(stored)
    }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .maybeSingle()
      if (profile?.role === 'superadmin') setIsSuperadmin(true)

      const name: string = profile?.full_name || user.email || ''
      setUserName(name)
      setUserInitial((name[0] ?? '?').toUpperCase())
    })

    fetch('/api/feeds/notifications?unread=true&limit=5')
      .then(r => r.ok ? r.json() : null)
      .then((data: { notifications: Notif[] } | null) => {
        if (!data) return
        setNotifs(data.notifications)
        setUnreadCount(data.notifications.length)
      })
      .catch(() => null)

    // Listen for viewAs changes from Sidebar
    function handler(e: Event) {
      setViewAs((e as CustomEvent<AccountRole>).detail)
    }
    window.addEventListener('tropen:viewas', handler)
    return () => window.removeEventListener('tropen:viewas', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close panels on outside click
  useEffect(() => {
    if (!notifOpen && !accountOpen) return
    function onMouseDown(e: MouseEvent) {
      if (
        notifOpen &&
        notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node) &&
        notifBtnRef.current && !notifBtnRef.current.contains(e.target as Node)
      ) setNotifOpen(false)
      if (
        accountOpen &&
        accountPanelRef.current && !accountPanelRef.current.contains(e.target as Node) &&
        accountBtnRef.current && !accountBtnRef.current.contains(e.target as Node)
      ) setAccountOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setNotifOpen(false); setAccountOpen(false) }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [notifOpen, accountOpen])

  function handleBellClick() {
    setAccountOpen(false)
    setNotifOpen(o => !o)
    if (!notifOpen && unreadCount > 0) {
      fetch('/api/feeds/notifications', { method: 'PATCH' })
        .then(() => setUnreadCount(0))
        .catch(() => null)
    }
  }

  function handleAccountClick() {
    setNotifOpen(false)
    setAccountOpen(o => !o)
  }

  function handleViewAsChange(role: AccountRole) {
    setViewAs(role)
    sessionStorage.setItem(VIEW_AS_KEY, role)
    window.dispatchEvent(new CustomEvent('tropen:viewas', { detail: role }))
    setAccountOpen(false)
  }

  async function handleSignOut() {
    setAccountOpen(false)
    await supabase.auth.signOut()
    document.cookie = 'onboarding_done=; max-age=0; path=/'
    document.cookie = 'is_superadmin=; max-age=0; path=/'
    router.push('/login')
  }

  const dropdownStyle: React.CSSProperties = {
    position: 'fixed',
    top: 'calc(var(--topbar-height) + 4px)',
    right: 12,
    background: '#ffffff',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 300,
    minWidth: 260,
  }

  const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 14px',
    fontSize: 13,
    color: 'var(--text-secondary)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'left',
  }

  return (
    <header className="top-bar" role="banner" aria-label="App-Header">
      {/* Bell */}
      <button
        ref={notifBtnRef}
        type="button"
        aria-label={unreadCount > 0 ? `${unreadCount} ungelesene Benachrichtigungen` : 'Benachrichtigungen'}
        aria-haspopup="true"
        aria-expanded={notifOpen}
        onClick={handleBellClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--sidebar-text)',
          position: 'relative',
          transition: 'background var(--t-fast)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-hover)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      >
        <Bell size={18} weight={unreadCount > 0 ? 'fill' : 'bold'} color={unreadCount > 0 ? 'var(--accent)' : 'currentColor'} aria-hidden="true" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent)',
          }} aria-hidden="true" />
        )}
      </button>

      {/* Notification panel */}
      {notifOpen && (
        <div ref={notifPanelRef} role="dialog" aria-label="Benachrichtigungen" style={dropdownStyle}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Benachrichtigungen
          </div>
          {notifs.length === 0 ? (
            <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
              Keine neuen Benachrichtigungen
            </div>
          ) : (
            <ul role="list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {notifs.map(n => (
                <li key={n.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                  {n.body && <div style={{ color: 'var(--text-tertiary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Member / Account button */}
      <button
        ref={accountBtnRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={accountOpen}
        aria-label="Account-Menü"
        onClick={handleAccountClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          height: 32,
          padding: '0 10px',
          borderRadius: 'var(--radius-md)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--sidebar-text)',
          fontSize: 13,
          transition: 'background var(--t-fast)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-hover)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      >
        {/* Avatar */}
        <span style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: 'var(--active-bg)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }} aria-hidden="true">
          {userInitial}
        </span>
        <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {userName || 'Account'}
        </span>
        <CaretDown size={12} weight="bold" aria-hidden="true" />
      </button>

      {/* Account dropdown */}
      {accountOpen && (
        <div ref={accountPanelRef} role="menu" aria-label="Account-Menü" style={dropdownStyle}>
          {/* User info header */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--active-bg)', color: '#fff',
                fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {userInitial}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName || 'Account'}
              </span>
            </div>
          </div>

          {/* AccountSwitcher for superadmin — inline role list */}
          {isSuperadmin && (
            <div style={{ padding: '6px 8px 8px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ padding: '0 6px', marginBottom: 6, fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Ansicht als
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(['superadmin', 'admin', 'member', 'viewer'] as const).map((role) => {
                  const labels: Record<string, { label: string; desc: string }> = {
                    superadmin: { label: 'Superadmin', desc: 'Vollzugriff auf alle Organisationen' },
                    admin:      { label: 'Admin',      desc: 'Organisations-Administrator' },
                    member:     { label: 'Member',     desc: 'Normales Mitglied — Chat, Projekte' },
                    viewer:     { label: 'Viewer',     desc: 'Lese-Zugriff, keine Erstellung' },
                  }
                  const active = viewAs === role
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => { handleViewAsChange(role); setAccountOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '7px 10px', border: 'none', cursor: 'pointer',
                        borderRadius: 8, textAlign: 'left',
                        fontFamily: 'var(--font-sans, system-ui)',
                        background: active ? 'var(--active-bg)' : 'transparent',
                        color: active ? '#fff' : 'var(--text-primary)',
                        transition: 'background var(--t-fast)',
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-inset)' }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{labels[role].label}</div>
                        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>{labels[role].desc}</div>
                      </div>
                      {active && <span aria-hidden="true" style={{ fontSize: 12 }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Menu items */}
          <div style={{ padding: '4px 0' }}>
            <Link
              href="/settings"
              role="menuitem"
              style={menuItemStyle}
              onClick={() => setAccountOpen(false)}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-inset)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
            >
              <Gear size={15} weight="bold" aria-hidden="true" />
              Einstellungen
            </Link>
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 14px' }} aria-hidden="true" />
            <button
              type="button"
              role="menuitem"
              aria-label="Abmelden"
              onClick={handleSignOut}
              style={{ ...menuItemStyle, color: 'var(--color-danger)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-inset)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <SignOut size={15} weight="bold" aria-hidden="true" />
              Abmelden
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
