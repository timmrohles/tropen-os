// src/lib/workspace-context.ts
// Builds system prompts and context snapshots for Workspace Silo-Chat and Card-Chat.
// Not a Server Action — plain async lib module.
// All queries use supabaseAdmin.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import type { CardPlanC, WorkspacePlanC } from '@/types/workspace-plan-c.types'

const log = createLogger('workspace-context')

// eslint-disable-next-line -- hex colors required for Reveal.js iframe CSS (CSS vars unavailable in iFrame)
const RC = { h: '#1A1714', a: '#2D7A50', bg: '#EAE9E5', t: '#4A4540' }

// Raw DB row shapes (snake_case from Supabase)
interface CardDbRow {
  id: string
  title: string
  role: string
  status: string
  content_type: string
  content: Record<string, unknown> | null
  stale_reason: string | null
}

interface ConnectionDbRow {
  source_card_id: string
  target_card_id: string
  label: string | null
}

// ---------------------------------------------------------------------------
// buildWorkspaceContext — system prompt for Silo-Chat
// ---------------------------------------------------------------------------
export async function buildWorkspaceContext(workspaceId: string): Promise<string> {
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('id, title, goal, domain, status')
    .eq('id', workspaceId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!workspace) throw new Error(`Workspace ${workspaceId} nicht gefunden`)

  const { data: cardRows } = await supabaseAdmin
    .from('cards')
    .select('id, title, role, status, content_type, content, stale_reason')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  const { data: connRows } = await supabaseAdmin
    .from('connections')
    .select('source_card_id, target_card_id, label')
    .eq('workspace_id', workspaceId)

  const cards = (cardRows ?? []) as CardDbRow[]
  const connections = (connRows ?? []) as ConnectionDbRow[]

  const cardSummaries = cards.map((c) => {
    const staleNote = c.status === 'stale'
      ? ` [VERALTET: ${c.stale_reason ?? 'Abhängigkeit geändert'}]`
      : ''
    const contentPreview = c.content
      ? JSON.stringify(c.content).slice(0, 200)
      : '(leer)'
    return `- [${c.role.toUpperCase()}] "${c.title}" (${c.content_type})${staleNote}: ${contentPreview}`
  }).join('\n')

  const connectionSummaries = connections.map((conn) => {
    const src = cards.find((c) => c.id === conn.source_card_id)?.title ?? conn.source_card_id
    const tgt = cards.find((c) => c.id === conn.target_card_id)?.title ?? conn.target_card_id
    const lbl = conn.label ? ` (${conn.label})` : ''
    return `  ${src} → ${tgt}${lbl}`
  }).join('\n')

  log.debug('buildWorkspaceContext', { workspaceId, cardCount: cards.length })

  return `Du bist Toro, ein KI-Assistent von Tropen OS. Du hilfst im Workspace "${workspace.title}".

Ziel: ${workspace.goal ?? '(kein Ziel definiert)'}
Bereich: ${workspace.domain ?? '(kein Bereich)'}
Status: ${workspace.status}

Aktuelle Karten (${cards.length}):
${cardSummaries || '(keine Karten)'}

Verbindungen:
${connectionSummaries || '(keine Verbindungen)'}

Wenn der User explizit einen neuen Workspace erstellen möchte, füge am Ende deiner Antwort eine eigene Zeile mit folgendem Marker ein:
[TORO:WORKSPACE:Passender Workspace-Titel]
Nur verwenden wenn der User explizit einen neuen Workspace anlegen will — nicht bei allgemeinen Fragen.

Wenn du Daten visualisieren möchtest (Zeitreihen, Vergleiche, Verteilungen, Trends), verwende einen Chart-Artifact statt einer Tabelle:
<artifact type="chart" title="[Titel]">
{ "xAxis": {...}, "yAxis": {...}, "series": [{"type":"bar","data":[...]}], "tooltip": {"trigger":"axis"} }
</artifact>
Typen: bar, line, pie (data: [{name,value}]), scatter (data: [[x,y]]). Keine Farben setzen — werden automatisch auf Tropen-Grün gesetzt. Nur bei >= 3 Datenpunkten.

Gesprächsregeln:
- EINE FRAGE AUF EINMAL: Stelle nie mehr als eine Frage pro Antwort.
- ERST FRAGEN, DANN BAUEN: Bei Erstellungs-Anfragen ohne ausreichend Details ("erstelle", "mach", "generier", "schreib") — EINE kurze Klärungsfrage stellen, dann warten. Erst wenn klar ist was gewünscht wird, bauen. Niemals raten und sofort bauen.
- DIREKT STARTEN wenn Thema, Inhalt und Zweck bereits klar sind — auch aus dem Gesprächskontext heraus.
- KEIN FORMULAR-STIL: Keine nummerierten Fragenlisten. Gespräch, nicht Intake-Formular.

Antworte präzise und auf Deutsch. Beziehe dich auf konkrete Karten wenn du Empfehlungen gibst.`
}

// ---------------------------------------------------------------------------
// buildCardContext — system prompt for Card-Chat
// ---------------------------------------------------------------------------
export async function buildCardContext(cardId: string): Promise<string> {
  const { data: card } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!card) throw new Error(`Karte ${cardId} nicht gefunden`)

  const { data: historyRows } = await supabaseAdmin
    .from('card_history')
    .select('snapshot, change_reason, created_at')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: incomingConns } = await supabaseAdmin
    .from('connections')
    .select('source_card_id')
    .eq('target_card_id', cardId)

  const upstreamIds = (incomingConns ?? []).map(
    (c: Record<string, unknown>) => c.source_card_id as string
  )
  let upstreamCards: CardDbRow[] = []

  if (upstreamIds.length > 0) {
    const { data: upstreamRows } = await supabaseAdmin
      .from('cards')
      .select('id, title, role, content_type, content, status')
      .in('id', upstreamIds)
      .limit(20) // cap to avoid unbounded system-prompt growth
    upstreamCards = (upstreamRows ?? []) as CardDbRow[]
  }

  const upstreamSummary = upstreamCards.length > 0
    ? upstreamCards.map((c) =>
        `- "${c.title}" (${c.role}): ${JSON.stringify(c.content ?? {}).slice(0, 300)}`
      ).join('\n')
    : '(keine upstream Karten)'

  const historySummary = (historyRows ?? []).map((h: Record<string, unknown>) => {
    const snap = h.snapshot as Record<string, unknown>
    return `- ${h.created_at as string}: ${(h.change_reason as string) ?? 'geändert'} → "${snap.title ?? '?'}"`
  }).join('\n') || '(keine History)'

  const currentContent = card.content
    ? JSON.stringify(card.content).slice(0, 500)
    : '(leer)'

  log.debug('buildCardContext', { cardId })

  return `Du bist Toro. Du arbeitest an der Karte "${card.title as string}" (${card.role as string} / ${card.content_type as string}).

Aktueller Inhalt:
${currentContent}

Upstream-Karten (Eingaben für diese Karte):
${upstreamSummary}

Letzte 5 Änderungen:
${historySummary}

Gesprächsregeln:
- EINE FRAGE AUF EINMAL: Stelle nie mehr als eine Frage pro Antwort.
- ERST FRAGEN, DANN BAUEN: Bei Erstellungs-Anfragen ohne ausreichend Details — EINE kurze Klärungsfrage stellen, dann warten. Erst wenn klar ist was gewünscht wird, bauen.
- DIREKT STARTEN wenn Typ, Inhalt und Zweck bereits klar sind.
- KEIN FORMULAR-STIL: Keine nummerierten Fragenlisten. Gespräch, nicht Intake-Formular.

Hilf dem User dabei, den Inhalt dieser Karte zu verbessern oder zu generieren. Antworte auf Deutsch.`
}

// ---------------------------------------------------------------------------
// buildPresentationContext — system prompt for Toro to generate presentations
// Loads workspace + cards + project memory from the same department
// ---------------------------------------------------------------------------
export async function buildPresentationContext(workspaceId: string): Promise<string> {
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('id, title, goal, domain, status, department_id')
    .eq('id', workspaceId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!workspace) throw new Error(`Workspace ${workspaceId} nicht gefunden`)

  const { data: cardRows } = await supabaseAdmin
    .from('cards')
    .select('id, title, role, status, content_type, content')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  const cards = (cardRows ?? []) as CardDbRow[]

  const cardSummaries = cards.map((c) => {
    const contentStr = c.content
      ? JSON.stringify(c.content).slice(0, 300)
      : '(leer)'
    return `- [${c.role.toUpperCase()}] "${c.title}" (${c.content_type}): ${contentStr}`
  }).join('\n')

  // Load project memory from all projects in the same department
  let memorySummary = '(kein Projekt-Gedächtnis verfügbar)'
  if (workspace.department_id) {
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, title')
      .eq('department_id', workspace.department_id)
      .is('deleted_at', null)
      .limit(10)

    const projectIds = (projects ?? []).map((p: { id: string }) => p.id)

    if (projectIds.length > 0) {
      const { data: memories } = await supabaseAdmin
        .from('project_memory')
        .select('type, content, importance, tags')
        .in('project_id', projectIds)
        .in('importance', ['high', 'medium'])
        .order('created_at', { ascending: false })
        .limit(20)

      if (memories && memories.length > 0) {
        memorySummary = (memories as { type: string; content: string; importance: string; tags: string[] }[])
          .map(m => `- [${m.importance.toUpperCase()} / ${m.type}] ${m.content}`)
          .join('\n')
      }
    }
  }

  log.debug('buildPresentationContext', { workspaceId, cardCount: cards.length })

  return `Du bist Toro, ein KI-Assistent von Tropen OS. Du erstellst Präsentationen im Auftrag des Users.

Workspace: "${workspace.title}"
Ziel: ${workspace.goal ?? '(kein Ziel definiert)'}
Bereich: ${(workspace as { domain?: string }).domain ?? '(kein Bereich)'}

Karten-Wissensbasis (${cards.length} Karten):
${cardSummaries || '(keine Karten)'}

Projekt-Erkenntnisse:
${memorySummary}

Wenn der User eine Präsentation, Slides oder Pitch möchte, antworte mit einem Artifact:
<artifact type="presentation" title="[Titel]" slides="[N]">
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/theme/white.min.css">
  <style>
    :root {
      --r-heading-color: ${RC.h};
      --r-link-color: ${RC.a};
      --r-background-color: ${RC.bg};
    }
    .reveal h2 { color: ${RC.h}; font-size: 1.8em; }
    .reveal li { color: ${RC.t}; }
  </style>
</head>
<body>
  <div class="reveal"><div class="slides">
    <!-- Slides hier -->
  </div></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.js"></script>
  <script>
    Reveal.initialize({ hash: true, controls: true })
    Reveal.on('slidechanged', (e) => {
      window.parent.postMessage({ type: 'slide-changed', indexh: e.indexh, total: Reveal.getTotalSlides() }, '*')
    })
  </script>
</body>
</html>
</artifact>

Regeln:
- Max. 8 Slides (außer explizit mehr gewünscht)
- Slide 1: Titel + Untertitel
- Slides 2–7: max. 5 Bullet-Points
- Letzte Slide: CTA oder Zusammenfassung
- Nur Tropen-OS-Farben verwenden (Heading-Dunkel, Akzent-Grün, Hintergrund-Sand)
- Beziehe dich konkret auf die Karten und Projekt-Erkenntnisse oben
- Antworte auf Deutsch

Gesprächsregeln:
- EINE FRAGE AUF EINMAL: Stelle nie mehr als eine Frage pro Antwort.
- ERST FRAGEN, DANN BAUEN: Bei Präsentations-Anfragen ohne ausreichend Details — EINE kurze Klärungsfrage stellen (z.B. "Für welche Zielgruppe?" oder "Wie viele Slides?"), dann warten.
- DIREKT STARTEN wenn Thema, Zielgruppe und Zweck bereits klar sind.
- KEIN FORMULAR-STIL: Keine nummerierten Fragenlisten.`
}

// ---------------------------------------------------------------------------
// buildContextSnapshot — compressed snapshot for workspace_messages storage
// ---------------------------------------------------------------------------
export function buildContextSnapshot(
  workspaceId: string,
  workspace: Pick<WorkspacePlanC, 'title' | 'goal' | 'status'>,
  cards: Pick<CardPlanC, 'id' | 'title' | 'role' | 'status'>[],
  cardId?: string
): Record<string, unknown> {
  return {
    workspaceId,
    workspaceTitle: workspace.title,
    workspaceGoal: workspace.goal,
    workspaceStatus: workspace.status,
    cardCount: cards.length,
    cardId: cardId ?? null,
    cardStatuses: cards.reduce<Record<string, string>>((acc, c) => {
      acc[c.id] = c.status
      return acc
    }, {}),
    capturedAt: new Date().toISOString(),
  }
}
