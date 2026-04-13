'use client'
import { useRouter } from '@/i18n/navigation'

interface Chat { id: string; title: string | null; updated_at: string }
interface Workspace { id: string; title: string; updated_at: string }

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (isNaN(diff) || diff < 0) return 'gerade eben'
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `vor ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours}h`
  const days = Math.floor(hours / 24)
  return `vor ${days}d`
}

interface Props {
  chats: Chat[]
  workspaces: Workspace[]
}

export default function RecentlyUsed({ chats, workspaces }: Props) {
  const router = useRouter()
  if (chats.length === 0 && workspaces.length === 0) return null

  return (
    <div>
      <span className="card-section-label" style={{ marginBottom: 12, display: 'block' }}>
        Zuletzt genutzt
      </span>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {chats.map(c => (
          <button
            key={c.id}
            className="btn btn-ghost"
            onClick={() => router.push(`/chat/${c.id}`)}
            style={{ fontSize: 13 }}
            suppressHydrationWarning
          >
            {c.title || 'Chat'} · {formatRelativeTime(c.updated_at)}
          </button>
        ))}
        {workspaces.map(w => (
          <button
            key={w.id}
            className="btn btn-ghost"
            onClick={() => router.push(`/workspaces/${w.id}`)}
            style={{ fontSize: 13 }}
            suppressHydrationWarning
          >
            {w.title} · {formatRelativeTime(w.updated_at)}
          </button>
        ))}
      </div>
    </div>
  )
}
