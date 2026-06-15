import { readdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

export interface PackSource { name: string; content: string }

/** Liest alle Agent-Packs (docs/agents/*.md) als Quelle. */
export function readAgentPacks(): PackSource[] {
  const dir = join(resolve(process.cwd()), 'docs', 'agents')
  return readdirSync(dir).filter(f => f.endsWith('.md')).map(f => ({
    name: f.replace(/\.md$/, ''),
    content: readFileSync(join(dir, f), 'utf-8'),
  }))
}
