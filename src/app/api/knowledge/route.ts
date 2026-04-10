// src/app/api/knowledge/route.ts
// GET: Dokumente laden | DELETE: Dokument + Chunks löschen

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 })

  const scope = req.nextUrl.searchParams.get('scope') ?? 'user'
  const project_id = req.nextUrl.searchParams.get('project_id')

  let query = supabase
    .from('knowledge_documents')
    .select(`
      id, title, file_type, file_size, status, chunk_count, created_at, error_message,
      knowledge_sources!inner(name, type, organization_id, user_id, project_id)
    `)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (scope === 'user') {
    query = query.eq('user_id', user.id).is('project_id', null)
  } else if (scope === 'org') {
    query = query.is('user_id', null).is('project_id', null)
  } else if (scope === 'project' && project_id) {
    query = query.eq('project_id', project_id)
  }

  const { data, error } = await query
  if (error) return apiError(error)

  return NextResponse.json(data ?? [])
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { document_id } = await req.json()
  if (!document_id) return NextResponse.json({ error: 'document_id fehlt' }, { status: 400 })

  // Dokument laden (Zugriffscheck + storage_path holen)
  const { data: doc } = await supabase
    .from('knowledge_documents')
    .select('id, storage_path, user_id, organization_id')
    .eq('id', document_id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  // Nur eigene Dokumente oder Org-Dokumente von Admins löschen
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'superadmin'
  const isOwner = doc.user_id === user.id

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  // Storage-Datei löschen
  if (doc.storage_path) {
    await supabaseAdmin.storage.from('knowledge-files').remove([doc.storage_path])
  }

  // Chunks werden via CASCADE gelöscht
  const { error } = await supabaseAdmin
    .from('knowledge_documents')
    .delete()
    .eq('id', document_id)

  if (error) return apiError(error)

  return NextResponse.json({ success: true })
}
