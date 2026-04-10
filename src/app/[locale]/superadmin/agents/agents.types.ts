// agents.types.ts — shared types for the Superadmin Agents page

export interface AgentTableRow {
  id: string
  name: string
  filename: string
  version: string
  ruleCount: number
  categoryIds: number[]
  categoryNames: string[]
  themes: string[]
  status: string
  createdBy: 'manual' | 'committee'
  lastUpdated: string | null  // from agent Meta block
  lastCheckAt: string | null  // from audit findings
  findingsCount: number
  markdownContent: string
}
