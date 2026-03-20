// src/lib/model-selector.ts
// Deterministic model routing — no DB query, pure function.
// Single source of truth for which model handles which task type.
// Usage: const { modelId } = selectModel('summarize')

// ─── Types ─────────────────────────────────────────────────────────────────

export type TaskType =
  | 'chat'              // interactive project/workspace chat
  | 'summarize'         // chat or project summaries
  | 'extract'           // structured data extraction
  | 'research'          // deep analysis, market research
  | 'create'            // long-form content generation
  | 'memory_extraction' // automatic memory extraction from conversations
  | 'feed_stage2'       // feed scoring + enrichment (fast pass)
  | 'feed_stage3'       // feed deep analysis
  | 'transformation'    // workspace/feed transformation
  | 'project_intro'    // context-aware opening message for project chats
  | 'chips'            // quick-action chip generation after responses
  | 'prompt_builder'   // guided prompt refinement dialog

export interface ModelSelection {
  modelId:   string    // what to pass to anthropic()
  taskType:  TaskType
  tier:      'fast' | 'deep'
  maxTokens: number
}

// ─── Model Constants ────────────────────────────────────────────────────────

const HAIKU  = 'claude-haiku-4.5'
const SONNET = 'claude-sonnet-4.6'

// ─── Routing Table ──────────────────────────────────────────────────────────

const MODEL_ROUTING: Record<TaskType, Omit<ModelSelection, 'taskType'>> = {
  chat:              { modelId: SONNET, tier: 'deep',  maxTokens: 4096  },
  research:          { modelId: SONNET, tier: 'deep',  maxTokens: 4096  },
  create:            { modelId: SONNET, tier: 'deep',  maxTokens: 4096  },
  transformation:    { modelId: SONNET, tier: 'deep',  maxTokens: 4096  },
  feed_stage3:       { modelId: SONNET, tier: 'deep',  maxTokens: 2048  },
  summarize:         { modelId: HAIKU,  tier: 'fast',  maxTokens: 1024  },
  extract:           { modelId: HAIKU,  tier: 'fast',  maxTokens: 1024  },
  memory_extraction: { modelId: HAIKU,  tier: 'fast',  maxTokens: 1024  },
  feed_stage2:       { modelId: HAIKU,  tier: 'fast',  maxTokens: 512   },
  project_intro:     { modelId: HAIKU,  tier: 'fast',  maxTokens: 512   },
  chips:             { modelId: HAIKU,  tier: 'fast',  maxTokens: 256   },
  prompt_builder:    { modelId: HAIKU,  tier: 'fast',  maxTokens: 512   },
}

// ─── Selector ───────────────────────────────────────────────────────────────

export function selectModel(taskType: TaskType): ModelSelection {
  return { ...MODEL_ROUTING[taskType], taskType }
}

/** Convenience: returns only the model ID string. */
export function modelFor(taskType: TaskType): string {
  return MODEL_ROUTING[taskType].modelId
}
