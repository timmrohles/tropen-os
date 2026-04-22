// src/lib/audit/utils/route-utils.ts
// Shared utility for route classification in audit checkers.
// Canonical source: see docs/checker-design-patterns.md → P9

/**
 * Segments that indicate a single-object or action endpoint — not a list.
 * Canonical list: derived from agent-committee-checker.ts (most refined version).
 */
const NON_LIST_SEGMENTS = [
  'branding', 'overview', 'stats', 'config', 'settings', 'health', 'status', 'summary',
  'profile', 'me', 'token', 'webhook', 'compliance', 'trigger', 'refresh', 'sync',
  'resolve', 'generate', 'export', 'import', 'batch', 'callback', 'session', 'invite',
  'accept', 'verify',
]

/**
 * Returns true if the given API route file path represents a "list route" —
 * one that typically returns a collection of items and therefore requires
 * pagination or explicit query limits.
 *
 * A route is NOT a list route when:
 * 1. Its parent directory is a dynamic segment ([id], [slug], etc.)
 * 2. Any ancestor segment is dynamic (sub-resource bounded by parent ID,
 *    e.g. /items/[id]/comments/route.ts)
 * 3. Its parent directory matches a known single-object/action segment
 *    (config, settings, callback, etc.), including hyphenated variants
 *    (e.g. batch-generate, post-callback)
 * 4. It lives under a /cron/ path (scheduled background jobs)
 *
 * Note: org/user-scope filters (.eq('user_id', ...)) are NOT checked here —
 * that check belongs in the calling checker alongside content inspection.
 *
 * @param routePath - Relative path to the route file (e.g. "src/app/api/users/route.ts")
 */
export function isListRoute(routePath: string): boolean {
  const parts = routePath.split('/')
  const lastDir = parts[parts.length - 2] ?? ''

  // 1. Last directory segment is a dynamic parameter
  if (/^\[.+\]$/.test(lastDir)) return false

  // 2. Any ancestor segment is a dynamic parameter (sub-resource of dynamic parent)
  if (parts.some((p) => /^\[.+\]$/.test(p))) return false

  // 3. Known non-list endpoint name (exact, or hyphen-combined)
  if (NON_LIST_SEGMENTS.some(
    (seg) => lastDir === seg || lastDir.includes('-' + seg) || lastDir.includes(seg + '-')
  )) return false

  // 4. Cron / scheduled-job paths
  if (routePath.includes('/cron/')) return false

  return true
}
