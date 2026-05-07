'use client'
// _components/FeedItemCard.tsx — item card extracted from FeedsPage.renderItem
import type { TranslationValues } from 'next-intl'
import type { FeedItem, FeedSource } from '@/types/feeds'
import {
  BookmarkSimple, ArrowSquareOut, CheckCircle, DotsThree,
  ThumbsDown, Archive, Trash, EyeSlash, ArrowCounterClockwise, ShareNetwork,
} from '@phosphor-icons/react'

const SOURCE_COLOR: Record<string, string> = {
  rss:   'var(--accent)',
  email: 'var(--tropen-process)',
  api:   'var(--tropen-output)',
  url:   'var(--text-tertiary)',
}

interface Props {
  item: FeedItem
  source: FeedSource | undefined
  isDismissed: boolean
  menuOpen: string | null
  t: (key: string, params?: TranslationValues) => string
  tc: (key: string) => string
  onRestore:            (id: string) => Promise<void>
  onToggleSaved:        (id: string, newValue: boolean) => Promise<void>
  onMarkRead:           (id: string) => Promise<void>
  onDismiss:            (id: string) => Promise<void>
  onMarkNotRelevant:    (id: string) => Promise<void>
  onArchive:            (id: string) => Promise<void>
  onSaveToWorkspace:    (id: string, title: string) => void
  onDelete:             (id: string) => Promise<void>
  onMenuToggle:         (id: string) => void
  onMenuClose:          () => void
}

function SourceBadge({ src }: { src: FeedSource }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 7px',
      borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#fff',
      background: SOURCE_COLOR[src.type] ?? 'var(--text-tertiary)', marginBottom: 6,
    }}>
      {src.name}
    </div>
  )
}

function KeyFactPills({ facts }: { facts: string[] }) {
  if (facts.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginBottom: 10 }}>
      {facts.slice(0, 4).map((f, i) => (
        <span key={i} style={{
          fontSize: 11, color: 'var(--text-secondary)',
          border: '1px solid var(--border)', borderRadius: 99, padding: '2px 8px',
        }}>
          • {f}
        </span>
      ))}
    </div>
  )
}

function DismissedActions({ itemId, t, onRestore }: {
  itemId: string
  t: (key: string) => string
  onRestore: (id: string) => Promise<void>
}) {
  return (
    <button
      className="btn btn-ghost btn-sm"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent)' }}
      onClick={async (e) => { e.stopPropagation(); await onRestore(itemId) }}
      aria-label={t('restore')}
    >
      <ArrowCounterClockwise size={13} weight="bold" aria-hidden="true" /> {t('restore')}
    </button>
  )
}

function ItemMenu({ itemId, t, tc, onDismiss, onMarkNotRelevant, onArchive, onSaveToWorkspace, onDelete, onClose, itemTitle }: {
  itemId: string
  itemTitle: string
  t: (key: string) => string
  tc: (key: string) => string
  onDismiss:         (id: string) => Promise<void>
  onMarkNotRelevant: (id: string) => Promise<void>
  onArchive:         (id: string) => Promise<void>
  onSaveToWorkspace: (id: string, title: string) => void
  onDelete:          (id: string) => Promise<void>
  onClose:           () => void
}) {
  return (
    <div
      className="dropdown"
      style={{ position: 'absolute' as const, right: 12, top: 44, zIndex: 10, minWidth: 180 }}
      role="menu"
      onClick={(e) => e.stopPropagation()}
    >
      <button role="menuitem" className="dropdown-item"
        onClick={async () => { await onDismiss(itemId); onClose() }}>
        <EyeSlash size={14} weight="bold" aria-hidden="true" /> {t('hide')}
      </button>
      <button role="menuitem" className="dropdown-item"
        onClick={async () => { await onMarkNotRelevant(itemId); onClose() }}>
        <ThumbsDown size={14} weight="bold" aria-hidden="true" /> {t('notRelevant')}
      </button>
      <button role="menuitem" className="dropdown-item"
        onClick={async () => { await onArchive(itemId); onClose() }}>
        <Archive size={14} weight="bold" aria-hidden="true" /> {tc('archive')}
      </button>
      <button role="menuitem" className="dropdown-item"
        onClick={() => { onClose(); onSaveToWorkspace(itemId, itemTitle) }}>
        <ShareNetwork size={14} weight="bold" aria-hidden="true" /> {t('saveToWorkspace')}
      </button>
      <div className="dropdown-divider" />
      <button role="menuitem" className="dropdown-item dropdown-item--danger"
        onClick={async () => { await onDelete(itemId); onClose() }}>
        <Trash size={14} weight="bold" aria-hidden="true" /> {tc('delete')}
      </button>
    </div>
  )
}

function ActiveItemActions({ item, t, tc, menuOpen, onToggleSaved, onMarkRead, onMenuToggle, onDismiss, onMarkNotRelevant, onArchive, onSaveToWorkspace, onDelete, onMenuClose }: {
  item: FeedItem
  t: (key: string) => string
  tc: (key: string) => string
  menuOpen: string | null
  onToggleSaved:     (id: string, newValue: boolean) => Promise<void>
  onMarkRead:        (id: string) => Promise<void>
  onMenuToggle:      (id: string) => void
  onDismiss:         (id: string) => Promise<void>
  onMarkNotRelevant: (id: string) => Promise<void>
  onArchive:         (id: string) => Promise<void>
  onSaveToWorkspace: (id: string, title: string) => void
  onDelete:          (id: string) => Promise<void>
  onMenuClose:       () => void
}) {
  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        style={{ color: item.isSaved ? 'var(--accent)' : undefined, display: 'inline-flex', alignItems: 'center', gap: 4 }}
        onClick={async (e) => { e.stopPropagation(); await onToggleSaved(item.id, !item.isSaved) }}
        aria-pressed={item.isSaved}
        aria-label={item.isSaved ? tc('save') : t('save')}
      >
        <BookmarkSimple size={13} weight={item.isSaved ? 'fill' : 'bold'} aria-hidden="true" />
        {item.isSaved ? t('saved') : t('save')}
      </button>
      <button
        className="btn btn-ghost btn-sm"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        onClick={async (e) => { e.stopPropagation(); await onMarkRead(item.id) }}
        aria-label={t('markRead')}
      >
        <CheckCircle size={13} weight="bold" aria-hidden="true" /> {t('markRead')}
      </button>
      <button
        className="btn-icon" style={{ marginLeft: 'auto' }}
        onClick={(e) => { e.stopPropagation(); onMenuToggle(item.id) }}
        aria-label={tc('loading')} aria-haspopup="true" aria-expanded={menuOpen === item.id}
      >
        <DotsThree size={16} weight="bold" aria-hidden="true" />
      </button>
      {menuOpen === item.id && (
        <ItemMenu
          itemId={item.id}
          itemTitle={item.title}
          t={t}
          tc={tc}
          onDismiss={onDismiss}
          onMarkNotRelevant={onMarkNotRelevant}
          onArchive={onArchive}
          onSaveToWorkspace={onSaveToWorkspace}
          onDelete={onDelete}
          onClose={onMenuClose}
        />
      )}
    </>
  )
}

export function FeedItemCard({
  item, source, isDismissed, menuOpen, t, tc,
  onRestore, onToggleSaved, onMarkRead, onDismiss,
  onMarkNotRelevant, onArchive, onSaveToWorkspace, onDelete,
  onMenuToggle, onMenuClose,
}: Props) {
  const isUnread = item.status === 'unread'

  return (
    <div
      key={item.id}
      className="card"
      style={{
        padding: '14px 16px',
        borderLeft: isUnread && !isDismissed ? '3px solid var(--accent)' : undefined,
        position: 'relative' as const,
      }}
      onClick={onMenuClose}
    >
      {item.score && (
        <span
          style={{ position: 'absolute' as const, top: 10, right: 12, fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}
          aria-label={t('relevanceLabel', { score: item.score })}
        >
          {item.score}/10
        </span>
      )}

      {source && <SourceBadge src={source} />}

      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 }}>
        {item.title}
      </div>

      {item.summary && (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
          {item.summary}
        </div>
      )}

      <KeyFactPills facts={item.keyFacts ?? []} />

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {item.url && (
          <a
            href={item.url} target="_blank" rel="noreferrer noopener"
            className="btn btn-ghost btn-sm"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            aria-label={`${t('source')}: ${item.title}`}
          >
            <ArrowSquareOut size={13} weight="bold" aria-hidden="true" /> {t('source')}
          </a>
        )}

        {isDismissed ? (
          <DismissedActions itemId={item.id} t={t} onRestore={onRestore} />
        ) : (
          <ActiveItemActions
            item={item} t={t} tc={tc} menuOpen={menuOpen}
            onToggleSaved={onToggleSaved}
            onMarkRead={onMarkRead}
            onMenuToggle={onMenuToggle}
            onDismiss={onDismiss}
            onMarkNotRelevant={onMarkNotRelevant}
            onArchive={onArchive}
            onSaveToWorkspace={onSaveToWorkspace}
            onDelete={onDelete}
            onMenuClose={onMenuClose}
          />
        )}
      </div>
    </div>
  )
}
