// src/app/audit/scan/page.tsx
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { FolderOpen } from '@phosphor-icons/react/dist/ssr'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/utils/supabase/server'
import { fetchUserOrgId, fetchScanProjects } from '@/lib/audit/page-data'
import ConnectProjectCard from './_components/ConnectProjectCard'
import ProjectList from './_components/ProjectList'

export const metadata = { title: 'Externes Projekt verbinden — Tropen OS' }

export default async function AuditScanPage() {
  const t = await getTranslations('auditScan')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await fetchUserOrgId(user.id)
  if (!orgId) redirect('/login')

  const projects = await fetchScanProjects(orgId)

  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <FolderOpen size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            {t('title')}
          </h1>
          <p className="page-header-sub">
            {t('subtitle')}
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/audit" className="btn btn-ghost">{t('backToAudit')}</Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <ConnectProjectCard />
        <ProjectList projects={projects as Parameters<typeof ProjectList>[0]['projects']} />
      </div>
    </div>
  )
}
