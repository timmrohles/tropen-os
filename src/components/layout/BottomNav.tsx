'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ChatCircle, FolderOpen, RssSimple, ChartBar } from '@phosphor-icons/react'

interface NavItem {
  href: string
  icon: React.ReactNode
  label: string
  matchPrefix?: string
}

export default function BottomNav() {
  const supabase = createClient()
  const pathname = usePathname()
  const [dbRole, setDbRole] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
      setDbRole(profile?.role ?? null)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isActive = (prefix?: string, href?: string) =>
    prefix ? pathname.startsWith(prefix) : pathname === href

  const adminItems: NavItem[] = [
    { href: '/dashboard', icon: <ChartBar size={22} weight="fill" aria-hidden="true" />, label: 'Dashboard', matchPrefix: '/dashboard' },
    { href: '/projects', icon: <FolderOpen size={22} weight="fill" aria-hidden="true" />, label: 'Projekte', matchPrefix: '/projects' },
    { href: '/feeds', icon: <RssSimple size={22} weight="fill" aria-hidden="true" />, label: 'Feeds', matchPrefix: '/feeds' },
    { href: '/chat', icon: <ChatCircle size={22} weight="fill" aria-hidden="true" />, label: 'Chat', matchPrefix: '/chat' },
  ]

  const memberItems: NavItem[] = [
    { href: '/chat', icon: <ChatCircle size={22} weight="fill" aria-hidden="true" />, label: 'Chat', matchPrefix: '/chat' },
    { href: '/projects', icon: <FolderOpen size={22} weight="fill" aria-hidden="true" />, label: 'Projekte', matchPrefix: '/projects' },
    { href: '/feeds', icon: <RssSimple size={22} weight="fill" aria-hidden="true" />, label: 'Feeds', matchPrefix: '/feeds' },
    { href: '/dashboard', icon: <ChartBar size={22} weight="fill" aria-hidden="true" />, label: 'Dashboard', matchPrefix: '/dashboard' },
  ]

  const items = dbRole === 'member' ? memberItems : adminItems

  return (
    <nav
      aria-label="Hauptnavigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 200,
        // Safe area inset for iOS
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {items.map((item) => {
        const active = isActive(item.matchPrefix, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              height: '100%',
              textDecoration: 'none',
              color: active ? 'var(--accent)' : 'var(--text-tertiary)',
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              transition: 'color var(--t-fast)',
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
