'use client'

import { useEffect, useRef, useState } from 'react'

export interface AppTabDef {
  id: string
  label: string
  count: number
  hasDanger?: boolean
  sectionId?: string
  href?: string        // ← new: direct link instead of scroll
  comingSoon?: boolean // ← new: disabled tab with "Bald" badge
}

interface AppTabsProps {
  tabs: AppTabDef[]
  /** When provided (URL-based routing), overrides internal active state. */
  activeTabId?: string
}

export function AppTabs({ tabs, activeTabId }: AppTabsProps) {
  const [activeTab, setActiveTab] = useState(activeTabId ?? tabs[0]?.id ?? '')

  // Sync when server re-renders with a different activeTabId (URL-based navigation)
  useEffect(() => {
    if (activeTabId) setActiveTab(activeTabId)
  }, [activeTabId])

  // ResizeObserver — hält --score-header-height dynamisch aktuell
  useEffect(() => {
    const hero = document.getElementById('audit-score-hero')
    if (!hero) return
    const update = () => {
      document.documentElement.style.setProperty('--score-header-height', `${hero.getBoundingClientRect().height + 2}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(hero)
    return () => ro.disconnect()
  }, [])

  // IntersectionObserver — aktiver Tab folgt sichtbarer Section (nur ohne href-Routing)
  useEffect(() => {
    if (activeTabId) return  // URL-based routing handles active state
    const observers: IntersectionObserver[] = []
    tabs.forEach(tab => {
      const el = document.getElementById(tab.sectionId ?? tab.id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveTab(tab.id) },
        { rootMargin: '0px 0px -65% 0px', threshold: 0.01 }
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [tabs, activeTabId])

  return (
    <div className="app-tabs" role="tablist">
      {tabs.map(tab => (
        <a
          key={tab.id}
          role="tab"
          aria-selected={!tab.comingSoon && activeTab === tab.id}
          aria-disabled={tab.comingSoon}
          href={tab.comingSoon ? undefined : (tab.href ?? `#${tab.sectionId ?? tab.id}`)}
          className={`app-tab${!tab.comingSoon && activeTab === tab.id ? ' app-tab--active' : ''}${tab.comingSoon ? ' app-tab--coming-soon' : ''}`}
          onClick={tab.comingSoon ? (e => e.preventDefault()) : (tab.href ? undefined : (e => {
            e.preventDefault()
            setActiveTab(tab.id)
            document.getElementById(tab.sectionId ?? tab.id)?.scrollIntoView({ behavior: 'smooth' })
          }))}
        >
          {tab.label}
          {tab.comingSoon
            ? <span className="app-tab__badge app-tab__badge--soon">Bald</span>
            : <span className="app-tab__count">{tab.count}</span>
          }
          {tab.hasDanger && <span className="app-tab__danger" aria-label="Offene Pflichten" />}
        </a>
      ))}
    </div>
  )
}
