'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useTranslations } from 'next-intl'
import { Books } from '@phosphor-icons/react'
import {
  type KnowledgeDoc, type UploadProgress,
  KnowledgeContent, MAX_SIZE_MB, ACCEPTED_TYPES,
} from './_components/DocComponents'

type Tab = 'user' | 'org' | 'project'

const VALID_EXTS = ['pdf', 'docx', 'txt', 'md', 'csv'] as const

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
}

interface UploadContext {
  orgId: string
  userId: string | null
  tab: Tab
  supabase: ReturnType<typeof createClient>
  onProgress: (name: string, percent: number) => void
  onRemove: (name: string) => void
  onDone: () => void
}

async function uploadSingleFile(file: File, ctx: UploadContext): Promise<void> {
  const { orgId, userId, tab, supabase, onProgress, onRemove, onDone } = ctx
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const safeName = sanitizeFileName(file.name)
  const userIdForScope = tab === 'user' ? userId : null

  const { data: source, error: srcErr } = await supabase
    .from('knowledge_sources')
    .insert({
      organization_id: orgId,
      user_id: userIdForScope,
      project_id: null,
      name: file.name,
      type: 'upload',
      is_active: true,
    })
    .select('id')
    .single()

  if (srcErr || !source) throw new Error(`knowledge_sources: ${srcErr?.message ?? 'Unbekannter Fehler'}`)

  const { data: doc, error: docErr } = await supabase
    .from('knowledge_documents')
    .insert({
      source_id: source.id,
      organization_id: orgId,
      user_id: userIdForScope,
      project_id: null,
      title: file.name.replace(/\.[^.]+$/, ''),
      file_type: ext,
      file_size: file.size,
      storage_path: `${orgId}/${source.id}/${safeName}`,
      status: 'processing',
    })
    .select('id')
    .single()

  if (docErr || !doc) throw new Error(`knowledge_documents: ${docErr?.message ?? 'Unbekannter Fehler'}`)

  onProgress(file.name, 30)

  const { error: storageErr } = await supabase.storage
    .from('knowledge-files')
    .upload(`${orgId}/${source.id}/${safeName}`, file, { upsert: true })

  if (storageErr) {
    await supabase.from('knowledge_documents').delete().eq('id', doc.id)
    await supabase.from('knowledge_sources').delete().eq('id', source.id)
    throw new Error(`Datei-Upload fehlgeschlagen: ${storageErr.message}`)
  }

  onProgress(file.name, 70)

  const { data: fnData, error: fnErr } = await supabase.functions.invoke('knowledge-ingest', {
    body: { document_id: doc.id },
  })

  if (fnErr) {
    const actualError = (fnData as { error?: string } | null)?.error ?? fnErr.message
    await supabase
      .from('knowledge_documents')
      .update({ status: 'error', error_message: actualError })
      .eq('id', doc.id)
    throw new Error(`ingest: ${actualError}`)
  }

  onProgress(file.name, 100)
  setTimeout(() => { onRemove(file.name); onDone() }, 1000)
}

// ─── Komponente ───────────────────────────────────────────────────────────────

export default function KnowledgePage() {
  const t = useTranslations('knowledge')
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('user')
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()
      if (!profile) return
      setOrgId(profile.organization_id)
      setIsAdmin(['admin', 'owner', 'superadmin'].includes(profile.role))
    }
    load()
  // supabase is created at render time — adding it would cause infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadDocs = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/knowledge?scope=${tab}`)
    if (res.ok) setDocs(await res.json())
    setLoading(false)
  }, [tab])

  useEffect(() => { loadDocs() }, [loadDocs])

  useEffect(() => {
    const processing = docs.some(d => d.status === 'processing')
    if (!processing) return
    const timer = setInterval(loadDocs, 3000)
    return () => clearInterval(timer)
  }, [docs, loadDocs])

  function validateFile(file: File): string | null {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!(VALID_EXTS as readonly string[]).includes(ext)) return t('unsupportedType', { ext })
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return t('fileTooLarge', { name: file.name, maxMb: String(MAX_SIZE_MB) })
    return null
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    if (!orgId || !userId) { setUploadError(t('profileNotLoaded')); return }
    setUploadError(null)

    for (const file of Array.from(files)) {
      const validationError = validateFile(file)
      if (validationError) { setUploadError(validationError); continue }

      setUploads(prev => [...prev, { name: file.name, percent: 0 }])

      const ctx: UploadContext = {
        orgId,
        userId,
        tab,
        supabase,
        onProgress: (name, pct) => setUploads(prev => prev.map(u => u.name === name ? { ...u, percent: pct } : u)),
        onRemove: name => setUploads(prev => prev.filter(u => u.name !== name)),
        onDone: loadDocs,
      }

      try {
        await uploadSingleFile(file, ctx)
      } catch (err) {
        setUploadError(String(err))
        setUploads(prev => prev.filter(u => u.name !== file.name))
      }
    }
  }

  async function deleteDoc(id: string) {
    if (!confirm(t('deleteConfirm'))) return
    await fetch('/api/knowledge', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: id }),
    })
    loadDocs()
  }

  async function retryDoc(id: string) {
    await supabase
      .from('knowledge_documents')
      .update({ status: 'processing', error_message: null })
      .eq('id', id)

    const { data: result, error: fnErr } = await supabase.functions.invoke('knowledge-ingest', {
      body: { document_id: id },
    })

    const errMsg = (result as { error?: string } | null)?.error ?? fnErr?.message ?? null

    if (errMsg?.includes('Object not found')) {
      await fetch('/api/knowledge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: id }),
      })
      setUploadError(t('fileNotFound'))
    } else if (errMsg) {
      await supabase
        .from('knowledge_documents')
        .update({ status: 'error', error_message: errMsg })
        .eq('id', id)
    }

    loadDocs()
  }

  const TABS: { id: Tab; label: string; adminOnly?: boolean }[] = [
    { id: 'user', label: t('tabMyDocs') },
    { id: 'org',  label: t('tabOrgKnowledge'), adminOnly: true },
    { id: 'project', label: t('tabProjectKnowledge') },
  ]

  if (loading && docs.length === 0) return (
    <div className="content-max" aria-busy="true" aria-live="polite">
      <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', paddingTop: 48 }}>{t('loading')}</p>
    </div>
  )

  return (
    <div className="content-max" aria-busy={loading}>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Books size={22} color="var(--accent)" weight="fill" aria-hidden="true" />
            {t('title')}
          </h1>
          <p className="page-header-sub">{t('subtitle')}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(tabItem => {
          const disabled = tabItem.adminOnly && !isAdmin
          return (
            <button
              key={tabItem.id}
              onClick={() => !disabled && setTab(tabItem.id)}
              disabled={disabled}
              className={tab === tabItem.id ? 'chip chip--active' : 'chip'}
            >
              {tabItem.label}
            </button>
          )
        })}
      </div>

      {tab === 'org' && !isAdmin ? (
        <p className="kb-admin-hint">{t('adminOnlyHint')}</p>
      ) : (
        <KnowledgeContent
          docs={docs}
          loading={loading}
          uploads={uploads}
          uploadError={uploadError}
          dragOver={dragOver}
          fileInputRef={fileInputRef}
          onDragOver={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onDrop={files => { setDragOver(false); handleFiles(files) }}
          onFilePick={files => handleFiles(files)}
          onRetry={retryDoc}
          onDelete={deleteDoc}
          t={t}
        />
      )}
    </div>
  )
}
