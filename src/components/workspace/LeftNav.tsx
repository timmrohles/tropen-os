'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Folders, ChartBar, Robot, CurrencyEur, ClipboardText,
  Users, TreePalm, SignOut, Gear, CaretDown,
} from '@phosphor-icons/react'
import ProjectSidebar from './ProjectSidebar'
import Papierkorb from './Papierkorb'
import type { WorkspaceState } from '@/hooks/useWorkspaceState'

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link href={href} className={`lnav-item${active ? ' lnav-item--active' : ''}`}>
      {icon}
      <span>{label}</span>
    </Link>
  )
}

type LeftNavProps = {
  workspaceName: string
  isAdmin: boolean
  userInitial: string
  userFullName: string
  userEmail: string
  handleLogout: () => void
  onNewConversation: () => void
  onNewProject: () => void
  trashCount: number
  trashOpen: boolean
  trashConvs: Array<{ id: string; title: string | null }>
  trashLoading: boolean
  onToggleTrash: () => void
  onRestoreConv: (id: string) => void
  onHardDeleteConv: (id: string) => void
} & React.ComponentProps<typeof ProjectSidebar>

export default function LeftNav({
  isAdmin,
  userInitial,
  userFullName,
  userEmail,
  handleLogout,
  onNewConversation: _onNewConversation,
  onNewProject: _onNewProject,
  trashCount,
  trashOpen,
  trashConvs,
  trashLoading,
  onToggleTrash,
  onRestoreConv,
  onHardDeleteConv,
  workspaceName: _workspaceName,
  ...projectSidebarProps
}: LeftNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [wsOpen, setWsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <nav className="lnav">
      {/* Logo */}
      <div className="lnav-logo">
        <TreePalm size={22} color="var(--accent)" weight="fill" />
        <span className="lnav-logo-text">Tropen OS</span>
      </div>

      {/* Navigation */}
      <div className="lnav-section">
        <span className="lnav-section-label">Navigation</span>
        <NavItem href="/dashboard" icon={<ChartBar size={22} weight="fill" />} label="Dashboard" />

        {/* Workspaces Dropdown */}
        <button className="lnav-item" onClick={() => setWsOpen(v => !v)}>
          <span className="lnav-item-inner">
            <Folders size={22} weight={wsOpen ? 'fill' : 'regular'} />
            Workspaces
          </span>
          <CaretDown size={12} className={`lnav-item-expand${wsOpen ? ' lnav-item-expand--open' : ''}`} />
        </button>
        {wsOpen && (
          <div className="lnav-ws-indent">
            <div className="lnav-ws-placeholder">Module folgen…</div>
          </div>
        )}
      </div>

      <div className="lnav-divider" />

      {/* Chats */}
      <div className="lnav-conv-list sidebar-scroll">
        <span className="lnav-section-label" style={{ padding: '10px 10px 6px' }}>Chats</span>
        <ProjectSidebar {...projectSidebarProps} />
        <Papierkorb
          trashCount={trashCount}
          trashOpen={trashOpen}
          trashConvs={trashConvs}
          trashLoading={trashLoading}
          onToggle={onToggleTrash}
          onRestore={onRestoreConv}
          onHardDelete={onHardDeleteConv}
        />
      </div>

      {/* User bar with dropdown */}
      <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
        {menuOpen && (
          <div className="lnav-user-menu">
            {isAdmin && (
              <>
                <Link href="/admin/models" className="lnav-menu-link" onClick={() => setMenuOpen(false)}>
                  <Robot size={15} /> Modelle
                </Link>
                <Link href="/admin/budget" className="lnav-menu-link" onClick={() => setMenuOpen(false)}>
                  <CurrencyEur size={15} /> Budget
                </Link>
                <Link href="/admin/logs" className="lnav-menu-link" onClick={() => setMenuOpen(false)}>
                  <ClipboardText size={15} /> Logs
                </Link>
                <Link href="/admin/users" className="lnav-menu-link" onClick={() => setMenuOpen(false)}>
                  <Users size={15} /> User
                </Link>
                <div className="lnav-menu-divider" />
              </>
            )}
            <Link href="/settings" className="lnav-menu-link" onClick={() => setMenuOpen(false)}>
              <Gear size={15} /> Einstellungen
            </Link>
            <div className="lnav-menu-divider" />
            <button className="lnav-menu-logout" onClick={() => { setMenuOpen(false); handleLogout() }}>
              <SignOut size={15} /> Abmelden
            </button>
          </div>
        )}
        <div className="lnav-user-bar" onClick={() => setMenuOpen(v => !v)}>
          <div className="lnav-user-avatar">{userInitial}</div>
          <div className="lnav-user-info">
            <span className="lnav-user-name">{userFullName || userEmail}</span>
            <span className="lnav-user-sub">{userEmail}</span>
          </div>
          <span className="lnav-user-chevron">{menuOpen ? '▴' : '▾'}</span>
        </div>
      </div>
    </nav>
  )
}
