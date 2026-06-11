// src/app/api/audit/review/status/route.ts
// GET — liefert Rate-Limit-Status für Deep Review des aktuellen Users.

import { NextResponse } from 'next/server'
import { checkDeepReviewRateLimit } from '@/lib/audit/deep-review-rate-limit'
import { withAuth } from '@/lib/auth/route-guards'

export const GET = withAuth(async (_req, { auth }) => {
  const status = await checkDeepReviewRateLimit(auth.id)
  return NextResponse.json(status)
})
