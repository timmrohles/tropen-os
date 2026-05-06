// src/app/api/audit/review/status/route.ts
// GET — liefert Rate-Limit-Status für Deep Review des aktuellen Users.

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { checkDeepReviewRateLimit } from '@/lib/audit/deep-review-rate-limit'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = await checkDeepReviewRateLimit(user.id)
  return NextResponse.json(status)
}
