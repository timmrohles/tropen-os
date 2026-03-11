'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type ViewAs = 'superadmin' | 'org_admin' | 'solo'

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
  const [branding, setBranding] = useState<OrgBranding | null>(null)
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [viewAs, setViewAs] = useState<ViewAs>('superadmin')

  useEffect(() => {
    const stored = sessionStorage.getItem(VIEW_AS_KEY) as ViewAs | null
    if (stored) setViewAs(stored)
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
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (profile?.role === 'superadmin') setIsSuperadmin(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const color = branding?.primary_color ?? '#a3b554'
    document.documentElement.style.setProperty('--primary-color', color)
  }, [branding?.primary_color])

  function switchViewAs(v: ViewAs) {
    setViewAs(v)
    sessionStorage.setItem(VIEW_AS_KEY, v)
  }

  async function logout() {
    await supabase.auth.signOut()
    document.cookie = 'onboarding_done=; max-age=0; path=/'
    document.cookie = 'is_superadmin=; max-age=0; path=/'
    router.push('/login')
  }

  const displayName = branding?.organization_display_name
  const logoUrl = branding?.logo_url

  const showSuperadminNav = isSuperadmin && viewAs === 'superadmin'
  const showAdminNav = !showSuperadminNav && viewAs === 'org_admin'

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 px-6 flex items-center gap-8 h-[52px]">

      {/* ── Logo-Bereich ── */}
      <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0" style={{ minWidth: 0 }}>
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={displayName ?? 'Logo'}
            width={120}
            height={32}
            style={{ maxHeight: 32, width: 'auto', objectFit: 'contain' }}
            unoptimized
          />
        ) : (
          <span className="font-bold text-base text-white tracking-tight">Tropen OS</span>
        )}
        {displayName && (
          <div className="flex flex-col leading-none" style={{ minWidth: 0 }}>
            <span className="text-sm font-semibold text-white truncate">{displayName}</span>
            {logoUrl && (
              <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.03em' }}>
                powered by Tropen OS
              </span>
            )}
          </div>
        )}
      </Link>

      {/* ── Navigation ── */}
      {showSuperadminNav ? (
        <>
          <Link href="/superadmin/clients" style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            Superadmin
          </Link>
          <Link href="/admin/qa" className="text-zinc-400 text-sm hover:text-white transition-colors no-underline">
            QA
          </Link>
        </>
      ) : (
        <>
          <Link href="/workspaces" className="text-zinc-400 text-sm hover:text-white transition-colors no-underline">
            Workspaces
          </Link>
          <Link href="/dashboard" className="text-zinc-400 text-sm hover:text-white transition-colors no-underline">
            Dashboard
          </Link>
          {showAdminNav && (
            <>
              <Link href="/admin/models" className="text-zinc-400 text-sm hover:text-white transition-colors no-underline">
                Modelle
              </Link>
              <Link href="/admin/budget" className="text-zinc-400 text-sm hover:text-white transition-colors no-underline">
                Budget
              </Link>
              <Link href="/admin/logs" className="text-zinc-400 text-sm hover:text-white transition-colors no-underline">
                Logs
              </Link>
              <Link href="/admin/users" className="text-zinc-400 text-sm hover:text-white transition-colors no-underline">
                User
              </Link>
              <Link href="/admin/branding" className="text-zinc-400 text-sm hover:text-white transition-colors no-underline">
                Branding
              </Link>
            </>
          )}
        </>
      )}

      <div className="ml-auto flex items-center gap-3">
        {/* ── Role-Switcher (nur Superadmin) ── */}
        {isSuperadmin && (
          <div style={{ display: 'flex', gap: 2, background: '#111', border: '1px solid #2a2a2a', borderRadius: 6, padding: 2 }}>
            {([
              { key: 'superadmin', label: 'Super' },
              { key: 'org_admin',  label: 'Admin' },
              { key: 'solo',       label: 'Solo' },
            ] as { key: ViewAs; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchViewAs(key)}
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '3px 9px',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  background: viewAs === key ? '#a3b554' : 'transparent',
                  color: viewAs === key ? '#0d1f16' : '#666',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {loggedIn && (
          <button
            onClick={logout}
            className="bg-transparent border border-zinc-800 text-zinc-500 text-sm px-3.5 py-1.5 rounded-md cursor-pointer hover:border-zinc-600 hover:text-zinc-300 transition-colors"
          >
            Abmelden
          </button>
        )}
      </div>
    </nav>
  )
}
