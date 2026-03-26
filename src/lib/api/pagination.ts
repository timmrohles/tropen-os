// src/lib/api/pagination.ts
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit = 100,
  maxLimit = 500,
): { limit: number; offset: number } {
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get('limit') ?? String(defaultLimit), 10) || defaultLimit),
    maxLimit,
  )
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0)
  return { limit, offset }
}
