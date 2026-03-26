import { NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/auth/guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const logger = createLogger('superadmin-prompts')

export interface SystemPrompt {
  id: string
  table: string
  name: string
  group: string
  prompt: string
  editable: boolean
  meta?: Record<string, unknown>
}

/**
 * GET /api/superadmin/prompts
 * Returns all system prompts from DB + hardcoded sources
 */
export async function GET() {
  try {
    await requireSuperadmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    // Parallel fetch from all prompt-carrying tables
    const [capRes, outRes, agentRes, wfOptRes] = await Promise.all([
      supabaseAdmin.from('capabilities').select('id, capability_type, label, system_prompt_injection').order('sort_order'),
      supabaseAdmin.from('outcomes').select('id, output_type, label, system_prompt_injection').order('sort_order'),
      supabaseAdmin.from('agents').select('id, name, system_prompt, scope, emoji').is('deleted_at', null).order('name'),
      supabaseAdmin.from('guided_workflow_options').select('id, label, system_prompt, workflow_id').order('workflow_id'),
    ])

    const prompts: SystemPrompt[] = []

    // --- Capabilities ---
    if (capRes.data) {
      for (const row of capRes.data) {
        prompts.push({
          id: row.id,
          table: 'capabilities',
          name: `${row.label ?? row.capability_type}`,
          group: 'Capabilities',
          prompt: row.system_prompt_injection ?? '',
          editable: true,
          meta: { capability_type: row.capability_type },
        })
      }
    }

    // --- Outcomes ---
    if (outRes.data) {
      for (const row of outRes.data) {
        prompts.push({
          id: row.id,
          table: 'outcomes',
          name: `${row.label ?? row.output_type}`,
          group: 'Outcomes (Output-Formate)',
          prompt: row.system_prompt_injection ?? '',
          editable: true,
          meta: { output_type: row.output_type },
        })
      }
    }

    // --- Agents ---
    if (agentRes.data) {
      for (const row of agentRes.data) {
        if (row.system_prompt) {
          prompts.push({
            id: row.id,
            table: 'agents',
            name: `${row.emoji ?? ''} ${row.name}`.trim(),
            group: 'Agenten',
            prompt: row.system_prompt,
            editable: true,
            meta: { scope: row.scope },
          })
        }
      }
    }

    // --- Guided Workflow Options ---
    if (wfOptRes.data) {
      for (const row of wfOptRes.data) {
        if (row.system_prompt) {
          prompts.push({
            id: row.id,
            table: 'guided_workflow_options',
            name: row.label,
            group: 'Guided Workflows',
            prompt: row.system_prompt,
            editable: true,
            meta: { workflow_id: row.workflow_id },
          })
        }
      }
    }

    // --- Hardcoded Prompts (read-only) ---
    prompts.push({
      id: 'hardcoded-ai-chat-base',
      table: 'hardcoded',
      name: 'Toro Base System Prompt',
      group: 'Hardcoded (Edge Functions)',
      prompt: 'Du bist {aiGuideName}, ein intelligenter KI-Arbeitsassistent.\nKontext: Firma "{orgName}", Abteilung "{deptName}".\nSprache: immer Deutsch.\n[+ proaktive Hints, Denkprozess, Wissenskontext]',
      editable: false,
      meta: { file: 'supabase/functions/ai-chat/index.ts', lines: '78-131' },
    })

    prompts.push({
      id: 'hardcoded-jungle-order-suggest',
      table: 'hardcoded',
      name: 'Jungle Order — Projektvorschlag',
      group: 'Hardcoded (Edge Functions)',
      prompt: 'Du bist Toro, ein KI-Papagei der durch den Dschungel navigiert.\n[Analysiert Gesprachsinhalte und schlagt Projekte vor]',
      editable: false,
      meta: { file: 'supabase/functions/jungle-order/index.ts', lines: '89-115' },
    })

    prompts.push({
      id: 'hardcoded-jungle-order-merge',
      table: 'hardcoded',
      name: 'Jungle Order — Zusammenfassung',
      group: 'Hardcoded (Edge Functions)',
      prompt: 'Du bist Toro. Fasse diese {count} Unterhaltungen zusammen.\n[Konsolidiert mehrere Chats zu einem Ergebnis]',
      editable: false,
      meta: { file: 'supabase/functions/jungle-order/index.ts', lines: '163-181' },
    })

    prompts.push({
      id: 'hardcoded-feed-stage2',
      table: 'hardcoded',
      name: 'Feed Pipeline — Stage 2 Scoring',
      group: 'Hardcoded (Edge Functions)',
      prompt: 'Du bewertest die Relevanz von Nachrichtenartikeln.\n[Haiku-basiertes Scoring mit Negativ-Beispielen]',
      editable: false,
      meta: { file: 'src/lib/feeds/pipeline.ts', lines: '91-114' },
    })

    return NextResponse.json({ prompts })
  } catch (err) {
    logger.error('Failed to load prompts', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
