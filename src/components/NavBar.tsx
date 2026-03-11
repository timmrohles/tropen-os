'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { AccountSwitcher, type AccountRole } from './AccountSwitcher'
import {
  ShieldCheck, ClipboardText, ListChecks,
  ChartBar, Cpu, CurrencyEur, FileText, Users, PaintBrush,
} from '@phosphor-icons/react'

const VIEW_AS_KEY = 'tropen_view_as'

interface OrgBranding {
  logo_url: string | null
  primary_color: string
  organization_display_name: string | null
  ai_guide_name: string
}

export default function NavBar() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [branding, setBranding] = useState<OrgBranding | null>(null)
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [viewAs, setViewAs] = useState<AccountRole>('superadmin')

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
      .select('logo_url, primary_color, organization_display_name, ai_guide_name')
      .maybeSingle()
      .then(({ data }) => { if (data) setBranding(data) })

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoggedIn(false); return }
      setLoggedIn(true)
      const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).maybeSingle()
      if (profile?.role === 'superadmin') setIsSuperadmin(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  const showAdminNav = !showSuperadminNav && viewAs === 'org_admin'

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
            <div style={{
              width: 28, height: 28, background: 'var(--active-bg)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>
              🦜
            </div>
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
            </>
          )}

        </ul>

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {isSuperadmin && (
            <AccountSwitcher current={viewAs} onChange={handleViewAsChange} />
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
