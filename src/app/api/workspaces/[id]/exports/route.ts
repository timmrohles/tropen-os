import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withWorkspaceAccess } from '@/lib/auth/route-guards'
import { apiError } from '@/lib/api-error'

export const GET = withWorkspaceAccess<{ id: string }>(async (_req, { workspaceId: id }) => {
  const { data, error } = await supabaseAdmin
    .from('workspace_exports')
    .select('id, format, status, file_url, is_stale, created_at')
    .eq('workspace_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return apiError(error)
  return NextResponse.json({ data: data ?? [] })
})
