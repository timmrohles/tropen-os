import type { Workspace, WorkspaceParticipant, Card } from '@/db/schema'

// ---------------------------------------------------------------------------
// WorkspaceMeta — known fields plus open-ended extensibility
// ---------------------------------------------------------------------------
export interface WorkspaceMeta {
  context?: string
  tone?: string
  language?: string
  target_audience?: string
  memory?: string
  migratedFromProjectId?: string
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// ParticipantWithUser
// user info is fetched from Supabase auth.users via supabaseAdmin;
// full_name is stored as `name` here for ergonomics.
// ---------------------------------------------------------------------------
export interface ParticipantWithUser extends WorkspaceParticipant {
  user: {
    id: string
    name: string | null  // maps to full_name in Supabase users table
    email: string
  }
}

// ---------------------------------------------------------------------------
// WorkspaceWithDetails — workspace + participants + cards + department
// ---------------------------------------------------------------------------
export interface WorkspaceWithDetails extends Workspace {
  participants: ParticipantWithUser[]
  cards: Card[]
  department: { id: string; name: string } | null
}
