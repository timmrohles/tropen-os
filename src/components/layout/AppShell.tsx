'use client'

import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import MobileHeader from './MobileHeader'
import BottomNav from './BottomNav'

const STORAGE_KEY = 'sidebar-collapsed'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Restore collapsed state from localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') setCollapsed(true)

    // Detect mobile breakpoint
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)

    setHydrated(true)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Sync sidebar offset CSS var and data attribute for fixed child elements
  useEffect(() => {
    const offset = isMobile
      ? '0px'
      : collapsed
        ? 'var(--sidebar-collapsed-width)'
        : 'var(--sidebar-width)'
    document.documentElement.style.setProperty('--current-sidebar-offset', offset)
    document.documentElement.dataset.sidebarCollapsed = String(!isMobile && collapsed)
  }, [collapsed, isMobile])

  function toggle() {
    setCollapsed(c => {
      const next = !c
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  const marginLeft = hydrated && !isMobile
    ? (collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)')
    : (isMobile ? 0 : 'var(--sidebar-width)')

  if (isMobile) {
    return (
      <>
        <MobileHeader />
        <main className="app-main">
          {children}
        </main>
        <BottomNav />
      </>
    )
  }

  return (
    <>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <TopBar />
      <main className="app-main" style={{ left: marginLeft }}>
        {children}
      </main>
    </>
  )
}
