import type { ReactNode } from 'react'
import { requireSuperadmin } from '@/lib/auth/guards'

/**
 * Server-side auth guard for all /admin/* routes.
 * Redirects non-superadmins to /workspaces.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireSuperadmin()
  return <>{children}</>
}
