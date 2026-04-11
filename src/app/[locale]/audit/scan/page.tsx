// src/app/audit/scan/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FolderOpen } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/utils/supabase/server'
import { fetchUserOrgId, fetchScanProjects } from '@/lib/audit/page-data'
import ConnectProjectCard from './_components/ConnectProjectCard'
import ProjectList from './_components/ProjectList'

export const metadata = { title: 'Externes Projekt verbinden — Tropen OS' }

export default async function AuditScanPage() {
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
            Externes Projekt verbinden
          </h1>
          <p className="page-header-sub">
            Lokale Projekte per File System Access API scannen — ohne Upload, ohne CLI
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/audit" className="btn btn-ghost">← Zum Audit</Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <ConnectProjectCard />
        <ProjectList projects={projects as Parameters<typeof ProjectList>[0]['projects']} />
      </div>
    </div>
  )
}
