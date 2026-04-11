import type { Icon as PhosphorIconType } from '@phosphor-icons/react'
import {
  FolderSimple, Briefcase, Rocket, Lightbulb, Note, Flask, Leaf, Handshake, TrendUp,
  ChartBar, PaintBrush, Globe, DeviceMobile, GraduationCap, ClipboardText, CurrencyEur,
  Buildings, Users, Sparkle, Robot,
} from '@phosphor-icons/react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Project = {
  id: string
  title: string
  emoji: string | null
  context: string | null
  goal: string | null
  department_id: string
  created_at: string
  updated_at: string
  archived_at: string | null
  project_memory: { count: number }[] | null
}

export type Chat = { id: string; title: string | null; updated_at: string }
export type Doc  = { id: string; filename: string; file_size: number | null; mime_type: string | null; created_at: string }
export type Mem  = { id: string; type: string; content: string; created_at: string; frozen?: boolean }

export type ProjectTab = 'uebersicht' | 'chats' | 'dokumente' | 'gedaechtnis'

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatRelDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60)      return 'gerade eben'
  if (diff < 3600)    return `vor ${Math.floor(diff / 60)} Min.`
  if (diff < 86400)   return `vor ${Math.floor(diff / 3600)} Std.`
  if (diff < 172800)  return 'gestern'
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export function formatBytes(b: number | null): string {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${Math.round(b / 1024)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

export const ICON_OPTIONS: { name: string; Icon: PhosphorIconType }[] = [
  { name: 'FolderSimple', Icon: FolderSimple },
  { name: 'Briefcase',    Icon: Briefcase    },
  { name: 'Rocket',       Icon: Rocket       },
  { name: 'Lightbulb',    Icon: Lightbulb    },
  { name: 'Note',         Icon: Note         },
  { name: 'Flask',        Icon: Flask        },
  { name: 'Leaf',         Icon: Leaf         },
  { name: 'Handshake',    Icon: Handshake    },
  { name: 'TrendUp',      Icon: TrendUp      },
  { name: 'ChartBar',     Icon: ChartBar     },
  { name: 'PaintBrush',   Icon: PaintBrush   },
  { name: 'Globe',        Icon: Globe        },
  { name: 'DeviceMobile', Icon: DeviceMobile },
  { name: 'GraduationCap',Icon: GraduationCap},
  { name: 'ClipboardText',Icon: ClipboardText},
  { name: 'CurrencyEur',  Icon: CurrencyEur  },
  { name: 'Buildings',    Icon: Buildings    },
  { name: 'Users',        Icon: Users        },
  { name: 'Sparkle',      Icon: Sparkle      },
  { name: 'Robot',        Icon: Robot        },
]

export function getProjectIcon(name: string | null): PhosphorIconType {
  if (!name) return FolderSimple
  return ICON_OPTIONS.find(o => o.name === name)?.Icon ?? FolderSimple
}
