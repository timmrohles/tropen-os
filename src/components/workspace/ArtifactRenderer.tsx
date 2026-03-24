'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { FloppyDisk, ArrowsOut, Code, FileText, Table, ListBullets, Atom, Play, ChatCircle, ArrowSquareOut, ProjectorScreen, CaretLeft, CaretRight, DownloadSimple, ChartBar, Warning, ArrowClockwise } from '@phosphor-icons/react'
import type { ArtifactSegment } from '@/lib/chat/parse-artifacts'

interface ArtifactActionEvent {
  type: string
  value: unknown
}

interface ArtifactRendererProps {
  artifact: ArtifactSegment
  conversationId?: string
  organizationId?: string
  messageId?: string
  onSaved?: () => void
  onSendDirect?: (text: string) => void
  isInSplitView?: boolean
}

// Strips ES module export syntax so Babel can eval the code in a script context.
// "export default function App" → "function App", "export const X" → "const X", etc.
function normalizeArtifactCode(code: string): string {
  return code
    .replace(/export\s+default\s+function\s+(\w+)/g, 'function $1')
    .replace(/export\s+default\s+class\s+(\w+)/g, 'class $1')
    .replace(/export\s+default\s+/g, 'var __defaultExport = ')
    .replace(/export\s+\{[^}]*\}/g, '')
    .replace(/export\s+(const|let|var|function|class)\s+/g, '$1 ')
}

// Builds a full HTML document using pre-transformed JS (no Babel in iframe).
// React + ReactDOM are loaded from CDN; JSX is already compiled server-side via sucrase.
function buildReactIframeHtml(transformedCode: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #111; font-size: 14px; line-height: 1.5; }
    #error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; white-space: pre-wrap; margin-top: 8px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="error" style="display:none"></div>
  <script>
  function onAction(event) {
    window.parent.postMessage({ type: 'artifact-action', event }, '*');
  }
  function __showError(msg) {
    var el = document.getElementById('error');
    if (el) { el.style.display = 'block'; el.textContent = String(msg); }
  }
  function __sendHeight() {
    var h = document.body.scrollHeight;
    window.parent.postMessage({ type: 'iframe-resize', height: h }, '*');
  }
  try {
    ${transformedCode}
    var __el = document.getElementById('root');
    var __root = ReactDOM.createRoot(__el);
    var __C = typeof App !== 'undefined' ? App : typeof Component !== 'undefined' ? Component : typeof Default !== 'undefined' ? Default : null;
    if (__C) {
      __root.render(React.createElement(__C, { onAction }));
      setTimeout(__sendHeight, 50);
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(__sendHeight).observe(document.body);
      }
    } else {
      __showError('Kein Component gefunden — erwartet: function App() { ... }');
      __sendHeight();
    }
  } catch(e) { __showError(e.stack || e.message || String(e)); __sendHeight(); }
  </script>
</body>
</html>`
}

// Builds ECharts iframe — no Babel needed, pure JSON config
function buildChartIframeHtml(config: object): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: transparent; }
    #chart { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script>
    var chart = echarts.init(document.getElementById('chart'), null, { renderer: 'canvas' })
    var defaultColor = ['#2D7A50','#4A9E72','#86C9A4','#D4EDDE','#1a5c37','#5ab882']
    var option = ${JSON.stringify(config)}
    if (!option.color) option.color = defaultColor
    if (!option.backgroundColor) option.backgroundColor = 'transparent'
    if (option.textStyle === undefined) option.textStyle = {}
    if (!option.textStyle.color) option.textStyle.color = '#9ca3af'
    chart.setOption(option)
    window.addEventListener('resize', function() { chart.resize() })
    chart.on('click', function(params) {
      window.parent.postMessage({
        type: 'artifact-action',
        event: { type: 'click', value: params.name || params.value }
      }, '*')
    })
  </script>
</body>
</html>`
}

function typeIcon(type: ArtifactSegment['artifactType']) {
  switch (type) {
    case 'react':        return <Atom size={14} weight="bold" aria-hidden="true" />
    case 'chart':        return <ChartBar size={14} weight="bold" aria-hidden="true" />
    case 'code':         return <Code size={14} weight="bold" aria-hidden="true" />
    case 'document':     return <FileText size={14} weight="bold" aria-hidden="true" />
    case 'table':        return <Table size={14} weight="bold" aria-hidden="true" />
    case 'list':         return <ListBullets size={14} weight="bold" aria-hidden="true" />
    case 'presentation': return <ProjectorScreen size={14} weight="bold" aria-hidden="true" />
    default:             return <Code size={14} weight="bold" aria-hidden="true" />
  }
}

function typeLabel(type: ArtifactSegment['artifactType']): string {
  switch (type) {
    case 'react':        return 'React'
    case 'chart':        return 'Chart'
    case 'code':         return 'Code'
    case 'document':     return 'Dokument'
    case 'table':        return 'Tabelle'
    case 'list':         return 'Liste'
    case 'presentation': return 'Präsentation'
    default:             return 'Artefakt'
  }
}

function codeLanguage(artifact: ArtifactSegment): string {
  if (artifact.language) return artifact.language
  if (artifact.artifactType === 'react') return 'jsx'
  if (artifact.artifactType === 'table') return 'html'
  return 'text'
}

export default function ArtifactRenderer({
  artifact,
  conversationId,
  organizationId,
  messageId,
  onSaved,
  onSendDirect,
  isInSplitView = false,
}: ArtifactRendererProps) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(
    artifact.artifactType === 'react' || artifact.artifactType === 'presentation' || artifact.artifactType === 'chart'
  )
  const [expanded, setExpanded] = useState(false)
  const [lastAction, setLastAction] = useState<ArtifactActionEvent | null>(null)
  const [iframeHtml, setIframeHtml] = useState<string | null>(null)
  const [transformError, setTransformError] = useState<string | null>(null)
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(1)
  const [totalSlides, setTotalSlides] = useState(artifact.slideCount ?? 1)
  const [dynamicHeight, setDynamicHeight] = useState<number | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Transform JSX server-side via sucrase — eliminates Babel CDN dependency in iframe
  useEffect(() => {
    if (artifact.artifactType !== 'react') return
    setTransformError(null)
    setIframeHtml(null)
    const normalized = normalizeArtifactCode(artifact.content)
    fetch('/api/artifacts/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: normalized }),
    })
      .then(r => r.json())
      .then((data: { code?: string; error?: string }) => {
        if (data.error) {
          setTransformError(data.error)
        } else if (data.code) {
          setIframeHtml(buildReactIframeHtml(data.code))
        }
      })
      .catch(err => {
        setTransformError(String(err))
      })
  }, [artifact.content, artifact.artifactType, retryCount])

  // Listen for postMessage events from the sandboxed iframe
  useEffect(() => {
    if (!previewOpen) return
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'artifact-action' && onSendDirect) {
        setLastAction(e.data.event as ArtifactActionEvent)
      }
      if (e.data?.type === 'slide-changed') {
        setCurrentSlide((e.data.indexh as number) + 1)
        setTotalSlides(e.data.total as number)
      }
      if (e.data?.type === 'iframe-resize' && typeof e.data.height === 'number') {
        setDynamicHeight(Math.min(e.data.height + 32, 800))
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [previewOpen, onSendDirect])

  const isReact = artifact.artifactType === 'react'
  const isPresentation = artifact.artifactType === 'presentation'
  const isChart = artifact.artifactType === 'chart'
  const canSave = !!conversationId && !!organizationId && !saved

  // Parse chart config once — null on invalid JSON
  // Must be before any early returns (Rules of Hooks)
  const chartIframeHtml = React.useMemo(() => {
    if (!isChart) return null
    try {
      const config = JSON.parse(artifact.content)
      return buildChartIframeHtml(config)
    } catch {
      return buildChartIframeHtml({ title: { text: 'Ungültige Chart-Konfiguration' }, series: [] })
    }
  }, [isChart, artifact.content])

  function handleExportHtml() {
    if (!iframeHtml) return
    const blob = new Blob([iframeHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.name.replace(/\s+/g, '_')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Compact header — shown in chat when split-view is active ──────────────
  if (isInSplitView && (isReact || isPresentation || isChart)) {
    return (
      <div className="artifact-header-only">
        <span className="artifact-type-icon">{typeIcon(artifact.artifactType)}</span>
        <span className="artifact-type-label">{typeLabel(artifact.artifactType)}</span>
        <span className="artifact-name artifact-name--compact">{artifact.name}</span>
        <div className="artifact-actions" style={{ marginLeft: 'auto' }}>
          {canSave && (
            <button onClick={() => void handleSave()} disabled={saving} title="Speichern" className="artifact-action-btn artifact-action-btn--icon" aria-label="Speichern">
              <FloppyDisk size={13} weight="bold" />
            </button>
          )}
          {saved && <span className="artifact-saved-badge">Gespeichert</span>}
        </div>
      </div>
    )
  }

  const previewHeight = isPresentation ? 480 : isChart ? 350 : (dynamicHeight ?? (expanded ? 520 : 300))

  async function handleSave() {
    if (!conversationId || !organizationId || saving) return
    setSaving(true)
    try {
      await fetch('/api/artifacts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          organizationId,
          name: artifact.name,
          type: artifact.artifactType,
          language: artifact.language ?? (isReact ? 'jsx' : null),
          content: artifact.content,
          messageId: messageId ?? undefined,
        }),
      })
      setSaved(true)
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  async function handleExportPptx() {
    if (exporting) return
    setExporting(true)
    try {
      const res = await fetch('/api/artifacts/export-pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: artifact.content, name: artifact.name }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${artifact.name.replace(/\s+/g, '_')}.pptx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="artifact-block" aria-label={`Artefakt: ${artifact.name}`}>
      {/* Header */}
      <div className="artifact-header">
        <span className="artifact-type-icon">{typeIcon(artifact.artifactType)}</span>
        <span className="artifact-type-label">{typeLabel(artifact.artifactType)}</span>
        <span className="artifact-name">{artifact.name}</span>

        <div className="artifact-actions">
          {(isReact || isPresentation || isChart) && (
            <button
              onClick={() => { setPreviewOpen(s => !s); setExpanded(false) }}
              title={previewOpen ? 'Quellcode anzeigen' : 'Vorschau öffnen'}
              className="artifact-action-btn"
            >
              {previewOpen ? <Code size={13} weight="bold" /> : <Play size={13} weight="bold" />}
              <span>{previewOpen ? 'Code' : 'Vorschau'}</span>
            </button>
          )}
          {isReact && previewOpen && (
            <button
              onClick={() => setExpanded(s => !s)}
              title={expanded ? 'Verkleinern' : 'Vergrößern'}
              className="artifact-action-btn artifact-action-btn--icon"
              aria-label={expanded ? 'Verkleinern' : 'Vergrößern'}
            >
              <ArrowsOut size={13} weight="bold" />
            </button>
          )}
          {canSave && (
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              title="Als Artefakt speichern"
              className="artifact-action-btn"
            >
              <FloppyDisk size={13} weight="bold" />
              <span>{saving ? 'Speichern…' : 'Speichern'}</span>
            </button>
          )}
          {saved && (
            <span className="artifact-saved-badge">Gespeichert</span>
          )}
          {isPresentation && (
            <button
              onClick={() => void handleExportPptx()}
              disabled={exporting}
              title="Als PowerPoint exportieren"
              className="artifact-action-btn"
            >
              <DownloadSimple size={13} weight="bold" />
              <span>{exporting ? 'Exportiere…' : 'PPTX'}</span>
            </button>
          )}
          {isReact && iframeHtml && (
            <button
              onClick={handleExportHtml}
              title="Als HTML exportieren"
              className="artifact-action-btn"
            >
              <DownloadSimple size={13} weight="bold" />
              <span>HTML</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isChart && previewOpen ? (
        <iframe
          srcDoc={chartIframeHtml ?? ''}
          sandbox="allow-scripts allow-same-origin"
          style={{ width: '100%', height: previewHeight, border: 'none', display: 'block' }}
          title={artifact.name}
        />
      ) : isPresentation && previewOpen ? (
        <>
          <iframe
            srcDoc={artifact.content}
            sandbox="allow-scripts allow-same-origin"
            style={{ width: '100%', height: previewHeight, border: 'none', display: 'block' }}
            title={artifact.name}
          />
          {totalSlides > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 12px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-tertiary)' }}>
              <CaretLeft size={13} weight="bold" aria-hidden="true" />
              <span>Slide {currentSlide} / {totalSlides}</span>
              <CaretRight size={13} weight="bold" aria-hidden="true" />
            </div>
          )}
        </>
      ) : isReact && previewOpen ? (
        <>
          {transformError ? (
            <div className="artifact-error-card">
              <div className="artifact-error-card__header">
                <Warning size={14} weight="fill" aria-hidden="true" />
                <span>Artifact konnte nicht geladen werden</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button className="artifact-action-btn" onClick={() => setRetryCount(c => c + 1)}>
                    <ArrowClockwise size={13} weight="bold" />
                    <span>Nochmal</span>
                  </button>
                  <button className="artifact-action-btn artifact-action-btn--ghost" onClick={() => setShowErrorDetails(v => !v)}>
                    {showErrorDetails ? 'Ausblenden' : 'Details'}
                  </button>
                </div>
              </div>
              {showErrorDetails && (
                <pre className="artifact-error-card__details">{transformError}</pre>
              )}
            </div>
          ) : iframeHtml ? (
            <iframe
              ref={iframeRef}
              srcDoc={iframeHtml}
              sandbox="allow-scripts"
              style={{ width: '100%', height: previewHeight, border: 'none', display: 'block' }}
              title={artifact.name}
            />
          ) : (
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              Wird kompiliert…
            </div>
          )}
          {lastAction && onSendDirect && (
            <div className="artifact-action-choice">
              <span className="artifact-action-choice__label">
                Auswahl: <strong>{String(lastAction.value)}</strong>
              </span>
              <button
                className="artifact-action-btn"
                onClick={() => {
                  onSendDirect(`Lass uns "${String(lastAction.value)}" besprechen.`)
                  setLastAction(null)
                }}
              >
                <ChatCircle size={13} weight="bold" />
                <span>Mit Toro besprechen</span>
              </button>
              <button
                className="artifact-action-btn"
                onClick={() => {
                  onSendDirect(`Öffne "${String(lastAction.value)}" in einem neuen Chat mit mehr Details.`)
                  setLastAction(null)
                }}
              >
                <ArrowSquareOut size={13} weight="bold" />
                <span>Vertiefen</span>
              </button>
              <button
                className="artifact-action-btn artifact-action-btn--ghost"
                onClick={() => setLastAction(null)}
              >
                ✕
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="artifact-code">
          <SyntaxHighlighter
            style={oneDark}
            language={codeLanguage(artifact)}
            PreTag="div"
            customStyle={{ borderRadius: 0, fontSize: 13, margin: 0 }}
          >
            {artifact.content}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  )
}
