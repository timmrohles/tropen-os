import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('organization_id, role').eq('id', user.id).single()
  if (!profile?.organization_id) return null
  return { id: user.id, organization_id: profile.organization_id, role: profile.role } as {
    id: string; organization_id: string; role: string
  }
}

export async function verifyProjectAccess(
  projectId: string,
  me: { id: string; organization_id: string; role: string }
): Promise<boolean> {
  if (me.role === 'superadmin') return true
  const { data: project } = await supabaseAdmin
    .from('projects').select('department_id').eq('id', projectId).is('deleted_at', null).single()
  if (!project) return false
  const { data } = await supabaseAdmin
    .from('departments').select('id')
    .eq('id', project.department_id).eq('organization_id', me.organization_id).single()
  return !!data
}
