'use client'

import { Link } from '@/i18n/navigation'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from '@/i18n/navigation'
import {
  ChartBar, ChatCircle, FolderSimple, DotsThreeCircle,
  Sparkle, ShareNetwork, RssSimple, Robot, GearSix, X,
} from '@phosphor-icons/react'
import type { Icon as PhosphorIconType } from '@phosphor-icons/react'

interface NavItem {
  href: string
  label: string
  Icon: PhosphorIconType
  matchPrefix: string
}

const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', Icon: ChartBar,      matchPrefix: '/dashboard' },
  { href: '/chat',      label: 'Chat',      Icon: ChatCircle,    matchPrefix: '/chat'      },
  { href: '/projects',  label: 'Projekte',  Icon: FolderSimple,  matchPrefix: '/projects'  },
]

const MORE_NAV: NavItem[] = [
  { href: '/artefakte',  label: 'Artefakte',  Icon: Sparkle,       matchPrefix: '/artefakte'  },
  { href: '/workspaces', label: 'Workspaces', Icon: ShareNetwork,  matchPrefix: '/workspaces' },
  { href: '/feeds',      label: 'Feeds',      Icon: RssSimple,     matchPrefix: '/feeds'      },
  { href: '/agenten',    label: 'Agenten',    Icon: Robot,         matchPrefix: '/agenten'    },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  const isActive = (prefix: string) => pathname.startsWith(prefix)
  const moreActive = MORE_NAV.some(item => isActive(item.matchPrefix))

  // Close on Escape
  useEffect(() => {
    if (!showMore) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowMore(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showMore])

  return (
    <>
      <nav className="bottom-nav" aria-label="Hauptnavigation">
        {PRIMARY_NAV.map(({ href, label, Icon, matchPrefix }) => {
          const active = isActive(matchPrefix)
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav-item${active ? ' bottom-nav-item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
            >
              <Icon size={22} weight={active ? 'fill' : 'bold'} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          )
        })}

        <button
          className={`bottom-nav-item${moreActive ? ' bottom-nav-item--active' : ''}`}
          onClick={() => setShowMore(true)}
          aria-label="Mehr anzeigen"
          aria-expanded={showMore}
          aria-haspopup="dialog"
        >
          <DotsThreeCircle size={22} weight={moreActive ? 'fill' : 'bold'} aria-hidden="true" />
          <span>Mehr</span>
        </button>
      </nav>

      {/* More Sheet */}
      {showMore && (
        <>
          <div
            className="modal-backdrop"
            onClick={() => setShowMore(false)}
            aria-hidden="true"
          />
          <div
            ref={sheetRef}
            className="bottom-nav-sheet"
            role="dialog"
            aria-label="Weitere Navigation"
            aria-modal="true"
          >
            <div className="bottom-nav-sheet-handle" aria-hidden="true" />
            <button
              className="modal-close-btn"
              onClick={() => setShowMore(false)}
              aria-label="Schließen"
            >
              <X size={16} weight="bold" />
            </button>

            <div className="bottom-nav-sheet-items">
              {MORE_NAV.map(({ href, label, Icon, matchPrefix }) => {
                const active = isActive(matchPrefix)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`bottom-nav-sheet-item${active ? ' bottom-nav-sheet-item--active' : ''}`}
                    onClick={() => setShowMore(false)}
                  >
                    <Icon size={20} weight={active ? 'fill' : 'bold'} aria-hidden="true" />
                    {label}
                  </Link>
                )
              })}

              <div className="bottom-nav-sheet-divider" />

              <Link
                href="/settings"
                className="bottom-nav-sheet-item"
                onClick={() => setShowMore(false)}
              >
                <GearSix size={20} weight="bold" aria-hidden="true" />
                Einstellungen
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  )
}
