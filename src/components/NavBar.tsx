'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

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
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    supabase
      .from('organization_settings')
      .select('logo_url, primary_color, organization_display_name, ai_guide_name')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setBranding(data)
      })

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoggedIn(false); return }
      setLoggedIn(true)
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (profile?.role === 'superadmin') {
        setIsSuperadmin(true)
      } else if (profile && ['owner', 'admin'].includes(profile.role)) {
        setIsAdmin(true)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Primärfarbe als CSS-Variable auf :root setzen
  useEffect(() => {
    const color = branding?.primary_color ?? '#14b8a6'
    document.documentElement.style.setProperty('--primary-color', color)
  }, [branding?.primary_color])

  async function logout() {
    await supabase.auth.signOut()
    document.cookie = 'onboarding_done=; max-age=0; path=/'
    document.cookie = 'is_superadmin=; max-age=0; path=/'
    router.push('/login')
  }

  const displayName = branding?.organization_display_name
  const logoUrl = branding?.logo_url

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
      {isSuperadmin ? (
        <Link href="/superadmin/clients" className="text-teal-400 text-sm hover:text-teal-300 transition-colors no-underline font-medium">
          Superadmin
        </Link>
      ) : (
        <>
          <Link href="/workspaces" className="text-zinc-400 text-sm hover:text-white transition-colors no-underline">
            Workspaces
          </Link>
          <Link href="/dashboard" className="text-zinc-400 text-sm hover:text-white transition-colors no-underline">
            Dashboard
          </Link>
          {isAdmin && (
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

      {loggedIn && (
        <div className="ml-auto">
          <button
            onClick={logout}
            className="bg-transparent border border-zinc-800 text-zinc-500 text-sm px-3.5 py-1.5 rounded-md cursor-pointer hover:border-zinc-600 hover:text-zinc-300 transition-colors"
          >
            Abmelden
          </button>
        </div>
      )}
    </nav>
  )
}
