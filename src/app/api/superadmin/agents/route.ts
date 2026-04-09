// GET /api/superadmin/agents
// Returns all 21 agents with metadata, findings counts, and markdown content.
import { NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/auth/guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AGENT_CATALOG } from '@/lib/agents/agent-catalog'
import { CATEGORIES } from '@/lib/audit/types'
import * as fs from 'node:fs'
import { join } from 'node:path'

function readAgentMarkdown(filename: string): string {
  try {
    const path = join(process.cwd(), 'docs', 'agents', filename)
    return fs.readFileSync(path, 'utf-8')
  } catch {
    return ''
  }
}

function extractLastUpdated(markdown: string): string | null {
  const match = markdown.match(/last_updated:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/)
  return match?.[1] ?? null
}

export async function GET() {
  await requireSuperadmin()

  // Fetch findings counts grouped by agentSource from last audit run
  const { data: findings } = await supabaseAdmin
    .from('audit_findings')
    .select('agent_source, created_at')
    .order('created_at', { ascending: false })

  // Build a map of agentSource → { count, lastCheckAt }
  const agentStats = new Map<string, { count: number; lastCheckAt: string | null }>()

  if (findings) {
    for (const f of findings) {
      const src = f.agent_source as string | null
      if (!src) continue
      const existing = agentStats.get(src)
      if (!existing) {
        agentStats.set(src, { count: 1, lastCheckAt: f.created_at })
      } else {
        existing.count++
        // keep the most recent
        if (!existing.lastCheckAt || f.created_at > existing.lastCheckAt) {
          existing.lastCheckAt = f.created_at
        }
      }
    }
  }

  // Build category name lookup
  const catNames = new Map<number, string>(CATEGORIES.map((c) => [c.id, c.name]))

  const agents = AGENT_CATALOG.map((agent) => {
    const markdown = readAgentMarkdown(agent.filename)
    const stats = agentStats.get(agent.id) ?? { count: 0, lastCheckAt: null }

    return {
      id: agent.id,
      name: agent.name,
      filename: agent.filename,
      version: agent.version,
      ruleCount: agent.ruleCount,
      categoryIds: agent.categoryIds,
      categoryNames: agent.categoryIds.map((id) => catNames.get(id) ?? `Cat ${id}`),
      themes: agent.themes,
      status: agent.status,
      createdBy: agent.createdBy,
      lastUpdated: extractLastUpdated(markdown),
      lastCheckAt: stats.lastCheckAt,
      findingsCount: stats.count,
      markdownContent: markdown,
    }
  })

  return NextResponse.json({ agents })
}
