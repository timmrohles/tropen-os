import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { getAuthUser, verifyProjectAccess } from '@/lib/api/projects'
import { apiError } from '@/lib/api-error'

// DELETE /api/projects/[id]/documents/[docId] — soft-delete + remove from storage
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  const { id, docId } = await params

  const allowed = await verifyProjectAccess(id, me)
  if (!allowed) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data: doc } = await supabaseAdmin
    .from('project_documents')
    .select('storage_path')
    .eq('id', docId)
    .eq('project_id', id)
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
}
