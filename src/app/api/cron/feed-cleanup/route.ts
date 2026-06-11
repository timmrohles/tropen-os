import { NextResponse } from 'next/server'
import { runTtlCleanup } from '@/lib/feeds/ttl-cleanup'
import { apiError } from '@/lib/api-error'
import { withCronAuth } from '@/lib/auth/route-guards'

export const GET = withCronAuth(async () => {
  try {
    const result = await runTtlCleanup()
    return NextResponse.json({ archived: result.archived }, { status: 200 })
  } catch (err: unknown) {
    return apiError(err)
  }
})
