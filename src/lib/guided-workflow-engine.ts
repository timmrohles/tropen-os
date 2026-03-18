import { supabaseAdmin } from '@/lib/supabase-admin'
import { resolveWorkflow } from '@/lib/capability-resolver'
import { createLogger } from '@/lib/logger'
import type { WorkflowContextType } from '@/lib/validators/guided'

const log = createLogger('guided-workflow-engine')

// ── Pure helpers (no DB, no LLM) ─────────────────────────────────────────────

/**
 * Score how well a message matches a keyword list.
 * Returns 0 if no match. Higher = better.
 * No LLM, no regex — case-insensitive substring matching.
 */
export function scoreKeywords(message: string, keywords: string[]): number {
  if (!keywords.length) return 0
  const lower = message.toLowerCase()
  return keywords.reduce((score, kw) => {
    return lower.includes(kw.toLowerCase()) ? score + 1 : score
  }, 0)
}

export interface WorkflowPromptInput {
  workflowSystemPrompt: string | null
  capabilityInjection:  string | null
  outcomeInjection:     string | null
  previousSelections:   string[]
}

/**
 * Build the combined system prompt from workflow + capability + outcome injections.
 * Called after the user completes all workflow steps.
 */
export function buildWorkflowPrompt(input: WorkflowPromptInput): string {
  const parts: string[] = []

  if (input.capabilityInjection)  parts.push(input.capabilityInjection)
  if (input.workflowSystemPrompt) parts.push(input.workflowSystemPrompt)
  if (input.outcomeInjection)     parts.push(input.outcomeInjection)

  if (input.previousSelections.length > 0) {
    parts.push(
      `Kontext aus Benutzerauswahl: ${input.previousSelections.join(', ')}.`
    )
  }

  return parts.join('\n\n')
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorkflowDetectionInput {
  message:         string
  context:         WorkflowContextType
  userId:          string
  projectId?:      string
  conversationId?: string
}

export interface GuidedWorkflowOption {
  id:               string
  label:            string
  description:      string | null
  emoji:            string | null
  capability_id:    string | null
  outcome_id:       string | null
  next_workflow_id: string | null
  system_prompt:    string | null
  sort_order:       number
  is_custom:        boolean
}

export interface GuidedWorkflow {
  id:               string
  title:            string
  subtitle:         string | null
  trigger_contexts: string[]
  options:          GuidedWorkflowOption[]
}

// ── DB-backed detection ───────────────────────────────────────────────────────

/**
 * Detect which guided workflow (if any) should be shown for this input.
 * No LLM calls — pure keyword matching + context rules.
 * Returns null if user has guided_enabled=false or no workflow matches.
 */
export async function detectWorkflow(
  input: WorkflowDetectionInput
): Promise<GuidedWorkflow | null> {
  // 1. Check user settings
  const { data: settings } = await supabaseAdmin
    .from('guided_workflow_settings')
    .select('guided_enabled, auto_trigger, new_project_trigger')
    .eq('user_id', input.userId)
    .single()

  if (settings?.guided_enabled === false) return null
  if (input.context === 'new_project' && settings?.new_project_trigger === false) return null
  if (input.context !== 'explicit' && settings?.auto_trigger === false) return null

  // 2. Load candidate workflows
  const { data: workflows, error } = await supabaseAdmin
    .from('guided_workflows')
    .select('id, title, subtitle, trigger_keywords, trigger_contexts, scope, is_active')
    .eq('is_active', true)
    .in('scope', ['system', 'org'])
    .order('sort_order')

  if (error || !workflows?.length) return null

  // 3. Find best match
  let bestWorkflow: typeof workflows[number] | null = null
  let bestScore = -1

  for (const wf of workflows) {
    const contexts: string[] = (wf.trigger_contexts as string[] | null) ?? []
    if (!contexts.includes(input.context)) continue

    // explicit → return first workflow with 'explicit' context
    if (input.context === 'explicit') {
      bestWorkflow = wf
      break
    }

    // context-only triggers → first match wins
    if (['new_project', 'after_search'].includes(input.context)) {
      bestWorkflow = wf
      break
    }

    // new_chat → keyword scoring
    const keywords: string[] = (wf.trigger_keywords as string[] | null) ?? []
    if (keywords.length === 0) {
      // no-keyword workflow = fallback, low priority
      if (bestScore < 0) {
        bestWorkflow = wf
        bestScore = 0
      }
      continue
    }

    const score = scoreKeywords(input.message, keywords)
    if (score > bestScore) {
      bestScore = score
      bestWorkflow = wf
    }
  }

  if (!bestWorkflow) return null

  // 4. Load options for matched workflow
  const { data: options } = await supabaseAdmin
    .from('guided_workflow_options')
    .select('id, label, description, emoji, capability_id, outcome_id, next_workflow_id, system_prompt, sort_order, is_custom')
    .eq('workflow_id', bestWorkflow.id)
    .order('sort_order')

  return {
    id:               bestWorkflow.id,
    title:            bestWorkflow.title,
    subtitle:         (bestWorkflow.subtitle as string | null) ?? null,
    trigger_contexts: (bestWorkflow.trigger_contexts as string[] | null) ?? [],
    options:          (options as GuidedWorkflowOption[]) ?? [],
  }
}

// ── Option Resolution ─────────────────────────────────────────────────────────

export type ResolveOptionResult =
  | { type: 'next_workflow'; workflow: GuidedWorkflow }
  | { type: 'capability_plan'; plan: Awaited<ReturnType<typeof resolveWorkflow>> }
  | { type: 'custom_input' }
  | { type: 'save_artifact' }

/**
 * Resolve what happens when the user picks a workflow option:
 * - next_workflow_id → load + return next workflow
 * - capability_id + outcome_id → call capability resolver
 * - is_custom → return custom_input signal
 * - label "In Wissenbasis speichern" → return save_artifact signal
 */
export async function resolveOption(
  workflowId: string,
  optionId:   string,
  userId:     string,
  orgId:      string,
): Promise<ResolveOptionResult> {
  const { data: option, error } = await supabaseAdmin
    .from('guided_workflow_options')
    .select('*')
    .eq('id', optionId)
    .eq('workflow_id', workflowId)
    .single()

  if (error || !option) {
    log.error('option not found', { workflowId, optionId })
    throw new Error('Option not found')
  }

  if (option.is_custom) return { type: 'custom_input' }

  if (option.label === 'In Wissenbasis speichern') return { type: 'save_artifact' }

  if (option.next_workflow_id) {
    const { data: nextWf } = await supabaseAdmin
      .from('guided_workflows')
      .select('id, title, subtitle, trigger_contexts')
      .eq('id', option.next_workflow_id as string)
      .single()

    if (!nextWf) throw new Error('Next workflow not found')

    const { data: nextOptions } = await supabaseAdmin
      .from('guided_workflow_options')
      .select('id, label, description, emoji, capability_id, outcome_id, next_workflow_id, system_prompt, sort_order, is_custom')
      .eq('workflow_id', nextWf.id)
      .order('sort_order')

    return {
      type: 'next_workflow',
      workflow: {
        id:               nextWf.id,
        title:            nextWf.title,
        subtitle:         (nextWf.subtitle as string | null) ?? null,
        trigger_contexts: (nextWf.trigger_contexts as string[] | null) ?? [],
        options:          (nextOptions as GuidedWorkflowOption[]) ?? [],
      },
    }
  }

  if (option.capability_id && option.outcome_id) {
    const plan = await resolveWorkflow(
      option.capability_id as string,
      option.outcome_id as string,
      userId,
      orgId,
    )
    // Merge option-specific system_prompt into plan
    if (option.system_prompt) {
      plan.system_prompt = [option.system_prompt as string, plan.system_prompt]
        .filter(Boolean)
        .join('\n\n')
    }
    return { type: 'capability_plan', plan }
  }

  // Fallback for options with neither next_workflow nor capability
  return { type: 'custom_input' }
}
