import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * Require the current user to be a superadmin.
 * Call at the top of any async Server Component or layout.
 * Returns the authenticated user on success.
 */
export async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') redirect('/workspaces')

  return user
}

/**
 * Require the current user to be an org admin or superadmin.
 * Returns the authenticated user on success.
 */
export async function requireOrgAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['superadmin', 'org_admin'].includes(profile?.role ?? '')) {
    redirect('/workspaces')
  }

  return user
}
