import type { ReactNode } from 'react'
import { requireOrgAdmin } from '@/lib/auth/guards'

/**
 * Server-side auth guard for all /admin/* routes.
 * Redirects users without admin or superadmin role to /workspaces.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireOrgAdmin()
  return <>{children}</>
}
