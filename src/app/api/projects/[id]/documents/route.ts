import { type NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser, verifyProjectAccess } from '@/lib/api/projects'
import { apiError } from '@/lib/api-error'

// GET /api/projects/[id]/documents
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  const { id } = await params

  const allowed = await verifyProjectAccess(id, me)
  if (!allowed) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('project_documents')
    .select('id, filename, file_size, mime_type, created_at')
    .eq('project_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return apiError(error)
  return NextResponse.json(data ?? [])
}

// POST /api/projects/[id]/documents — multipart/form-data upload
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  const { id } = await params

  const allowed = await verifyProjectAccess(id, me)
  if (!allowed) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

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
  const storagePath = `${me.organization_id}/${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('project-docs')
    .upload(storagePath, buffer, { contentType: file.type })

  if (uploadError) return apiError(uploadError)

  const { data, error } = await supabaseAdmin
    .from('project_documents')
    .insert({
      project_id: id,
      organization_id: me.organization_id,
      filename: file.name,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      created_by: me.id,
    })
    .select('id, filename, file_size, mime_type, created_at')
    .single()

  if (error) return apiError(error)
  return NextResponse.json(data)
}
