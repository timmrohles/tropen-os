'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useTranslations } from 'next-intl'
import {
  CloudArrowUp, FilePdf, FileDoc, FileText, FileCsv,
  Trash, CheckCircle, Warning, Spinner, Books, ArrowClockwise,
} from '@phosphor-icons/react'

// ─── Typen ────────────────────────────────────────────────────────────────────

type Tab = 'user' | 'org' | 'project'
type DocStatus = 'processing' | 'ready' | 'error'

interface KnowledgeDoc {
  id: string
  title: string
  file_type: string | null
  file_size: number | null
  status: DocStatus
  chunk_count: number
  created_at: string
  error_message: string | null
}

interface UploadProgress {
  name: string
  percent: number
}

const ACCEPTED_TYPES = '.pdf,.docx,.txt,.md,.csv'
const MAX_SIZE_MB = 25

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Umlaute → Basis (ü→u)
    .replace(/[^a-zA-Z0-9._-]/g, '_')                 // Sonderzeichen → _
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(type: string | null) {
  switch (type?.toLowerCase()) {
    case 'pdf':  return <FilePdf size={20} weight="fill" style={{ color: 'var(--error)' }} />
    case 'docx': return <FileDoc size={20} weight="fill" style={{ color: 'var(--accent)' }} />
    case 'csv':  return <FileCsv size={20} weight="fill" style={{ color: 'var(--accent)' }} />
    default:     return <FileText size={20} weight="fill" style={{ color: 'var(--text-tertiary)' }} />
  }
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

  // User + Profil laden
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
      if (profile) {
        setOrgId(profile.organization_id)
        setIsAdmin(['admin', 'owner', 'superadmin'].includes(profile.role))
      }
    }
    load()
  }, [])

  const loadDocs = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/knowledge?scope=${tab}`)
    if (res.ok) setDocs(await res.json())
    setLoading(false)
  }, [tab])

  useEffect(() => { loadDocs() }, [loadDocs])

  // Polling für "processing" Dokumente
  useEffect(() => {
    const processing = docs.some(d => d.status === 'processing')
    if (!processing) return
    const timer = setInterval(loadDocs, 3000)
    return () => clearInterval(timer)
  }, [docs, loadDocs])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    if (!orgId || !userId) {
      setUploadError(t('profileNotLoaded'))
      return
    }
    setUploadError(null)

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      if (!['pdf', 'docx', 'txt', 'md', 'csv'].includes(ext)) {
        setUploadError(t('unsupportedType', { ext }))
        continue
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(t('fileTooLarge', { name: file.name, maxMb: MAX_SIZE_MB }))
        continue
      }

      const safeName = sanitizeFileName(file.name)
      const progress: UploadProgress = { name: file.name, percent: 0 }
      setUploads(prev => [...prev, progress])

      try {
        // 1. Source anlegen (Upload-Typ, persönliche Ebene)
        const { data: source, error: srcErr } = await supabase
          .from('knowledge_sources')
          .insert({
            organization_id: orgId,
            user_id: tab === 'user' ? userId : null,
            project_id: null,
            name: file.name,
            type: 'upload',
            is_active: true,
          })
          .select('id')
          .single()

        if (srcErr || !source) throw new Error(`knowledge_sources: ${srcErr?.message ?? 'Unbekannter Fehler'}`)

        // 2. Dokument-Eintrag anlegen
        const { data: doc, error: docErr } = await supabase
          .from('knowledge_documents')
          .insert({
            source_id: source.id,
            organization_id: orgId,
            user_id: tab === 'user' ? userId : null,
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

        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, percent: 30 } : u))

        // 3. Datei in Storage hochladen
        const { error: storageErr } = await supabase.storage
          .from('knowledge-files')
          .upload(`${orgId}/${source.id}/${safeName}`, file, { upsert: true })

        if (storageErr) {
          // DB-Record bereinigen — sonst bleibt Dokument ewig in 'processing' hängen
          await supabase.from('knowledge_documents').delete().eq('id', doc.id)
          await supabase.from('knowledge_sources').delete().eq('id', source.id)
          throw new Error(`Datei-Upload fehlgeschlagen: ${storageErr.message}`)
        }

        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, percent: 70 } : u))

        // 4. Ingest-Edge-Function triggern
        const { data: fnData, error: fnErr } = await supabase.functions.invoke('knowledge-ingest', {
          body: { document_id: doc.id },
        })

        if (fnErr) {
          // Echten Fehler direkt aus dem Response-Body lesen (vermeidet Race Condition mit DB-Update)
          const actualError = (fnData as { error?: string } | null)?.error ?? fnErr.message
          await supabase
            .from('knowledge_documents')
            .update({ status: 'error', error_message: actualError })
            .eq('id', doc.id)
          throw new Error(`ingest: ${actualError}`)
        }

        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, percent: 100 } : u))
        setTimeout(() => {
          setUploads(prev => prev.filter(u => u.name !== file.name))
          loadDocs()
        }, 1000)
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
      // Datei nicht in Storage — Dokument löschen, User muss neu hochladen
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

  function isStuck(doc: KnowledgeDoc): boolean {
    if (doc.status !== 'processing') return false
    return Date.now() - new Date(doc.created_at).getTime() > 10 * 60 * 1000
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
            <Books size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            {t('title')}
          </h1>
          <p className="page-header-sub">{t('subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const disabled = t.adminOnly && !isAdmin
          return (
            <button
              key={t.id}
              onClick={() => !disabled && setTab(t.id)}
              disabled={disabled}
              className={tab === t.id ? 'chip chip--active' : 'chip'}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Org-Tab: nur Admins */}
      {tab === 'org' && !isAdmin ? (
        <p className="kb-admin-hint">{t('adminOnlyHint')}</p>
      ) : (
        <>
          {/* Upload-Zone */}
          <div
            className={`kb-drop-zone${dragOver ? ' kb-drop-zone--active' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="kb-drop-icon"><CloudArrowUp size={36} weight="fill" /></div>
            <p className="kb-drop-title">{t('dropTitle')}</p>
            <p className="kb-drop-sub">{t('dropSub', { maxMb: MAX_SIZE_MB })}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)}
            />
          </div>

          {/* Upload-Fortschritt */}
          {uploads.map(u => (
            <div key={u.name} className="kb-progress-wrap">
              <div className="kb-progress-label">{u.name}</div>
              <div className="kb-progress-bar">
                <div className="kb-progress-fill" style={{ width: `${u.percent}%` }} />
              </div>
            </div>
          ))}

          {uploadError && <p className="kb-error-msg">{uploadError}</p>}

          {/* Dokument-Liste */}
          {loading ? (
            <div className="kb-empty">
              <Spinner size={24} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
            </div>
          ) : docs.length === 0 ? (
            <div className="kb-empty">
              <div className="kb-empty-icon"><Books size={40} weight="fill" /></div>
              <p className="kb-empty-text">{t('emptyText')}</p>
            </div>
          ) : (
            <div className="kb-doc-list">
              {docs.map(doc => (
                <div key={doc.id} className="kb-doc-row">
                  <div className="kb-doc-icon">{fileIcon(doc.file_type)}</div>
                  <div className="kb-doc-info">
                    <div className="kb-doc-name">{doc.title}</div>
                    <div className="kb-doc-meta">
                      {doc.file_size ? formatBytes(doc.file_size) : ''}
                      {doc.chunk_count > 0 && ` · ${t('chunks', { count: doc.chunk_count })}`}
                      {` · ${new Date(doc.created_at).toLocaleDateString('de-DE')}`}
                    </div>
                    {(doc.status === 'error' || isStuck(doc)) && doc.error_message && (
                      <div style={{ fontSize: 11, color: 'var(--error)', marginTop: 3 }}>
                        {doc.error_message}
                      </div>
                    )}
                  </div>
                  <div className="kb-doc-status">
                    {doc.status === 'ready' && (
                      <span className="kb-badge kb-badge--ready">
                        <CheckCircle size={11} weight="fill" /> {t('statusReady')}
                      </span>
                    )}
                    {doc.status === 'processing' && !isStuck(doc) && (
                      <span className="kb-badge kb-badge--processing">
                        <Spinner size={11} className="animate-spin" /> {t('statusProcessing')}
                      </span>
                    )}
                    {doc.status === 'processing' && isStuck(doc) && (
                      <span className="kb-badge kb-badge--error" title={t('stuckTitle')}>
                        <Warning size={11} weight="fill" /> {t('statusStuck')}
                      </span>
                    )}
                    {doc.status === 'error' && (
                      <span className="kb-badge kb-badge--error" title={doc.error_message ?? ''}>
                        <Warning size={11} weight="fill" /> {t('statusError')}
                      </span>
                    )}
                  </div>
                  {(doc.status === 'error' || isStuck(doc)) && (
                    <button className="kb-doc-delete" onClick={() => retryDoc(doc.id)} aria-label={t('retryAriaLabel')} title={t('retryAriaLabel')}>
                      <ArrowClockwise size={16} weight="bold" />
                    </button>
                  )}
                  <button className="kb-doc-delete" onClick={() => deleteDoc(doc.id)} aria-label={t('deleteAriaLabel')}>
                    <Trash size={16} weight="fill" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
