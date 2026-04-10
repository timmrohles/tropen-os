'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { AccountRole } from '@/components/AccountSwitcher'
import ParrotIcon from '@/components/ParrotIcon'
import {
  ShieldCheck, ClipboardText, ListChecks, Speedometer, Cpu, CurrencyEur,
  FileText, Users, PaintBrush, ChatCircle, FolderSimple,
  Buildings, RssSimple, Sparkle, Robot, CaretLeft, CaretRight, GearSix, ShareNetwork,
} from '@phosphor-icons/react'

const VIEW_AS_KEY = 'tropen_view_as'

interface OrgBranding {
  logo_url: string | null
  organization_display_name: string | null
  members_see_models: boolean
}

interface NavItem {
  href: string
  icon: React.ReactNode
  label: string
  matchPrefix?: string
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const supabase = createClient()
  const pathname = usePathname()
  const [branding, setBranding] = useState<OrgBranding | null>(null)
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [dbRole, setDbRole] = useState<string | null>(null)
  const [viewAs, setViewAs] = useState<AccountRole>('superadmin')
  const [user, setUser] = useState<User | null>(null)

  const isActive = (path: string, prefix?: string) =>
    prefix ? pathname.startsWith(prefix) : pathname === path || pathname.startsWith(path + '/')

  useEffect(() => {
    // Restore viewAs from sessionStorage
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

    // Listen for viewAs changes from TopBar
    function handler(e: Event) {
      setViewAs((e as CustomEvent<AccountRole>).detail)
    }
    window.addEventListener('tropen:viewas', handler)

    // Load branding + auth
    supabase
      .from('organization_settings')
      .select('logo_url, organization_display_name, members_see_models')
      .maybeSingle()
      .then(({ data }) => { if (data) setBranding(data) })

    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return
      setUser(authUser)
      const { data: profile } = await supabase.from('users').select('role').eq('id', authUser.id).maybeSingle()
      if (profile?.role === 'superadmin') setIsSuperadmin(true)
      setDbRole(profile?.role ?? null)
    })

    return () => window.removeEventListener('tropen:viewas', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showSuperadminNav = isSuperadmin && viewAs === 'superadmin'
  const showAdminNav = !showSuperadminNav && (
    (isSuperadmin && (viewAs === 'admin' || viewAs === 'viewer')) ||
    (!isSuperadmin && (dbRole === 'admin' || dbRole === 'viewer'))
  )
  const showMemberNav = !showSuperadminNav && !showAdminNav && (
    (isSuperadmin && viewAs === 'member') ||
    (!isSuperadmin && dbRole === 'member')
  )

  const displayName = branding?.organization_display_name
  const logoUrl = branding?.logo_url

  const superadminItems: NavItem[] = [
    { href: '/superadmin/clients', icon: <ShieldCheck size={18} weight="bold" aria-hidden="true" />, label: 'Superadmin', matchPrefix: '/superadmin' },
    { href: '/workspaces', icon: <Users size={18} weight="bold" aria-hidden="true" />, label: 'Workspaces', matchPrefix: '/workspaces' },
    { href: '/admin/qa', icon: <ClipboardText size={18} weight="bold" aria-hidden="true" />, label: 'QA', matchPrefix: '/admin/qa' },
    { href: '/admin/todos', icon: <ListChecks size={18} weight="bold" aria-hidden="true" />, label: 'To-Dos', matchPrefix: '/admin/todos' },
    { href: '/audit', icon: <ShieldCheck size={18} weight="fill" aria-hidden="true" />, label: 'Audit', matchPrefix: '/audit' },
    { href: '/design-reference', icon: <Sparkle size={18} weight="bold" aria-hidden="true" />, label: 'Design Ref', matchPrefix: '/design-reference' },
  ]

  const adminPrimaryItems: NavItem[] = [
    { href: '/cockpit', icon: <Speedometer size={18} weight="bold" aria-hidden="true" />, label: 'Cockpit', matchPrefix: '/cockpit' },
    { href: '/projects', icon: <FolderSimple size={18} weight="bold" aria-hidden="true" />, label: 'Projekte', matchPrefix: '/projects' },
    { href: '/workspaces', icon: <ShareNetwork size={18} weight="bold" aria-hidden="true" />, label: 'Workspaces', matchPrefix: '/workspaces' },
  ]
  const adminItems: NavItem[] = [
    { href: '/admin/models', icon: <Cpu size={18} weight="bold" aria-hidden="true" />, label: 'Modelle', matchPrefix: '/admin/models' },
    { href: '/admin/budget', icon: <CurrencyEur size={18} weight="bold" aria-hidden="true" />, label: 'Budget', matchPrefix: '/admin/budget' },
    { href: '/admin/logs', icon: <FileText size={18} weight="bold" aria-hidden="true" />, label: 'Logs', matchPrefix: '/admin/logs' },
    { href: '/audit', icon: <ShieldCheck size={18} weight="fill" aria-hidden="true" />, label: 'Audit', matchPrefix: '/audit' },
    { href: '/admin/users', icon: <Users size={18} weight="bold" aria-hidden="true" />, label: 'User', matchPrefix: '/admin/users' },
    { href: '/admin/branding', icon: <PaintBrush size={18} weight="bold" aria-hidden="true" />, label: 'Branding', matchPrefix: '/admin/branding' },
    { href: '/department', icon: <Buildings size={18} weight="bold" aria-hidden="true" />, label: 'Department', matchPrefix: '/department' },
  ]

  // Member nav — Dashboard top, then core items, then Feeds/Agenten
  const memberTopItems: NavItem[] = [
    { href: '/cockpit', icon: <Speedometer size={18} weight="bold" aria-hidden="true" />, label: 'Cockpit', matchPrefix: '/cockpit' },
  ]
  const memberCoreItems: NavItem[] = [
    { href: '/chat', icon: <ChatCircle size={18} weight="bold" aria-hidden="true" />, label: 'Chat', matchPrefix: '/chat' },
    { href: '/projects', icon: <FolderSimple size={18} weight="bold" aria-hidden="true" />, label: 'Projekte', matchPrefix: '/projects' },
    { href: '/artifacts', icon: <Sparkle size={18} weight="bold" aria-hidden="true" />, label: 'Artefakte', matchPrefix: '/artifacts' },
    { href: '/workspaces', icon: <ShareNetwork size={18} weight="bold" aria-hidden="true" />, label: 'Workspaces', matchPrefix: '/workspaces' },
    { href: '/audit', icon: <ShieldCheck size={18} weight="fill" aria-hidden="true" />, label: 'Audit', matchPrefix: '/audit' },
    ...(branding?.members_see_models ? [{ href: '/admin/models', icon: <Cpu size={18} weight="bold" aria-hidden="true" />, label: 'Modelle', matchPrefix: '/admin/models' }] : []),
  ]
  const memberFeedItems: NavItem[] = [
    { href: '/feeds', icon: <RssSimple size={18} weight="bold" aria-hidden="true" />, label: 'Feeds', matchPrefix: '/feeds' },
    { href: '/agenten', icon: <Robot size={18} weight="bold" aria-hidden="true" />, label: 'Agenten', matchPrefix: '/agenten' },
  ]

  const userName = user?.user_metadata?.full_name as string | undefined ?? user?.email ?? 'Account'

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item.href, item.matchPrefix)
    return (
      <li role="none">
        <Link
          href={item.href}
          aria-current={active ? 'page' : undefined}
          aria-label={collapsed ? item.label : undefined}
          title={collapsed ? item.label : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
            height: 'var(--nav-item-height)',
            padding: collapsed ? '0' : '0 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            fontWeight: active ? 600 : 400,
            textDecoration: 'none',
            color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
            background: active ? 'var(--sidebar-active-bg)' : 'transparent',
            transition: 'background var(--t-fast), color var(--t-fast)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
          onMouseEnter={e => {
            if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'var(--sidebar-hover)'
          }}
          onMouseLeave={e => {
            if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
          }}
        >
          {item.icon}
          {!collapsed && <span>{item.label}</span>}
        </Link>
      </li>
    )
  }

  function Divider() {
    return (
      <li role="none" aria-hidden="true" style={{
        height: 1, background: 'var(--sidebar-border)', margin: '6px 12px',
      }} />
    )
  }

  const isSettingsActive = pathname.startsWith('/settings')

  return (
    <aside
      className="sidebar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 200,
        overflow: 'hidden',
        transition: 'width 200ms ease-out',
      }}
    >
      {/* Logo + Collapse Button */}
      <div style={{ display: 'flex', alignItems: 'center', height: 'var(--header-height)', flexShrink: 0, borderBottom: '1px solid var(--sidebar-border)' }}>
        <Link
          href="/"
          aria-label="Tropen OS — Startseite"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
            padding: collapsed ? '0' : '0 14px',
            flex: 1,
            height: '100%',
            textDecoration: 'none',
            overflow: 'hidden',
          }}
        >
          {logoUrl ? (
            <Image
              src={logoUrl} alt={displayName ?? 'Logo'}
              width={28} height={28}
              style={{ maxHeight: 28, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
              unoptimized
            />
          ) : (
            <ParrotIcon size={28} />
          )}
          {!collapsed && (
            <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName ?? 'Tropen OS'}
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggle}
            aria-label="Navigation einklappen"
            title="Navigation einklappen"
          >
            <CaretLeft size={14} weight="bold" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        aria-label="Hauptnavigation"
        style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 0' }}
        className="sidebar-scroll"
      >
        <ul role="list" style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {showSuperadminNav && superadminItems.map(item => <NavLink key={item.href} item={item} />)}

          {showAdminNav && (
            <>
              {adminPrimaryItems.map(item => <NavLink key={item.href} item={item} />)}
              <Divider />
              {adminItems.map(item => <NavLink key={item.href} item={item} />)}
            </>
          )}

          {showMemberNav && (
            <>
              {memberTopItems.map(item => <NavLink key={item.href} item={item} />)}
              <Divider />
              {memberCoreItems.map(item => <NavLink key={item.href} item={item} />)}
              <Divider />
              {memberFeedItems.map(item => <NavLink key={item.href} item={item} />)}
            </>
          )}
        </ul>
      </nav>

      {/* Bottom: new chat + account + collapse */}
      <div style={{
        flexShrink: 0,
        borderTop: '1px solid var(--sidebar-border)',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {/* Neuer Chat */}
        {showMemberNav && (
          <Link
            href="/chat/new"
            aria-label={collapsed ? 'Neuer Chat' : undefined}
            title={collapsed ? 'Neuer Chat' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'center',
              gap: 8,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: 4,
              flexShrink: 0,
              transition: 'background var(--t-fast)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--accent-dark, #225f3e)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--accent)' }}
          >
            {!collapsed && <span>+ Neuer Chat</span>}
            {collapsed && <span style={{ fontSize: 16 }}>+</span>}
          </Link>
        )}

        {/* Account link — no avatar, TopBar has the primary account UI */}
        <Link
          href="/settings"
          aria-label={collapsed ? 'Einstellungen' : undefined}
          title={collapsed ? 'Einstellungen' : undefined}
          className={`sidebar-account${isSettingsActive ? ' sidebar-account--active' : ''}`}
          style={{
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 12px',
          }}
        >
          <GearSix size={18} weight="bold" aria-hidden="true" style={{ flexShrink: 0 }} />
          {!collapsed && (
            <div className="sidebar-account-info">
              <span className="sidebar-account-name">{userName}</span>
              <span className="sidebar-account-role">Einstellungen</span>
            </div>
          )}
        </Link>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Navigation ausklappen' : 'Navigation einklappen'}
          title={collapsed ? 'Navigation ausklappen' : 'Navigation einklappen'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? 'center' : 'flex-end',
            width: '100%',
            height: 'var(--nav-item-height)',
            padding: collapsed ? '0' : '0 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--sidebar-text-muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'background var(--t-fast), color var(--t-fast)',
          }}
          onMouseEnter={e => {
            const btn = e.currentTarget as HTMLButtonElement
            btn.style.background = 'var(--sidebar-hover)'
            btn.style.color = 'var(--sidebar-text)'
          }}
          onMouseLeave={e => {
            const btn = e.currentTarget as HTMLButtonElement
            btn.style.background = 'transparent'
            btn.style.color = 'var(--sidebar-text-muted)'
          }}
        >
          {collapsed
            ? <CaretRight size={18} weight="bold" aria-hidden="true" />
            : <CaretLeft size={18} weight="bold" aria-hidden="true" />
          }
        </button>
      </div>
    </aside>
  )
}
