// src/lib/api-error.ts
// Central API error handler — never exposes internal details to clients.
// Usage: catch (err) { return apiError(err) }
//        if (dbError) return apiError(dbError)

import { NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:error')

/**
 * Logs the full error server-side and returns a generic 500 JSON response.
 * Safe for both JS Error objects and Supabase PostgREST errors.
 */
export function apiError(err: unknown, code = 'INTERNAL_ERROR'): NextResponse {
  log.error('API error', { err })
  return NextResponse.json(
    { error: 'Ein Fehler ist aufgetreten', code },
    { status: 500 }
  )
}
