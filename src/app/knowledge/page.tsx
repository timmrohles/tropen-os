'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  CloudArrowUp, File, FilePdf, FileDoc, FileText, FileCsv,
  Trash, CheckCircle, Warning, Spinner, Books, FolderOpen, Users,
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
    case 'pdf':  return <FilePdf size={20} weight="fill" style={{ color: '#ef4444' }} />
    case 'docx': return <FileDoc size={20} weight="fill" style={{ color: '#3b82f6' }} />
    case 'csv':  return <FileCsv size={20} weight="fill" style={{ color: '#22c55e' }} />
    default:     return <FileText size={20} weight="fill" style={{ color: 'rgba(255,255,255,0.4)' }} />
  }
}

// ─── Komponente ───────────────────────────────────────────────────────────────

export default function KnowledgePage() {
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
    setUploadError(null)

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      if (!['pdf', 'docx', 'txt', 'md', 'csv'].includes(ext)) {
        setUploadError(`Dateityp .${ext} nicht unterstützt`)
        continue
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(`${file.name} ist größer als ${MAX_SIZE_MB} MB`)
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

        if (srcErr || !source) throw new Error(srcErr?.message ?? 'Source-Fehler')

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

        if (docErr || !doc) throw new Error(docErr?.message ?? 'Dokument-Fehler')

        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, percent: 30 } : u))

        // 3. Datei in Storage hochladen
        const { error: storageErr } = await supabase.storage
          .from('knowledge-files')
          .upload(`${orgId}/${source.id}/${safeName}`, file, { upsert: true })

        if (storageErr) throw new Error(storageErr.message)

        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, percent: 70 } : u))

        // 4. Ingest-Edge-Function triggern
        const { error: fnErr } = await supabase.functions.invoke('knowledge-ingest', {
          body: { document_id: doc.id },
        })

        if (fnErr) throw new Error(fnErr.message)

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
    if (!confirm('Dokument wirklich löschen?')) return
    await fetch('/api/knowledge', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: id }),
    })
    loadDocs()
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'user', label: 'Meine Dokumente', icon: <File size={16} weight="fill" /> },
    { id: 'org',  label: 'Org-Wissen',      icon: <Users size={16} weight="fill" />, adminOnly: true },
    { id: 'project', label: 'Projekt-Wissen', icon: <FolderOpen size={16} weight="fill" /> },
  ]

  return (
    <div className="kb-wrap content-max">
      {/* Header */}
      <div className="kb-header">
        <h1 className="kb-title">
          <Books size={24} weight="fill" style={{ verticalAlign: 'middle', marginRight: 10, color: '#a3b554' }} />
          Wissensbasis
        </h1>
      </div>

      {/* Tabs */}
      <div className="kb-tabs">
        {TABS.map(t => {
          const disabled = t.adminOnly && !isAdmin
          return (
            <button
              key={t.id}
              className={`kb-tab${tab === t.id ? ' kb-tab--active' : ''}${disabled ? ' kb-tab--disabled' : ''}`}
              onClick={() => !disabled && setTab(t.id)}
              disabled={disabled}
            >
              {t.icon}
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Org-Tab: nur Admins */}
      {tab === 'org' && !isAdmin ? (
        <p className="kb-admin-hint">Nur Admins können das Org-Wissen verwalten.</p>
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
            <div className="kb-drop-icon"><CloudArrowUp size={36} weight="duotone" /></div>
            <p className="kb-drop-title">Datei hierher ziehen oder klicken</p>
            <p className="kb-drop-sub">PDF, DOCX, TXT, MD, CSV · max. {MAX_SIZE_MB} MB</p>
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
              <Spinner size={24} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
          ) : docs.length === 0 ? (
            <div className="kb-empty">
              <div className="kb-empty-icon"><Books size={40} weight="duotone" /></div>
              <p className="kb-empty-text">Noch keine Dokumente. Lade dein erstes Dokument hoch.</p>
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
                      {doc.chunk_count > 0 && ` · ${doc.chunk_count} Chunks`}
                      {` · ${new Date(doc.created_at).toLocaleDateString('de-DE')}`}
                    </div>
                  </div>
                  <div className="kb-doc-status">
                    {doc.status === 'ready' && (
                      <span className="kb-badge kb-badge--ready">
                        <CheckCircle size={11} weight="fill" /> Bereit
                      </span>
                    )}
                    {doc.status === 'processing' && (
                      <span className="kb-badge kb-badge--processing">
                        <Spinner size={11} className="animate-spin" /> Verarbeitung
                      </span>
                    )}
                    {doc.status === 'error' && (
                      <span className="kb-badge kb-badge--error" title={doc.error_message ?? ''}>
                        <Warning size={11} weight="fill" /> Fehler
                      </span>
                    )}
                  </div>
                  <button className="kb-doc-delete" onClick={() => deleteDoc(doc.id)} aria-label="Löschen">
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
