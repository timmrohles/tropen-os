import { createLogger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
const log = createLogger('admin/models')

const VALID_PROVIDERS = ['openai', 'anthropic', 'mistral', 'google'] as const

async function getAdminUser() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: me } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!me || !['owner', 'admin', 'superadmin'].includes(me.role)) return null
  return me as { organization_id: string; role: string }
}

// GET /api/admin/models — alle Modelle
export async function GET() {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

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
}

// POST /api/admin/models — neues Modell anlegen
export async function POST(req: NextRequest) {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

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
}
