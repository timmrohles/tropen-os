import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-error'
import { withProjectAccess } from '@/lib/auth/route-guards'

// GET /api/projects/[id]/chats
export const GET = withProjectAccess<{ id: string }>(async (_req, { projectId }) => {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) return apiError(error)
  return NextResponse.json(data ?? [])
})
