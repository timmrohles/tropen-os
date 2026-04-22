import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { apiError } from '@/lib/api-error'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {  
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
    const { is_shared } = await req.json()
  
    const { data, error } = await supabaseAdmin
      .from('prompt_templates')
      .update({ is_shared })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
  
    if (error) return apiError(error)
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabaseAdmin
    .from('prompt_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return apiError(error)
  return NextResponse.json({ ok: true })
}
