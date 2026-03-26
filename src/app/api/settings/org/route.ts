import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.organization_id) return NextResponse.json({ docs: [], settings: null, isAdmin: false })

  const isAdmin = ['admin', 'owner', 'superadmin'].includes(profile.role ?? '')

  const [{ data: settings }, { data: docs }] = await Promise.all([
    supabaseAdmin
      .from('organization_settings')
      .select('organization_display_name, ai_guide_name, ai_guide_description')
      .eq('organization_id', profile.organization_id)
      .maybeSingle(),
    supabaseAdmin
      .from('knowledge_documents')
      .select('id, title, file_type, file_size, status, created_at')
      .eq('organization_id', profile.organization_id)
      .is('user_id', null)
      .is('project_id', null)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return NextResponse.json({ docs: docs ?? [], settings, isAdmin })
}
