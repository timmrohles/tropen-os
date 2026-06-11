import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'
import { withSuperadmin } from '@/lib/auth/route-guards'

export const GET = withSuperadmin(async () => {
  const { data, error } = await supabaseAdmin
    .from('packages')
    .select('id, slug, name, description, icon')
    .order('created_at', { ascending: true })

  if (error) return apiError(error)
  return NextResponse.json(data ?? [])
})
