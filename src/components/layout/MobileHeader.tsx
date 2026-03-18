'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Bell, Gear, SignOut } from '@phosphor-icons/react'
import ParrotIcon from '@/components/ParrotIcon'

interface OrgBranding {
  logo_url: string | null
  organization_display_name: string | null
}

export default function MobileHeader() {
  const supabase = createClient()
  const router = useRouter()

  const [branding, setBranding] = useState<OrgBranding | null>(null)
  const [userInitial, setUserInitial] = useState('?')
  const [userName, setUserName] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountBtnRef = useRef<HTMLButtonElement>(null)
  const accountPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('organization_settings')
      .select('logo_url, organization_display_name')
      .maybeSingle()
      .then(({ data }) => { if (data) setBranding(data) })

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()
      const name: string = profile?.full_name || user.email || ''
      setUserName(name)
      setUserInitial((name[0] ?? '?').toUpperCase())
    })

    fetch('/api/feeds/notifications?unread=true&limit=1')
      .then(r => r.ok ? r.json() : null)
      .then((data: { notifications: unknown[] } | null) => {
        if (data) setUnreadCount(data.notifications.length)
      })
      .catch(() => null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!accountOpen) return
    function onMouseDown(e: MouseEvent) {
      if (
        accountPanelRef.current && !accountPanelRef.current.contains(e.target as Node) &&
        accountBtnRef.current && !accountBtnRef.current.contains(e.target as Node)
      ) setAccountOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setAccountOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [accountOpen])

  async function handleSignOut() {
    setAccountOpen(false)
    await supabase.auth.signOut()
    document.cookie = 'onboarding_done=; max-age=0; path=/'
    document.cookie = 'is_superadmin=; max-age=0; path=/'
    router.push('/login')
  }

  const logoUrl = branding?.logo_url
  const displayName = branding?.organization_display_name

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
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--header-height)',
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 200,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        aria-label="Tropen OS — Startseite"
        style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={displayName ?? 'Logo'}
            width={24}
            height={24}
            style={{ maxHeight: 24, width: 'auto', objectFit: 'contain' }}
            unoptimized
          />
        ) : (
          <ParrotIcon size={24} />
        )}
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {displayName ?? 'Tropen OS'}
        </span>
      </Link>

      {/* Right side: Bell + Account */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Link
          href="/settings/notifications"
          aria-label={unreadCount > 0 ? `${unreadCount} ungelesene Benachrichtigungen` : 'Benachrichtigungen'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)', textDecoration: 'none',
            position: 'relative',
          }}
        >
          <Bell size={20} weight={unreadCount > 0 ? 'fill' : 'bold'} color={unreadCount > 0 ? 'var(--accent)' : 'currentColor'} aria-hidden="true" />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--accent)',
            }} aria-hidden="true" />
          )}
        </Link>

        {/* Account avatar */}
        <button
          ref={accountBtnRef}
          type="button"
          aria-haspopup="true"
          aria-expanded={accountOpen}
          aria-label="Account-Menü"
          onClick={() => setAccountOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--active-bg)', color: '#fff',
            fontSize: 12, fontWeight: 700,
            border: 'none', cursor: 'pointer',
          }}
        >
          {userInitial}
        </button>
      </div>

      {/* Account dropdown */}
      {accountOpen && (
        <div
          ref={accountPanelRef}
          role="menu"
          aria-label="Account-Menü"
          style={{
            position: 'fixed',
            top: 'calc(var(--header-height) + 4px)',
            right: 12,
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 300,
            minWidth: 200,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName || 'Account'}
            </div>
          </div>
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
