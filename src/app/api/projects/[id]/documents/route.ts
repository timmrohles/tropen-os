import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import { withProjectAccess } from '@/lib/auth/route-guards'

// GET /api/projects/[id]/documents
export const GET = withProjectAccess<{ id: string }>(async (_req, { projectId }) => {
  const { data, error } = await supabaseAdmin
    .from('project_documents')
    .select('id, filename, file_size, mime_type, created_at')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return apiError(error)
  return NextResponse.json(data ?? [])
})

// POST /api/projects/[id]/documents — multipart/form-data upload
export const POST = withProjectAccess<{ id: string }>(async (req, { projectId, auth }) => {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Ungültige Formulardaten' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Datei fehlt' }, { status: 400 })

  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: 'Datei zu groß (max. 10 MB)' }, { status: 400 })

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ]
  if (!allowedTypes.includes(file.type))
    return NextResponse.json({ error: 'Dateityp nicht erlaubt (PDF, DOCX, TXT, MD)' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const storagePath = `${auth.organization_id}/${projectId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('project-docs')
    .upload(storagePath, buffer, { contentType: file.type })

  if (uploadError) return apiError(uploadError)

  const { data, error } = await supabaseAdmin
    .from('project_documents')
    .insert({
      project_id: projectId,
      organization_id: auth.organization_id,
      filename: file.name,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      created_by: auth.id,
    })
    .select('id, filename, file_size, mime_type, created_at')
    .single()

  if (error) return apiError(error)
  return NextResponse.json(data)
})
