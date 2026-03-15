'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Connection, Card, ConnectionType, ConnectionStrength } from '@/db/schema'
import { traverseGraph, detectCycles, wouldCreateCycle } from '@/lib/graph'
import { AppError } from '@/lib/errors'
import type { ConnectionWithCards, AffectedCard } from '@/types/connections'
import { mapCard } from '@/lib/card-history'

// ---------------------------------------------------------------------------
// Mapper: snake_case DB → camelCase TypeScript
// ---------------------------------------------------------------------------
function mapConnection(row: Record<string, unknown>): Connection {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    fromCardId: row.from_card_id as string,
    toCardId: row.to_card_id as string,
    type: row.type as ConnectionType,
    strength: (row.strength as ConnectionStrength) ?? 'required',
    label: (row.label as string) ?? null,
    meta: (row.meta as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
  }
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------
interface CreateConnectionInput {
  workspaceId: string
  fromCardId: string
  toCardId: string
  type: ConnectionType
  strength?: ConnectionStrength
  label?: string
  meta?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// createConnection
// ---------------------------------------------------------------------------
export async function createConnection(
  input: CreateConnectionInput,
): Promise<Connection> {
  const { workspaceId, fromCardId, toCardId, type, strength, label, meta } = input

  if (fromCardId === toCardId) {
    throw new AppError('SELF_REFERENCE_NOT_ALLOWED', 'A card cannot connect to itself.')
  }

  // Verify both cards exist in this workspace
  const { data: existingCards } = await supabaseAdmin
    .from('cards')
    .select('id')
    .eq('workspace_id', workspaceId)
    .in('id', [fromCardId, toCardId])

  const foundIds = new Set((existingCards ?? []).map((c: { id: string }) => c.id))
  if (!foundIds.has(fromCardId) || !foundIds.has(toCardId)) {
    throw new AppError('CARD_NOT_FOUND', 'One or both cards do not exist in this workspace.')
  }

  // Load all existing connections for cycle detection
  const { data: existingConns } = await supabaseAdmin
    .from('connections')
    .select()
    .eq('workspace_id', workspaceId)

  const workspaceConnections = (existingConns ?? []).map(mapConnection)

  if (wouldCreateCycle(fromCardId, toCardId, workspaceConnections)) {
    throw new AppError('CYCLE_DETECTED', 'Adding this connection would create a cycle in the graph.')
  }

  const { data, error } = await supabaseAdmin
    .from('connections')
    .insert({
      workspace_id: workspaceId,
      from_card_id: fromCardId,
      to_card_id: toCardId,
      type,
      ...(strength !== undefined && { strength }),
      ...(label !== undefined && { label }),
      ...(meta !== undefined && { meta }),
    })
    .select()
    .single()

  if (error || !data) throw new Error(`createConnection failed: ${error?.message}`)
  return mapConnection(data)
}

// ---------------------------------------------------------------------------
// deleteConnection
// ---------------------------------------------------------------------------
export async function deleteConnection(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('connections').delete().eq('id', id)
  if (error) throw new Error(`deleteConnection failed: ${error.message}`)
}

// ---------------------------------------------------------------------------
// listConnections
// ---------------------------------------------------------------------------
export async function listConnections(
  workspaceId: string,
): Promise<ConnectionWithCards[]> {
  const { data: rows, error } = await supabaseAdmin
    .from('connections')
    .select()
    .eq('workspace_id', workspaceId)

  if (error) throw new Error(`listConnections failed: ${error.message}`)
  if (!rows || rows.length === 0) return []

  const conns = rows.map(mapConnection)
  const cardIds = [...new Set(conns.flatMap((c) => [c.fromCardId, c.toCardId]))]

  const { data: cardRows } = await supabaseAdmin
    .from('cards')
    .select('id, title, type')
    .in('id', cardIds)

  type CardStub = { id: string; title: string; type: 'input' | 'process' | 'output' }
  const cardMap = new Map((cardRows ?? []).map((c: { id: string; title: string; type: string }) => [
    c.id,
    { id: c.id, title: c.title, type: c.type as 'input' | 'process' | 'output' } satisfies CardStub,
  ]))

  return conns.map((conn) => ({
    ...conn,
    fromCard: cardMap.get(conn.fromCardId) ?? { id: conn.fromCardId, title: '(unknown)', type: 'input' as const },
    toCard: cardMap.get(conn.toCardId) ?? { id: conn.toCardId, title: '(unknown)', type: 'input' as const },
  }))
}

// ---------------------------------------------------------------------------
// Helper: load all connections for the workspace that contains a card
// ---------------------------------------------------------------------------
async function getWorkspaceConnectionsForCard(cardId: string): Promise<{
  workspaceConnections: Connection[]
}> {
  const { data: cardRow } = await supabaseAdmin
    .from('cards')
    .select('workspace_id')
    .eq('id', cardId)
    .single()

  if (!cardRow) throw new AppError('CARD_NOT_FOUND', `Card ${cardId} not found.`)

  const { data: connRows } = await supabaseAdmin
    .from('connections')
    .select()
    .eq('workspace_id', cardRow.workspace_id)

  return { workspaceConnections: (connRows ?? []).map(mapConnection) }
}

// ---------------------------------------------------------------------------
// getCardDependencies  (upstream — cards this card depends on)
// ---------------------------------------------------------------------------
export async function getCardDependencies(
  cardId: string,
): Promise<{ direct: Card[]; all: Card[] }> {
  const { workspaceConnections } = await getWorkspaceConnectionsForCard(cardId)
  const depthMap = traverseGraph(cardId, workspaceConnections, 'upstream', 10)
  if (depthMap.size === 0) return { direct: [], all: [] }

  const allIds = [...depthMap.keys()]
  const directIds = allIds.filter((id) => depthMap.get(id) === 1)

  const { data: cardRows } = await supabaseAdmin.from('cards').select().in('id', allIds)
  const allCards = (cardRows ?? []).map(mapCard)
  const directSet = new Set(directIds)

  return { direct: allCards.filter((c) => directSet.has(c.id)), all: allCards }
}

// ---------------------------------------------------------------------------
// getCardDependents  (downstream — cards that depend on this card)
// ---------------------------------------------------------------------------
export async function getCardDependents(
  cardId: string,
): Promise<{ direct: Card[]; all: Card[] }> {
  const { workspaceConnections } = await getWorkspaceConnectionsForCard(cardId)
  const depthMap = traverseGraph(cardId, workspaceConnections, 'downstream', 10)
  if (depthMap.size === 0) return { direct: [], all: [] }

  const allIds = [...depthMap.keys()]
  const directIds = allIds.filter((id) => depthMap.get(id) === 1)

  const { data: cardRows } = await supabaseAdmin.from('cards').select().in('id', allIds)
  const allCards = (cardRows ?? []).map(mapCard)
  const directSet = new Set(directIds)

  return { direct: allCards.filter((c) => directSet.has(c.id)), all: allCards }
}

// ---------------------------------------------------------------------------
// getAffectedCards
// ---------------------------------------------------------------------------
export async function getAffectedCards(cardId: string): Promise<AffectedCard[]> {
  const { workspaceConnections } = await getWorkspaceConnectionsForCard(cardId)

  const visited = new Map<string, { depth: number; path: string[] }>()
  const queue: [string, number, string[]][] = [[cardId, 0, [cardId]]]

  while (queue.length > 0) {
    const [current, depth, path] = queue.shift()!
    if (depth >= 10) continue
    for (const conn of workspaceConnections) {
      if (conn.fromCardId !== current) continue
      const neighbour = conn.toCardId
      if (!visited.has(neighbour)) {
        const newPath = [...path, neighbour]
        visited.set(neighbour, { depth: depth + 1, path: newPath })
        queue.push([neighbour, depth + 1, newPath])
      }
    }
  }

  if (visited.size === 0) return []

  const affectedIds = [...visited.keys()]
  const { data: cardRows } = await supabaseAdmin.from('cards').select().in('id', affectedIds)
  const cardMap = new Map((cardRows ?? []).map(mapCard).map((c) => [c.id, c]))

  const result: AffectedCard[] = affectedIds
    .filter((id) => cardMap.has(id))
    .map((id) => {
      const { depth, path } = visited.get(id)!
      return { card: cardMap.get(id)!, depth, connectionPath: path }
    })

  result.sort((a, b) => a.depth - b.depth)
  return result
}

// ---------------------------------------------------------------------------
// validateGraph
// ---------------------------------------------------------------------------
export async function validateGraph(workspaceId: string): Promise<{
  valid: boolean
  cycles: string[][]
  orphans: string[]
}> {
  const [{ data: connRows }, { data: cardRows }] = await Promise.all([
    supabaseAdmin.from('connections').select().eq('workspace_id', workspaceId),
    supabaseAdmin.from('cards').select('id').eq('workspace_id', workspaceId),
  ])

  const workspaceConnections = (connRows ?? []).map(mapConnection)
  const cycles = detectCycles(workspaceConnections)
  const cardIdSet = new Set((cardRows ?? []).map((c: { id: string }) => c.id))

  const orphanSet = new Set<string>()
  for (const conn of workspaceConnections) {
    if (!cardIdSet.has(conn.fromCardId)) orphanSet.add(conn.fromCardId)
    if (!cardIdSet.has(conn.toCardId)) orphanSet.add(conn.toCardId)
  }

  const orphans = [...orphanSet]
  return { valid: cycles.length === 0 && orphans.length === 0, cycles, orphans }
}
