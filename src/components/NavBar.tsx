'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { AccountRole } from './AccountSwitcher'
import {
  ShieldCheck, ClipboardText, ListChecks,
  ChartBar, Cpu, CurrencyEur, FileText, Users, PaintBrush, Megaphone,
  ChatCircle, FolderOpen, Books, Compass, Buildings, SquaresFour, RssSimple, Archive,
  Sparkle, Eye,
} from '@phosphor-icons/react'
import ParrotIcon from './ParrotIcon'
import NavBarViewAsSwitcher from './NavBarViewAsSwitcher'
import NavBarNotifications from './NavBarNotifications'

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
                <Link href="/admin/announcements" style={navLinkStyle(isActive('/admin/announcements'))}
                  aria-current={isActive('/admin/announcements') ? 'page' : undefined}>
                  <Megaphone size={16} weight="fill" aria-hidden="true" />
                  Neuigkeiten
                </Link>
              </li>
              <li>
                <Link href="/department" style={navLinkStyle(isActive('/department'))}
                  aria-current={isActive('/department') ? 'page' : undefined}>
                  <Buildings size={16} weight="fill" aria-hidden="true" />
                  Department
                </Link>
              </li>
              <li>
                <Link href="/perspectives" style={navLinkStyle(isActive('/perspectives'))}
                  aria-current={isActive('/perspectives') ? 'page' : undefined}>
                  <Eye size={16} weight="fill" aria-hidden="true" />
                  Perspectives
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
                <Link href="/agenten" style={navLinkStyle(isActive('/agenten'))}
                  aria-current={isActive('/agenten') ? 'page' : undefined}>
                  <Compass size={16} weight="fill" aria-hidden="true" />
                  Agenten
                </Link>
              </li>
              <li>
                <Link href="/perspectives" style={navLinkStyle(isActive('/perspectives'))}
                  aria-current={isActive('/perspectives') ? 'page' : undefined}>
                  <Eye size={16} weight="fill" aria-hidden="true" />
                  Perspectives
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
            <NavBarViewAsSwitcher
              viewAs={viewAs}
              viewAsOpen={viewAsOpen}
              setViewAsOpen={setViewAsOpen}
              onViewAsChange={handleViewAsChange}
            />
          )}
          <NavBarNotifications
            loggedIn={loggedIn}
            unreadCount={unreadCount}
            notifOpen={notifOpen}
            notifs={notifs}
            onBellClick={handleBellClick}
          />
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
