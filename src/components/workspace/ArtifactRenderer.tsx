'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { FloppyDisk } from '@phosphor-icons/react'
import type { ArtifactSegment } from '@/lib/chat/parse-artifacts'
import {
  ArtifactToolbar, ChartContent, PresentationContent, ReactContent, CodeContent,
  typeIcon, typeLabel,
  type ArtifactActionEvent,
} from './ArtifactContent'

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
  function onAction(event) { window.parent.postMessage({ type: 'artifact-action', event }, '*'); }
  function __showError(msg) { var el=document.getElementById('error'); if(el){el.style.display='block';el.textContent=String(msg);} }
  function __sendHeight() { window.parent.postMessage({ type: 'iframe-resize', height: document.body.scrollHeight }, '*'); }
  try {
    ${transformedCode}
    var __el = document.getElementById('root');
    var __root = ReactDOM.createRoot(__el);
    var __C = typeof App !== 'undefined' ? App : typeof Component !== 'undefined' ? Component : typeof Default !== 'undefined' ? Default : null;
    if (__C) {
      __root.render(React.createElement(__C, { onAction }));
      setTimeout(__sendHeight, 50);
      if (typeof ResizeObserver !== 'undefined') { new ResizeObserver(__sendHeight).observe(document.body); }
    } else { __showError('Kein Component gefunden — erwartet: function App() { ... }'); __sendHeight(); }
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
  <style>* { box-sizing: border-box; } body { margin: 0; background: transparent; } #chart { width: 100%; height: 100%; }</style>
</head>
<body>
  <div id="chart"></div>
  <script>
    var chart = echarts.init(document.getElementById('chart'), null, { renderer: 'canvas' })
    // eslint-disable-next-line -- hex color palette injected into iframe JS (CSS vars unavailable in iFrame)
    var defaultColor = ['#3F4A55','#5A6872','#8A9AA8','#EEF2DD','#A8B852','#7A8E3A']
    var option = ${JSON.stringify(config)}
    if (!option.color) option.color = defaultColor
    if (!option.backgroundColor) option.backgroundColor = 'transparent'
    if (option.textStyle === undefined) option.textStyle = {}
    if (!option.textStyle.color) option.textStyle.color = '#9ca3af'
    chart.setOption(option)
    window.addEventListener('resize', function() { chart.resize() })
    chart.on('click', function(params) {
      window.parent.postMessage({ type: 'artifact-action', event: { type: 'click', value: params.name || params.value } }, '*')
    })
  </script>
</body>
</html>`
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
  const t = useTranslations('artifactRenderer')
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
        if (data.error) { setTransformError(data.error) }
        else if (data.code) { setIframeHtml(buildReactIframeHtml(data.code)) }
      })
      .catch(err => setTransformError(String(err)))
  }, [artifact.content, artifact.artifactType, retryCount])

  // Listen for postMessage events from the sandboxed iframe
  useEffect(() => {
    if (!previewOpen) return
    function handleMessage(e: MessageEvent) {
      if (e.origin !== 'null' && e.origin !== window.location.origin) return
      if (e.data?.type === 'artifact-action' && onSendDirect) setLastAction(e.data.event as ArtifactActionEvent)
      if (e.data?.type === 'slide-changed') { setCurrentSlide((e.data.indexh as number) + 1); setTotalSlides(e.data.total as number) }
      if (e.data?.type === 'iframe-resize' && typeof e.data.height === 'number') setDynamicHeight(Math.min(e.data.height + 32, 800))
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [previewOpen, onSendDirect])

  const isReact = artifact.artifactType === 'react'
  const isPresentation = artifact.artifactType === 'presentation'
  const isChart = artifact.artifactType === 'chart'
  const canSave = !!conversationId && !!organizationId && !saved

  // Must be before early returns (Rules of Hooks)
  const chartIframeHtml = React.useMemo(() => {
    if (!isChart) return null
    try { return buildChartIframeHtml(JSON.parse(artifact.content)) }
    catch { return buildChartIframeHtml({ title: { text: 'Ungültige Chart-Konfiguration' }, series: [] }) }
  }, [isChart, artifact.content])

  // ── Compact header for split-view ────────────────────────────────────────
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
          {saved && <span className="artifact-saved-badge">{t('saved')}</span>}
        </div>
      </div>
    )
  }

  const previewHeight = isPresentation ? 480 : isChart ? 350 : (dynamicHeight ?? (expanded ? 520 : 300))

  function handleExportHtml() {
    if (!iframeHtml) return
    const blob = new Blob([iframeHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${artifact.name.replace(/\s+/g, '_')}.html`; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSave() {
    if (!conversationId || !organizationId || saving) return
    setSaving(true)
    try {
      await fetch('/api/artifacts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId, organizationId, name: artifact.name,
          type: artifact.artifactType, language: artifact.language ?? (isReact ? 'jsx' : null),
          content: artifact.content, messageId: messageId ?? undefined,
        }),
      })
      setSaved(true); onSaved?.()
    } finally { setSaving(false) }
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
      a.href = url; a.download = `${artifact.name.replace(/\s+/g, '_')}.pptx`; a.click()
      URL.revokeObjectURL(url)
    } finally { setExporting(false) }
  }

  function renderContent() {
    if (isChart && previewOpen) return <ChartContent chartIframeHtml={chartIframeHtml} previewHeight={previewHeight} name={artifact.name} />
    if (isPresentation && previewOpen) return <PresentationContent content={artifact.content} previewHeight={previewHeight} name={artifact.name} currentSlide={currentSlide} totalSlides={totalSlides} />
    if (isReact && previewOpen) {
      return (
        <ReactContent
          iframeRef={iframeRef} transformError={transformError} iframeHtml={iframeHtml}
          showErrorDetails={showErrorDetails} previewHeight={previewHeight} name={artifact.name}
          lastAction={lastAction} onSendDirect={onSendDirect}
          onRetry={() => setRetryCount(c => c + 1)}
          onToggleErrorDetails={() => setShowErrorDetails(v => !v)}
          onDismissAction={() => setLastAction(null)} t={t}
        />
      )
    }
    return <CodeContent artifact={artifact} />
  }

  return (
    <div className="artifact-block" aria-label={`Artefakt: ${artifact.name}`}>
      <ArtifactToolbar
        artifact={artifact} isReact={isReact} isPresentation={isPresentation} isChart={isChart}
        previewOpen={previewOpen} expanded={expanded} iframeHtml={iframeHtml}
        canSave={canSave} saved={saved} saving={saving} exporting={exporting} t={t}
        onTogglePreview={() => { setPreviewOpen(s => !s); setExpanded(false) }}
        onToggleExpand={() => setExpanded(s => !s)}
        onSave={() => void handleSave()}
        onExportPptx={() => void handleExportPptx()}
        onExportHtml={handleExportHtml}
      />
      {renderContent()}
    </div>
  )
}
