import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-error'
import { withProjectAccess } from '@/lib/auth/route-guards'

// DELETE /api/projects/[id]/documents/[docId] — soft-delete + remove from storage
export const DELETE = withProjectAccess<{ id: string; docId: string }>(async (_req, { projectId, params }) => {
  const { docId } = params

  const { data: doc } = await supabaseAdmin
    .from('project_documents')
    .select('storage_path')
    .eq('id', docId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .single()

  if (!doc) return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 })

  // Remove from storage (best-effort)
  await supabaseAdmin.storage.from('project-docs').remove([doc.storage_path])

  const { error } = await supabaseAdmin
    .from('project_documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', docId)

  if (error) return apiError(error)
  return NextResponse.json({ success: true })
})
