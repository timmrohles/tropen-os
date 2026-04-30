'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type AuditTab = 'findings' | 'categories' | 'history'

interface AuditTabsProps {
  findingsCount: number
  categoryCount: number
  runCount: number
  findingsContent: React.ReactNode
  categoriesContent: React.ReactNode
  historyContent: React.ReactNode
  /** Called when navigating to findings tab with an agent filter (from category click) */
  onNavigateToFindings?: (agentFilter: string) => void
}

export default function AuditTabs({
  findingsCount,
  categoryCount,
  runCount,
  findingsContent,
  categoriesContent,
  historyContent,
}: AuditTabsProps) {
  const t = useTranslations('audit')
  const [activeTab, setActiveTab] = useState<AuditTab>('findings')

  const tabs: Array<{ id: AuditTab; label: string; count: number }> = [
    { id: 'findings',   label: t('tabFindings'),   count: findingsCount },
    { id: 'categories', label: t('tabCategories'), count: categoryCount },
    { id: 'history',    label: t('tabHistory'),    count: runCount },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="kb-tabs">
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            className={activeTab === id ? 'kb-tab kb-tab--active' : 'kb-tab'}
            onClick={() => setActiveTab(id)}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ minHeight: 200 }}>
        {activeTab === 'findings' ? findingsContent
          : activeTab === 'categories' ? categoriesContent
          : historyContent}
      </div>
    </div>
  )
}
