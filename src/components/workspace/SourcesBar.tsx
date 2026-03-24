'use client'

import React from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import type { SearchSource } from '@/lib/workspace-types'

interface SourcesBarProps {
  sources: SearchSource[]
}

function isYoutube(url: string): boolean {
  return /youtube\.com\/watch|youtu\.be\//i.test(url)
}

function getYoutubeId(url: string): string | null {
  const m = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?/]+)/)
  return m?.[1] ?? null
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
      {thumb && (
        <img
          src={thumb}
          alt={src.title}
          className="source-card-thumb"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      )}
      <div className="source-card-meta">
        <div className="source-card-domain">
          <img
            src={getFaviconUrl(src.url)}
            alt=""
            width={12}
            height={12}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          YouTube
        </div>
        <div className="source-card-title">{src.title}</div>
      </div>
    </a>
  )
}

function ArticleCard({ src }: { src: SearchSource }) {
  const domain = getDomain(src.url)

  return (
    <a
      href={src.url}
      target="_blank"
      rel="noopener noreferrer"
      className="source-card source-card--article"
    >
      <div className="source-card-meta">
        <div className="source-card-domain">
          <img
            src={getFaviconUrl(src.url)}
            alt=""
            width={12}
            height={12}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          {domain}
        </div>
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
