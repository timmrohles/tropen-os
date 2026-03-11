import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Get artifact to check ownership
  const { data: artifact } = await supabaseAdmin
    .from('artifacts')
    .select('organization_id, user_id')
    .eq('id', id)
    .single()

  if (!artifact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Verify user belongs to the org
  const { data: membership } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .eq('organization_id', artifact.organization_id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('artifacts')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
