'use client'

import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname } from '@/i18n/navigation'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import ParrotIcon from '@/components/ParrotIcon'
import {
  CaretLeft, CaretRight, GearSix, House, ClipboardText,
} from '@phosphor-icons/react'


interface OrgBranding {
  logo_url: string | null
  organization_display_name: string | null
}

interface NavItem {
  href: string
  icon: React.ReactNode
  label: string
  matchPrefix?: string
}

interface NavLinkProps {
  item: NavItem
  collapsed: boolean
  pathname: string
}

function NavLink({ item, collapsed, pathname }: NavLinkProps) {
  const active = item.matchPrefix
    ? pathname.startsWith(item.matchPrefix)
    : pathname === item.href || pathname.startsWith(item.href + '/')
  return (
    <li>
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

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const supabase = createClient()
  const pathname = usePathname()
  const [branding, setBranding] = useState<OrgBranding | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    void Promise.resolve(
      supabase
        .from('organization_settings')
        .select('logo_url, organization_display_name')
        .maybeSingle()
        .then(({ data }) => { if (data) setBranding(data) })
    ).catch(() => {})

    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) setUser(authUser)
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayName = branding?.organization_display_name
  const logoUrl = branding?.logo_url

  // ── Universal nav ─────────────────────────────────────────────────────────
  const navItems: NavItem[] = [
    { href: '/dashboard', icon: <House size={18} weight="bold" aria-hidden="true" />, label: 'Dashboard', matchPrefix: '/dashboard' },
    { href: '/audit',     icon: <ClipboardText size={18} weight="bold" aria-hidden="true" />, label: 'Audit', matchPrefix: '/audit' },
  ]

  const userName = user?.user_metadata?.full_name as string | undefined ?? user?.email ?? 'Account'

  const isSettingsActive = pathname === '/settings' || pathname.startsWith('/settings/')

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
          aria-label={collapsed ? (displayName ? `${displayName} — Startseite` : 'Tropen OS — Startseite') : undefined}
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
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => <NavLink key={item.href} item={item} collapsed={collapsed} pathname={pathname} />)}
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
