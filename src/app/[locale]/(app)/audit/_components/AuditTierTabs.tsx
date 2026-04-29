'use client'

import { useEffect, useRef, useState } from 'react'

interface TierTab {
  id: 'findings' | 'metrics' | 'compliance'
  label: string
  count: number
  hasDanger?: boolean
}

interface AuditTierTabsProps {
  codeCount: number
  metricCount: number
  complianceCount: number
  complianceHasDanger: boolean
}

export default function AuditTierTabs({
  codeCount,
  metricCount,
  complianceCount,
  complianceHasDanger,
}: AuditTierTabsProps) {
  const [activeTab, setActiveTab] = useState<string>('findings')
  const tabsRef = useRef<HTMLDivElement>(null)

  // ResizeObserver — misst ScoreHero dynamisch und setzt --score-header-height
  useEffect(() => {
    const hero = document.getElementById('audit-score-hero')
    if (!hero) return
    const update = () => {
      const h = hero.getBoundingClientRect().height
      document.documentElement.style.setProperty('--score-header-height', `${h + 4}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(hero)
    return () => ro.disconnect()
  }, [])

  // IntersectionObserver — aktiver Tab folgt der sichtbaren Section
  useEffect(() => {
    const sections = ['findings', 'metrics', 'compliance']
    const observers: IntersectionObserver[] = []

    sections.forEach(id => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveTab(id)
        },
        { rootMargin: '0px 0px -65% 0px', threshold: 0.01 }
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  const tabs: TierTab[] = [
    { id: 'findings',   label: 'Findings',    count: codeCount },
    { id: 'metrics',    label: 'Metriken',    count: metricCount },
    { id: 'compliance', label: 'Compliance',  count: complianceCount, hasDanger: complianceHasDanger },
  ]

  return (
    <div
      ref={tabsRef}
      style={{
        position: 'sticky',
        top: 'var(--score-header-height, 120px)',
        zIndex: 20,
        background: 'var(--bg-base)',
        borderBottom: '1px solid var(--border)',
        marginBottom: 24,
      }}
    >
      <div style={{ display: 'flex', gap: 0 }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id
          return (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              onClick={e => {
                e.preventDefault()
                setActiveTab(tab.id)
                document.getElementById(tab.id)?.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '11px 18px',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                textDecoration: 'none',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'color 120ms, border-color 120ms',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
              <span style={{
                fontSize: 11, fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 10,
                background: active ? 'var(--accent-light)' : 'var(--bg-surface-2)',
                color: active ? 'var(--accent)' : 'var(--text-tertiary)',
                transition: 'background 120ms, color 120ms',
              }}>
                {tab.count}
              </span>
              {tab.hasDanger && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--status-danger)',
                  flexShrink: 0,
                }} aria-label="Offene Pflichten" />
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}
