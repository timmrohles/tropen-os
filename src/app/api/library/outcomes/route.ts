// GET /api/library/outcomes — all system outcomes
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabaseAdmin.from('outcomes')
    .select('id, name, label, icon, description, output_type, card_type, sort_order')
    .eq('is_active', true).order('sort_order')
  return NextResponse.json({ outcomes: data ?? [] })
}
