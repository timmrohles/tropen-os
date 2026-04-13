'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { GearSix, User, Brain, Lightning, Plugs, Buildings, Sliders, ShieldCheck, ChartBar } from '@phosphor-icons/react'
import { ProfileSection } from './_components/ProfileSection'
import { KIContextSection } from './_components/KIContextSection'
import { SkillsSection } from './_components/SkillsSection'
import { ConnectionsSection } from './_components/ConnectionsSection'
import { FromOrgSection } from './_components/FromOrgSection'
import { PreferencesSection } from './_components/PreferencesSection'
import { SecuritySection } from './_components/SecuritySection'
import { OrganizationSection } from './_components/OrganizationSection'
import { KostenVerbrauchSection } from './_components/KostenVerbrauchSection'

type SettingsTab =
  | 'profile'
  | 'ki-context'
  | 'skills'
  | 'connections'
  | 'from-org'
  | 'preferences'
  | 'security'
  | 'organization'
  | 'kosten'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [isAdmin, setIsAdmin] = useState(false)

  const TABS = [
    { id: 'profile' as const,      label: t('tabs.profile'),      icon: User },
    { id: 'ki-context' as const,   label: t('tabs.kiContext'),    icon: Brain },
    { id: 'skills' as const,       label: t('tabs.skills'),       icon: Lightning },
    { id: 'connections' as const,  label: t('tabs.connections'),  icon: Plugs },
    { id: 'from-org' as const,     label: t('tabs.fromOrg'),      icon: Buildings },
    { id: 'preferences' as const,  label: t('tabs.preferences'),  icon: Sliders },
    { id: 'security' as const,     label: t('tabs.security'),     icon: ShieldCheck },
  ]

  useEffect(() => {
    // Support hash-style navigation: /settings#ki-kontext
    const hash = window.location.hash.replace('#', '')
    const allTabIds: SettingsTab[] = [...TABS.map(t => t.id), 'organization', 'kosten']
    if (hash && allTabIds.includes(hash as SettingsTab)) setActiveTab(hash as SettingsTab)

    // Check admin status
    const load = async () => {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
      setIsAdmin(['admin', 'owner', 'superadmin'].includes(data?.role ?? ''))
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const visibleTabs = [
    ...TABS,
    ...(isAdmin ? [{ id: 'organization' as const, label: t('tabs.organization'), icon: Buildings }] : []),
    ...(isAdmin ? [{ id: 'kosten' as const, label: t('tabs.costs'), icon: ChartBar }] : []),
  ]

  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <GearSix size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            {t('title')}
          </h1>
        </div>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label={t('navAriaLabel')}>
          {visibleTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`settings-nav-item${activeTab === id ? ' settings-nav-item--active' : ''}`}
              onClick={() => {
                setActiveTab(id)
                window.history.replaceState(null, '', `/settings#${id}`)
              }}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              <Icon size={14} weight="bold" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {activeTab === 'profile'      && <ProfileSection />}
          {activeTab === 'ki-context'   && <KIContextSection />}
          {activeTab === 'skills'       && <SkillsSection />}
          {activeTab === 'connections'  && <ConnectionsSection />}
          {activeTab === 'from-org'     && <FromOrgSection />}
          {activeTab === 'preferences'  && <PreferencesSection />}
          {activeTab === 'security'     && <SecuritySection />}
          {activeTab === 'organization' && isAdmin && <OrganizationSection />}
          {activeTab === 'kosten'       && isAdmin && <KostenVerbrauchSection />}
        </div>
      </div>
    </div>
  )
}
