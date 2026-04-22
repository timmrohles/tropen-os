import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { getAuthUser, canWriteWorkspace, requireWorkspaceAccess } from '@/lib/api/workspaces'
import { exportWorkspaceSchema } from '@/lib/validators/workspace-plan-c'
import { createLogger } from '@/lib/logger'
import { apiError } from '@/lib/api-error'

const log = createLogger('api:workspaces:export')
type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, exportWorkspaceSchema)
  if (valErr) return valErr

  // 501 for unimplemented formats
  if (['word', 'pdf', 'presentation'].includes(body.format)) {
    return NextResponse.json({
      error: 'Noch nicht implementiert',
      roadmap: 'Word, PDF und Presentation Export kommen in Phase 3 (Plan F/G).',
    }, { status: 501 })
  }

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data: cardRows, error: cardsErr } = await supabaseAdmin
    .from('cards')
    .select('id, title, description, role, content_type, content, status, sort_order')
    .eq('workspace_id', id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  if (cardsErr) return apiError(cardsErr)

  const cards = (cardRows ?? []) as Record<string, unknown>[]
  const staleCards = cards.filter((c) => c.status === 'stale')
  const warnings = staleCards.length > 0
    ? [`${staleCards.length} Karte(n) sind veraltet: ${staleCards.map((c) => `"${c.title}"`).join(', ')}`]
    : []

  // Create export record
  const { data: exportRecord, error: insertErr } = await supabaseAdmin
    .from('workspace_exports')
    .insert({ workspace_id: id, format: body.format, status: 'processing' })
    .select()
    .single()

  if (insertErr) return apiError(insertErr)

  const content = body.format === 'markdown'
    ? generateMarkdownExport(workspace as unknown as Record<string, unknown>, cards)
    : generateChatExport(workspace as unknown as Record<string, unknown>, cards)

  // Plan F/G: Store in Supabase Storage and save the storage URL instead.
  // data: URIs work for Phase 2 but will produce large DB rows for bigger workspaces.
  const dataUrl = `data:text/plain;base64,${Buffer.from(content).toString('base64')}`

  await supabaseAdmin
    .from('workspace_exports')
    .update({ status: 'ready', file_url: dataUrl })
    .eq('id', exportRecord.id)

  log.info('workspace exported', { workspaceId: id, format: body.format })

  return NextResponse.json({
    export: { ...exportRecord, status: 'ready', file_url: dataUrl },
    warnings,
    content,
  })
}

function generateMarkdownExport(
  workspace: Record<string, unknown>,
  cards: Record<string, unknown>[]
): string {
  const lines: string[] = [
    `# ${workspace.title}`,
    '',
    workspace.goal ? `**Ziel:** ${workspace.goal}` : '',
    workspace.domain ? `**Bereich:** ${workspace.domain}` : '',
    '',
    '---',
    '',
  ]

  for (const card of cards) {
    lines.push(`## ${card.title} (${card.role})`)
    if (card.description) lines.push(`> ${card.description}`)
    lines.push('')

    const content = card.content as Record<string, unknown> | null
    if (content) {
      if (card.content_type === 'text' && content.text) {
        lines.push(String(content.text))
      } else {
        lines.push('```json')
        lines.push(JSON.stringify(content, null, 2))
        lines.push('```')
      }
    } else {
      lines.push('*(leer)*')
    }

    if (card.status === 'stale') lines.push('\n> ⚠️ Diese Karte ist veraltet.')
    lines.push('')
  }

  return lines.filter(Boolean).join('\n')
}

function generateChatExport(
  workspace: Record<string, unknown>,
  cards: Record<string, unknown>[]
): string {
  const sections = cards.map((card) => {
    const content = card.content as Record<string, unknown> | null
    const contentStr = content
      ? (card.content_type === 'text' && content.text ? String(content.text) : JSON.stringify(content))
      : '(leer)'
    return `**${card.title}** (${card.role}):\n${contentStr}`
  })

  return [
    `Workspace: ${workspace.title}`,
    workspace.goal ? `Ziel: ${workspace.goal}` : '',
    '',
    ...sections,
  ].filter(Boolean).join('\n\n')
}
