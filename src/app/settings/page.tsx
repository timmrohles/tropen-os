'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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

const TABS = [
  { id: 'profile' as const,      label: 'Profil',           icon: User },
  { id: 'ki-context' as const,   label: 'Mein KI-Kontext',  icon: Brain },
  { id: 'skills' as const,       label: 'Meine Skills',     icon: Lightning },
  { id: 'connections' as const,  label: 'Verbindungen',     icon: Plugs },
  { id: 'from-org' as const,     label: 'Von meiner Org',   icon: Buildings },
  { id: 'preferences' as const,  label: 'Präferenzen',      icon: Sliders },
  { id: 'security' as const,     label: 'Sicherheit',       icon: ShieldCheck },
]

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [isAdmin, setIsAdmin] = useState(false)

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
  }, [searchParams])

  const visibleTabs = [
    ...TABS,
    ...(isAdmin ? [{ id: 'organization' as const, label: 'Organisation', icon: Buildings }] : []),
    ...(isAdmin ? [{ id: 'kosten' as const, label: 'Kosten & Verbrauch', icon: ChartBar }] : []),
  ]

  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <GearSix size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Einstellungen
          </h1>
        </div>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Einstellungs-Bereiche">
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
