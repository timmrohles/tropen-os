'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { AccountRole } from './AccountSwitcher'
import {
  ShieldCheck, ClipboardText, ListChecks,
  ChartBar, Cpu, CurrencyEur, FileText, Users, PaintBrush,
  ChatCircle, FolderOpen, Books, Compass, Buildings, SquaresFour, RssSimple, Archive,
  Sparkle, Bell,
} from '@phosphor-icons/react'
import ParrotIcon from './ParrotIcon'

const VIEW_AS_KEY = 'tropen_view_as'

interface OrgBranding {
  logo_url: string | null
  primary_color: string
  organization_display_name: string | null
  ai_guide_name: string
  members_see_models: boolean
}

export default function NavBar() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [branding, setBranding] = useState<OrgBranding | null>(null)
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [dbRole, setDbRole] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [viewAs, setViewAs]               = useState<AccountRole>('superadmin')
  const [unreadCount, setUnreadCount]     = useState(0)
  const [notifOpen, setNotifOpen]         = useState(false)
  const [notifs, setNotifs]               = useState<{ id: string; title: string; body: string | null; createdAt: string }[]>([])
  const [viewAsOpen, setViewAsOpen]       = useState(false)

  const isActive = (path: string) => pathname.startsWith(path)

  useEffect(() => {
    const stored = sessionStorage.getItem(VIEW_AS_KEY) as AccountRole | null
    // 'solo' was renamed to 'member' — migrate stale sessionStorage values
    if (stored === ('solo' as string)) {
      sessionStorage.setItem(VIEW_AS_KEY, 'member')
      setViewAs('member')
    } else if (stored) {
      setViewAs(stored)
    }
  }, [])

  useEffect(() => {
    supabase
      .from('organization_settings')
      .select('logo_url, primary_color, organization_display_name, ai_guide_name, members_see_models')
      .maybeSingle()
      .then(({ data }) => { if (data) setBranding(data) })

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoggedIn(false); return }
      setLoggedIn(true)
      const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).maybeSingle()
      if (profile?.role === 'superadmin') setIsSuperadmin(true)
      setDbRole(profile?.role ?? null)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!loggedIn) return
    fetch('/api/feeds/notifications?unread=true&limit=5')
      .then((r) => r.ok ? r.json() : null)
      .then((data: { notifications: { id: string; title: string; body: string | null; createdAt: string }[] } | null) => {
        if (!data) return
        setNotifs(data.notifications)
        setUnreadCount(data.notifications.length)
      })
      .catch(() => null)
  }, [loggedIn])

  const handleBellClick = () => {
    setNotifOpen((o) => !o)
    if (!notifOpen && unreadCount > 0) {
      // Mark all as read
      fetch('/api/feeds/notifications', { method: 'PATCH' })
        .then(() => setUnreadCount(0))
        .catch(() => null)
    }
  }

  function handleViewAsChange(role: AccountRole) {
    setViewAs(role)
    sessionStorage.setItem(VIEW_AS_KEY, role)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    document.cookie = 'onboarding_done=; max-age=0; path=/'
    document.cookie = 'is_superadmin=; max-age=0; path=/'
    router.push('/login')
  }

  const displayName = branding?.organization_display_name
  const logoUrl = branding?.logo_url
  const showSuperadminNav = isSuperadmin && viewAs === 'superadmin'
  const showAdminNav = !showSuperadminNav && (
    (isSuperadmin && (viewAs === 'org_admin' || viewAs === 'viewer')) ||
    (!isSuperadmin && (dbRole === 'org_admin' || dbRole === 'viewer'))
  )
  const showMemberNav = !showSuperadminNav && !showAdminNav && (
    (isSuperadmin && viewAs === 'member') ||
    (!isSuperadmin && dbRole === 'member')
  )

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 13, fontWeight: active ? 600 : 400,
    textDecoration: 'none',
    padding: active ? '7px 18px' : '7px 14px',
    borderRadius: 999,
    transition: 'all var(--t-fast)',
    background: active ? 'var(--active-bg)' : 'transparent',
    color: active ? 'var(--active-text)' : 'var(--text-secondary)',
    boxShadow: active ? '0 3px 10px rgba(26,46,35,0.30)' : 'none',
    display: 'flex', alignItems: 'center', gap: 6,
  })

  return (
    <header role="banner">
      <nav
        aria-label="Hauptnavigation"
        style={{
          height: 52, display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 4,
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          aria-label="Tropen OS — Startseite"
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 14 }}
        >
          {logoUrl ? (
            <Image
              src={logoUrl} alt={displayName ?? 'Logo'}
              width={100} height={28}
              style={{ maxHeight: 28, width: 'auto', objectFit: 'contain' }}
              unoptimized
            />
          ) : (
            <ParrotIcon size={30} />
          )}
          {!logoUrl && (
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {displayName ?? 'Tropen OS'}
            </span>
          )}
          {logoUrl && displayName && (
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {displayName}
            </span>
          )}
        </Link>

        {/* Contextual nav links */}
        <ul role="list" style={{ display: 'flex', alignItems: 'center', gap: 2, listStyle: 'none', margin: 0, padding: 0 }}>
          {showSuperadminNav && (
            <>
              <li>
                <Link href="/superadmin/clients" style={navLinkStyle(isActive('/superadmin'))}
                  aria-current={isActive('/superadmin') ? 'page' : undefined}>
                  <ShieldCheck size={16} weight="fill" aria-hidden="true" />
                  Superadmin
                </Link>
              </li>
              <li>
                <Link href="/workspaces" style={navLinkStyle(isActive('/workspaces') || isActive('/ws/'))}
                  aria-current={isActive('/workspaces') || isActive('/ws/') ? 'page' : undefined}>
                  <SquaresFour size={16} weight="fill" aria-hidden="true" />
                  Workspaces
                </Link>
              </li>
              <li>
                <Link href="/admin/qa" style={navLinkStyle(isActive('/admin/qa'))}
                  aria-current={isActive('/admin/qa') ? 'page' : undefined}>
                  <ClipboardText size={16} weight="fill" aria-hidden="true" />
                  QA
                </Link>
              </li>
              <li>
                <Link href="/admin/todos" style={navLinkStyle(isActive('/admin/todos'))}
                  aria-current={isActive('/admin/todos') ? 'page' : undefined}>
                  <ListChecks size={16} weight="fill" aria-hidden="true" />
                  To-Dos
                </Link>
              </li>
              <li>
                <Link href="/design-reference" style={navLinkStyle(isActive('/design-reference'))}
                  aria-current={isActive('/design-reference') ? 'page' : undefined}>
                  <Sparkle size={16} weight="fill" aria-hidden="true" />
                  Design Ref
                </Link>
              </li>
            </>
          )}

          {showAdminNav && (
            <>
              <li>
                <Link href="/dashboard" style={navLinkStyle(isActive('/dashboard') && !isActive('/admin'))}
                  aria-current={isActive('/dashboard') && !isActive('/admin') ? 'page' : undefined}>
                  <ChartBar size={16} weight="fill" aria-hidden="true" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/projects" style={navLinkStyle(isActive('/projects'))}
                  aria-current={isActive('/projects') ? 'page' : undefined}>
                  <FolderOpen size={16} weight="fill" aria-hidden="true" />
                  Projekte
                </Link>
              </li>
              <li>
                <Link href="/workspaces" style={navLinkStyle(isActive('/workspaces') || isActive('/ws/'))}
                  aria-current={isActive('/workspaces') || isActive('/ws/') ? 'page' : undefined}>
                  <SquaresFour size={16} weight="fill" aria-hidden="true" />
                  Workspaces
                </Link>
              </li>
              <li>
                <Link href="/admin/models" style={navLinkStyle(isActive('/admin/models'))}
                  aria-current={isActive('/admin/models') ? 'page' : undefined}>
                  <Cpu size={16} weight="fill" aria-hidden="true" />
                  Modelle
                </Link>
              </li>
              <li>
                <Link href="/admin/budget" style={navLinkStyle(isActive('/admin/budget'))}
                  aria-current={isActive('/admin/budget') ? 'page' : undefined}>
                  <CurrencyEur size={16} weight="fill" aria-hidden="true" />
                  Budget
                </Link>
              </li>
              <li>
                <Link href="/admin/logs" style={navLinkStyle(isActive('/admin/logs'))}
                  aria-current={isActive('/admin/logs') ? 'page' : undefined}>
                  <FileText size={16} weight="fill" aria-hidden="true" />
                  Logs
                </Link>
              </li>
              <li>
                <Link href="/admin/users" style={navLinkStyle(isActive('/admin/users'))}
                  aria-current={isActive('/admin/users') ? 'page' : undefined}>
                  <Users size={16} weight="fill" aria-hidden="true" />
                  User
                </Link>
              </li>
              <li>
                <Link href="/admin/branding" style={navLinkStyle(isActive('/admin/branding'))}
                  aria-current={isActive('/admin/branding') ? 'page' : undefined}>
                  <PaintBrush size={16} weight="fill" aria-hidden="true" />
                  Branding
                </Link>
              </li>
              <li>
                <Link href="/department" style={navLinkStyle(isActive('/department'))}
                  aria-current={isActive('/department') ? 'page' : undefined}>
                  <Buildings size={16} weight="fill" aria-hidden="true" />
                  Department
                </Link>
              </li>
            </>
          )}

          {showMemberNav && (
            <>
              <li>
                <Link href="/chat" style={navLinkStyle(isActive('/chat'))}
                  aria-current={isActive('/chat') ? 'page' : undefined}>
                  <ChatCircle size={16} weight="fill" aria-hidden="true" />
                  Chat
                </Link>
              </li>
              <li>
                <Link href="/projects" style={navLinkStyle(isActive('/projects'))}
                  aria-current={isActive('/projects') ? 'page' : undefined}>
                  <FolderOpen size={16} weight="fill" aria-hidden="true" />
                  Projekte
                </Link>
              </li>
              <li>
                <Link href="/workspaces" style={navLinkStyle(isActive('/workspaces') || isActive('/ws/'))}
                  aria-current={isActive('/workspaces') || isActive('/ws/') ? 'page' : undefined}>
                  <SquaresFour size={16} weight="fill" aria-hidden="true" />
                  Workspaces
                </Link>
              </li>
              <li>
                <Link href="/feeds" style={navLinkStyle(isActive('/feeds'))}
                  aria-current={isActive('/feeds') ? 'page' : undefined}>
                  <RssSimple size={16} weight="fill" aria-hidden="true" />
                  Feeds
                </Link>
              </li>
              <li>
                <Link href="/artifacts" style={navLinkStyle(isActive('/artifacts'))}
                  aria-current={isActive('/artifacts') ? 'page' : undefined}>
                  <Archive size={16} weight="fill" aria-hidden="true" />
                  Artefakte
                </Link>
              </li>
              <li>
                <Link href="/hub" style={navLinkStyle(isActive('/hub'))}
                  aria-current={isActive('/hub') ? 'page' : undefined}>
                  <Compass size={16} weight="fill" aria-hidden="true" />
                  Hub
                </Link>
              </li>
              <li>
                <Link href="/knowledge" style={navLinkStyle(isActive('/knowledge'))}
                  aria-current={isActive('/knowledge') ? 'page' : undefined}>
                  <Books size={16} weight="fill" aria-hidden="true" />
                  Wissen
                </Link>
              </li>
              <li>
                <Link href="/dashboard" style={navLinkStyle(isActive('/dashboard'))}
                  aria-current={isActive('/dashboard') ? 'page' : undefined}>
                  <ChartBar size={16} weight="fill" aria-hidden="true" />
                  Dashboard
                </Link>
              </li>
              {branding?.members_see_models && (
                <li>
                  <Link href="/admin/models" style={navLinkStyle(isActive('/admin/models'))}
                    aria-current={isActive('/admin/models') ? 'page' : undefined}>
                    <Cpu size={16} weight="fill" aria-hidden="true" />
                    Modelle
                  </Link>
                </li>
              )}
            </>
          )}

        </ul>

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {isSuperadmin && (
            <div style={{ position: 'relative' }}>
              {viewAsOpen && (
                <div
                  role="presentation"
                  aria-hidden="true"
                  style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                  onClick={() => setViewAsOpen(false)}
                />
              )}
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={viewAsOpen}
                aria-label={`Ansicht als: ${viewAs}`}
                onClick={() => setViewAsOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'rgba(26,23,20,0.06)',
                  color: 'var(--text-primary)', fontSize: 12, fontWeight: 500,
                  fontFamily: 'var(--font-sans, system-ui)',
                }}
              >
                {({ superadmin: 'Super', org_admin: 'Admin', member: 'Member', viewer: 'Viewer' })[viewAs]}
                <span aria-hidden="true" style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
              </button>
              {viewAsOpen && (
                <ul
                  role="listbox"
                  aria-label="Ansicht wechseln"
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 100,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    minWidth: 220, padding: 4,
                    listStyle: 'none', margin: 0,
                  }}
                >
                  {([
                    { role: 'superadmin' as const, label: 'Superadmin', desc: 'Vollzugriff auf alle Organisationen' },
                    { role: 'org_admin'  as const, label: 'Admin',      desc: 'Organisations-Administrator' },
                    { role: 'member'     as const, label: 'Member',     desc: 'Normales Mitglied — Chat, Projekte' },
                    { role: 'viewer'     as const, label: 'Viewer',     desc: 'Lese-Zugriff, keine Erstellung' },
                  ]).map(({ role, label, desc }) => {
                    const active = viewAs === role
                    return (
                      <li key={role} role="option" aria-selected={active}>
                        <button
                          type="button"
                          onClick={() => { handleViewAsChange(role); setViewAsOpen(false) }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', padding: '8px 12px', border: 'none', cursor: 'pointer',
                            borderRadius: 8, textAlign: 'left',
                            fontFamily: 'var(--font-sans, system-ui)',
                            background: active ? 'var(--active-bg)' : 'transparent',
                            color: active ? '#fff' : 'var(--text-primary)',
                          }}
                          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-inset, rgba(0,0,0,0.04))' }}
                          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>{desc}</div>
                          </div>
                          {active && <span aria-hidden="true" style={{ fontSize: 12 }}>✓</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
          {loggedIn && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                aria-label={unreadCount > 0 ? `${unreadCount} ungelesene Benachrichtigungen` : 'Benachrichtigungen'}
                aria-haspopup="true"
                aria-expanded={notifOpen}
                className="btn-icon"
                onClick={handleBellClick}
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
          )}
          {loggedIn && (
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                fontSize: 12, padding: '5px 12px', borderRadius: 8,
                border: '1px solid var(--border-medium)',
                background: 'transparent', color: 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'var(--font-sans, system-ui)',
                transition: 'all var(--t-fast)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-medium)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
              }}
            >
              Abmelden
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
