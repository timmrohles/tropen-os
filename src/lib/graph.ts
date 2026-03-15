import type { Connection } from '@/db/schema'

/**
 * Traverses graph from startCardId.
 * direction "upstream"   = follow toCardId back to fromCardId (dependencies)
 * direction "downstream" = follow fromCardId forward to toCardId (dependents)
 * Returns Map<cardId, depth>
 */
export function traverseGraph(
  startCardId: string,
  connections: Connection[],
  direction: 'upstream' | 'downstream',
  maxDepth = 10,
): Map<string, number> {
  const visited = new Map<string, number>()
  // BFS queue holds [cardId, depth]
  const queue: [string, number][] = [[startCardId, 0]]

  while (queue.length > 0) {
    const [current, depth] = queue.shift()!

    if (depth >= maxDepth) continue

    const nextDepth = depth + 1

    for (const conn of connections) {
      let neighbour: string | null = null

      if (direction === 'downstream' && conn.fromCardId === current) {
        neighbour = conn.toCardId
      } else if (direction === 'upstream' && conn.toCardId === current) {
        neighbour = conn.fromCardId
      }

      if (neighbour !== null && !visited.has(neighbour)) {
        visited.set(neighbour, nextDepth)
        queue.push([neighbour, nextDepth])
      }
    }
  }

  return visited
}

/**
 * Detects cycles via DFS with visited + recursion stack.
 * Returns array of cycle paths (each path = array of cardIds forming the cycle).
 */
export function detectCycles(connections: Connection[]): string[][] {
  // Build adjacency list (downstream direction)
  const adj = new Map<string, string[]>()

  for (const conn of connections) {
    if (!adj.has(conn.fromCardId)) adj.set(conn.fromCardId, [])
    adj.get(conn.fromCardId)!.push(conn.toCardId)
    // Ensure toCardId node exists in the map even if it has no outgoing edges
    if (!adj.has(conn.toCardId)) adj.set(conn.toCardId, [])
  }

  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const stackPath: string[] = []
  const cycles: string[][] = []

  function dfs(node: string): void {
    visited.add(node)
    recursionStack.add(node)
    stackPath.push(node)

    const neighbours = adj.get(node) ?? []

    for (const neighbour of neighbours) {
      if (!visited.has(neighbour)) {
        dfs(neighbour)
      } else if (recursionStack.has(neighbour)) {
        // Cycle detected — reconstruct path from neighbour to current position
        const cycleStart = stackPath.indexOf(neighbour)
        const cycle = stackPath.slice(cycleStart)
        cycles.push([...cycle, neighbour]) // close the cycle
      }
    }

    stackPath.pop()
    recursionStack.delete(node)
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      dfs(node)
    }
  }

  return cycles
}

/**
 * Topological sort via Kahn's algorithm (BFS).
 * Returns cardIds in topological order.
 * If a cycle exists, returns partial result (processed nodes only).
 */
export function topologicalSort(
  cardIds: string[],
  connections: Connection[],
): string[] {
  // Only consider connections between the provided cardIds
  const cardSet = new Set(cardIds)
  const relevantConns = connections.filter(
    (c) => cardSet.has(c.fromCardId) && cardSet.has(c.toCardId),
  )

  // Build in-degree map and adjacency list
  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()

  for (const id of cardIds) {
    inDegree.set(id, 0)
    adj.set(id, [])
  }

  for (const conn of relevantConns) {
    inDegree.set(conn.toCardId, (inDegree.get(conn.toCardId) ?? 0) + 1)
    adj.get(conn.fromCardId)!.push(conn.toCardId)
  }

  // Initialise queue with nodes of in-degree 0
  const queue: string[] = []
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id)
  }

  const result: string[] = []

  while (queue.length > 0) {
    const node = queue.shift()!
    result.push(node)

    for (const neighbour of adj.get(node) ?? []) {
      const newDegree = (inDegree.get(neighbour) ?? 1) - 1
      inDegree.set(neighbour, newDegree)
      if (newDegree === 0) queue.push(neighbour)
    }
  }

  return result
}

/**
 * Would adding fromCardId → toCardId create a cycle?
 */
export function wouldCreateCycle(
  fromCardId: string,
  toCardId: string,
  existingConnections: Connection[],
): boolean {
  // Construct a minimal fake Connection object — only graph fields are used
  const tempConnection = {
    fromCardId,
    toCardId,
  } as Connection

  const cycles = detectCycles([...existingConnections, tempConnection])
  return cycles.length > 0
}
