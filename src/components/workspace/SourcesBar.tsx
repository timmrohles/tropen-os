'use client'

import React from 'react'
import { MagnifyingGlass, Play } from '@phosphor-icons/react'
import type { SearchSource } from '@/lib/workspace-types'

interface SourcesBarProps {
  sources: SearchSource[]
}

function isYoutube(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url)
}

function getYoutubeId(url: string): string | null {
  // watch?v=ID
  const watch = url.match(/[?&]v=([^&]+)/)
  if (watch) return watch[1]
  // youtu.be/ID
  const short = url.match(/youtu\.be\/([^?/]+)/)
  if (short) return short[1]
  // /shorts/ID
  const shorts = url.match(/\/shorts\/([^?/]+)/)
  if (shorts) return shorts[1]
  return null
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

function getFaviconUrl(url: string): string {
  const domain = getDomain(url)
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
}

function YoutubeCard({ src }: { src: SearchSource }) {
  const videoId = getYoutubeId(src.url)
  const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null

  return (
    <a
      href={src.url}
      target="_blank"
      rel="noopener noreferrer"
      className="source-card source-card--yt"
    >
      {thumb ? (
        <img
          src={thumb}
          alt={src.title}
          className="source-card-thumb"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement
            img.style.display = 'none'
            const placeholder = img.nextElementSibling as HTMLElement | null
            if (placeholder) placeholder.style.display = 'flex'
          }}
        />
      ) : null}
      <div className="source-card-thumb source-card-thumb--yt-placeholder" style={{ display: thumb ? 'none' : 'flex' }}>
        <Play size={28} weight="fill" color="rgba(255,255,255,0.9)" aria-hidden="true" />
      </div>
      <div className="source-card-meta">
        <div className="source-card-domain">
          <img
            src={getFaviconUrl(src.url)}
            alt=""
            width={12}
            height={12}
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          YouTube
        </div>
        <div className="source-card-title">{src.title}</div>
      </div>
    </a>
  )
}

// eslint-disable-next-line -- hex color palette for domain badges (CSS vars not applicable in JS arrays)
const DOMAIN_COLORS: [string, string][] = [['#e8f4f0', '#2D7A50'], ['#f0e8f4', '#7A2D6E'], ['#f4f0e8', '#7A5A2D'], ['#e8eef4', '#2D4E7A'], ['#f4e8e8', '#7A2D2D'], ['#e8f4f4', '#2D7A7A']] // eslint-disable

function domainColor(domain: string): [string, string] {
  let h = 0
  for (let i = 0; i < domain.length; i++) h = (h * 31 + domain.charCodeAt(i)) & 0xffff
  return DOMAIN_COLORS[h % DOMAIN_COLORS.length]
}

function ArticleCard({ src }: { src: SearchSource }) {
  const domain = getDomain(src.url)
  const [bg, fg] = domainColor(domain)

  return (
    <a
      href={src.url}
      target="_blank"
      rel="noopener noreferrer"
      className="source-card source-card--article"
    >
      <div className="source-card-thumb source-card-thumb--article" style={{ background: bg }}>
        <img
          src={getFaviconUrl(src.url)}
          alt=""
          width={28}
          height={28}
          loading="lazy"
          style={{ borderRadius: 6, opacity: 0.9 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
        <span style={{ fontSize: 11, color: fg, fontWeight: 600, marginTop: 4, maxWidth: 120, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{domain}</span>
      </div>
      <div className="source-card-meta">
        <div className="source-card-title">{src.title}</div>
        {src.page_age && <div className="source-card-age">{src.page_age}</div>}
      </div>
    </a>
  )
}

export default function SourcesBar({ sources }: SourcesBarProps) {
  if (!sources.length) return null

  return (
    <div className="sources-bar-wrap">
      <div className="sources-bar-label">
        <MagnifyingGlass size={11} weight="bold" aria-hidden="true" />
        <span>Webquellen</span>
      </div>
      <div className="sources-bar">
        {sources.map((src, i) =>
          isYoutube(src.url)
            ? <YoutubeCard key={i} src={src} />
            : <ArticleCard key={i} src={src} />
        )}
      </div>
    </div>
  )
}
