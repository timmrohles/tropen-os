'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { Compass, ArrowLeft, ArrowsClockwise, Trash, PencilSimple } from '@phosphor-icons/react'
import { Link, useRouter } from '@/i18n/navigation'
import type { PreflightProjectDetail } from '@/lib/preflight/types'
import { PreflightResult } from '../_components/PreflightResult'

export default function PreflightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [detail, setDetail] = useState<PreflightProjectDetail | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const [reanalyzing, setReanalyzing] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/preflight/projects/${id}`)
    if (!res.ok) { setNotFound(true); return }
    const json = await res.json() as PreflightProjectDetail
    setDetail(json); setRenameVal(json.name)
  }, [id])

  useEffect(() => { void load() }, [load])

  const rename = useCallback(async () => {
    if (!renameVal.trim() || !detail) return
    await fetch(`/api/preflight/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: renameVal.trim() }) })
    setDetail(d => d ? { ...d, name: renameVal.trim() } : d); setRenaming(false)
  }, [id, renameVal, detail])

  const remove = useCallback(async () => {
    await fetch(`/api/preflight/projects/${id}`, { method: 'DELETE' })
    router.push('/preflight')
  }, [id, router])

  const reanalyze = useCallback(async () => {
    if (!detail || reanalyzing) return
    setReanalyzing(true)
    try {
      const res = await fetch(`/api/preflight/projects/${id}/runs`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: detail.input, pivots: detail.pivots }),
      })
      if (res.ok) {
        const json = await res.json() as { result: PreflightProjectDetail['result'] }
        setDetail(d => d ? { ...d, result: json.result } : d)
      }
    } finally { setReanalyzing(false) }
  }, [id, detail, reanalyzing])

  if (notFound) {
    return (
      <div className="content-max">
        <p style={{ marginTop: 40, color: 'var(--text-secondary)' }}>
          Projekt nicht gefunden. <Link href="/preflight" style={{ color: 'var(--teal)' }}>Zurück zur Übersicht</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="content-max">
      <div style={{ marginBottom: 8 }}>
        <Link href="/preflight" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ArrowLeft size={14} weight="bold" aria-hidden="true" /> Übersicht
        </Link>
      </div>

      <div className="page-header">
        <div className="page-header-text">
          {renaming ? (
            <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void rename(); if (e.key === 'Escape') { setRenameVal(detail?.name ?? ''); setRenaming(false) } }}
              onBlur={() => void rename()}
              style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--accent)', borderRadius: 6, padding: '6px 10px', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', outline: 'none' }} />
          ) : (
            <h1 className="page-header-title">
              <Compass size={30} color="var(--text-primary)" weight="fill" aria-hidden="true" />
              {detail?.name ?? 'Lädt …'}
            </h1>
          )}
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost" onClick={() => void reanalyze()} disabled={reanalyzing || !detail?.input}>
            <ArrowsClockwise size={14} weight="bold" aria-hidden="true" /> {reanalyzing ? 'Analysiere …' : 'Neu analysieren'}
          </button>
          <button className="btn btn-ghost" onClick={() => setRenaming(true)}>
            <PencilSimple size={14} weight="bold" aria-hidden="true" /> Umbenennen
          </button>
          {confirmDel ? (
            <>
              <button className="btn btn-danger" onClick={() => void remove()}>Wirklich löschen</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(false)}>Abbrechen</button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={() => setConfirmDel(true)}>
              <Trash size={14} weight="bold" aria-hidden="true" /> Löschen
            </button>
          )}
        </div>
      </div>

      {detail?.result
        ? <PreflightResult result={detail.result} />
        : <p style={{ color: 'var(--text-tertiary)', marginTop: 24 }}>Lädt …</p>}
    </div>
  )
}
