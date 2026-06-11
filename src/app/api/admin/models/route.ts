import { apiError } from '@/lib/api-error'
import { createLogger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withOrgAdmin } from '@/lib/auth/route-guards'
const log = createLogger('admin/models')

const VALID_PROVIDERS = ['openai', 'anthropic', 'mistral', 'google'] as const

// GET /api/admin/models — alle Modelle
export const GET = withOrgAdmin(async () => {
  const { data, error } = await supabaseAdmin
    .from('model_catalog')
    .select('*')
    .order('provider')
    .order('name')

  if (error) {
    log.error('DB Error:', error)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
  return NextResponse.json(data)
})

// POST /api/admin/models — neues Modell anlegen
export const POST = withOrgAdmin(async (req: NextRequest) => {
  try {
    // Body-Größe limitieren
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 4096) {
      return NextResponse.json({ error: 'Request zu groß' }, { status: 413 })
    }
  
    const body = await req.json()
    const { name, provider, cost_per_1k_input, cost_per_1k_output, description } = body
  
    // Pflichtfelder
    if (!name || !provider || cost_per_1k_input == null || cost_per_1k_output == null) {
      return NextResponse.json({ error: 'Fehlende Pflichtfelder' }, { status: 400 })
    }
  
    // Provider-Enum
    if (!VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: `provider muss einer von: ${VALID_PROVIDERS.join(', ')} sein` },
        { status: 400 }
      )
    }
  
    // Kosten > 0
    if (
      typeof cost_per_1k_input !== 'number' ||
      typeof cost_per_1k_output !== 'number' ||
      cost_per_1k_input <= 0 ||
      cost_per_1k_output <= 0
    ) {
      return NextResponse.json(
        { error: 'Kosten müssen positive Zahlen sein' },
        { status: 400 }
      )
    }
  
    // Längenbeschränkungen
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      return NextResponse.json({ error: 'name: 1–100 Zeichen erforderlich' }, { status: 400 })
    }
    if (description != null && (typeof description !== 'string' || description.length > 500)) {
      return NextResponse.json({ error: 'description: max. 500 Zeichen' }, { status: 400 })
    }
  
    const { data, error } = await supabaseAdmin
      .from('model_catalog')
      .insert({ name: name.trim(), provider, cost_per_1k_input, cost_per_1k_output, description })
      .select()
      .single()
  
    if (error) {
      log.error('DB Error:', error)
      return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
})
